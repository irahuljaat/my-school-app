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
import { useColors } from '../components/ColorComponent';

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
    const colors = useColors();
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
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    
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
                    relaxationHistory: data.relaxationHistory || {},
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

    // Aggregate All Transactions for History Feed
    const allTransactionsList = useMemo(() => {
        let list = [];
        Object.entries(annualPayments).forEach(([studentId, data]) => {
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

    const handlePrintHistoryWindow = () => {
        const printWindow = window.open('', '_blank', 'width=900,height=650');
        if (!printWindow) {
            alert("Please allow pop-ups for printing.");
            return;
        }

        const rowsHTML = allTransactionsList.length > 0 
            ? allTransactionsList.map(t => `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #cbd5e1; font-weight: bold; text-transform: uppercase;">${t.studentName}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #cbd5e1;">Class ${t.grade}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #cbd5e1;"><span style="padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; background: ${t.type === 'Paid Fee' ? '#ecfdf5; color: #047857;' : '#fff1f2; color: #be123c;'}">${t.type}</span></td>
                    <td style="padding: 10px; border-bottom: 1px solid #cbd5e1;">${t.dateKey}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #047857;">${formatCurrency(t.amount)}</td>
                </tr>
              `).join('')
            : `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #94a3b8;">No transaction records found.</td></tr>`;

        const totalSum = allTransactionsList.reduce((acc, curr) => acc + curr.amount, 0);

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Fee Collection History Report - ${activeSession}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; }
                        h2 { text-transform: uppercase; margin-bottom: 5px; color: ${colors.primary}; }
                        p { font-size: 12px; color: #64748b; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
                        th { background: #f8fafc; padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; font-size: 10px; color: #64748b; }
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
    if (!isMounted || !activeSession) return <div className="h-screen flex items-center justify-center font-black text-slate-500 animate-pulse uppercase italic">Loading System...</div>;

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
        <div 
            className="flex flex-col min-h-screen text-slate-800 font-sans relative overflow-hidden transition-colors duration-300"
            style={{ backgroundColor: colors.background }}
        >
            {/* Decorative Blur Background Elements */}
            <div 
                className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
                style={{ backgroundColor: colors.primary }}
            />
            <div 
                className="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
                style={{ backgroundColor: colors.primary }}
            />

            {/* TOP ACTION BAR */}
            <div className="max-w-[1440px] w-full mx-auto p-6 lg:p-8 relative z-10 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Fee Management</h1>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.primary }}></span>
                            Active Session: <span className="font-semibold" style={{ color: colors.primary }}>{activeSession}</span>
                        </p>
                    </div>
                    
                    <div className="flex gap-3 items-center flex-wrap">
                        {/* View Complete History Pop-up Trigger Button */}
                        <button 
                            onClick={() => setIsHistoryModalOpen(true)}
                            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-full font-bold text-xs hover:bg-black transition-all shadow-xs cursor-pointer"
                        >
                            <HiCalendar className="w-4 h-4 text-indigo-400" /> View History Ledger
                        </button>

                        <button 
                            onClick={() => setShowOnlyDummy(!showOnlyDummy)} 
                            className={`px-6 py-3 rounded-full font-bold text-xs transition-all shadow-xs border cursor-pointer ${showOnlyDummy ? 'bg-rose-500 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                        >
                            {showOnlyDummy ? 'Dummy Data' : 'Live Data'}
                        </button>

                        <button 
                            onClick={() => setIsStructureModalOpen(true)} 
                            className="flex items-center gap-2 text-white px-6 py-3 rounded-full font-bold text-xs transition-all shadow-xs cursor-pointer"
                            style={{ backgroundColor: colors.primary }}
                        >
                            <HiCollection className="w-4 h-4" /> Structure
                        </button>

                        <div className="flex bg-white rounded-full shadow-xs border border-slate-200 overflow-hidden items-center px-1">
                            <select 
                                value={selectedClass} 
                                onChange={(e) => setSelectedClass(e.target.value)} 
                                className="px-4 py-2 bg-transparent font-bold text-xs outline-none border-r border-slate-100 cursor-pointer"
                            >
                                {MOCK_CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                            </select>
                            <button onClick={fetchFeeData} className="p-2.5 hover:bg-slate-50 text-slate-400 rounded-full cursor-pointer transition-colors">
                                <HiRefresh className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* STUDENT DATA TABLE CONTAINER */}
                <div className="bg-white rounded-[28px] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
                        <div className="relative flex-grow max-w-md">
                            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input 
                                type="text" 
                                placeholder="Search student..." 
                                className="w-full pl-11 pr-5 py-3 bg-slate-50/80 border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                            />
                        </div>
                        <div className="hidden md:flex gap-6">
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Students</p>
                                <p className="text-base font-bold text-slate-900">{detailedStudentList.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 bg-slate-50/30">
                                    <th className="px-6 py-4">Student Profile</th>
                                    <th className="px-6 py-4 text-right">Structure</th>
                                    <th className="px-6 py-4 text-right">Old Due</th>
                                    <th className="px-6 py-4 text-right">Paid</th>
                                    <th className="px-6 py-4 text-right">Relaxation</th>
                                    <th className="px-6 py-4 text-right">Balance</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {detailedStudentList.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50/85 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${s.isDummy ? 'bg-rose-400' : 'bg-emerald-400'}`}></div>
                                                <span className="font-bold text-slate-900">{s.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500 font-medium">
                                            {s.isRte ? <span className="text-emerald-600 font-semibold">RTE Free</span> : formatCurrency(s.totalFee)}
                                        </td>
                                        
                                        {/* Editable Old Due Cell */}
                                        <td className="px-6 py-4 text-right font-semibold text-amber-600 relative group/due">
                                            {editingDueId === s.id ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <input 
                                                        type="number" 
                                                        className="w-24 p-2 bg-white shadow-xs rounded-full outline-none border border-amber-300 text-amber-700 text-right text-xs font-semibold focus:border-amber-500 transition-all"
                                                        value={editingDueValue}
                                                        onChange={e => setEditingDueValue(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <button onClick={() => handleUpdateOldDue(s.id, s.totalFee)} className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 p-2 rounded-full transition-colors cursor-pointer"><HiCheckCircle size={16}/></button>
                                                    <button onClick={() => setEditingDueId(null)} className="text-rose-500 hover:text-rose-600 bg-rose-50 p-2 rounded-full transition-colors cursor-pointer"><HiX size={16}/></button>
                                                </div>
                                            ) : (
                                                <div 
                                                    className="flex items-center justify-end gap-2 cursor-pointer hover:bg-amber-50/50 -mr-2 pr-2 py-1 rounded-full transition-all" 
                                                    onClick={() => { setEditingDueId(s.id); setEditingDueValue(s.dueFees || 0); }}
                                                >
                                                    <span>{formatCurrency(s.dueFees)}</span>
                                                    <div className="opacity-0 group-hover/due:opacity-100 transition-opacity p-1 bg-amber-100 rounded-full text-amber-600">
                                                        <HiPencil className="w-3 h-3" />
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        
                                        <td className="px-6 py-4 text-right font-semibold text-emerald-600">{formatCurrency(s.totalPaid)}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-rose-500">{formatCurrency(s.relaxation)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${s.balanceDue > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                {formatCurrency(s.balanceDue)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => { setSelectedStudent(s); setIsViewModalOpen(true); }} className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-full transition-colors border border-slate-200 cursor-pointer" title="View Details">
                                                    <HiEye className="w-4 h-4"/>
                                                </button>
                                                <button onClick={() => { setSelectedStudent(s); setIsPaymentModalOpen(true); }} className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-full transition-colors border border-slate-200 cursor-pointer" title="Add Payment">
                                                    <HiCash className="w-4 h-4"/>
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
                                                }} className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-full transition-colors border border-slate-200 cursor-pointer" title="Print Receipt">
                                                    <HiPrinter className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* 1. COMPLETE HISTORY LEDGER POP-UP MODAL */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[28px] p-6 md:p-8 w-full max-w-4xl max-h-[85vh] shadow-xl flex flex-col border border-slate-100">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <CalendarIcon className="w-5 h-5 text-indigo-600" /> Complete Collection & Relaxation History
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">Review all paid fees and relaxation entries across students.</p>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-colors cursor-pointer border border-slate-200"><HiX className="w-4 h-4"/></button>
                        </div>

                        {/* Filter and Export Bar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-full border border-slate-200 w-full md:w-auto">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter Date:</span>
                                <input 
                                    type="date" 
                                    className="bg-transparent font-semibold text-xs outline-none text-slate-800 cursor-pointer"
                                    value={historyFilterDate}
                                    onChange={e => setHistoryFilterDate(e.target.value)}
                                />
                                {historyFilterDate && (
                                    <button onClick={() => setHistoryFilterDate("")} className="text-rose-600 hover:text-rose-700 font-semibold text-xs ml-2 cursor-pointer">Clear</button>
                                )}
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                <button onClick={exportToExcel} className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-emerald-600 border border-slate-200 px-5 py-2.5 rounded-full font-bold text-xs transition-colors cursor-pointer">
                                    <HiDownload className="w-4 h-4" /> Excel
                                </button>
                                <button onClick={handlePrintHistoryWindow} className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-indigo-600 border border-slate-200 px-5 py-2.5 rounded-full font-bold text-xs transition-colors cursor-pointer">
                                    <HiPrinter className="w-4 h-4" /> Print PDF
                                </button>
                            </div>
                        </div>

                        {/* Pop-up Table Content */}
                        <div className="flex-grow overflow-y-auto pr-2 rounded-2xl border border-slate-100">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4">Student Name</th>
                                        <th className="px-6 py-4">Class</th>
                                        <th className="px-6 py-4">Entry Type</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-center">Manage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {allTransactionsList.length > 0 ? (
                                        allTransactionsList.map((tx, idx) => (
                                            <tr key={`${tx.studentId}-${tx.dateKey}-${tx.type}-${idx}`} className="hover:bg-slate-50/85 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-900">{tx.studentName}</td>
                                                <td className="px-6 py-4 text-slate-700">Class {tx.grade}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${tx.type === 'Paid Fee' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">{tx.dateKey}</td>
                                                
                                                {/* Editable Amount Cell */}
                                                <td className="px-6 py-4 text-right font-mono font-semibold text-slate-900">
                                                    {editingTxKey === `${tx.studentId}-${tx.dateKey}-${tx.type}` ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <input 
                                                                type="number" 
                                                                className="w-24 p-2 bg-white shadow-xs rounded-full border border-slate-200 text-right font-semibold text-xs outline-none"
                                                                value={editingTxAmount}
                                                                onChange={e => setEditingTxAmount(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <button onClick={() => handleUpdateTransaction(tx.studentId, tx.dateKey, tx.amount, tx.type)} className="text-emerald-600 hover:text-emerald-700 p-2 bg-emerald-50 rounded-full cursor-pointer"><HiCheckCircle size={16}/></button>
                                                            <button onClick={() => setEditingTxKey(null)} className="text-rose-500 hover:text-rose-600 p-2 bg-rose-50 rounded-full cursor-pointer"><HiX size={16}/></button>
                                                        </div>
                                                    ) : (
                                                        <span className={tx.type === 'Paid Fee' ? 'text-emerald-600' : 'text-rose-500'}>{formatCurrency(tx.amount)}</span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    {editingTxKey !== `${tx.studentId}-${tx.dateKey}-${tx.type}` && (
                                                        <div className="flex justify-center gap-2">
                                                            <button onClick={() => { setEditingTxKey(`${tx.studentId}-${tx.dateKey}-${tx.type}`); setEditingTxAmount(tx.amount); }} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-full transition-colors border border-slate-200 cursor-pointer" title="Edit Amount">
                                                                <HiPencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => handleDeleteTransaction(tx.studentId, tx.dateKey, tx.amount, tx.type)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-full transition-colors border border-rose-100 cursor-pointer" title="Delete Transaction">
                                                                <HiTrash className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center py-12 text-slate-400 font-medium">No history records found matching criteria.</td>
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
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[28px] p-6 md:p-8 w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-xl flex flex-col border border-slate-100">
                        <div className="pb-4 flex justify-between items-start border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{selectedStudent.name}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 flex items-center gap-1.5"><HiBadgeCheck className="text-emerald-500"/> Verified Statement</p>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors cursor-pointer border border-slate-200"><HiX className="w-4 h-4 text-slate-400" /></button>
                        </div>
                        <div className="flex-grow overflow-y-auto py-6 space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Standard Fee</p>
                                    <p className="text-sm font-bold text-slate-900">{formatCurrency(selectedStudent.totalFee)}</p>
                                </div>
                                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Arrears/Old</p>
                                    <p className="text-sm font-bold text-amber-600">{formatCurrency(selectedStudent.dueFees)}</p>
                                </div>
                                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Total Paid</p>
                                    <p className="text-sm font-bold text-emerald-600">{formatCurrency(selectedStudent.totalPaid)}</p>
                                </div>
                                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">Relaxation</p>
                                    <p className="text-sm font-bold text-rose-600">{formatCurrency(selectedStudent.relaxation)}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction History</h4>
                                {Object.entries(selectedStudent.history || {}).length > 0 ? (
                                    Object.entries(selectedStudent.history).sort((a,b) => parseFirestoreDate(b[0]) - parseFirestoreDate(a[0])).map(([date, amount]) => (
                                        <div key={date} className="flex justify-between items-center bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                                            <div className="flex items-center gap-3">
                                                <HiTrendingUp className="text-emerald-500 w-4 h-4"/>
                                                <span className="text-xs font-bold text-slate-800">{date}</span>
                                            </div>
                                            <span className="text-xs font-mono font-semibold text-emerald-600">+{formatCurrency(amount)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-400 text-xs">No payments recorded.</div>
                                )}
                            </div>
                            <div className="bg-slate-900 p-6 rounded-[24px] flex justify-between items-center text-white">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Balance Due</p>
                                    <h2 className="text-xl font-bold">{formatCurrency(selectedStudent.balanceDue)}</h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. PAYMENT & RELAXATION MODAL */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[28px] p-6 md:p-8 w-full max-w-md shadow-xl border border-slate-100">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <h2 className="text-base font-bold text-slate-900">Add Entry</h2>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors cursor-pointer border border-slate-200"><HiX className="w-4 h-4 text-slate-400"/></button>
                        </div>
                        
                        <div className="space-y-4 text-sm">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                                <p className="font-bold text-slate-900 text-sm">{selectedStudent?.name}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Date</label>
                                    <input type="date" className="w-full px-5 py-3 bg-slate-50/80 border border-slate-200 rounded-full focus:outline-none focus:border-slate-400 focus:bg-white text-xs transition-all cursor-pointer" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Existing Old Due</label>
                                    <div className="w-full px-5 py-3 bg-amber-50 border border-amber-200 rounded-full font-semibold text-amber-700 text-xs text-center">{formatCurrency(selectedStudent?.dueFees || 0)}</div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Installment Amount (₹)</label>
                                <input type="number" placeholder="Enter Amount..." className="w-full px-5 py-3 bg-slate-50/80 border border-slate-200 rounded-full focus:outline-none focus:border-slate-400 focus:bg-white text-xs transition-all" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1.5">Relaxation / Discount (₹)</label>
                                <input type="number" placeholder="Enter Relaxation..." className="w-full px-5 py-3 bg-emerald-50/50 border border-emerald-200 rounded-full focus:outline-none focus:border-emerald-400 focus:bg-white text-xs text-emerald-700 transition-all" value={relaxationAmount} onChange={e => setRelaxationAmount(e.target.value)} />
                            </div>

                            <div className="pt-2">
                                <button 
                                    onClick={handleProcessPayment} 
                                    disabled={loading} 
                                    className="w-full py-3.5 text-white font-bold rounded-full text-xs transition-all active:scale-[0.99] shadow-xs cursor-pointer flex items-center justify-center space-x-2"
                                    style={{ backgroundColor: colors.primary }}
                                >
                                    <span>{loading ? 'Saving Data...' : 'Confirm Transaction'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. STRUCTURE MODAL */}
            {isStructureModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[28px] p-6 md:p-8 w-full max-w-2xl shadow-xl border border-slate-100 flex flex-col">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <h2 className="text-base font-bold text-slate-900">Class {selectedClass} Structure</h2>
                            <button onClick={() => setIsStructureModalOpen(false)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors cursor-pointer border border-slate-200"><HiX className="w-4 h-4 text-slate-400"/></button>
                        </div>
                        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 text-sm">
                            {feeComponents.map((comp, idx) => (
                                <div key={idx} className="flex gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200 items-center">
                                    <input type="text" placeholder="Fee Name" className="flex-grow px-5 py-3 bg-white border border-slate-200 rounded-full font-bold outline-none text-xs uppercase" value={comp.name} onChange={e => { const n = [...feeComponents]; n[idx].name = e.target.value; setFeeComponents(n); }} />
                                    <input type="number" placeholder="₹" className="w-32 px-5 py-3 bg-white border border-slate-200 rounded-full font-semibold outline-none text-xs" value={comp.amount} onChange={e => { const n = [...feeComponents]; n[idx].amount = e.target.value; setFeeComponents(n); }} />
                                    <button onClick={() => setFeeComponents(feeComponents.filter((_, i) => i !== idx))} className="text-rose-500 p-2.5 bg-rose-50 hover:bg-rose-100 rounded-full cursor-pointer border border-rose-100"><HiTrash className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setFeeComponents([...feeComponents, { name: '', amount: '' }])} className="mt-4 flex items-center gap-1.5 text-indigo-600 font-bold text-xs px-4 py-2 hover:bg-indigo-50 rounded-full transition-all cursor-pointer self-start"><HiPlus /> Add Item</button>
                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Academic Fee</p>
                                <p className="text-xl font-bold text-slate-900">{formatCurrency(feeComponents.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0))}</p>
                            </div>
                            <button 
                                onClick={async () => {
                                    setIsSavingStructure(true);
                                    const total = feeComponents.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
                                    try {
                                        await setDoc(doc(db, 'sessions', activeSession, 'studentFeeStructures', selectedClass), { totalFee: total, feeBreakdown: feeComponents, updatedAt: serverTimestamp() });
                                        alert("Structure applied!"); fetchFeeData(); setIsStructureModalOpen(false);
                                    } finally { setIsSavingStructure(false); }
                                }} 
                                className="text-white px-8 py-3.5 rounded-full font-bold text-xs flex items-center gap-2 transition-all active:scale-[0.99] cursor-pointer shadow-xs"
                                style={{ backgroundColor: colors.primary }}
                            >
                                <HiSave className="w-4 h-4" /> {isSavingStructure ? 'Saving...' : 'Apply Structure'}
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