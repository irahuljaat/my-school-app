'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
    HiOutlineCalendar, 
    HiUserGroup, 
    HiOutlineSave,
    HiOutlineUserCircle,
    HiOutlineLightningBolt,
    HiCheck,
    HiX,
    HiMinus
} from 'react-icons/hi'; 
import Image from 'next/image';
import { useColors } from '../components/ColorComponent';

const MOCK_CLASSES = [ 'LKG','UKG','PREP' ,'1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

function AttendancePage() {
    const colors = useColors();
    const [hasMounted, setHasMounted] = useState(false);
    const [activeSession, setActiveSession] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedClass, setSelectedClass] = useState(MOCK_CLASSES[0]);
    const [showOnlyDummy, setShowOnlyDummy] = useState(false);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [attendanceData, setAttendanceData] = useState({}); 
    const [isSaving, setIsSaving] = useState(false);
    const [recordExists, setRecordExists] = useState(false);

    // Initial setup and Session listener
    useEffect(() => {
        setHasMounted(true);
        setSelectedDate(new Date().toISOString().split('T')[0]);

        const unsub = onSnapshot(doc(db, 'config', 'settings'), (docSnap) => {
            if (docSnap.exists()) {
                setActiveSession(docSnap.data().activeSession);
            }
        });
        return () => unsub();
    }, []);

    // Alphabetical Sorting Logic
    const sortedStudents = useMemo(() => {
        return [...students].sort((a, b) => 
            (a.name || '').localeCompare(b.name || '')
        );
    }, [students]);

    // Attendance Statistics
    const stats = useMemo(() => {
        const values = Object.values(attendanceData);
        return {
            total: students.length,
            present: values.filter(v => v === 'Present' || v === 'present').length,
            absent: values.filter(v => v === 'Absent' || v === 'absent').length,
            leave: values.filter(v => v === 'Leave' || v === 'leave').length,
        };
    }, [attendanceData, students]);

    const fetchStudentsAndAttendance = async () => {
        if (!selectedClass || !selectedDate || !hasMounted || !activeSession) return;
        
        setLoading(true);
        try {
            // 1. Fetch Students for the Grade
            const studentsRef = collection(db, 'sessions', activeSession, 'students');
            const studentSnapshot = await getDocs(studentsRef);
            
            const studentList = studentSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(student => {
                    const matchesClass = String(student.grade) === String(selectedClass);
                    let matchesType = showOnlyDummy ? student.isDummy === true : (student.isDummy === false || student.isDummy === undefined);
                    return matchesClass && matchesType;
                });
            
            setStudents(studentList);
            
            // 2. Fetch Attendance Record matching exact ID format: YYYY-MM-DD_Grade
            const docId = `${selectedDate}_${selectedClass}${showOnlyDummy ? '_dummy' : ''}`;
            const attendanceDocRef = doc(db, 'sessions', activeSession, 'attendance', docId);
            const attendanceSnap = await getDoc(attendanceDocRef);
            
            let initialAttendance = {};
            let exists = false;

            if (attendanceSnap.exists()) {
                const record = attendanceSnap.data();
                // Map the saved records map directly
                initialAttendance = record.records || {};
                exists = true;
            } 
            
            // Fill default 'Present' for students not yet saved in this day's log
            studentList.forEach(student => {
                if (!initialAttendance[student.id]) {
                    initialAttendance[student.id] = 'Present';
                }
            });

            setAttendanceData(initialAttendance);
            setRecordExists(exists);
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => {
        fetchStudentsAndAttendance();
    }, [selectedClass, selectedDate, hasMounted, activeSession, showOnlyDummy]);

    const handleAttendanceChange = (studentId, status) => {
        setAttendanceData(prev => ({ ...prev, [studentId]: status }));
    };

    const markAllPresent = () => {
        const updated = {};
        students.forEach(s => { updated[s.id] = 'Present'; });
        setAttendanceData(updated);
    };

    const handleSaveAttendance = async () => {
        if (students.length === 0 || isSaving || !activeSession) return;
        setIsSaving(true);
        try {
            const docId = `${selectedDate}_${selectedClass}${showOnlyDummy ? '_dummy' : ''}`;
            const attendanceDocRef = doc(db, 'sessions', activeSession, 'attendance', docId);
            
            const dataToSave = {
                date: selectedDate,
                grade: selectedClass,
                isDummyRecord: showOnlyDummy,
                session: activeSession,
                records: attendanceData,
                totalStudents: stats.total,
                totalPresent: stats.present,
                totalAbsent: stats.absent,
                updatedAt: new Date().toISOString(),
                ...(!recordExists && { createdAt: new Date().toISOString() })
            };

            await setDoc(attendanceDocRef, dataToSave, { merge: true });
            setRecordExists(true); 

            // --- Send SMS to Absent Students ---
            if (!showOnlyDummy && stats.absent > 0) {
                const absentStudents = students.filter(
                    (student) => attendanceData[student.id] === 'Absent' || attendanceData[student.id] === 'absent'
                );

                const smsPayloads = absentStudents
                    .map((student) => ({
                        name: student.name,
                        phone: student.phone || student.mobile || student.parentPhone, 
                        date: selectedDate,
                        grade: selectedClass,
                    }))
                    .filter((payload) => payload.phone);

                if (smsPayloads.length > 0) {
                    try {
                        await fetch('/api/send-sms', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ recipients: smsPayloads }),
                        });
                    } catch (smsErr) {
                        console.error("SMS triggering error:", smsErr);
                    }
                }
            }

            alert("Attendance Saved Successfully and Absence Notifications Sent.");
        } catch (error) {
            console.error(error);
        } finally { setIsSaving(false); }
    };

    if (!hasMounted) return null;

    return (
        <div className="min-h-screen p-6 lg:p-8 font-sans transition-colors duration-300 relative overflow-hidden pb-36" style={{ backgroundColor: colors.background }}>
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none opacity-10 blur-3xl -mr-20 -mt-20" style={{ backgroundColor: colors.primary }}></div>
            <div className="absolute bottom-10 left-0 w-72 h-72 rounded-full pointer-events-none opacity-5 blur-2xl -ml-20" style={{ backgroundColor: colors.primary }}></div>

            <div className="max-w-[1440px] mx-auto space-y-8 relative z-10">
                {/* Header Card */}
                <div 
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-[28px] shadow-sm border border-slate-100 transition-colors duration-300 relative overflow-hidden"
                    style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3.5 rounded-full shadow-inner" style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
                            <HiOutlineCalendar size={24} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 text-slate-500">
                                Active Session: <span style={{ color: colors.primary }}>{activeSession || 'Loading...'}</span>
                            </span>
                            <h1 className="text-2xl font-black tracking-tight mt-1" style={{ color: colors.text }}>Registry & Attendance</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Record Status:</span>
                        <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-2 ${recordExists ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            <div className={`w-2.5 h-2.5 rounded-full ${recordExists ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                            {recordExists ? 'Loaded Existing Record' : 'No Record for Date'}
                        </div>
                    </div>
                </div>

                {/* Main Content Card Container */}
                <div 
                    className="rounded-[28px] border border-slate-100 shadow-sm p-6 md:p-8 space-y-8 transition-colors duration-300 relative overflow-hidden"
                    style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                >
                    {/* Mode & Quick Actions Bar */}
                    <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-slate-50/60 p-6 rounded-[24px] border border-slate-100">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Grade</span>
                            <h2 className="text-2xl font-black" style={{ color: colors.text }}>
                                Class <span style={{ color: colors.primary }}>{selectedClass}</span>
                            </h2>
                            <p className="text-xs font-bold text-slate-500">{new Date(selectedDate).toDateString()}</p>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button 
                                onClick={() => setShowOnlyDummy(!showOnlyDummy)}
                                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                                    showOnlyDummy 
                                    ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20' 
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <HiOutlineLightningBolt size={16} />
                                {showOnlyDummy ? 'Viewing Dummy' : 'Show Dummy'}
                            </button>
                            <button 
                                onClick={markAllPresent}
                                style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                                className="flex-1 md:flex-none px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition-all active:scale-[0.99]"
                            >
                                Mark All Present
                            </button>
                        </div>
                    </div>

                    {/* Filter Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="group relative">
                            <HiOutlineCalendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={18} />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full pl-12 pr-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-full text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 transition-all outline-none"
                            />
                        </div>
                        <div className="group relative">
                            <HiUserGroup className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={18} />
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full pl-12 pr-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-full text-xs font-bold uppercase text-slate-700 focus:bg-white focus:ring-2 transition-all outline-none cursor-pointer appearance-none"
                            >
                                {MOCK_CLASSES.map(cls => <option key={cls} value={cls}>Grade {cls}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Status Dashboard Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                        {[
                            { label: 'Total', val: stats.total, color: 'text-slate-700' },
                            { label: 'Present', val: stats.present, color: 'text-emerald-600' },
                            { label: 'Absent', val: stats.absent, color: 'text-rose-600' },
                            { label: 'On Leave', val: stats.leave, color: 'text-amber-500' },
                        ].map((s, i) => (
                            <div key={i} className="flex flex-col bg-slate-50/50 p-5 rounded-[24px] border border-slate-100 shadow-sm">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
                                <span className={`text-2xl font-black ${s.color} mt-1`}>{s.val}</span>
                            </div>
                        ))}
                    </div>

                    {/* Student Manifest */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Student Manifest List</h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sortedStudents.length} Students Listed</span>
                        </div>

                        {loading ? (
                            <div className="py-20 text-center space-y-4">
                                <div className="w-8 h-8 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Registry...</p>
                            </div>
                        ) : sortedStudents.length === 0 ? (
                            <div className="py-20 text-center rounded-[24px] bg-slate-50/50 border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No students found matching this criteria.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {sortedStudents.map((student) => (
                                    <div key={student.id} className="group bg-slate-50/40 p-4 rounded-[24px] border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 overflow-hidden relative flex-shrink-0 shadow-sm">
                                                {student.imageUrl ? (
                                                    <Image 
                                                        src={student.imageUrl.replace('/upload/', '/upload/w_100,h_100,c_fill/')} 
                                                        alt="" fill className="object-cover"
                                                    />
                                                ) : <HiOutlineUserCircle className="h-full w-full text-slate-300" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-extrabold text-xs" style={{ color: colors.text }}>{student.name}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5">ID: {student.id}</p>
                                            </div>
                                        </div>

                                        {/* Status Toggles */}
                                        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                                            {[
                                                { id: 'Present', icon: HiCheck, active: 'bg-emerald-600 text-white shadow-md' },
                                                { id: 'Absent', icon: HiX, active: 'bg-rose-600 text-white shadow-md' },
                                                { id: 'Leave', icon: HiMinus, active: 'bg-amber-500 text-white shadow-md' }
                                            ].map((status) => {
                                                const currentVal = attendanceData[student.id];
                                                const isActive = currentVal && currentVal.toLowerCase() === status.id.toLowerCase();
                                                return (
                                                    <button
                                                        key={status.id}
                                                        onClick={() => handleAttendanceChange(student.id, status.id)}
                                                        className={`w-10 h-10 md:w-12 md:h-10 flex items-center justify-center rounded-xl transition-all ${
                                                            isActive ? status.active : 'text-slate-400 hover:text-slate-700'
                                                        }`}
                                                    >
                                                        <status.icon className="text-base" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-6">
                <button
                    onClick={handleSaveAttendance}
                    disabled={isSaving || students.length === 0}
                    style={{ backgroundColor: showOnlyDummy ? '#e11d48' : colors.primary }}
                    className="group w-full py-4 rounded-[2rem] text-white font-black text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:grayscale uppercase"
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <HiOutlineSave className="text-lg group-hover:rotate-12 transition-transform" />
                            <span>Save Attendance & Notify</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export default AttendancePage;