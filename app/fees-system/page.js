'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    getFirestore, collection, query, where, getDocs, doc, getDoc, 
    setDoc, Timestamp 
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../firebase/config'; 
import { 
    HiRefresh, HiPencilAlt, HiCheckCircle, HiExclamationCircle, 
    HiPrinter, HiTrendingUp, HiX, HiCash, HiClock, HiTag, HiSearch,
    HiOutlineLightningBolt
} from 'react-icons/hi';

// Important: Ensure this file exists in your components folder
import FeesReceipt from '../components/FeeReceipt'; 

const db = getFirestore(app);
const MOCK_CLASSES = ["PREP", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(Number(amount) || 0);
};

export default function FeesSystemPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [activeSession, setActiveSession] = useState(null); 
    const [authStatus, setAuthStatus] = useState('loading');
    
    const [selectedClass, setSelectedClass] = useState("1");
    const [searchTerm, setSearchTerm] = useState("");
    const [showOnlyDummy, setShowOnlyDummy] = useState(false); // NEW: Dummy Toggle State
    
    const [students, setStudents] = useState([]);
    const [feeStructure, setFeeStructure] = useState({ totalAnnual: 0, components: [] });
    const [annualPayments, setAnnualPayments] = useState({});
    const [loading, setLoading] = useState(false);
    
    const [isDefineModalOpen, setIsDefineModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    
    const [feeComponents, setFeeComponents] = useState([{ label: '', amount: 0 }]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [relaxationAmount, setRelaxationAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [remarks, setRemarks] = useState("");

    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [feeHistory, setFeeHistory] = useState([]);

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
            
            // FETCH ALL STUDENTS for the class (filter dummy status locally for reliability)
            const sSnap = await getDocs(query(collection(db, 'sessions', activeSession, 'students'), where('grade', '==', classStr)));
            setStudents(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            // FETCH FEE STRUCTURE
            const fSnap = await getDoc(doc(db, 'sessions', activeSession, 'studentFeeStructures', classStr));
            if (fSnap.exists()) {
                const data = fSnap.data();
                setFeeStructure({ totalAnnual: Number(data.totalFee) || 0, components: data.components || [] });
                setFeeComponents(data.components?.map(c => ({ label: c.name, amount: Number(c.amount) })) || []);
            } else {
                setFeeStructure({ totalAnnual: 0, components: [] });
            }

            // FETCH PAYMENTS
            const pSnap = await getDocs(query(collection(db, 'sessions', activeSession, 'feePayments'), where('grade', '==', classStr)));
            const totals = {};
            pSnap.forEach(d => {
                const data = d.data();
                if (!totals[data.studentId]) totals[data.studentId] = { amount: 0, relaxation: 0 };
                totals[data.studentId].amount += Number(data.amount || 0);
                totals[data.studentId].relaxation += Number(data.relaxation || 0);
            });
            setAnnualPayments(totals);
        } catch (err) { console.error("Fetch Error:", err); } finally { setLoading(false); }
    }, [selectedClass, activeSession, authStatus]);

    useEffect(() => { fetchFeeData(); }, [fetchFeeData]);

    const detailedStudentList = useMemo(() => {
        const annualFee = Number(feeStructure.totalAnnual) || 0;
        
        return students
            .filter(s => {
                // NAME SEARCH FILTER
                const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase());
                
                // NORMAL vs DUMMY FILTER
                let matchesType = false;
                if (showOnlyDummy) {
                    matchesType = s.isDummy === true;
                } else {
                    matchesType = s.isDummy === false || s.isDummy === undefined;
                }
                
                return matchesSearch && matchesType;
            })
            .map(s => {
                const paid = Number(annualPayments[s.id]?.amount) || 0;
                const rel = Number(annualPayments[s.id]?.relaxation) || 0;
                const prevDue = Number(s.previouslyDue || s.previousDue || s.prevDue || 0); 
                const totalPayable = annualFee + prevDue;

                return { 
                    ...s, 
                    totalFee: annualFee, 
                    totalPaid: paid, 
                    totalRel: rel, 
                    prevDue: prevDue,
                    balanceDue: totalPayable - paid - rel 
                };
            })
            .sort((a, b) => Number(a.srNo || 0) - Number(b.srNo || 0));
    }, [students, feeStructure, annualPayments, searchTerm, showOnlyDummy]);

    const handleProcessPayment = async () => {
        if (!selectedStudent || (!paymentAmount && !relaxationAmount)) return;
        setLoading(true);
        try {
            const amt = Number(paymentAmount) || 0;
            const rel = Number(relaxationAmount) || 0;

            const newPayment = {
                studentId: selectedStudent.id,
                name: selectedStudent.name,
                srNo: selectedStudent.srNo || "",
                grade: selectedClass,
                amount: amt,
                relaxation: rel,
                paymentMethod,
                remarks,
                isDummyRecord: showOnlyDummy, // Track if payment was made in dummy mode
                createdAt: Timestamp.now(), 
            };

            const docRef = doc(collection(db, 'sessions', activeSession, 'feePayments'));
            await setDoc(docRef, newPayment);
            
            const hSnap = await getDocs(query(collection(db, 'sessions', activeSession, 'feePayments'), where('studentId', '==', selectedStudent.id)));
            const history = hSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

            setFeeHistory(history);
            setReceiptData({ ...newPayment, id: docRef.id });
            setShowReceipt(true);
            setIsPaymentModalOpen(false);
            
            setPaymentAmount(""); setRelaxationAmount(""); setRemarks("");
            fetchFeeData(); 
        } catch (e) { alert("Save Failed"); } finally { setLoading(false); }
    };

    if (!isMounted || !activeSession) return <div className="h-screen flex items-center justify-center font-black text-slate-400">LOADING DATABASE...</div>;

    if (showReceipt && receiptData) {
        return <FeesReceipt student={selectedStudent} paymentRecord={receiptData} feeHistory={feeHistory} onClose={() => { setShowReceipt(false); setReceiptData(null); }} receiptNumber={receiptData.id?.slice(-6).toUpperCase()} />;
    }

    return (
        <div className="min-h-screen bg-[#F4F7FE] p-4 md:p-10 text-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic">SCHOOL FEES</h1>
                    <div className="flex gap-2 items-center mt-1">
                        <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-md">{activeSession}</span>
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Class {selectedClass} Ledger</span>
                        {showOnlyDummy && (
                            <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase animate-pulse">Dummy List</span>
                        )}
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-2 items-center">
                    {/* DUMMY TOGGLE BUTTON */}
                    <button 
                        onClick={() => setShowOnlyDummy(!showOnlyDummy)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest shadow-sm ${
                            showOnlyDummy 
                            ? 'bg-rose-500 border-rose-600 text-white shadow-rose-100' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-400'
                        }`}
                    >
                        <HiOutlineLightningBolt className={showOnlyDummy ? "animate-bounce" : ""} />
                        {showOnlyDummy ? 'Dummy View' : 'Normal View'}
                    </button>

                    <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border">
                        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="px-4 py-2 font-black outline-none bg-transparent text-sm">
                            {MOCK_CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>
                        <button onClick={fetchFeeData} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 transition-colors">
                            <HiRefresh className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-6 md:p-8 border-b flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
                    <div className="relative w-full md:w-80">
                        <HiSearch className="absolute left-4 top-3.5 text-slate-300" />
                        <input type="text" placeholder={`Search ${showOnlyDummy ? 'dummy' : 'normal'} students...`} className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl text-sm font-bold border-none shadow-inner focus:ring-2 ring-indigo-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <button onClick={() => setIsDefineModalOpen(true)} className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200">
                        <HiPencilAlt className="w-4 h-4" /> Edit Fee Structure
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b">
                                <th className="px-8 py-6">SR</th>
                                <th className="px-8 py-6">Student</th>
                                <th className="px-8 py-6 text-right">Annual</th>
                                <th className="px-8 py-6 text-right text-rose-500">Prev. Due</th>
                                <th className="px-8 py-6 text-right">Paid</th>
                                <th className="px-8 py-6 text-right">Balance</th>
                                <th className="px-8 py-6 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {detailedStudentList.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-20 text-center font-black text-slate-200 uppercase tracking-tighter text-2xl">
                                        No {showOnlyDummy ? 'Dummy' : 'Normal'} Students Found
                                    </td>
                                </tr>
                            ) : (
                                detailedStudentList.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                                        <td className="px-8 py-5 font-bold text-slate-300">{s.srNo || '-'}</td>
                                        <td className="px-8 py-5 font-black text-slate-700 uppercase">
                                            {s.name}
                                            {s.balanceDue > 0 && <span className="ml-2 bg-rose-500 text-white text-[7px] px-1.5 py-0.5 rounded shadow-sm">DUE</span>}
                                        </td>
                                        <td className="px-8 py-5 text-right font-bold text-slate-500">{formatCurrency(s.totalFee)}</td>
                                        <td className="px-8 py-5 text-right font-black text-rose-600">{formatCurrency(s.prevDue)}</td>
                                        <td className="px-8 py-5 text-right font-black text-emerald-600">{formatCurrency(s.totalPaid)}</td>
                                        <td className="px-8 py-5 text-right">
                                            <span className={`px-4 py-1.5 rounded-xl font-black text-[11px] ${s.balanceDue <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {formatCurrency(s.balanceDue)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 flex justify-center gap-2">
                                            <button onClick={() => { setSelectedStudent(s); setIsPaymentModalOpen(true); }} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition shadow-sm"><HiCash className="w-5 h-5"/></button>
                                            <button onClick={async () => {
                                                setSelectedStudent(s);
                                                const q = query(collection(db, 'sessions', activeSession, 'feePayments'), where('studentId', '==', s.id));
                                                const snap = await getDocs(q);
                                                const hist = snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => b.createdAt.seconds - a.createdAt.seconds);
                                                setFeeHistory(hist);
                                                if(hist.length > 0) { setReceiptData(hist[0]); setShowReceipt(true); } else { alert("No Payments Found"); }
                                            }} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-800 hover:text-white transition shadow-sm"><HiClock className="w-5 h-5"/></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODALS RENDERED HERE... (Same as your previous logic) */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-white/20">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-slate-800 italic">Receive Fees</h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-full transition"><HiX className="w-6 h-6"/></button>
                        </div>
                        <div className="p-6 bg-indigo-50 rounded-3xl mb-8 border border-indigo-100/50">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Student</p>
                            <h4 className="text-xl font-black text-indigo-900 uppercase leading-tight">{selectedStudent?.name}</h4>
                            <div className="flex justify-between mt-3 pt-3 border-t border-indigo-100">
                                <span className="text-[10px] font-black text-rose-500 uppercase">Total Incl. Arrears</span>
                                <span className="text-xs font-black text-indigo-600">{formatCurrency(selectedStudent?.balanceDue)}</span>
                            </div>
                        </div>
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Amount</label>
                                    <input type="number" className="w-full p-4 bg-emerald-50 rounded-2xl font-black text-emerald-700 border-2 border-transparent focus:border-emerald-200 outline-none transition-all" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="0" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Discount</label>
                                    <input type="number" className="w-full p-4 bg-amber-50 rounded-2xl font-black text-amber-700 border-2 border-transparent focus:border-amber-200 outline-none transition-all" value={relaxationAmount} onChange={e => setRelaxationAmount(e.target.value)} placeholder="0" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Method</label>
                                <select className="w-full p-4 bg-slate-100 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-100 appearance-none" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                    <option>Cash</option>
                                    <option>Online/UPI</option>
                                    <option>Cheque</option>
                                    <option>Scholarship</option>
                                </select>
                            </div>
                            <button onClick={handleProcessPayment} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all mt-4">Process & Print Receipt</button>
                        </div>
                    </div>
                </div>
            )}

            {isDefineModalOpen && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800 uppercase">Setup Class {selectedClass}</h3>
                            <button onClick={() => setIsDefineModalOpen(false)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><HiX className="w-6 h-6"/></button>
                        </div>
                        <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                            {feeComponents.map((c, i) => (
                                <div key={i} className="flex gap-2">
                                    <input className="flex-1 p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 ring-indigo-500" placeholder="e.g. Tuition Fee" value={c.label} onChange={e => {
                                        const n = [...feeComponents]; n[i].label = e.target.value; setFeeComponents(n);
                                    }} />
                                    <input className="w-28 p-4 bg-slate-50 rounded-2xl font-black text-right border-none outline-none focus:ring-2 ring-indigo-500" type="number" value={c.amount} onChange={e => {
                                        const n = [...feeComponents]; n[i].amount = Number(e.target.value); setFeeComponents(n);
                                    }} />
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl mb-6 font-black text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all" onClick={() => setFeeComponents([...feeComponents, {label:'', amount:0}])}>+ ADD FEE TYPE</button>
                        <div className="bg-slate-900 p-5 rounded-3xl text-white flex justify-between items-center mb-6">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Total Annual</span>
                            <span className="text-2xl font-black tracking-tighter">{formatCurrency(feeComponents.reduce((a,b)=>a+b.amount, 0))}</span>
                        </div>
                        <button className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100" onClick={async () => {
                            const total = feeComponents.reduce((a,b)=>a+b.amount,0);
                            await setDoc(doc(db, 'sessions', activeSession, 'studentFeeStructures', selectedClass), { components: feeComponents.map(c=>({name:c.label, amount:c.amount})), totalFee: total });
                            setIsDefineModalOpen(false); fetchFeeData();
                        }}>Confirm Structure</button>
                    </div>
                </div>
            )}
        </div>
    );
}