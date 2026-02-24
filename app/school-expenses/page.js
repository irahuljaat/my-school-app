'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    getFirestore, collection, query, getDocs, doc, 
    setDoc, Timestamp, deleteDoc, where, collectionGroup, onSnapshot 
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../firebase/config'; 
import { 
    HiPlus, HiTrash, HiAcademicCap, HiCalendar, 
    HiCash, HiRefresh, HiX, HiUserGroup, HiArrowSmUp, HiArrowSmDown 
} from 'react-icons/hi';

const db = getFirestore(app);

// --- HELPERS ---
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
};

const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    const d = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function SchoolExpensePortal() {
    const [loading, setLoading] = useState(true);
    const [availableSessions, setAvailableSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(""); 
    
    const [feeTransactions, setFeeTransactions] = useState([]);
    const [salaryTransactions, setSalaryTransactions] = useState([]);
    const [manualTransactions, setManualTransactions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState("All");
    const [authStatus, setAuthStatus] = useState('loading');

    const [entryType, setEntryType] = useState("Expense");
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");

    // 1. DYNAMIC SESSION LISTENER
    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'config', 'settings'), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setAvailableSessions(data.sessions || ["2025-26"]);
                if (!activeSession) {
                    setActiveSession(data.activeSession);
                }
            }
        });
        return () => unsub();
    }, [activeSession]);

    const fetchData = useCallback(async () => {
        if (!activeSession) return;
        setLoading(true);
        try {
            // 1. TEACHERS DATA
            const teacherSnap = await getDocs(collection(db, 'teachers'));
            const teacherMap = {};
            teacherSnap.docs.forEach(d => {
                const data = d.data();
                const cleanSalary = String(data.salary || "0").replace(/[^0-9.]/g, '');
                teacherMap[d.id] = Number(cleanSalary);
            });

            // 2. FEES (Filtered by session path)
            const feeSnap = await getDocs(query(collectionGroup(db, 'feePayments')));
            const feeList = feeSnap.docs
                .filter(d => d.ref.path.includes(activeSession))
                .map(d => ({
                    id: d.id, source: 'fees', type: 'Income', category: 'Student Fee',
                    amount: Number(d.data().paidAmount || 0),
                    date: d.data().createdAt || Timestamp.now(),
                    note: `Student Fee: ${d.data().studentName || 'Student'}`
                }));

            // 3. SALARIES (Filtered by academic year logic)
            const salarySnap = await getDocs(collection(db, 'salaryPayments'));
            const [sYear, eYearShort] = activeSession.split('-').map(v => v.trim());
            const sessionStartYear = Number(sYear);
            const sessionEndYear = eYearShort ? Number(`20${eYearShort}`) : sessionStartYear + 1;

            const salaryList = salarySnap.docs
                .filter(d => {
                    const data = d.data();
                    const my = data.monthYear; 
                    const status = (data.status || "").toLowerCase().trim();
                    if (!my || status !== "paid") return false;
                    const [y, m] = my.split('-').map(Number);
                    return (y === sessionStartYear && m >= 4) || (y === sessionEndYear && m <= 3);
                })
                .map(d => {
                    const data = d.data();
                    return {
                        id: d.id, source: 'salary', type: 'Expense', category: 'Teacher Salary',
                        amount: Number(data.amount || 0),
                        date: data.paymentDate || data.createdAt || Timestamp.now(),
                        note: `${data.teacherName || 'Staff'} - ${data.monthYear}`
                    };
                });

            // 4. MANUAL ENTRIES (Updated to: sessions > {activeSession} > accounts)
            const manualSnap = await getDocs(collection(db, 'sessions', activeSession, 'accounts'));
            const manualList = manualSnap.docs.map(d => ({ id: d.id, source: 'manual', ...d.data() }));

            setFeeTransactions(feeList);
            setSalaryTransactions(salaryList);
            setManualTransactions(manualList);
        } catch (e) {
            console.error("Fetch Error:", e);
        } finally {
            setLoading(false);
        }
    }, [activeSession]);

    useEffect(() => {
        const auth = getAuth(app);
        return onAuthStateChanged(auth, (user) => {
            if (user) { 
                setAuthStatus('authenticated'); 
                if (activeSession) fetchData(); 
            }
            else { setAuthStatus('unauthenticated'); }
        });
    }, [fetchData, activeSession]);

    const stats = useMemo(() => {
        const inc = feeTransactions.reduce((s, t) => s + t.amount, 0) + 
                    manualTransactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
        const sal = salaryTransactions.reduce((s, t) => s + t.amount, 0);
        const exp = sal + manualTransactions.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
        return { inc, exp, sal, bal: inc - exp };
    }, [feeTransactions, salaryTransactions, manualTransactions]);

    const combinedList = useMemo(() => {
        const all = [...feeTransactions, ...salaryTransactions, ...manualTransactions];
        return all.filter(t => filter === "All" || t.type === filter)
                  .sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
    }, [feeTransactions, salaryTransactions, manualTransactions, filter]);

    if (authStatus === 'loading' || !activeSession) return (
        <div className="h-screen flex items-center justify-center font-black animate-pulse bg-white text-slate-400 uppercase tracking-[0.3em]">
            Syncing Ledger...
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fafafa] p-4 md:p-10 text-slate-900 font-sans">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase text-slate-800">School Ledger</h1>
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                        <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                            Session {activeSession}
                        </span>
                        <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
                        <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">Accounting Portal</p>
                    </div>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                    <select 
                        value={activeSession} 
                        onChange={(e) => setActiveSession(e.target.value)} 
                        className="bg-white border border-slate-200 px-4 py-3 rounded-2xl font-black text-[10px] uppercase shadow-sm outline-none focus:ring-2 ring-indigo-500"
                    >
                        {availableSessions.map(s => <option key={s} value={s}>{s} Session</option>)}
                    </select>
                    
                    <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-400 hover:text-indigo-600 transition-colors">
                        <HiRefresh className={loading ? 'animate-spin' : ''}/>
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="flex-1 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-xl hover:bg-indigo-700 transition-all">
                        + Add Entry
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <StatCard label="Total Income" val={stats.inc} color="text-emerald-600" />
                <StatCard label="Teacher Salaries" val={stats.sal} color="text-rose-600" />
                <StatCard label="Direct Expenses" val={stats.exp - stats.sal} color="text-slate-700" />
                <div className="bg-slate-900 p-7 rounded-[2rem] text-white shadow-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Balance</p>
                    <h3 className="text-2xl font-black tracking-tight">{formatCurrency(stats.bal)}</h3>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-50 overflow-hidden">
                <div className="p-8 border-b flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
                    <h2 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Transaction History</h2>
                    <div className="flex bg-slate-50 p-1 rounded-2xl">
                        {["All", "Income", "Expense"].map(f => (
                            <button key={f} onClick={() => setFilter(f)} className={`px-6 md:px-8 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{f}</button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-300 text-[10px] uppercase font-black tracking-widest border-b bg-slate-50/50">
                                <th className="px-10 py-6">Date</th>
                                <th className="px-10 py-6">Category</th>
                                <th className="px-10 py-6">Reference</th>
                                <th className="px-10 py-6 text-right">Amount</th>
                                <th className="px-10 py-6 text-center">Source</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {combinedList.map((t, idx) => (
                                <tr key={t.id + idx} className="hover:bg-indigo-50/30 transition-all duration-300 group">
                                    <td className="px-10 py-6 font-bold text-slate-400 text-[11px]">{formatDate(t.date)}</td>
                                    <td className="px-10 py-6">
                                        <span className={`px-4 py-1.5 rounded-full font-black text-[8px] uppercase tracking-widest ${t.type === 'Income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {t.category}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-slate-600 font-black text-xs italic tracking-tight">{t.note}</td>
                                    <td className={`px-10 py-6 text-right font-black text-sm ${t.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {t.type === 'Income' ? '+' : '-'}{formatCurrency(t.amount)}
                                    </td>
                                    <td className="px-10 py-6 text-center">
                                        {t.source === 'manual' ? (
                                            <button onClick={() => deleteDoc(doc(db, 'sessions', activeSession, 'accounts', t.id)).then(fetchData)} className="text-slate-200 hover:text-rose-600 transition-colors"><HiTrash className="mx-auto w-5 h-5"/></button>
                                        ) : (
                                            t.source === 'fees' ? <HiAcademicCap className="text-indigo-300 mx-auto w-6 h-6"/> : <HiUserGroup className="text-orange-200 mx-auto w-6 h-6"/>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Manual Entry</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-rose-500 transition"><HiX className="w-8 h-8"/></button>
                        </div>
                        <p className="text-[10px] font-black text-indigo-600 mb-4 uppercase tracking-[0.2em]">Adding to Session {activeSession}</p>
                        <div className="flex bg-slate-50 p-1 rounded-[1.5rem] mb-6">
                            <button onClick={() => setEntryType("Expense")} className={`flex-1 py-4 rounded-[1.2rem] font-black text-[9px] tracking-widest ${entryType === 'Expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-300'}`}>EXPENSE</button>
                            <button onClick={() => setEntryType("Income")} className={`flex-1 py-4 rounded-[1.2rem] font-black text-[9px] tracking-widest ${entryType === 'Income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-300'}`}>INCOME</button>
                        </div>
                        <input type="number" placeholder="Amount (INR)" className="w-full p-5 bg-slate-50 border border-transparent focus:border-indigo-500 rounded-3xl mb-4 font-black text-lg outline-none transition-all" value={amount} onChange={e => setAmount(e.target.value)}/>
                        <input type="text" placeholder="Entry Details" className="w-full p-5 bg-slate-50 border border-transparent focus:border-indigo-500 rounded-3xl mb-6 font-bold outline-none transition-all" value={note} onChange={e => setNote(e.target.value)}/>
                        <button className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] tracking-widest uppercase shadow-xl hover:bg-indigo-600 transition-all" onClick={async () => {
                            if(!amount) return;
                            // Updated path to sessions > activeSession > accounts
                            const manualRef = doc(collection(db, 'sessions', activeSession, 'accounts'));
                            await setDoc(manualRef, { 
                                type: entryType, 
                                amount: Number(amount), 
                                note, 
                                date: Timestamp.now(), 
                                category: note 
                            });
                            setIsModalOpen(false); setAmount(""); setNote(""); fetchData();
                        }}>Confirm Transaction</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, val, color }) {
    return (
        <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm group hover:shadow-lg transition-all duration-500">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{label}</p>
            <h3 className={`text-2xl font-black ${color} tracking-tight`}>{formatCurrency(val)}</h3>
        </div>
    );
}