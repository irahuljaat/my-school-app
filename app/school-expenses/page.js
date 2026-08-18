'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    getFirestore, collection, query, getDocs, doc, 
    setDoc, Timestamp, deleteDoc, collectionGroup, onSnapshot 
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../firebase/config'; 
import { 
    HiTrash, HiAcademicCap, HiRefresh, HiX, HiUserGroup, 
    HiOutlineDocumentText, HiPrinter, HiDownload
} from 'react-icons/hi';

const db = getFirestore(app);

// --- HELPERS ---
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
};

const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    const d = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
    if (isNaN(d.getTime())) return 'N/A';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
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
                setAvailableSessions(data.sessions || ["2025-26", "2026-27"]);
                if (!activeSession && data.activeSession) {
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
            // 1. FEES (Income) - Using history map with date as field and amount as value
            const feeSnap = await getDocs(query(collectionGroup(db, 'feePayments')));
            const feeList = [];

            feeSnap.docs.forEach(d => {
                if (!d.ref.path.includes(activeSession)) return;
                const data = d.data();
                const history = data.history;
                const studentName = data.studentName || 'Student';

                if (history && typeof history === 'object') {
                    // history is a map where key is date string and value is amount paid
                    Object.entries(history).forEach(([dateKey, paidAmt]) => {
                        let parsedDate = Timestamp.now();
                        // Try parsing dateKey (could be YYYY-MM-DD, timestamp, or formatted string)
                        if (dateKey) {
                            const parsed = new Date(dateKey);
                            if (!isNaN(parsed.getTime())) {
                                parsedDate = Timestamp.fromDate(parsed);
                            }
                        }

                        feeList.push({
                            id: `${d.id}_${dateKey}`,
                            source: 'fees',
                            type: 'Income',
                            category: 'Student Fee',
                            amount: Number(paidAmt || 0),
                            date: parsedDate,
                            note: `Student Fee: ${studentName}`
                        });
                    });
                } else {
                    // Fallback to legacy fields if history map is missing
                    feeList.push({
                        id: d.id,
                        source: 'fees',
                        type: 'Income',
                        category: 'Student Fee',
                        amount: Number(data.paidAmount || 0),
                        date: data.createdAt || Timestamp.now(),
                        note: `Student Fee: ${studentName}`
                    });
                }
            });

            // 2. SALARIES (Expense)
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

            // 3. MANUAL ENTRIES (Admin added Accounts)
            const manualSnap = await getDocs(collection(db, 'sessions', activeSession, 'accounts'));
            const manualList = manualSnap.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id, 
                    source: 'manual', 
                    type: data.type?.toLowerCase() === 'income' ? 'Income' : 'Expense',
                    category: data.category || 'Manual Entry',
                    amount: Number(data.amount || 0),
                    date: data.date || Timestamp.now(),
                    note: data.category || 'Manual Entry'
                };
            });

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

    // --- PRINT & EXCEL HANDLERS ---
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>School Ledger - Session ${activeSession}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                        h2 { text-align: center; margin-bottom: 5px; }
                        .subtitle { text-align: center; font-size: 12px; color: #666; margin-bottom: 20px; }
                        .summary-box { display: flex; justify-content: space-around; margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; border-radius: 8px; background: #f9f9f9; }
                        .summary-item { text-align: center; }
                        .summary-item h4 { margin: 0; font-size: 14px; color: #555; }
                        .summary-item p { margin: 5px 0 0; font-size: 16px; font-weight: bold; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 12px; }
                        th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; }
                        .text-right { text-align: right; }
                        .income { color: #0d9488; }
                        .expense { color: #e11d48; }
                    </style>
                </head>
                <body>
                    <h2>MVG PUBLIC SR. SEC. SCHOOL - Ledger</h2>
                    <div class="subtitle">Accounting & Finance Portal | Session: ${activeSession} | Filter: ${filter}</div>
                    
                    <div class="summary-box">
                        <div class="summary-item"><h4>Total Income</h4><p class="income">${formatCurrency(stats.inc)}</p></div>
                        <div class="summary-item"><h4>Salaries</h4><p class="expense">${formatCurrency(stats.sal)}</p></div>
                        <div class="summary-item"><h4>Other Expenses</h4><p class="expense">${formatCurrency(stats.exp - stats.sal)}</p></div>
                        <div class="summary-item"><h4>Net Balance</h4><p>${formatCurrency(stats.bal)}</p></div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Details</th>
                                <th class="text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${combinedList.map(t => `
                                <tr>
                                    <td>${formatDate(t.date)}</td>
                                    <td>${t.type}</td>
                                    <td>${t.note}</td>
                                    <td class="text-right ${t.type === 'Income' ? 'income' : ''}">${t.type === 'Income' ? '+' : '-'}${formatCurrency(t.amount)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handleExportExcel = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Date,Type,Details,Amount,Source\r\n";
        
        combinedList.forEach(t => {
            const dateStr = formatDate(t.date);
            const typeStr = t.type;
            const detailsStr = `"${(t.note || "").replace(/"/g, '""')}"`;
            const amountStr = `${t.type === 'Income' ? '+' : '-'}${t.amount}`;
            const sourceStr = t.source;
            csvContent += `${dateStr},${typeStr},${detailsStr},${amountStr},${sourceStr}\r\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `School_Ledger_Session_${activeSession}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (authStatus === 'loading' || !activeSession) return (
        <div className="h-screen flex flex-col items-center justify-center font-bold animate-pulse bg-[#f4f7fe] text-[#9853eb] uppercase tracking-widest text-sm">
            <HiRefresh className="w-8 h-8 mb-4 animate-spin" />
            Syncing Ledger...
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f4f7fe] p-4 md:p-8 text-slate-800 font-sans">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                <div className="text-center md:text-left">
                    <h1 className="text-2xl font-black tracking-tight text-slate-800">School Ledger</h1>
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                        <span className="bg-[#f3efff] text-[#9853eb] px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest">
                            Session {activeSession}
                        </span>
                        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                        <p className="text-slate-500 font-medium text-xs">Accounting & Finance Portal</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto flex-wrap justify-center md:justify-end">
                    <select 
                        value={activeSession} 
                        onChange={(e) => setActiveSession(e.target.value)} 
                        className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-[12px] font-bold text-xs text-slate-600 outline-none focus:ring-2 focus:ring-[#9853eb] transition-all cursor-pointer"
                    >
                        {availableSessions.map(s => <option key={s} value={s}>{s} Session</option>)}
                    </select>
                    
                    <button onClick={fetchData} className="p-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-slate-400 hover:text-[#9853eb] hover:bg-[#f3efff] transition-all" title="Refresh Data">
                        <HiRefresh className={`w-5 h-5 ${loading ? 'animate-spin text-[#9853eb]' : ''}`}/>
                    </button>

                    <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#9853eb] hover:bg-[#f3efff] rounded-[12px] font-bold text-xs transition-all">
                        <HiPrinter className="w-4 h-4" /> Print
                    </button>

                    <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#9853eb] hover:bg-[#f3efff] rounded-[12px] font-bold text-xs transition-all">
                        <HiDownload className="w-4 h-4" /> Excel
                    </button>
                    
                    <button onClick={() => setIsModalOpen(true)} className="bg-[#9853eb] text-white px-6 py-2.5 rounded-[12px] font-bold text-xs shadow-md shadow-purple-200 hover:bg-[#8645d4] transition-all">
                        + Add Entry
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard label="Total Income" val={stats.inc} color="text-emerald-600" bgColor="bg-emerald-50" />
                <StatCard label="Teacher Salaries" val={stats.sal} color="text-rose-500" bgColor="bg-rose-50" />
                <StatCard label="Other Expenses" val={stats.exp - stats.sal} color="text-orange-500" bgColor="bg-orange-50" />
                <div className="bg-[#9853eb] p-6 rounded-[24px] text-white shadow-lg shadow-purple-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <p className="text-xs font-semibold text-purple-100 uppercase tracking-wider mb-2 relative z-10">Net Balance</p>
                    <h3 className="text-3xl font-black tracking-tight relative z-10">{formatCurrency(stats.bal)}</h3>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="font-bold text-sm uppercase tracking-wider text-slate-800">Transaction History</h2>
                    <div className="flex bg-slate-50 p-1 rounded-[12px] border border-slate-100">
                        {["All", "Income", "Expense"].map(f => (
                            <button 
                                key={f} 
                                onClick={() => setFilter(f)} 
                                className={`px-6 py-1.5 rounded-[8px] font-bold text-xs transition-all ${
                                    filter === f 
                                    ? 'bg-white text-[#9853eb] shadow-sm' 
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-400 text-[11px] uppercase font-bold tracking-wider bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5">Date</th>
                                <th className="px-8 py-5">Category</th>
                                <th className="px-8 py-5">Details</th>
                                <th className="px-8 py-5 text-right">Amount</th>
                                <th className="px-8 py-5 text-center">Action/Source</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {combinedList.map((t, idx) => (
                                <tr key={t.id + idx} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-4 font-medium text-slate-500 text-xs">
                                        {formatDate(t.date)}
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wide ${
                                            t.type === 'Income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                                        }`}>
                                            {t.type === 'Income' ? 'INCOME' : 'EXPENSE'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-slate-700 font-semibold text-sm">
                                        {t.note}
                                    </td>
                                    <td className={`px-8 py-4 text-right font-black text-sm ${
                                        t.type === 'Income' ? 'text-emerald-600' : 'text-slate-800'
                                    }`}>
                                        {t.type === 'Income' ? '+' : '-'}{formatCurrency(t.amount)}
                                    </td>
                                    <td className="px-8 py-4 text-center flex justify-center items-center">
                                        {t.source === 'manual' ? (
                                            <button 
                                                onClick={() => deleteDoc(doc(db, 'sessions', activeSession, 'accounts', t.id)).then(fetchData)} 
                                                className="p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-colors"
                                                title="Delete Entry"
                                            >
                                                <HiTrash className="w-5 h-5"/>
                                            </button>
                                        ) : (
                                            <div className="p-2 text-slate-300 bg-slate-50 rounded-lg" title={`System Generated: ${t.source}`}>
                                                {t.source === 'fees' ? <HiAcademicCap className="w-5 h-5 text-emerald-400"/> : <HiUserGroup className="w-5 h-5 text-blue-400"/>}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {combinedList.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-8 py-12 text-center text-slate-400 font-medium flex flex-col items-center justify-center">
                                        <HiOutlineDocumentText className="w-12 h-12 text-slate-200 mb-2" />
                                        No transactions found for this filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Entry Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[24px] p-8 w-full max-w-md shadow-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-800">Add Entry</h3>
                                <p className="text-[10px] font-bold text-[#9853eb] uppercase tracking-wider mt-1">Session {activeSession}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 p-2 rounded-full transition-colors">
                                <HiX className="w-5 h-5"/>
                            </button>
                        </div>
                        
                        <div className="flex bg-slate-50 p-1.5 rounded-[12px] mb-6 border border-slate-100">
                            <button 
                                onClick={() => setEntryType("Expense")} 
                                className={`flex-1 py-2 rounded-[8px] font-bold text-xs transition-all ${entryType === 'Expense' ? 'bg-white text-rose-500 shadow-sm border border-slate-100' : 'text-slate-400'}`}
                            >
                                EXPENSE
                            </button>
                            <button 
                                onClick={() => setEntryType("Income")} 
                                className={`flex-1 py-2 rounded-[8px] font-bold text-xs transition-all ${entryType === 'Income' ? 'bg-white text-emerald-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}
                            >
                                INCOME
                            </button>
                        </div>
                        
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2 mb-1 block">Amount (INR)</label>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 5000" 
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#9853eb] focus:bg-white rounded-[12px] font-bold text-slate-800 outline-none transition-all" 
                                    value={amount} 
                                    onChange={e => setAmount(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2 mb-1 block">Category / Details</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Building Repair, Donation" 
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#9853eb] focus:bg-white rounded-[12px] font-medium text-slate-700 outline-none transition-all" 
                                    value={note} 
                                    onChange={e => setNote(e.target.value)}
                                />
                            </div>
                        </div>

                        <button 
                            className="w-full py-3.5 bg-[#9853eb] text-white rounded-[12px] font-bold text-sm shadow-md shadow-purple-200 hover:bg-[#8645d4] transition-all" 
                            onClick={async () => {
                                if(!amount || !note) return;
                                const manualRef = doc(collection(db, 'sessions', activeSession, 'accounts'));
                                await setDoc(manualRef, { 
                                    type: entryType.toLowerCase(), // Saved as lowercase to match existing db structure
                                    amount: Number(amount), 
                                    category: note, 
                                    date: Timestamp.now()
                                });
                                setIsModalOpen(false); setAmount(""); setNote(""); fetchData();
                            }}
                        >
                            Save Transaction
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, val, color, bgColor }) {
    return (
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
            <div className={`absolute -right-4 -top-4 w-16 h-16 ${bgColor} rounded-full opacity-50`}></div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 relative z-10">{label}</p>
            <h3 className={`text-2xl font-black ${color} tracking-tight relative z-10`}>{formatCurrency(val)}</h3>
        </div>
    );
}