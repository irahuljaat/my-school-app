'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
    HiOutlineCalendar, 
    HiUserGroup, 
    HiOutlineClipboardCheck, 
    HiOutlineSave,
    HiOutlineUserCircle,
    HiOutlineTrendingUp,
    HiCheckCircle,
    HiOutlineDatabase,
    HiOutlineLightningBolt
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
            alert("Attendance saved successfully.");
            setRecordExists(true); 
        } catch (error) {
            alert("Failed to save attendance.");
        } finally { setIsSaving(false); }
    };

    if (!hasMounted) return null;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-24 font-sans">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                    <button 
                        onClick={() => setShowOnlyDummy(!showOnlyDummy)}
                        className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border transition-all duration-300 ${
                            showOnlyDummy 
                            ? 'bg-rose-500 border-rose-600 text-white shadow-lg' 
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                    >
                        <HiOutlineLightningBolt className={showOnlyDummy ? 'animate-pulse' : ''} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {showOnlyDummy ? 'Dummy Mode' : 'Regular Mode'}
                        </span>
                    </button>

                    {activeSession && (
                        <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-2xl flex items-center justify-center gap-2">
                            <HiOutlineDatabase className="text-indigo-600 w-4 h-4" />
                            <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Session: {activeSession}</span>
                        </div>
                    )}
                </div>

                {/* Date & Class Selectors */}
                <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <HiOutlineCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-xs font-black uppercase ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="relative">
                            <HiUserGroup className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-xs font-black uppercase ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                            >
                                {MOCK_CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Statistics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center">
                        <p className="text-slate-400 text-[9px] font-black uppercase">Total</p>
                        <h4 className="text-xl font-black text-slate-800">{stats.total}</h4>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100 text-center">
                        <p className="text-emerald-600 text-[9px] font-black uppercase">Present</p>
                        <h4 className="text-xl font-black text-emerald-700">{stats.present}</h4>
                    </div>
                    <div className="bg-rose-50 p-4 rounded-3xl border border-rose-100 text-center">
                        <p className="text-rose-600 text-[9px] font-black uppercase">Absent</p>
                        <h4 className="text-xl font-black text-rose-700">{stats.absent}</h4>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100 text-center">
                        <p className="text-amber-600 text-[9px] font-black uppercase">Leave</p>
                        <h4 className="text-xl font-black text-amber-700">{stats.leave}</h4>
                    </div>
                </div>

                {/* Attendance List Container */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest flex items-center">
                            <HiOutlineTrendingUp className="mr-2 text-indigo-500" /> 
                            {recordExists ? 'Editing Existing' : 'Mark New'}
                        </h3>
                        <button 
                            onClick={markAllPresent}
                            className="text-[10px] font-black px-4 py-2 rounded-xl uppercase bg-indigo-100 text-indigo-600 active:scale-95 transition-all"
                        >
                            Mark All Present
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-20 text-center animate-pulse text-slate-400 font-black text-[10px] tracking-[0.3em]">FETCHING DATA...</div>
                    ) : students.length === 0 ? (
                        <div className="py-20 text-center bg-white rounded-[2rem] text-slate-400 text-xs font-bold uppercase italic">
                            No students found
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {students.map((student) => (
                                <div key={student.id} className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-100 overflow-hidden relative border border-slate-200">
                                            {student.imageUrl ? (
                                                <Image 
                                                    src={student.imageUrl.replace('/upload/', '/upload/w_100,h_100,c_fill/')} 
                                                    alt="" fill className="object-cover"
                                                />
                                            ) : <HiOutlineUserCircle className="h-full w-full text-slate-300" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-800 text-sm uppercase leading-tight">{student.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {student.studentId || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {/* Responsive Toggle Buttons */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Present', 'Absent', 'Leave'].map((status) => {
                                            const isActive = attendanceData[student.id] === status;
                                            const statusColors = {
                                                Present: 'bg-emerald-500 text-white shadow-emerald-200',
                                                Absent: 'bg-rose-500 text-white shadow-rose-200',
                                                Leave: 'bg-amber-500 text-white shadow-amber-200'
                                            };
                                            return (
                                                <button
                                                    key={status}
                                                    onClick={() => handleAttendanceChange(student.id, status)}
                                                    className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                        isActive 
                                                        ? `${statusColors[status]} shadow-lg scale-[1.02]` 
                                                        : 'bg-slate-50 text-slate-400 border border-slate-100'
                                                    }`}
                                                >
                                                    {status}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Floating Save Button Area */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 md:relative md:bg-transparent md:border-none md:p-0">
                    <button
                        onClick={handleSaveAttendance}
                        disabled={isSaving || students.length === 0}
                        className={`w-full max-w-6xl mx-auto py-4 rounded-[1.5rem] text-white font-black uppercase tracking-widest shadow-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 ${
                            showOnlyDummy ? 'bg-rose-600' : 'bg-indigo-600'
                        }`}
                    >
                        <HiOutlineSave className="w-5 h-5 mr-3" />
                        {isSaving ? 'Processing...' : 'Save Attendance'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AttendancePage;