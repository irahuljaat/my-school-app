"use client";

import React, { useState, useEffect } from 'react';
import { 
    HiOutlineAcademicCap, HiOutlineCurrencyRupee, 
    HiOutlineShieldCheck, HiOutlineTrendingUp,
    HiX, HiExclamationCircle, HiPlusCircle, HiOutlineCake
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

export default function ProfessionalDashboard() {
    const [currentSession, setCurrentSession] = useState(null);
    const [allSessions, setAllSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMigrating, setIsMigrating] = useState(false);
    const [targetMigrationSession, setTargetMigrationSession] = useState('');
    const [showNewSessionModal, setShowNewSessionModal] = useState(false);
    const [newSessionName, setNewSessionName] = useState('');
    const [stats, setStats] = useState({ totalStudents: 0, currentYearCollection: 0, pendingPreviousDues: 0 });
    const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);

    // Logic: Sync Config
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

    // Logic: Fetch Stats & Birthdays
    useEffect(() => {
        if (!currentSession) return;
        const sRef = collection(db, 'sessions', currentSession, 'students');
        const fRef = collection(db, 'sessions', currentSession, 'feePayments');

        const unsubS = onSnapshot(sRef, (snap) => {
            const studentData = snap.docs.map(d => d.data());
            const active = studentData.filter(s => s.grade !== 'PASSED OUT').length;
            const prevDues = studentData.reduce((sum, s) => sum + (Number(s.previouslyDue || s.previousDue || 0)), 0);
            setStats(prev => ({ ...prev, totalStudents: active, pendingPreviousDues: prevDues }));
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const bdays = studentData
                .filter(s => s.dob && s.dob !== "N/A")
                .map(s => {
                    const birthDate = new Date(s.dob);
                    const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                    if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
                    return { ...s, nextBirthday };
                })
                .sort((a, b) => a.nextBirthday - b.nextBirthday)
                .slice(0, 6);
            setUpcomingBirthdays(bdays);
        });

        const unsubF = onSnapshot(fRef, (snap) => {
            const total = snap.docs.reduce((sum, d) => sum + (Number(d.data().amount) || 0), 0);
            setStats(prev => ({ ...prev, currentYearCollection: total }));
        });

        return () => { unsubS(); unsubF(); };
    }, [currentSession]);

    // Handlers
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
        if (!window.confirm(`PROMOTE ALL STUDENTS TO ${targetMigrationSession}?`)) return;
        setIsMigrating(true);
        try {
            const batch = writeBatch(db);
            const timestamp = Date.now();
            const feeStructSnap = await getDocs(collection(db, 'sessions', currentSession, 'studentFeeStructures'));
            const classFees = {};
            feeStructSnap.forEach(doc => { classFees[doc.id] = Number(doc.data().totalFee || 0); });

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
                const balanceToCarry = (classFees[data.grade] || 0) + Number(data.previouslyDue || 0) - (studentPayments[d.id] || 0);
                const srNo = data.scholarNo || data. ScholarNo || "NA";
                const newStudentId = `S${srNo}_${nextGrade}_${timestamp}`;
                batch.set(doc(db, 'sessions', targetMigrationSession, 'students', newStudentId), {
                    ...data, id: newStudentId, grade: nextGrade, migratedFrom: currentSession,
                    previouslyDue: balanceToCarry > 0 ? balanceToCarry : 0, paidAmount: 0,
                });
            });
            await batch.commit();
            await updateDoc(doc(db, 'config', 'settings'), { activeSession: targetMigrationSession });
            alert("Success");
        } catch (e) { alert(e.message); } finally { setIsMigrating(false); }
    };

    if (loading) return <div className="p-10 font-bold  animate-pulse text-zinc-400">Loading Dashboard...</div>;

    return (
        <div className="m-10 space-y-6">
            {/* 1. TOP BAR: Session Status */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-900 flex items-center justify-center rounded-lg text-white">
                        <HiOutlineShieldCheck size={24} />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Active Management Session</span>
                        <select 
                            value={currentSession}
                            onChange={(e) => updateDoc(doc(db, 'config', 'settings'), { activeSession: e.target.value })}
                            className="text-xl font-black bg-transparent outline-none cursor-pointer hover:text-indigo-600 transition-colors"
                        >
                            {allSessions.map(s => <option key={s} value={s}>{s} Academic Year</option>)}
                        </select>
                    </div>
                </div>
                <button 
                    onClick={() => setShowNewSessionModal(true)}
                    className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-tight hover:bg-zinc-800 transition-all shadow-sm"
                >
                    <HiPlusCircle size={18} /> Initialize Session
                </button>
            </div>

            {/* 2. STATS GRID: Clean & Bold */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={HiOutlineAcademicCap} label="Total Students" value={stats.totalStudents} sub="Actively Enrolled" />
                <StatCard icon={HiOutlineCurrencyRupee} label="Total Collection" value={`₹${stats.currentYearCollection.toLocaleString()}`} sub="Current Session" />
                <StatCard icon={HiExclamationCircle} label="Historical Dues" value={`₹${stats.pendingPreviousDues.toLocaleString()}`} sub="Pending Arrears" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 3. MIGRATION ENGINE (Main Action) */}
                <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <HiOutlineTrendingUp className="text-zinc-400" size={20} />
                            <h3 className="font-black text-sm uppercase tracking-wider text-zinc-800">Promotion & Migration Engine</h3>
                        </div>
                        <p className="text-sm text-zinc-500 font-medium leading-relaxed mb-6">
                            Use this tool to end the current academic year. It will promote all students to the next grade and calculate their outstanding balance to be carried forward as 'Previous Due'.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-100">
                        <select 
                            value={targetMigrationSession} 
                            onChange={(e) => setTargetMigrationSession(e.target.value)}
                            className="flex-1 bg-zinc-50 border border-zinc-200 p-3 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-zinc-400"
                        >
                            <option value="">Select Target Session...</option>
                            {allSessions.filter(s => s !== currentSession).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button 
                            onClick={handleMigrateAndPromote}
                            disabled={isMigrating || !targetMigrationSession}
                            className="bg-zinc-900 text-white px-8 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest disabled:opacity-20 transition-all active:scale-95"
                        >
                            {isMigrating ? "Migrating Data..." : "Run Migration"}
                        </button>
                    </div>
                </div>

                {/* 4. BIRTHDAY LIST (Secondary Context) */}
                <div className="bg-white border border-zinc-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <HiOutlineCake className="text-zinc-900" size={20} />
                        <h3 className="font-black text-sm uppercase tracking-wider text-zinc-800">Birthdays</h3>
                    </div>
                    <div className="space-y-3">
                        {upcomingBirthdays.map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-zinc-900 truncate uppercase">{s.name}</p>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Class {s.grade}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[11px] font-black text-indigo-600 bg-white px-2 py-1 rounded shadow-sm border border-zinc-100">
                                        {new Date(s.nextBirthday).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showNewSessionModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border-2 border-zinc-900 rounded-xl w-full max-w-sm p-8 shadow-2xl">
                        <h3 className="text-lg font-black uppercase tracking-tighter mb-1">New Academic Session</h3>
                        <p className="text-xs font-medium text-zinc-400 mb-6 uppercase tracking-widest">Setup a new year</p>
                        <input 
                            value={newSessionName} 
                            onChange={(e) => setNewSessionName(e.target.value)}
                            placeholder="e.g., 2027-28"
                            className="w-full bg-zinc-50 border-2 border-zinc-100 p-4 rounded-lg mb-4 text-center font-black text-xl outline-none focus:border-zinc-900 transition-all"
                        />
                        <div className="flex flex-col gap-2">
                            <button onClick={handleCreateSession} className="w-full bg-zinc-900 text-white py-4 rounded-lg font-black text-xs uppercase tracking-widest transition-all hover:bg-black">Initialize Now</button>
                            <button onClick={() => setShowNewSessionModal(false)} className="w-full py-3 text-zinc-400 font-bold text-[10px] uppercase tracking-widest">Dismiss</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, sub }) {
    return (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-zinc-50 text-zinc-900 flex items-center justify-center rounded-lg border border-zinc-100">
                    <Icon size={20} />
                </div>
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{label}</p>
            <h2 className="text-3xl font-black text-zinc-900 tracking-tighter mb-1">{value}</h2>
            <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-tight italic">{sub}</p>
        </div>
    );
}