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
    HiCollection, HiPlus, HiTrash, HiSave, HiGift, HiExclamation,
    HiCalendar, HiDatabase, HiEye, HiTrendingUp, HiBadgeCheck, HiPrinter
} from 'react-icons/hi';

// Component Import
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
    
    // Modal Management
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
    
    // Form States
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [relaxationAmount, setRelaxationAmount] = useState(""); 
    const [dueAmount, setDueAmount] = useState("");
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    // Receipt & History States
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [feeHistory, setFeeHistory] = useState([]);
    const [feeComponents, setFeeComponents] = useState([{ name: 'Tuition Fee', amount: '' }]);
    const [isSavingStructure, setIsSavingStructure] = useState(false);

    // 1. SESSION & AUTH INITIALIZATION
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

    // 2. DATA FETCHING (FIREBASE)
    const fetchFeeData = useCallback(async () => {
        if (!activeSession || authStatus !== 'authenticated') return;
        setLoading(true);
        try {
            const classStr = selectedClass.toString();
            const sSnap = await getDocs(query(collection(db, 'sessions', activeSession, 'students'), where('grade', '==', classStr)));
            setStudents(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            const fSnap = await getDoc(doc(db, 'sessions', activeSession, 'studentFeeStructures', classStr));
            if (fSnap.exists()) {
                setBaseClassFee(Number(fSnap.data().totalFee) || 0);
                setFeeComponents(fSnap.data().feeBreakdown || [{ name: 'Tuition Fee', amount: '' }]);
            }

            const pSnap = await getDocs(collection(db, 'sessions', activeSession, 'feePayments'));
            const paymentMap = {};
            pSnap.forEach(d => {
                const data = d.data();
                paymentMap[d.id] = { 
                    totalFee: Number(data.totalFee),
                    paidAmount: Number(data.paidAmount) || 0,
                    relaxationAmount: Number(data.relaxationAmount) || 0,
                    dueFees: Number(data.dueFees) || 0,
                    history: data.history || {}
                };
            });
            setAnnualPayments(paymentMap);
        } catch (err) { console.error("Fetch Error:", err); } finally { setLoading(false); }
    }, [selectedClass, activeSession, authStatus]);

    useEffect(() => { fetchFeeData(); }, [fetchFeeData]);

    // 3. COMPUTED LIST (DUMMY/LIVE FILTER)
    const detailedStudentList = useMemo(() => {
        return students
            .filter(s => {
                const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase());
                // Logic for Dummy vs Live
                const matchesType = showOnlyDummy ? s.isDummy === true : (s.isDummy === false || s.isDummy === undefined);
                return matchesSearch && matchesType;
            })
            .map(s => {
                const pDoc = annualPayments[s.id] || { totalFee: baseClassFee, paidAmount: 0, relaxationAmount: 0, dueFees: 0, history: {} };
                const isStudentRte = s.isRte === true;
                const finalTotalFee = isStudentRte ? 0 : (pDoc.totalFee > 0 ? pDoc.totalFee : baseClassFee);
                
                // Final balance logic: (Structure + Arrears) - (Paid + Relaxation)
                const balanceDue = isStudentRte ? 0 : (finalTotalFee + (pDoc.dueFees || 0)) - (pDoc.paidAmount + pDoc.relaxationAmount);

                return { 
                    ...s, 
                    isRte: isStudentRte,
                    totalFee: finalTotalFee, 
                    dueFees: pDoc.dueFees || 0,
                    totalPaid: pDoc.paidAmount, 
                    relaxation: pDoc.relaxationAmount,
                    balanceDue: balanceDue,
                    history: pDoc.history
                };
            })
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }, [students, baseClassFee, annualPayments, searchTerm, showOnlyDummy]);

    // 4. TRANSACTION HANDLER
    const handleProcessPayment = async () => {
        if (!selectedStudent || (!paymentAmount && !relaxationAmount && !dueAmount)) return;
        setLoading(true);
        try {
            const amtNum = Number(paymentAmount) || 0;
            const relaxNum = Number(relaxationAmount) || 0;
            const dueNum = Number(dueAmount) || 0;
            const dateParts = paymentDate.split('-');
            const dateKey = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
            
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
                dueFees: increment(dueNum),
                history: amtNum > 0 ? { [finalKey]: amtNum } : (docSnap.exists() ? docSnap.data().history : {}),
                studentName: selectedStudent.name,
                grade: selectedClass,
                lastPaymentDate: dateKey
            }, { merge: true });

            setIsPaymentModalOpen(false);
            setPaymentAmount("");
            setRelaxationAmount("");
            setDueAmount("");
            fetchFeeData(); 
        } catch (e) { alert("Database update failed."); } 
        finally { setLoading(false); }
    };

    // 5. RENDER LOGIC
    if (!isMounted || !activeSession) return <div className="h-screen flex items-center justify-center font-black text-indigo-500 animate-pulse uppercase italic">Loading System...</div>;

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
            {/* TOP ACTION BAR */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">Fee Management</h1>
                    <p className="text-slate-500 font-bold text-sm mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Active Session: <span className="text-indigo-600 font-black">{activeSession}</span>
                    </p>
                </div>
                
                <div className="flex gap-3 items-center">
                    {/* LIVE / DUMMY TOGGLE */}
                    <button 
                        onClick={() => setShowOnlyDummy(!showOnlyDummy)} 
                        className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md border ${showOnlyDummy ? 'bg-rose-500 text-white border-rose-600 shadow-rose-100' : 'bg-white text-slate-400 border-slate-200 shadow-slate-100'}`}
                    >
                        {showOnlyDummy ? 'Dummy Data' : 'Live Data'}
                    </button>

                    <button onClick={() => setIsStructureModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                        <HiCollection className="w-4 h-4" /> Structure
                    </button>

                    <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="px-4 py-2 bg-transparent font-black text-sm outline-none border-r border-slate-100">
                            {MOCK_CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>
                        <button onClick={fetchFeeData} className="p-2 hover:bg-slate-50 text-slate-400">
                            <HiRefresh className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* STUDENT DATA TABLE */}
            <div className="max-w-7xl mx-auto bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between gap-4">
                    <div className="relative flex-grow max-w-md">
                        <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                        <input type="text" placeholder="Search student..." className="w-full pl-12 pr-4 py-4 bg-slate-50/50 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-indigo-500/20" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="hidden md:flex gap-6">
                        <div className="text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase">Total Students</p>
                            <p className="text-lg font-black">{detailedStudentList.length}</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50">
                                <th className="px-8 py-6">Student Profile</th>
                                <th className="px-8 py-6 text-right">Structure</th>
                                <th className="px-8 py-6 text-right">Old Due</th>
                                <th className="px-8 py-6 text-right">Paid</th>
                                <th className="px-8 py-6 text-right">Relaxation</th>
                                <th className="px-8 py-6 text-right">Balance</th>
                                <th className="px-8 py-6 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {detailedStudentList.map(s => (
                                <tr key={s.id} className="hover:bg-indigo-50/20 transition-all group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${s.isDummy ? 'bg-rose-400' : 'bg-indigo-400'}`}></div>
                                            <span className="font-black text-slate-700 uppercase italic leading-none">{s.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right text-slate-400 font-bold text-sm">
                                        {s.isRte ? <span className="text-emerald-500">RTE Free</span> : formatCurrency(s.totalFee)}
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-amber-600">{formatCurrency(s.dueFees)}</td>
                                    <td className="px-8 py-5 text-right font-black text-emerald-600">{formatCurrency(s.totalPaid)}</td>
                                    <td className="px-8 py-5 text-right font-black text-rose-500">{formatCurrency(s.relaxation)}</td>
                                    <td className="px-8 py-5 text-right">
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black shadow-sm ${s.balanceDue > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                            {formatCurrency(s.balanceDue)}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => { setSelectedStudent(s); setIsViewModalOpen(true); }} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-black transition-all shadow-md">
                                                <HiEye className="w-5 h-5"/>
                                            </button>
                                            <button onClick={() => { setSelectedStudent(s); setIsPaymentModalOpen(true); }} className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md">
                                                <HiCash className="w-5 h-5"/>
                                            </button>
                                            <button onClick={() => {
                                                setSelectedStudent(s);
                                                const hist = Object.entries(s.history || {}).map(([date, amount]) => ({
                                                    id: date, date: date, amount: Number(amount),
                                                    createdAt: { seconds: parseFirestoreDate(date).getTime() / 1000 }
                                                })).sort((a, b) => b.createdAt.seconds - a.createdAt.seconds); 
                                                setFeeHistory(hist);
                                                if(hist.length > 0) { setReceiptData({ ...hist[0], name: s.name }); setShowReceipt(true); } 
                                                else alert("No receipt history available.");
                                            }} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all">
                                                <HiPrinter className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* 1. NEUGLASS VIEW MODAL */}
            {isViewModalOpen && selectedStudent && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
                    <div className="bg-white/70 backdrop-blur-2xl border border-white/50 rounded-[3rem] w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-[20px_20px_60px_rgba(0,0,0,0.05),-20px_-20px_60px_rgba(255,255,255,0.8)] flex flex-col">
                        <div className="p-8 pb-4 flex justify-between items-start">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">{selectedStudent.name}</h3>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1 flex items-center gap-2"><HiBadgeCheck/> Verified Statement</p>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-3 bg-white/50 hover:bg-white rounded-2xl shadow-inner transition-all"><HiX className="w-6 h-6 text-slate-400" /></button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-8 pt-4 space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white/40 p-5 rounded-[2rem] border border-white/60 shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Standard Fee</p>
                                    <p className="text-xl font-black">{formatCurrency(selectedStudent.totalFee)}</p>
                                </div>
                                <div className="bg-white/40 p-5 rounded-[2rem] border border-white/60 shadow-sm">
                                    <p className="text-[9px] font-black text-amber-500 uppercase mb-1">Arrears/Old</p>
                                    <p className="text-xl font-black text-amber-600">{formatCurrency(selectedStudent.dueFees)}</p>
                                </div>
                                <div className="bg-white/40 p-5 rounded-[2rem] border border-white/60 shadow-sm">
                                    <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Total Paid</p>
                                    <p className="text-xl font-black text-emerald-600">{formatCurrency(selectedStudent.totalPaid)}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Transaction History</h4>
                                {Object.entries(selectedStudent.history || {}).length > 0 ? (
                                    Object.entries(selectedStudent.history).sort((a,b) => parseFirestoreDate(b[0]) - parseFirestoreDate(a[0])).map(([date, amount]) => (
                                        <div key={date} className="flex justify-between items-center bg-white/60 p-5 rounded-[1.5rem] border border-white shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center gap-3">
                                                <HiTrendingUp className="text-emerald-500 w-5 h-5"/>
                                                <span className="text-sm font-black text-slate-700">{date}</span>
                                            </div>
                                            <span className="text-sm font-black text-emerald-600">+{formatCurrency(amount)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-slate-300 font-bold italic">No payments recorded.</div>
                                )}
                            </div>
                            <div className="bg-slate-900 p-6 rounded-[2.5rem] flex justify-between items-center text-white">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Balance Due</p>
                                    <h2 className="text-3xl font-black">{formatCurrency(selectedStudent.balanceDue)}</h2>
                                </div>
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${selectedStudent.balanceDue <= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                    <HiExclamationCircle className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. PAYMENT & ARREARS MODAL */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] p-8 w-full max-w-md shadow-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black italic uppercase text-slate-900">Add Entry</h2>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><HiX className="w-6 h-6 text-slate-300"/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-center">
                                <p className="font-black text-indigo-900 text-lg uppercase italic">{selectedStudent?.name}</p>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Date</label>
                                    <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-500" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Existing Old</label>
                                    <div className="w-full p-4 bg-amber-50 rounded-2xl font-black text-amber-700 border border-amber-100">{formatCurrency(selectedStudent?.dueFees || 0)}</div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-rose-500 uppercase mb-1 block">Add to Old Due / Arrears (₹)</label>
                                <input type="number" placeholder="Enter Arrears..." className="w-full p-4 bg-rose-50/30 rounded-2xl font-black outline-none border-2 border-transparent focus:border-rose-300 text-rose-700" value={dueAmount} onChange={e => setDueAmount(e.target.value)} />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Installment Amount (₹)</label>
                                <input type="number" placeholder="Enter Amount..." className="w-full p-4 bg-slate-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-500" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-emerald-500 uppercase mb-1 block">Relaxation / Discount (₹)</label>
                                <input type="number" placeholder="Enter Relaxation..." className="w-full p-4 bg-emerald-50/30 rounded-2xl font-black outline-none border-2 border-transparent focus:border-emerald-500 text-emerald-700" value={relaxationAmount} onChange={e => setRelaxationAmount(e.target.value)} />
                            </div>

                            <button onClick={handleProcessPayment} disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                                {loading ? 'Saving Data...' : 'Confirm Transaction'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. STRUCTURE MODAL */}
            {isStructureModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] p-8 w-full max-w-2xl shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black uppercase italic text-slate-900">Class {selectedClass} Structure</h2>
                            <button onClick={() => setIsStructureModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><HiX className="w-6 h-6 text-slate-300"/></button>
                        </div>
                        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                            {feeComponents.map((comp, idx) => (
                                <div key={idx} className="flex gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <input type="text" placeholder="Fee Name" className="flex-grow bg-white p-3 rounded-xl font-bold outline-none border border-slate-200 text-sm uppercase" value={comp.name} onChange={e => { const n = [...feeComponents]; n[idx].name = e.target.value; setFeeComponents(n); }} />
                                    <input type="number" placeholder="₹" className="w-32 bg-white p-3 rounded-xl font-black outline-none border border-slate-200" value={comp.amount} onChange={e => { const n = [...feeComponents]; n[idx].amount = e.target.value; setFeeComponents(n); }} />
                                    <button onClick={() => setFeeComponents(feeComponents.filter((_, i) => i !== idx))} className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg"><HiTrash/></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setFeeComponents([...feeComponents, { name: '', amount: '' }])} className="mt-4 flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-indigo-50 rounded-xl transition-all"><HiPlus /> Add Item</button>
                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Academic Fee</p>
                                <p className="text-3xl font-black text-slate-900 italic tracking-tighter">{formatCurrency(feeComponents.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0))}</p>
                            </div>
                            <button onClick={async () => {
                                setIsSavingStructure(true);
                                const total = feeComponents.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
                                try {
                                    await setDoc(doc(db, 'sessions', activeSession, 'studentFeeStructures', selectedClass), { totalFee: total, feeBreakdown: feeComponents, updatedAt: serverTimestamp() });
                                    alert("Structure applied!"); fetchFeeData(); setIsStructureModalOpen(false);
                                } finally { setIsSavingStructure(false); }
                            }} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all">
                                <HiSave className="w-5 h-5" /> {isSavingStructure ? 'Saving...' : 'Apply Structure'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}