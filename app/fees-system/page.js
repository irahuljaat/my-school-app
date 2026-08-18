'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    getFirestore, collection, query, where, getDocs, doc, getDoc, 
    setDoc, updateDoc, increment, serverTimestamp, deleteDoc
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../firebase/config'; 
import { 
    HiRefresh, HiCash, HiSearch, HiX, 
    HiCheckCircle, HiCollection, HiPlus, HiTrash, HiSave, 
    HiTrendingUp, HiBadgeCheck, HiPrinter, HiPencil, HiCalendar, HiDownload, HiEye
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
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false); // Pop-up History Modal
    
    // Form States
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [relaxationAmount, setRelaxationAmount] = useState(""); 
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    // Inline Edit States for Old Dues
    const [editingDueId, setEditingDueId] = useState(null);
    const [editingDueValue, setEditingDueValue] = useState("");

    // History Edit States inside Pop-up
    const [editingTxKey, setEditingTxKey] = useState(null);
    const [editingTxAmount, setEditingTxAmount] = useState("");

    // History Filter State inside Pop-up
    const [historyFilterDate, setHistoryFilterDate] = useState("");

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
                    history: data.history || {},
                    relaxationHistory: data.relaxationHistory || {}, // Added relaxation history mapping
                    studentName: data.studentName || 'Unknown Student',
                    grade: data.grade || ''
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
                const matchesType = showOnlyDummy ? s.isDummy === true : (s.isDummy === false || s.isDummy === undefined);
                return matchesSearch && matchesType;
            })
            .map(s => {
                const pDoc = annualPayments[s.id] || { totalFee: baseClassFee, paidAmount: 0, relaxationAmount: 0, dueFees: 0, history: {}, relaxationHistory: {} };
                const isStudentRte = s.isRte === true;
                const finalTotalFee = isStudentRte ? 0 : (pDoc.totalFee > 0 ? pDoc.totalFee : baseClassFee);
                const balanceDue = isStudentRte ? 0 : (finalTotalFee + (pDoc.dueFees || 0)) - (pDoc.paidAmount + pDoc.relaxationAmount);

                return { 
                    ...s, 
                    isRte: isStudentRte,
                    totalFee: finalTotalFee, 
                    dueFees: pDoc.dueFees || 0,
                    totalPaid: pDoc.paidAmount, 
                    relaxation: pDoc.relaxationAmount,
                    balanceDue: balanceDue,
                    history: pDoc.history,
                    relaxationHistory: pDoc.relaxationHistory
                };
            })
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }, [students, baseClassFee, annualPayments, searchTerm, showOnlyDummy]);

    // Aggregate All Transactions (Paid and Relaxation) for Pop-up History Feed
    const allTransactionsList = useMemo(() => {
        let list = [];
        Object.entries(annualPayments).forEach(([studentId, data]) => {
            // Paid Fees History
            const hist = data.history || {};
            Object.entries(hist).forEach(([dateKey, amt]) => {
                const pureDateStr = dateKey.split(' ')[0];
                list.push({
                    studentId,
                    studentName: data.studentName || 'Student',
                    grade: data.grade || 'N/A',
                    dateKey,
                    pureDateStr,
                    type: 'Paid Fee',
                    amount: Number(amt) || 0
                });
            });

            // Relaxation History
            const relaxHist = data.relaxationHistory || {};
            Object.entries(relaxHist).forEach(([dateKey, amt]) => {
                const pureDateStr = dateKey.split(' ')[0];
                list.push({
                    studentId,
                    studentName: data.studentName || 'Student',
                    grade: data.grade || 'N/A',
                    dateKey,
                    pureDateStr,
                    type: 'Relaxation',
                    amount: Number(amt) || 0
                });
            });
        });

        // Filter by Date if specified
        if (historyFilterDate) {
            const [y, m, d] = historyFilterDate.split('-');
            const formattedFilter = `${d}-${m}-${y}`;
            list = list.filter(item => item.pureDateStr === formattedFilter);
        }

        return list.sort((a, b) => parseFirestoreDate(b.pureDateStr) - parseFirestoreDate(a.pureDateStr));
    }, [annualPayments, historyFilterDate]);

    // 4. HANDLERS
    const handleUpdateOldDue = async (studentId, currentTotalFee) => {
        try {
            const studentFeeRef = doc(db, 'sessions', activeSession, 'feePayments', studentId);
            const newDue = Number(editingDueValue) || 0;
            
            await setDoc(studentFeeRef, {
                dueFees: newDue,
                totalFee: currentTotalFee || baseClassFee
            }, { merge: true });
            
            setEditingDueId(null);
            fetchFeeData();
        } catch (e) { alert("Failed to update old due."); }
    };

    const handleProcessPayment = async () => {
        if (!selectedStudent || (!paymentAmount && !relaxationAmount)) return;
        setLoading(true);
        try {
            const amtNum = Number(paymentAmount) || 0;
            const relaxNum = Number(relaxationAmount) || 0;
            
            const validExistingDue = Math.max(0, selectedStudent.dueFees || 0);
            const deductFromDue = Math.min(amtNum, validExistingDue);
            const addToPaid = amtNum - deductFromDue;

            const dateParts = paymentDate.split('-');
            const dateKey = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
            
            const studentFeeRef = doc(db, 'sessions', activeSession, 'feePayments', selectedStudent.id);
            const docSnap = await getDoc(studentFeeRef);
            
            let finalKey = dateKey;
            let finalRelaxKey = dateKey;

            if (docSnap.exists()) {
                const existingHistory = docSnap.data().history || {};
                let count = 1;
                while (existingHistory[finalKey]) {
                    count++;
                    finalKey = `${dateKey} (${count})`;
                }

                const existingRelaxHistory = docSnap.data().relaxationHistory || {};
                let rCount = 1;
                while (existingRelaxHistory[finalRelaxKey]) {
                    rCount++;
                    finalRelaxKey = `${dateKey} (${rCount})`;
                }
            }

            const updatePayload = {
                totalFee: selectedStudent.totalFee || baseClassFee,
                studentName: selectedStudent.name,
                grade: selectedClass,
                lastPaymentDate: dateKey
            };

            if (amtNum > 0) {
                updatePayload.paidAmount = increment(addToPaid);
                updatePayload.dueFees = increment(-deductFromDue);
                updatePayload.history = { 
                    ...(docSnap.exists() ? docSnap.data().history || {} : {}), 
                    [finalKey]: amtNum 
                };
            }

            if (relaxNum > 0) {
                updatePayload.relaxationAmount = increment(relaxNum);
                updatePayload.relaxationHistory = { 
                    ...(docSnap.exists() ? docSnap.data().relaxationHistory || {} : {}), 
                    [finalRelaxKey]: relaxNum 
                };
            }

            await setDoc(studentFeeRef, updatePayload, { merge: true });

            setIsPaymentModalOpen(false);
            setPaymentAmount("");
            setRelaxationAmount("");
            fetchFeeData(); 
        } catch (e) { alert("Database update failed."); } 
        finally { setLoading(false); }
    };

    // Edit Transaction from History Popup
    const handleUpdateTransaction = async (studentId, dateKey, oldAmount, type) => {
        try {
            const newAmt = Number(editingTxAmount) || 0;
            const diff = newAmt - oldAmount;
            
            const studentFeeRef = doc(db, 'sessions', activeSession, 'feePayments', studentId);
            const docSnap = await getDoc(studentFeeRef);
            if (!docSnap.exists()) return;

            const currentData = docSnap.data();

            if (type === 'Paid Fee') {
                const currentHistory = currentData.history || {};
                currentHistory[dateKey] = newAmt;
                await updateDoc(studentFeeRef, {
                    paidAmount: increment(diff),
                    history: currentHistory
                });
            } else {
                const currentRelaxHistory = currentData.relaxationHistory || {};
                currentRelaxHistory[dateKey] = newAmt;
                await updateDoc(studentFeeRef, {
                    relaxationAmount: increment(diff),
                    relaxationHistory: currentRelaxHistory
                });
            }

            setEditingTxKey(null);
            setEditingTxAmount("");
            fetchFeeData();
        } catch (err) {
            alert("Failed to update transaction.");
        }
    };

    // Delete Transaction from History Popup
    const handleDeleteTransaction = async (studentId, dateKey, amount, type) => {
        if (!confirm(`Are you sure you want to delete this ${type} of ${formatCurrency(amount)}? This will adjust the respective ledger balance.`)) return;
        try {
            const studentFeeRef = doc(db, 'sessions', activeSession, 'feePayments', studentId);
            const docSnap = await getDoc(studentFeeRef);
            if (!docSnap.exists()) return;

            const currentData = docSnap.data();
            
            if (type === 'Paid Fee') {
                const currentHistory = currentData.history || {};
                delete currentHistory[dateKey];
                await updateDoc(studentFeeRef, {
                    paidAmount: increment(-amount),
                    history: currentHistory
                });
            } else {
                const currentRelaxHistory = currentData.relaxationHistory || {};
                delete currentRelaxHistory[dateKey];
                await updateDoc(studentFeeRef, {
                    relaxationAmount: increment(-amount),
                    relaxationHistory: currentRelaxHistory
                });
            }

            fetchFeeData();
        } catch (err) {
            alert("Failed to delete transaction.");
        }
    };

    // Excel Export
    const exportToExcel = () => {
        let csvContent = "data:text/csv;charset=utf-8,Student Name,Class,Type,Date,Amount\n";
        allTransactionsList.forEach(t => {
            csvContent += `"${t.studentName}","${t.grade}","${t.type}","${t.dateKey}",${t.amount}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Fee_Collection_History_${activeSession}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Isolated Print Opening New Window (Only History Table)
    const handlePrintHistoryWindow = () => {
        const printWindow = window.open('', '_blank', 'width=900,height=650');
        if (!printWindow) {
            alert("Please allow pop-ups for printing.");
            return;
        }

        const rowsHTML = allTransactionsList.length > 0 
            ? allTransactionsList.map(t => `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; text-transform: uppercase;">${t.studentName}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">Class ${t.grade}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;"><span style="padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: ${t.type === 'Paid Fee' ? '#e6f4ea; color: #137333;' : '#fce8e6; color: #c5221f;'}">${t.type}</span></td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${t.dateKey}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold; color: #137333;">${formatCurrency(t.amount)}</td>
                </tr>
              `).join('')
            : `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #888;">No transaction records found.</td></tr>`;

        const totalSum = allTransactionsList.reduce((acc, curr) => acc + curr.amount, 0);

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Fee Collection History Report - ${activeSession}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                        h2 { text-transform: uppercase; margin-bottom: 5px; }
                        p { font-size: 12px; color: #666; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
                        th { background: #f4f4f4; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; text-transform: uppercase; font-size: 11px; }
                        .total-box { margin-top: 20px; text-align: right; font-size: 16px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h2>Fee Collection & Relaxation History</h2>
                    <p>Academic Session: <strong>${activeSession}</strong> | Generated on: ${new Date().toLocaleDateString()}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Class</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th style="text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHTML}
                        </tbody>
                    </table>
                    <div class="total-box">
                        Total Recorded Value: ${formatCurrency(totalSum)}
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    // 5. RENDER LOGIC
    if (!isMounted || !activeSession) return <div className="h-screen flex items-center justify-center font-black text-indigo-500 animate-pulse uppercase italic">Loading System...</div>;

    if (showReceipt && receiptData) {
        return <FeesReceipt 
            student={selectedStudent} 
            paymentRecord={receiptData} 
            feeHistory={feeHistory} 
            onClose={() => { setShowReceipt(false); setReceiptData(null); }} 
            receiptNumber={`REC-${selectedStudent?.id?.slice(0,4) || 'GEN'}-${receiptData.date.replace(/-/g,'')}`} 
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
                
                <div className="flex gap-3 items-center flex-wrap">
                    {/* View Complete History Pop-up Trigger Button */}
                    <button 
                        onClick={() => setIsHistoryModalOpen(true)}
                        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200"
                    >
                        <HiCalendar className="w-4 h-4 text-indigo-400" /> View History Ledger
                    </button>

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
                                    
                                    {/* Editable Old Due Cell */}
                                    <td className="px-8 py-5 text-right font-black text-amber-600 relative group/due">
                                        {editingDueId === s.id ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <input 
                                                    type="number" 
                                                    className="w-20 p-1.5 bg-white shadow-inner rounded-lg outline-none border border-amber-200 text-amber-700 text-right text-sm font-black focus:border-amber-400 transition-all"
                                                    value={editingDueValue}
                                                    onChange={e => setEditingDueValue(e.target.value)}
                                                    autoFocus
                                                />
                                                <button onClick={() => handleUpdateOldDue(s.id, s.totalFee)} className="text-emerald-500 hover:text-emerald-600 bg-emerald-50 p-1.5 rounded-lg transition-colors"><HiCheckCircle size={18}/></button>
                                                <button onClick={() => setEditingDueId(null)} className="text-rose-500 hover:text-rose-600 bg-rose-50 p-1.5 rounded-lg transition-colors"><HiX size={18}/></button>
                                            </div>
                                        ) : (
                                            <div 
                                                className="flex items-center justify-end gap-2 cursor-pointer hover:bg-amber-50/50 -mr-2 pr-2 py-1 rounded-lg transition-all" 
                                                onClick={() => { setEditingDueId(s.id); setEditingDueValue(s.dueFees || 0); }}
                                            >
                                                <span>{formatCurrency(s.dueFees)}</span>
                                                <div className="opacity-0 group-hover/due:opacity-100 transition-opacity p-1 bg-amber-100 rounded text-amber-600">
                                                    <HiPencil className="w-3 h-3" />
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    
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

            {/* 1. COMPLETE HISTORY LEDGER POP-UP MODAL */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] p-8 w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-black uppercase italic text-slate-900 flex items-center gap-2">
                                    <CalendarIcon className="text-indigo-600" /> Complete Collection & Relaxation History
                                </h2>
                                <p className="text-xs font-bold text-slate-400 mt-1">Review all paid fees and relaxation entries across students.</p>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-full transition-colors"><HiX className="w-6 h-6 text-slate-400"/></button>
                        </div>

                        {/* Filter and Export Bar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 w-full md:w-auto">
                                <span className="text-[10px] font-black uppercase text-slate-400">Filter Date:</span>
                                <input 
                                    type="date" 
                                    className="bg-transparent font-black text-xs outline-none text-slate-700 cursor-pointer"
                                    value={historyFilterDate}
                                    onChange={e => setHistoryFilterDate(e.target.value)}
                                />
                                {historyFilterDate && (
                                    <button onClick={() => setHistoryFilterDate("")} className="text-rose-500 hover:text-rose-700 font-bold text-xs ml-2">Clear</button>
                                )}
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                <button onClick={exportToExcel} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all">
                                    <HiDownload className="w-4 h-4" /> Excel
                                </button>
                                <button onClick={handlePrintHistoryWindow} className="flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">
                                    <HiPrinter className="w-4 h-4" /> Print (PDF/New Page)
                                </button>
                            </div>
                        </div>

                        {/* Pop-up Table Content */}
                        <div className="flex-grow overflow-y-auto pr-2 rounded-2xl border border-slate-100">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Student Name</th>
                                        <th className="px-6 py-4">Class</th>
                                        <th className="px-6 py-4">Entry Type</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-center">Manage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-xs">
                                    {allTransactionsList.length > 0 ? (
                                        allTransactionsList.map((tx, idx) => (
                                            <tr key={`${tx.studentId}-${tx.dateKey}-${tx.type}-${idx}`} className="hover:bg-slate-50/50 transition">
                                                <td className="px-6 py-3.5 font-black uppercase text-slate-800">{tx.studentName}</td>
                                                <td className="px-6 py-3.5 font-bold text-slate-500">Class {tx.grade}</td>
                                                <td className="px-6 py-3.5">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${tx.type === 'Paid Fee' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 font-bold text-indigo-600">{tx.dateKey}</td>
                                                
                                                {/* Editable Amount Cell */}
                                                <td className="px-6 py-3.5 text-right font-black text-slate-900">
                                                    {editingTxKey === `${tx.studentId}-${tx.dateKey}-${tx.type}` ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <input 
                                                                type="number" 
                                                                className="w-24 p-1 bg-white shadow-inner rounded border border-indigo-300 text-right font-black text-xs outline-none"
                                                                value={editingTxAmount}
                                                                onChange={e => setEditingTxAmount(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <button onClick={() => handleUpdateTransaction(tx.studentId, tx.dateKey, tx.amount, tx.type)} className="text-emerald-600 hover:text-emerald-700 p-1 bg-emerald-50 rounded"><HiCheckCircle size={16}/></button>
                                                            <button onClick={() => setEditingTxKey(null)} className="text-rose-500 hover:text-rose-600 p-1 bg-rose-50 rounded"><HiX size={16}/></button>
                                                        </div>
                                                    ) : (
                                                        <span className={tx.type === 'Paid Fee' ? 'text-emerald-600' : 'text-rose-500'}>{formatCurrency(tx.amount)}</span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-3.5 text-center">
                                                    {editingTxKey !== `${tx.studentId}-${tx.dateKey}-${tx.type}` && (
                                                        <div className="flex justify-center gap-1.5">
                                                            <button onClick={() => { setEditingTxKey(`${tx.studentId}-${tx.dateKey}-${tx.type}`); setEditingTxAmount(tx.amount); }} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition" title="Edit Amount">
                                                                <HiPencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => handleDeleteTransaction(tx.studentId, tx.dateKey, tx.amount, tx.type)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition" title="Delete Transaction">
                                                                <HiTrash className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center py-12 text-slate-300 font-bold italic">No history records found matching criteria.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. VIEW MODAL */}
            {isViewModalOpen && selectedStudent && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
                    <div className="bg-white/70 backdrop-blur-2xl border border-white/50 rounded-[3rem] w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-8 pb-4 flex justify-between items-start">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">{selectedStudent.name}</h3>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1 flex items-center gap-2"><HiBadgeCheck/> Verified Statement</p>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-3 bg-white/50 hover:bg-white rounded-2xl shadow-inner transition-all"><HiX className="w-6 h-6 text-slate-400" /></button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-8 pt-4 space-y-6">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-white/40 p-4 rounded-[2rem] border border-white/60 shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Standard Fee</p>
                                    <p className="text-lg font-black">{formatCurrency(selectedStudent.totalFee)}</p>
                                </div>
                                <div className="bg-white/40 p-4 rounded-[2rem] border border-white/60 shadow-sm">
                                    <p className="text-[9px] font-black text-amber-500 uppercase mb-1">Arrears/Old</p>
                                    <p className="text-lg font-black text-amber-600">{formatCurrency(selectedStudent.dueFees)}</p>
                                </div>
                                <div className="bg-white/40 p-4 rounded-[2rem] border border-white/60 shadow-sm">
                                    <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Total Paid</p>
                                    <p className="text-lg font-black text-emerald-600">{formatCurrency(selectedStudent.totalPaid)}</p>
                                </div>
                                <div className="bg-white/40 p-4 rounded-[2rem] border border-white/60 shadow-sm">
                                    <p className="text-[9px] font-black text-rose-500 uppercase mb-1">Relaxation</p>
                                    <p className="text-lg font-black text-rose-600">{formatCurrency(selectedStudent.relaxation)}</p>
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
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. PAYMENT & RELAXATION MODAL */}
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
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Existing Old Due</label>
                                    <div className="w-full p-4 bg-amber-50 rounded-2xl font-black text-amber-700 border border-amber-100 text-center">{formatCurrency(selectedStudent?.dueFees || 0)}</div>
                                </div>
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

            {/* 4. STRUCTURE MODAL */}
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

function CalendarIcon(props) {
    return <HiCalendar {...props} />;
}