'use client';

import React, { useState, useEffect } from 'react';
import { 
    HiOutlineAcademicCap, HiOutlineCurrencyRupee, 
    HiOutlineShieldCheck, HiOutlineTrendingUp,
    HiX, HiExclamationCircle, HiPlusCircle
} from 'react-icons/hi';
import { db } from '../firebase/config'; 
import { 
    collection, onSnapshot, doc, getDocs, writeBatch, updateDoc, arrayUnion
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
    const [stats, setStats] = useState({
        totalStudents: 0,
        currentYearCollection: 0,
        pendingPreviousDues: 0,
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

    // 2. FETCH SESSION DATA
    useEffect(() => {
        if (!currentSession) return;

        const sRef = collection(db, 'sessions', currentSession, 'students');
        const fRef = collection(db, 'sessions', currentSession, 'feePayments');

        const unsubS = onSnapshot(sRef, (snap) => {
            const studentData = snap.docs.map(d => d.data());
            const active = studentData.filter(s => s.grade !== 'PASSED OUT').length;
            const prevDues = studentData.reduce((sum, s) => sum + (Number(s.previouslyDue || s.previousDue || 0)), 0);
            setStats(prev => ({ ...prev, totalStudents: active, pendingPreviousDues: prevDues }));
        });

        const unsubF = onSnapshot(fRef, (snap) => {
            const total = snap.docs.reduce((sum, d) => sum + (Number(d.data().amount) || 0), 0);
            setStats(prev => ({ ...prev, currentYearCollection: total }));
        });

        return () => { unsubS(); unsubF(); };
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
        if (!window.confirm(`MIGRATE ALL STUDENTS TO ${targetMigrationSession}?`)) return;
        setIsMigrating(true);
        
        try {
            const batch = writeBatch(db);
            const timestamp = Date.now();

            // Fetch fee structures to calculate current session balance
            const feeStructSnap = await getDocs(collection(db, 'sessions', currentSession, 'studentFeeStructures'));
            const classFees = {};
            feeStructSnap.forEach(doc => { classFees[doc.id] = Number(doc.data().totalFee || 0); });

            // Fetch payments to calculate balance
            const paymentSnap = await getDocs(collection(db, 'sessions', currentSession, 'feePayments'));
            const studentPayments = {};
            paymentSnap.forEach(doc => {
                const p = doc.data();
                if (!studentPayments[p.studentId]) studentPayments[p.studentId] = 0;
                studentPayments[p.studentId] += (Number(p.amount) + Number(p.relaxation || 0));
            });

            const sSnap = await getDocs(collection(db, 'sessions', currentSession, 'students'));
            
            sSnap.docs.forEach(d => {
                const data = d.data();
                const nextGrade = CLASS_PROMOTION_MAP[String(data.grade)] || data.grade;
                
                // Calculate dues: (Current Class Fee + Old Arrears) - Total Paid this session
                const currentTotalFee = (classFees[data.grade] || 0);
                const currentPreviouslyDue = Number(data.previouslyDue || 0);
                const totalPaidThisYear = (studentPayments[d.id] || 0);
                const balanceToCarry = (currentTotalFee + currentPreviouslyDue) - totalPaidThisYear;

                // --- GENERATING THE NEW ID ---
                // Format: S{SRNO}_{CLASS}_{TIMESTAMP}
                const srNo = data.srNo || data.scholarNo || "NA";
                const newStudentId = `S${srNo}_${nextGrade}_${timestamp}`;

                const newStudentRef = doc(db, 'sessions', targetMigrationSession, 'students', newStudentId);

                batch.set(newStudentRef, {
                    ...data,
                    id: newStudentId, // Update internal ID field
                    grade: nextGrade,
                    migratedFrom: currentSession,
                    previouslyDue: balanceToCarry > 0 ? balanceToCarry : 0, 
                    paidAmount: 0, // Reset paid amount for the new session
                });
            });

            await batch.commit();
            
            // Set the new session as active
            await updateDoc(doc(db, 'config', 'settings'), { activeSession: targetMigrationSession });
            
            alert(`Migration to ${targetMigrationSession} completed successfully with updated Class IDs.`);
        } catch (e) { 
            console.error(e);
            alert("Migration Error: " + e.message); 
        } finally { 
            setIsMigrating(false); 
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-indigo-600">LOADING...</div>;

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Session Header Card */}
            <div className="bg-slate-900 text-white p-6 md:p-8 rounded-2xl md:rounded-[3rem] shadow-xl border-b-4 border-indigo-600">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shrink-0">
                            <HiOutlineShieldCheck className="w-6 h-6 md:w-8 md:h-8"/>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black text-indigo-300 tracking-[0.2em] uppercase truncate">Active Session</p>
                            <select 
                                value={currentSession}
                                onChange={(e) => updateDoc(doc(db, 'config', 'settings'), { activeSession: e.target.value })}
                                className="bg-transparent text-xl md:text-3xl font-black outline-none cursor-pointer w-full"
                            >
                                {allSessions.map(s => <option key={s} value={s} className="text-black font-bold">{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowNewSessionModal(true)} 
                        className="bg-indigo-600 md:bg-white/10 px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center gap-2"
                    >
                        <HiPlusCircle size={18}/> New Session
                    </button>
                </div>
            </div>

            {/* Promotion Engine Tool */}
            <div className="bg-white border-2 border-dashed border-indigo-200 p-6 md:p-8 rounded-2xl md:rounded-[3rem] shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start md:items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0"><HiOutlineTrendingUp size={24}/></div>
                        <div>
                            <h3 className="font-black text-slate-800 uppercase text-xs md:text-sm">Promotion Engine</h3>
                            <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wide leading-relaxed">
                                Automatically updates Class IDs and carries over dues.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <select 
                            value={targetMigrationSession} 
                            onChange={(e) => setTargetMigrationSession(e.target.value)} 
                            className="w-full sm:w-48 bg-slate-50 border p-3 md:p-4 rounded-xl text-[10px] font-black uppercase outline-none focus:border-indigo-500"
                        >
                            <option value="">Select Target Year...</option>
                            {allSessions.filter(s => s !== currentSession).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button 
                            onClick={handleMigrateAndPromote} 
                            disabled={isMigrating || !targetMigrationSession} 
                            className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3 md:py-4 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:shadow-lg transition-all"
                        >
                            {isMigrating ? 'Migrating...' : 'Start Promotion'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <StatCard icon={HiOutlineAcademicCap} label="Students" value={stats.totalStudents} color="bg-indigo-600" />
                <StatCard icon={HiOutlineCurrencyRupee} label="Collected" value={`₹${stats.currentYearCollection}`} color="bg-emerald-500" />
                <StatCard icon={HiExclamationCircle} label="Total Arrears" value={`₹${stats.pendingPreviousDues}`} color="bg-rose-500" textColor="text-rose-500" border="border-rose-100" />
            </div>

            {/* New Session Modal */}
            {showNewSessionModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[3rem] w-full max-w-sm shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">New Session</h3>
                            <button onClick={() => setShowNewSessionModal(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><HiX/></button>
                        </div>
                        <input 
                            value={newSessionName} 
                            onChange={(e) => setNewSessionName(e.target.value)} 
                            placeholder="e.g. 2026-27" 
                            className="w-full p-4 md:p-5 bg-slate-50 border rounded-xl mb-6 outline-none font-black text-center text-xl focus:ring-2 focus:ring-indigo-100" 
                        />
                        <button onClick={handleCreateSession} className="w-full bg-slate-900 text-white py-4 md:py-5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Create Session</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const StatCard = ({ icon: Icon, label, value, color, textColor = "text-slate-400", border = "border-slate-100" }) => (
    <div className={`bg-white p-5 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-sm border ${border} flex items-center gap-4 md:gap-5`}>
        <div className={`w-12 h-12 md:w-14 md:h-14 ${color} rounded-xl md:rounded-2xl flex items-center justify-center text-white shrink-0`}>
            <Icon size={24}/>
        </div>
        <div className="min-w-0">
            <p className={`text-[10px] font-black uppercase tracking-widest truncate ${textColor}`}>{label}</p>
            <h2 className="text-xl md:text-2xl font-black truncate">{value}</h2>
        </div>
    </div>
);