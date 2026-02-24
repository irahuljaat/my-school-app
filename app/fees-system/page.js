'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    getFirestore, collection, query, where, getDocs, doc, getDoc, 
    setDoc, updateDoc, increment, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../firebase/config'; 
import { 
    HiRefresh, HiCash, HiClock, HiSearch, HiX, 
    HiUserCircle, HiCheckCircle, HiExclamationCircle,
    HiCollection, HiPlus, HiTrash, HiSave, HiGift 
} from 'react-icons/hi';

import FeesReceipt from '../components/FeeReceipt'; 

const db = getFirestore(app);
const MOCK_CLASSES = ["PREP", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(Number(amount) || 0);
};

const parseFirestoreDate = (dateStr) => {
    if (!dateStr) return new Date();
    const cleanStr = String(dateStr).split('(')[0].trim();
    const parts = cleanStr.split(/[-/]/);
    if (parts.length === 3) {
        if (parts[0].length === 4) return new Date(parts[0], parts[1] - 1, parts[2]);
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date();
};

export default function FeesSystemPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [activeSession, setActiveSession] = useState(null); 
    const [authStatus, setAuthStatus] = useState('loading');
    const [selectedClass, setSelectedClass] = useState("1");
    const [searchTerm, setSearchTerm] = useState("");
    const [showOnlyDummy, setShowOnlyDummy] = useState(false); 
    
    const [students, setStudents] = useState([]);
    const [baseClassFee, setBaseClassFee] = useState(0);
    const [annualPayments, setAnnualPayments] = useState({});
    const [loading, setLoading] = useState(false);
    
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [relaxationAmount, setRelaxationAmount] = useState(""); 
    
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [feeHistory, setFeeHistory] = useState([]);

    // --- STRUCTURE STATES ---
    const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
    const [feeComponents, setFeeComponents] = useState([{ name: 'Tuition Fee', amount: '' }]);
    const [isSavingStructure, setIsSavingStructure] = useState(false);

    const fetchGlobalSession = useCallback(async () => {
        try {
            const configRef = doc(db, 'config', 'settings');
            const configSnap = await getDoc(configRef);
            if (configSnap.exists()) setActiveSession(configSnap.data().activeSession);
        } catch (err) { console.error("Session Error:", err); }
    }, []);

    useEffect(() => {
        setIsMounted(true);
        const auth = getAuth(app);
        return onAuthStateChanged(auth, (user) => {
            if (user) { setAuthStatus('authenticated'); fetchGlobalSession(); } 
            else { setAuthStatus('unauthenticated'); }
        });
    }, [fetchGlobalSession]);

    const fetchFeeData = useCallback(async () => {
        if (!activeSession || authStatus !== 'authenticated') return;
        setLoading(true);
        try {
            const classStr = selectedClass.toString();
            
            // 1. Fetch Students
            const sSnap = await getDocs(query(collection(db, 'sessions', activeSession, 'students'), where('grade', '==', classStr)));
            setStudents(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            // 2. Fetch Base Fee Template
            const fSnap = await getDoc(doc(db, 'sessions', activeSession, 'studentFeeStructures', classStr));
            if (fSnap.exists()) setBaseClassFee(Number(fSnap.data().totalFee) || 0);

            // 3. Fetch Payments & Relaxations
            const pSnap = await getDocs(collection(db, 'sessions', activeSession, 'feePayments'));
            const paymentMap = {};
            pSnap.forEach(d => {
                const data = d.data();
                paymentMap[d.id] = { 
                    totalFee: Number(data.totalFee),
                    paidAmount: Number(data.paidAmount) || 0,
                    relaxationAmount: Number(data.relaxationAmount) || 0,
                    history: data.history || {}
                };
            });
            setAnnualPayments(paymentMap);
        } catch (err) { console.error("Fetch Error:", err); } finally { setLoading(false); }
    }, [selectedClass, activeSession, authStatus]);

    useEffect(() => { fetchFeeData(); }, [fetchFeeData]);

    const detailedStudentList = useMemo(() => {
        return students
            .filter(s => {
                const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesType = showOnlyDummy ? s.isDummy === true : (s.isDummy === false || s.isDummy === undefined);
                return matchesSearch && matchesType;
            })
            .map(s => {
                const pDoc = annualPayments[s.id] || { totalFee: baseClassFee, paidAmount: 0, relaxationAmount: 0, history: {} };
                const finalTotalFee = pDoc.totalFee > 0 ? pDoc.totalFee : baseClassFee;
                
                return { 
                    ...s, 
                    totalFee: finalTotalFee, 
                    totalPaid: pDoc.paidAmount, 
                    relaxation: pDoc.relaxationAmount,
                    balanceDue: finalTotalFee - (pDoc.paidAmount + pDoc.relaxationAmount),
                    history: pDoc.history
                };
            })
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }, [students, baseClassFee, annualPayments, searchTerm, showOnlyDummy]);

    // --- STRUCTURE LOGIC ---
    const totalStructureAmount = useMemo(() => {
        return feeComponents.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    }, [feeComponents]);

    const addComponent = () => setFeeComponents([...feeComponents, { name: '', amount: '' }]);
    const removeComponent = (index) => setFeeComponents(feeComponents.filter((_, i) => i !== index));
    const updateComponent = (index, field, value) => {
        const newComponents = [...feeComponents];
        newComponents[index][field] = value;
        setFeeComponents(newComponents);
    };

    const handleSaveStructure = async () => {
        if (!activeSession) return alert("No active session found");
        if (totalStructureAmount <= 0) return alert("Total fee must be greater than 0");

        setIsSavingStructure(true);
        try {
            const classStr = selectedClass.toString();
            const studentsRef = collection(db, 'sessions', activeSession, 'students');
            const q = query(studentsRef, where('grade', '==', classStr));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                alert(`No students found in Class ${selectedClass}`);
                return;
            }

            const batch = writeBatch(db);
            querySnapshot.docs.forEach((studentDoc) => {
                const feeDocRef = doc(db, 'sessions', activeSession, 'feePayments', studentDoc.id);
                batch.set(feeDocRef, {
                    totalFee: totalStructureAmount,
                    feeBreakdown: feeComponents,
                    studentName: studentDoc.data().name,
                    grade: classStr,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            });

            await batch.commit();
            alert(`Structure set for ${querySnapshot.size} students`);
            setIsStructureModalOpen(false);
            fetchFeeData();
        } catch (error) {
            console.error(error);
            alert("Failed to save structure");
        } finally { setIsSavingStructure(false); }
    };

    // --- PAYMENT LOGIC ---
    const handleProcessPayment = async () => {
        if (!selectedStudent || (!paymentAmount && !relaxationAmount)) return;
        setLoading(true);
        try {
            const amtNum = Number(paymentAmount) || 0;
            const relaxNum = Number(relaxationAmount) || 0;
            const now = new Date();
            const dateKey = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
            
            const studentFeeRef = doc(db, 'sessions', activeSession, 'feePayments', selectedStudent.id);
            const docSnap = await getDoc(studentFeeRef);
            
            let finalKey = dateKey;
            if (docSnap.exists()) {
                const existingHistory = docSnap.data().history || {};
                let count = 1;
                while (existingHistory[finalKey]) {
                    count++;
                    finalKey = `${dateKey} (${count})`;
                }
            }

            await setDoc(studentFeeRef, {
                totalFee: selectedStudent.totalFee || baseClassFee,
                paidAmount: increment(amtNum),
                relaxationAmount: increment(relaxNum),
                history: amtNum > 0 ? { [finalKey]: amtNum } : {},
                studentName: selectedStudent.name,
                grade: selectedClass,
                lastPaymentDate: dateKey
            }, { merge: true });

            setIsPaymentModalOpen(false);
            setPaymentAmount("");
            setRelaxationAmount("");
            fetchFeeData(); 
        } catch (e) { 
            console.error(e);
            alert("Payment failed."); 
        } finally { setLoading(false); }
    };

    if (!isMounted || !activeSession) return <div className="h-screen flex items-center justify-center font-black text-indigo-500 animate-pulse tracking-widest uppercase">Loading Accounts...</div>;

    if (showReceipt && receiptData) {
        return <FeesReceipt 
            student={selectedStudent} 
            paymentRecord={receiptData} 
            feeHistory={feeHistory} 
            onClose={() => { setShowReceipt(false); setReceiptData(null); }} 
            receiptNumber={`REC-${selectedStudent.id.slice(0,4)}-${receiptData.date.replace(/-/g,'')}`} 
        />;
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 text-slate-900 font-sans">
            {/* Header */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">Fee Ledger</h1>
                    <p className="text-slate-500 font-bold text-sm mt-1">Session: <span className="text-indigo-600">{activeSession}</span></p>
                </div>
                
                <div className="flex gap-3 items-center">
                    <button 
                        onClick={() => setIsStructureModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                        <HiCollection className="w-4 h-4" /> Set Structure
                    </button>

                    <button 
                        onClick={() => setShowOnlyDummy(!showOnlyDummy)} 
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${showOnlyDummy ? 'bg-rose-500 text-white border-rose-600' : 'bg-white text-slate-400 border-slate-200'}`}
                    >
                        {showOnlyDummy ? 'Dummy' : 'Live'}
                    </button>
                    <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <select 
                            value={selectedClass} 
                            onChange={(e) => setSelectedClass(e.target.value)} 
                            className="px-4 py-2 bg-transparent font-black text-sm outline-none border-r border-slate-100"
                        >
                            {MOCK_CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>
                        <button onClick={fetchFeeData} className="p-2 hover:bg-slate-50 text-slate-400 transition-colors">
                            <HiRefresh className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                    <div className="relative w-full md:w-96">
                        <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Search by name..." 
                            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl text-sm font-bold border-none shadow-sm outline-none focus:ring-2 ring-indigo-500/20" 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50">
                                <th className="px-8 py-5">Student</th>
                                <th className="px-8 py-5 text-right">Total Fee</th>
                                <th className="px-8 py-5 text-right">Paid</th>
                                <th className="px-8 py-5 text-right">Relaxation</th>
                                <th className="px-8 py-5 text-right">Balance</th>
                                <th className="px-8 py-5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {detailedStudentList.map(s => (
                                <tr key={s.id} className="hover:bg-indigo-50/20 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <HiUserCircle className="w-8 h-8 text-slate-200 group-hover:text-indigo-200 transition-colors" />
                                            <span className="font-black text-slate-700 uppercase">{s.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right font-bold text-slate-400 text-sm">
                                        {formatCurrency(s.totalFee)}
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-emerald-600">
                                        {formatCurrency(s.totalPaid)}
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-rose-500">
                                        {formatCurrency(s.relaxation)}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black ${s.balanceDue > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {s.balanceDue > 0 ? <HiExclamationCircle className="w-3.5 h-3.5" /> : <HiCheckCircle className="w-3.5 h-3.5" />}
                                            {formatCurrency(s.balanceDue)}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex justify-center gap-2">
                                            <button 
                                                onClick={() => { setSelectedStudent(s); setIsPaymentModalOpen(true); }} 
                                                className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                            >
                                                <HiCash className="w-5 h-5"/>
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setSelectedStudent(s);
                                                    const hist = Object.entries(s.history || {}).map(([date, amount]) => ({
                                                        id: date,
                                                        date: date,
                                                        amount: Number(amount),
                                                        createdAt: { seconds: parseFirestoreDate(date).getTime() / 1000 }
                                                    })).sort((a, b) => b.createdAt.seconds - a.createdAt.seconds); 
                                                    
                                                    setFeeHistory(hist);
                                                    if(hist.length > 0) { 
                                                        setReceiptData({ ...hist[0], name: s.name }); 
                                                        setShowReceipt(true); 
                                                    } else alert("No payment history found.");
                                                }} 
                                                className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all"
                                            >
                                                <HiClock className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PAYMENT & RELAXATION MODAL */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black italic uppercase text-slate-900">Add Entry</h2>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <HiX className="w-6 h-6 text-slate-300"/>
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100 text-center">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Student</p>
                                <p className="font-black text-indigo-900 text-lg uppercase">{selectedStudent?.name}</p>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">Amount (₹)</label>
                                <input 
                                    type="number" 
                                    placeholder="0" 
                                    className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all text-xl" 
                                    value={paymentAmount} 
                                    onChange={e => setPaymentAmount(e.target.value)} 
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest flex items-center gap-2">
                                    <HiGift className="text-rose-500 w-4 h-4"/> Relaxation (₹)
                                </label>
                                <input 
                                    type="number" 
                                    placeholder="0" 
                                    className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-rose-500 focus:bg-white transition-all text-xl text-rose-600" 
                                    value={relaxationAmount} 
                                    onChange={e => setRelaxationAmount(e.target.value)} 
                                />
                            </div>

                            <button 
                                onClick={handleProcessPayment} 
                                disabled={loading || (!paymentAmount && !relaxationAmount)}
                                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Confirm Entry'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STRUCTURE MODAL */}
            {isStructureModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black uppercase italic text-slate-900">
                                Fee Structure: Class {selectedClass}
                            </h2>
                            <button onClick={() => setIsStructureModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <HiX className="w-6 h-6 text-slate-300"/>
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                            {feeComponents.map((comp, idx) => (
                                <div key={idx} className="flex gap-3 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <input 
                                        type="text" placeholder="Component Name"
                                        className="flex-grow bg-white p-3 rounded-xl font-bold outline-none border border-slate-200"
                                        value={comp.name} onChange={e => updateComponent(idx, 'name', e.target.value)}
                                    />
                                    <input 
                                        type="number" placeholder="Amount"
                                        className="w-32 bg-white p-3 rounded-xl font-black outline-none border border-slate-200"
                                        value={comp.amount} onChange={e => updateComponent(idx, 'amount', e.target.value)}
                                    />
                                    <button onClick={() => removeComponent(idx)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg">
                                        <HiTrash className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button onClick={addComponent} className="mt-4 flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all">
                            <HiPlus /> Add Component
                        </button>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Class Fee</p>
                                <p className="text-3xl font-black text-slate-900">{formatCurrency(totalStructureAmount)}</p>
                            </div>
                            <button 
                                onClick={handleSaveStructure}
                                disabled={isSavingStructure}
                                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black disabled:opacity-50"
                            >
                                <HiSave className="w-5 h-5" /> {isSavingStructure ? 'Applying...' : 'Apply to Class'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}