'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, setDoc, onSnapshot } from 'firebase/firestore';
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

const MOCK_CLASSES = [ 'LKG','UKG','PREP' ,'1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

function AttendancePage() {
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
            present: values.filter(v => v === 'Present').length,
            absent: values.filter(v => v === 'Absent').length,
            leave: values.filter(v => v === 'Leave').length,
        };
    }, [attendanceData, students]);

    const fetchStudentsAndAttendance = async () => {
        if (!selectedClass || !selectedDate || !hasMounted || !activeSession) return;
        
        setLoading(true);
        try {
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
            
            const docId = `${selectedDate}_${selectedClass}${showOnlyDummy ? '_dummy' : ''}`;
            const attendanceSnap = await getDocs(query(
                collection(db, 'sessions', activeSession, 'attendance'), 
                where('__name__', '==', docId)
            ));
            
            let initialAttendance = {};
            let exists = false;

            if (!attendanceSnap.empty) {
                const record = attendanceSnap.docs[0].data();
                initialAttendance = record.records || {};
                exists = true;
            } 
            
            studentList.forEach(student => {
                if (!initialAttendance[student.id]) initialAttendance[student.id] = 'Present';
            });

            setAttendanceData(initialAttendance);
            setRecordExists(exists);
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally { 
            loading && setLoading(false); 
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
                // Find all student objects whose current attendance record is marked 'Absent'
                const absentStudents = students.filter(
                    (student) => attendanceData[student.id] === 'Absent'
                );

                // Map data out into clean payloads (adjust 'student.phone' or 'student.parentPhone' based on your schema)
                const smsPayloads = absentStudents
                    .map((student) => ({
                        name: student.name,
                        phone: student.phone || student.mobile || student.parentPhone, 
                        date: selectedDate,
                        grade: selectedClass,
                    }))
                    .filter((payload) => payload.phone); // Ensure a phone number actually exists

                if (smsPayloads.length > 0) {
                    try {
                        // Forward payloads to an API endpoint to protect keys and prevent CORS issues
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
        <div className="min-h-screen bg-[#FDFDFD] text-slate-900 pb-32">
            {/* Minimal Sticky Top Bar */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                            <HiOutlineCalendar />
                        </div>
                        <h1 className="font-bold text-lg tracking-tight">Registry</h1>
                    </div>
                    <div className="flex items-center gap-2">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeSession}</span>
                         <div className={`w-2 h-2 rounded-full ${recordExists ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
                
                {/* Mode & Quick Actions */}
                <div className="flex flex-col md:flex-row gap-6 justify-between items-end">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-light text-slate-400">Class <span className="text-slate-900 font-semibold">{selectedClass}</span></h2>
                        <p className="text-sm text-slate-500">{new Date(selectedDate).toDateString()}</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button 
                            onClick={() => setShowOnlyDummy(!showOnlyDummy)}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-bold transition-all border ${
                                showOnlyDummy 
                                ? 'bg-rose-50 border-rose-100 text-rose-600' 
                                : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
                            }`}
                        >
                            <HiOutlineLightningBolt />
                            {showOnlyDummy ? 'DUMMY' : 'REGULAR'}
                        </button>
                        <button 
                            onClick={markAllPresent}
                            className="flex-1 md:flex-none px-5 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[11px] font-bold hover:bg-indigo-600 hover:text-white transition-all"
                        >
                            MARK ALL PRESENT
                        </button>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group relative">
                        <HiOutlineCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                        />
                    </div>
                    <div className="group relative">
                        <HiUserGroup className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none"
                        >
                            {MOCK_CLASSES.map(cls => <option key={cls} value={cls}>Grade {cls}</option>)}
                        </select>
                    </div>
                </div>

                {/* Status Dashboard */}
                <div className="flex flex-wrap gap-8 py-4 border-y border-slate-50">
                    {[
                        { label: 'Total', val: stats.total, color: 'text-slate-900' },
                        { label: 'Present', val: stats.present, color: 'text-emerald-600' },
                        { label: 'Absent', val: stats.absent, color: 'text-rose-600' },
                        { label: 'On Leave', val: stats.leave, color: 'text-amber-500' },
                    ].map((s, i) => (
                        <div key={i} className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</span>
                            <span className={`text-xl font-semibold ${s.color}`}>{s.val}</span>
                        </div>
                    ))}
                </div>

                {/* Student Manifest (Sorted Alphabetically) */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em]">SYNCING REGISTRY</p>
                        </div>
                    ) : (
                        sortedStudents.map((student) => (
                            <div key={student.id} className="group bg-white p-3 md:p-4 rounded-3xl border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden relative flex-shrink-0">
                                        {student.imageUrl ? (
                                            <Image 
                                                src={student.imageUrl.replace('/upload/', '/upload/w_100,h_100,c_fill/')} 
                                                alt="" fill className="object-cover"
                                            />
                                        ) : <HiOutlineUserCircle className="h-full w-full text-slate-200" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-800 text-sm">{student.name}</p>
                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">SR: {student.srNo}</p>
                                    </div>
                                </div>

                                {/* Status Toggles */}
                                <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                                    {[
                                        { id: 'Present', icon: HiCheck, active: 'bg-white text-emerald-600 shadow-sm' },
                                        { id: 'Absent', icon: HiX, active: 'bg-white text-rose-600 shadow-sm' },
                                        { id: 'Leave', icon: HiMinus, active: 'bg-white text-amber-500 shadow-sm' }
                                    ].map((status) => {
                                        const isActive = attendanceData[student.id] === status.id;
                                        return (
                                            <button
                                                key={status.id}
                                                onClick={() => handleAttendanceChange(student.id, status.id)}
                                                className={`w-10 h-10 md:w-12 md:h-10 flex items-center justify-center rounded-xl transition-all ${
                                                    isActive ? status.active : 'text-slate-300 hover:text-slate-500'
                                                }`}
                                            >
                                                <status.icon className="text-lg" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Floating Action Button (FAB) */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-6">
                <button
                    onClick={handleSaveAttendance}
                    disabled={isSaving || students.length === 0}
                    className={`group w-full py-4 rounded-[2rem] text-white font-bold text-sm tracking-widest shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:grayscale ${
                        showOnlyDummy ? 'bg-rose-500' : 'bg-indigo-600'
                    }`}
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <HiOutlineSave className="text-xl group-hover:rotate-12 transition-transform" />
                            <span>SAVE ATTENDANCE</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export default AttendancePage;