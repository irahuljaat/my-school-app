'use client';

import React, { useState, useEffect } from 'react';
import { 
    HiOutlineAcademicCap, HiOutlineCurrencyRupee, 
    HiOutlineShieldCheck, HiOutlineTrendingUp,
    HiOutlineLogout, HiX, HiSearch, HiDatabase, HiExclamationCircle
} from 'react-icons/hi';
import { db } from '../firebase/config'; 
import { 
    collection, onSnapshot, doc, getDocs, writeBatch, updateDoc, arrayUnion, setDoc
} from 'firebase/firestore';

const CLASS_PROMOTION_MAP = {
    'Nursery': 'LKG', 'LKG': 'UKG', 'UKG': '1',
    '1': '2', '2': '3', '3': '4', '4': '5', '5': '6',
    '6': '7', '7': '8', '8': '9', '9': '10', '10': '11', 
    '11': '12', '12': 'PASSED OUT'
};

export default function DashboardPage() {
    const [currentSession, setCurrentSession] = useState(null);
    const [allSessions, setAllSessions] = useState([]);
    const [isMigrating, setIsMigrating] = useState(false);
    const [showNewSessionModal, setShowNewSessionModal] = useState(false);
    const [newSessionName, setNewSessionName] = useState('');
    const [targetMigrationSession, setTargetMigrationSession] = useState('');
    const [loading, setLoading] = useState(true);
    
    const [students, setStudents] = useState([]);
    const [showAlumniModal, setShowAlumniModal] = useState(false);
    const [alumniSearch, setAlumniSearch] = useState("");
    
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        currentYearCollection: 0,
        pendingPreviousDues: 0,
        passedOutCount: 0
    });

    // 1. SYNC CONFIG
    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'config', 'settings'), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setCurrentSession(data.activeSession);
                setAllSessions(data.sessions || []);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // 2. FETCH SESSION DATA & CALCULATE TOTALS
    useEffect(() => {
        if (!currentSession) return;

        const sRef = collection(db, 'sessions', currentSession, 'students');
        const tRef = collection(db, 'sessions', currentSession, 'teachers');
        const fRef = collection(db, 'sessions', currentSession, 'feePayments');

        const unsubS = onSnapshot(sRef, (snap) => {
            const studentData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setStudents(studentData);
            
            const active = studentData.filter(s => s.grade !== 'PASSED OUT').length;
            const alumni = studentData.filter(s => s.grade === 'PASSED OUT').length;
            
            // Stats Calculation with field name fallback
            const prevDues = studentData.reduce((sum, s) => sum + (Number(s.previouslyDue || s.previousDue || 0)), 0);
            
            setStats(prev => ({ 
                ...prev, 
                totalStudents: active, 
                passedOutCount: alumni,
                pendingPreviousDues: prevDues 
            }));
        });

        const unsubT = onSnapshot(tRef, (snap) => {
            setStats(prev => ({ ...prev, totalTeachers: snap.size }));
        });
        
        const unsubF = onSnapshot(fRef, (snap) => {
            const total = snap.docs.reduce((sum, d) => sum + (Number(d.data().amount) || 0), 0);
            setStats(prev => ({ ...prev, currentYearCollection: total }));
        });

        return () => { unsubS(); unsubT(); unsubF(); };
    }, [currentSession]);

    const handleCreateSession = async () => {
        if (!newSessionName.trim()) return;
        try {
            await updateDoc(doc(db, 'config', 'settings'), { sessions: arrayUnion(newSessionName.trim()) });
            setNewSessionName('');
            setShowNewSessionModal(false);
        } catch (e) { alert(e.message); }
    };

    const handleMigrateAndPromote = async () => {
        if (!targetMigrationSession) return;
        if (!window.confirm(`MIGRATE TO ${targetMigrationSession}?`)) return;
        
        setIsMigrating(true);
        try {
            const batch = writeBatch(db);
            
            // 1. Fetch Class Wise Fee Structures to know the Annual Fee
            const feeStructSnap = await getDocs(collection(db, 'sessions', currentSession, 'studentFeeStructures'));
            const classFees = {};
            feeStructSnap.forEach(doc => { classFees[doc.id] = Number(doc.data().totalFee || 0); });

            // 2. Fetch Payments for this session
            const paymentSnap = await getDocs(collection(db, 'sessions', currentSession, 'feePayments'));
            const studentPayments = {};
            paymentSnap.forEach(doc => {
                const p = doc.data();
                if (!studentPayments[p.studentId]) studentPayments[p.studentId] = 0;
                studentPayments[p.studentId] += (Number(p.amount) + Number(p.relaxation || 0));
            });

            // 3. Migrate Students
            const sSnap = await getDocs(collection(db, 'sessions', currentSession, 'students'));
            
            sSnap.docs.forEach(d => {
                const data = d.data();
                const nextGrade = CLASS_PROMOTION_MAP[String(data.grade)] || data.grade;

                // --- CALCULATION FIX ---
                const annualFee = classFees[data.grade] || 0;
                const oldArrears = Number(data.previouslyDue || data.previousDue || 0);
                const totalPaid = studentPayments[d.id] || 0;
                
                // Final calculation: (Fees + Arrears) - Paid
                const balanceToCarry = (annualFee + oldArrears) - totalPaid;
                
                console.log(`Migrating ${data.name}: Fees(${annualFee}) + Arrears(${oldArrears}) - Paid(${totalPaid}) = ${balanceToCarry}`);

                batch.set(doc(db, 'sessions', targetMigrationSession, 'students', d.id), {
                    ...data,
                    grade: nextGrade,
                    migratedFrom: currentSession,
                    previouslyDue: balanceToCarry > 0 ? balanceToCarry : 0, 
                    paidAmount: 0, 
                });
            });

            await batch.commit();
            await updateDoc(doc(db, 'config', 'settings'), { activeSession: targetMigrationSession });
            alert("Success! Dues calculated and students promoted.");
        } catch (e) { 
            console.error(e);
            alert("Error: " + e.message); 
        } finally { 
            setIsMigrating(false); 
        }
    };

    if (loading) return <div className="p-20 text-center font-black animate-pulse">LOADING...</div>;

    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="bg-slate-900 text-white p-8 rounded-[3rem] flex flex-col md:flex-row justify-between items-center shadow-2xl border-b-4 border-indigo-600">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-indigo-600 rounded-3xl shadow-lg"><HiOutlineShieldCheck className="w-8 h-8"/></div>
                        <div>
                            <p className="text-[10px] font-black text-indigo-300 tracking-[0.3em] uppercase">Control Center</p>
                            <select 
                                value={currentSession}
                                onChange={(e) => updateDoc(doc(db, 'config', 'settings'), { activeSession: e.target.value })}
                                className="bg-transparent text-3xl font-black outline-none cursor-pointer"
                            >
                                {allSessions.map(s => <option key={s} value={s} className="text-black font-bold">{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <button onClick={() => setShowNewSessionModal(true)} className="bg-white/10 px-8 py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-white hover:text-slate-900 transition-all">
                        + Initialize New Session
                    </button>
                </div>

                {/* Migration Tool */}
                <div className="bg-white border-2 border-dashed border-indigo-200 p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><HiOutlineTrendingUp size={28}/></div>
                        <div>
                            <h3 className="font-black text-slate-800 uppercase text-sm">Promotion & Dues Engine</h3>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Move students to next year & carry forward unpaid balances</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select value={targetMigrationSession} onChange={(e) => setTargetMigrationSession(e.target.value)} className="bg-slate-50 border p-4 rounded-2xl text-[10px] font-black uppercase outline-none">
                            <option value="">Select Next Year...</option>
                            {allSessions.filter(s => s !== currentSession).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={handleMigrateAndPromote} disabled={isMigrating || !targetMigrationSession} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-indigo-700 transition-all">
                            {isMigrating ? 'Processing...' : 'Start Promotion'}
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white"><HiOutlineAcademicCap size={28}/></div>
                        <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Students</p><h2 className="text-2xl font-black">{stats.totalStudents}</h2></div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5">
                        <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white"><HiOutlineCurrencyRupee size={28}/></div>
                        <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Fees Paid</p><h2 className="text-2xl font-black">₹{stats.currentYearCollection}</h2></div>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-rose-100 flex items-center gap-5">
                        <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white"><HiExclamationCircle size={28}/></div>
                        <div><p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Total Arrears (Old Dues)</p><h2 className="text-2xl font-black">₹{stats.pendingPreviousDues}</h2></div>
                    </div>
                </div>
            </div>

            {/* New Session Modal */}
            {showNewSessionModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-10 rounded-[3rem] w-full max-w-sm shadow-2xl">
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-6">New Academic Year</h3>
                        <input value={newSessionName} onChange={(e) => setNewSessionName(e.target.value)} placeholder="e.g. 2026-27" className="w-full p-5 bg-slate-50 border rounded-2xl mb-8 outline-none font-black text-center text-xl" />
                        <div className="flex gap-4">
                            <button onClick={() => setShowNewSessionModal(false)} className="flex-1 font-black text-[10px] uppercase text-slate-400">Cancel</button>
                            <button onClick={handleCreateSession} className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase">Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}