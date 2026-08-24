'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase/config'; 
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    query, 
    where,
    writeBatch
} from 'firebase/firestore';
import { 
    HiOutlineClipboardList, 
    HiRefresh, 
    HiChevronRight,
    HiOutlineArrowLeft,
    HiCloudUpload
} from 'react-icons/hi';
import Link from 'next/link';

const CLASSES = ['LKG', 'UKG', 'PREP', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export default function AttendancePage() {
    const [activeSession, setActiveSession] = useState('');
    const [selectedClass, setSelectedClass] = useState('11');
    const [students, setStudents] = useState([]);
    const [attendanceStats, setAttendanceStats] = useState({});
    const [totalWorkingDays, setTotalWorkingDays] = useState(0);
    const [newTotalInput, setNewTotalInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 1. Fetch Global Session and Class-Specific Totals
    useEffect(() => {
        async function fetchSettings() {
            try {
                const configSnap = await getDoc(doc(db, 'config', 'settings'));
                if (configSnap.exists()) {
                    const sessionFromDb = configSnap.data().activeSession;
                    setActiveSession(sessionFromDb);

                    const sessionSnap = await getDoc(doc(db, 'sessions', sessionFromDb));
                    if (sessionSnap.exists()) {
                        const sessionData = sessionSnap.data();
                        const totals = sessionData.attendanceTotals || {};
                        setTotalWorkingDays(Number(totals[selectedClass]) || 0);
                    } else {
                        setTotalWorkingDays(0);
                    }
                }
            } catch (e) {
                console.error("Session sync error:", e);
            }
        }
        fetchSettings();
    }, [selectedClass]);

    // 2. Load Students and Calculate Attendance Stats from Logs
    const loadData = useCallback(async () => {
        if (!activeSession) return;
        setLoading(true);

        try {
            const sessionParts = activeSession.split('-'); 
            const startYear = sessionParts[0]; 
            const endYear = `20${sessionParts[1]}`;
            const startDate = `${startYear}-04-01`;
            const endDate = `${endYear}-03-31`;

            // Fetch Students for the selected class
            const studentSnap = await getDocs(collection(db, 'sessions', activeSession, 'students'));
            const studentList = studentSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(s => String(s.grade || s.class) === selectedClass);
            
            setStudents(studentList.sort((a, b) => (a.name || "").localeCompare(b.name || "")));

            // Fetch Attendance Logs to calculate Present/Absent counts
            const attendanceRef = collection(db, 'sessions', activeSession, 'attendance');
            const q = query(
                attendanceRef,
                where('grade', '==', selectedClass),
                where('date', '>=', startDate),
                where('date', '<=', endDate)
            );
            
            const attendanceSnap = await getDocs(q);
            const stats = {};
            
            attendanceSnap.docs.forEach(docSnap => {
                const data = docSnap.data();
                Object.entries(data.records || {}).forEach(([studentId, status]) => {
                    if (!stats[studentId]) stats[studentId] = { present: 0, absent: 0 };
                    const normalizedStatus = String(status).toLowerCase();
                    if (normalizedStatus === 'present') stats[studentId].present++;
                    else if (normalizedStatus === 'absent') stats[studentId].absent++;
                });
            });

            setAttendanceStats(stats);
        } catch (error) {
            console.error("Attendance Load Error:", error);
        } finally {
            setLoading(false);
        }
    }, [activeSession, selectedClass]);

    useEffect(() => { loadData(); }, [loadData]);

    // 3. Update Working Days for the Class
    const handleUpdateTotal = async () => {
        if (!newTotalInput || !activeSession) return;
        try {
            const sessionRef = doc(db, 'sessions', activeSession);
            const snap = await getDoc(sessionRef);
            const currentTotals = snap.exists() ? (snap.data().attendanceTotals || {}) : {};
            
            await setDoc(sessionRef, {
                attendanceTotals: { ...currentTotals, [selectedClass]: newTotalInput }
            }, { merge: true });
            
            setTotalWorkingDays(Number(newTotalInput));
            setNewTotalInput('');
        } catch (e) {
            console.error("Save failed:", e);
        }
    };

    // 4. SYNC TO INDIVIDUAL STUDENT DOCUMENTS
    const handleSyncToStudents = async () => {
        if (!activeSession || students.length === 0) return;
        setSaving(true);
        
        try {
            const batch = writeBatch(db);
            
            students.forEach((stu) => {
                const p = attendanceStats[stu.id]?.present || 0;
                const attendanceString = totalWorkingDays > 0 ? `${p}/${totalWorkingDays}` : "-";

                // Target: sessions > {session} > students > {id}
                const studentRef = doc(db, 'sessions', activeSession, 'students', stu.id);
                
                batch.set(studentRef, {
                    attendance: attendanceString, // Directly readable by Marksheet Template
                    presentCount: p,
                    totalWorkingDays: totalWorkingDays,
                    lastAttendanceSync: new Date().toISOString()
                }, { merge: true });
            });

            await batch.commit();
            alert(`Attendance injected into ${students.length} student documents.`);
        } catch (e) {
            console.error("Sync Error:", e);
            alert("Failed to update student documents.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans">
            <div className="max-w-6xl mx-auto">
                <nav className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">
                    <div className="flex items-center gap-3">
                        <Link href="/exam-manage" className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                            <HiOutlineArrowLeft /> Exam Controller
                        </Link>
                        <HiChevronRight />
                        <span className="text-indigo-600">Session Attendance</span>
                    </div>
                    
                    <button 
                        onClick={handleSyncToStudents}
                        disabled={saving || loading}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-full hover:bg-emerald-700 transition-all shadow-lg disabled:bg-slate-300 font-bold text-[11px] uppercase tracking-wider"
                    >
                        <HiCloudUpload size={18}/>
                        {saving ? 'Processing...' : 'Push to Student Records'}
                    </button>
                </nav>

                <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
                    <header className="p-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Attendance Manager</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Current Global Session: <span className="text-indigo-600 font-black">{activeSession || 'Loading...'}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl">
                                <span className="pl-3 text-[10px] font-black text-slate-400 uppercase">Class</span>
                                <select 
                                    value={selectedClass} 
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="bg-white px-5 py-2 rounded-xl font-bold text-xs shadow-sm border-none outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                >
                                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <button onClick={loadData} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                    <HiRefresh size={22} className={loading ? 'animate-spin text-indigo-500' : ''} />
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Working Days Config Panel */}
                    <section className="m-8 p-10 bg-slate-900 rounded-[2.5rem] text-white flex flex-wrap items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <HiOutlineClipboardList size={40} />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase opacity-40 tracking-widest">Total Working Days ({activeSession})</p>
                                <h3 className="text-6xl font-black italic tracking-tighter">{totalWorkingDays}</h3>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-[2rem]">
                            <input 
                                type="number" 
                                placeholder="Update Total" 
                                className="bg-white p-4 rounded-2xl text-slate-900 font-bold w-36 outline-none border-none placeholder:text-slate-300"
                                value={newTotalInput}
                                onChange={e => setNewTotalInput(e.target.value)}
                            />
                            <button 
                                onClick={handleUpdateTotal}
                                className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-white hover:text-indigo-600 transition-all shadow-xl active:scale-95"
                            >
                                Set Days
                            </button>
                        </div>
                    </section>

                    {/* Data Table */}
                    <div className="px-8 pb-12">
                        {loading ? (
                            <div className="py-40 text-center text-xs font-black text-slate-300 uppercase italic tracking-widest">Compiling Session Data...</div>
                        ) : students.length === 0 ? (
                            <div className="py-40 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100 mx-4">
                                <p className="font-black text-slate-300 uppercase tracking-widest">No Student Records Found</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-separate border-spacing-y-4">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        <th className="px-10 py-4">Student Profile</th>
                                        <th className="px-10 py-4 text-center">Present</th>
                                        <th className="px-10 py-4 text-center">Absent</th>
                                        <th className="px-10 py-4 text-center">Final Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(stu => {
                                        const p = attendanceStats[stu.id]?.present || 0;
                                        const a = attendanceStats[stu.id]?.absent || 0;
                                        const percentage = totalWorkingDays > 0 ? ((p / totalWorkingDays) * 100).toFixed(1) : '0.0';
                                        
                                        return (
                                            <tr key={stu.id} className="bg-white group hover:shadow-xl hover:shadow-slate-200 transition-all duration-300">
                                                <td className="px-10 py-6 rounded-l-[2.5rem] border-y border-l border-slate-50">
                                                    <p className="font-black text-slate-800 text-sm uppercase leading-none">{stu.name}</p>
                                                    <p className="text-[9px] font-bold text-indigo-500 tracking-widest uppercase mt-2">SR No: {stu.srNo || '---'}</p>
                                                </td>
                                                <td className="px-10 py-6 text-center font-black text-emerald-600 text-3xl border-y border-slate-50 italic">{p}</td>
                                                <td className="px-10 py-6 text-center font-black text-rose-500 text-3xl border-y border-slate-50 italic">{a}</td>
                                                <td className="px-10 py-6 text-center rounded-r-[2.5rem] border-y border-r border-slate-50">
                                                    <div className={`inline-flex px-8 py-2.5 rounded-full font-black text-[12px] ${Number(percentage) < 75 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        {percentage}%
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}