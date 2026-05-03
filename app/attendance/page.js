'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
    HiOutlineCalendar, 
    HiUserGroup, 
    HiOutlineSave,
    HiOutlineUserCircle,
    HiOutlineTrendingUp,
    HiOutlineDatabase,
    HiOutlineLightningBolt,
    HiCheckCircle,
    HiXCircle,
    HiClock
} from 'react-icons/hi'; // Fixed the import path to /hi
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
            setRecordExists(true); 
            alert("Attendance Updated");
        } catch (error) {
            console.error(error);
        } finally { setIsSaving(false); }
    };

    if (!hasMounted) return null;

    return (
        <div className="min-h-screen bg-[#F8F9FD] p-3 md:p-8 pb-32">
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Header Section: Stacked on Mobile */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-[#303972] tracking-tight">Attendance</h1>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase">
                                <HiOutlineDatabase /> {activeSession}
                            </span>
                            {recordExists && (
                                <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase">
                                    Live Record
                                </span>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowOnlyDummy(!showOnlyDummy)}
                        className={`w-full md:w-auto flex items-center justify-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all duration-300 ${
                            showOnlyDummy 
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' 
                            : 'bg-white border border-slate-200 text-slate-500'
                        }`}
                    >
                        <HiOutlineLightningBolt />
                        <span className="text-[10px] uppercase tracking-widest font-black">
                            {showOnlyDummy ? 'Dummy Mode' : 'Regular Mode'}
                        </span>
                    </button>
                </div>

                {/* Filter Card */}
                <div className="bg-white rounded-[2rem] p-4 md:p-6 shadow-sm border border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <HiOutlineCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-[#303972] outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="relative">
                            <HiUserGroup className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" />
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-[#303972] outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500 appearance-none"
                            >
                                {MOCK_CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Stats Summary: 2x2 Grid on Mobile */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Total', val: stats.total, color: 'bg-white text-slate-800' },
                        { label: 'Present', val: stats.present, color: 'bg-emerald-500 text-white shadow-emerald-100' },
                        { label: 'Absent', val: stats.absent, color: 'bg-rose-500 text-white shadow-rose-100' },
                        { label: 'Leave', val: stats.leave, color: 'bg-amber-400 text-white shadow-amber-100' },
                    ].map((s, idx) => (
                        <div key={idx} className={`${s.color} p-4 rounded-3xl text-center shadow-sm`}>
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-70 mb-1">{s.label}</p>
                            <h4 className="text-xl font-black">{s.val}</h4>
                        </div>
                    ))}
                </div>

                {/* List Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <HiOutlineTrendingUp className="text-indigo-500" />
                        Student Manifest
                    </h3>
                    <button 
                        onClick={markAllPresent}
                        className="w-full sm:w-auto text-[9px] font-black px-4 py-2 rounded-lg uppercase bg-indigo-50 text-indigo-600 active:scale-95 transition-all border border-indigo-100"
                    >
                        Mark All Present
                    </button>
                </div>

                {/* Responsive Student Cards */}
                <div className="grid grid-cols-1 gap-3">
                    {loading ? (
                        <div className="py-20 text-center animate-pulse text-slate-400 font-black text-[10px] tracking-widest">LOADING REGISTRY...</div>
                    ) : students.length === 0 ? (
                        <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100 text-slate-400 text-[10px] font-black uppercase">No students in this class</div>
                    ) : (
                        students.map((student) => (
                            <div key={student.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
                                {/* Top Info: Flex row on all screens */}
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-slate-100 overflow-hidden relative flex-shrink-0">
                                        {student.imageUrl ? (
                                            <Image 
                                                src={student.imageUrl.replace('/upload/', '/upload/w_100,h_100,c_fill/')} 
                                                alt="" fill className="object-cover"
                                            />
                                        ) : <HiOutlineUserCircle className="h-full w-full text-slate-200" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-[#303972] text-sm uppercase truncate">{student.name}</p>
                                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">UID: {student.studentId || 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Bottom Toggles: Large buttons for mobile thumbs */}
                                <div className="flex gap-2">
                                    {[
                                        { id: 'Present', icon: HiCheckCircle, color: 'bg-emerald-500 shadow-emerald-100' },
                                        { id: 'Absent', icon: HiXCircle, color: 'bg-rose-500 shadow-rose-100' },
                                        { id: 'Leave', icon: HiClock, color: 'bg-amber-400 shadow-amber-100' }
                                    ].map((status) => {
                                        const isActive = attendanceData[student.id] === status.id;
                                        return (
                                            <button
                                                key={status.id}
                                                onClick={() => handleAttendanceChange(student.id, status.id)}
                                                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                    isActive 
                                                    ? `${status.color} text-white shadow-lg` 
                                                    : 'bg-slate-50 text-slate-400'
                                                }`}
                                            >
                                                <status.icon className="text-sm" />
                                                <span className="hidden sm:inline">{status.id}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    ))}
                </div>

                {/* Sticky Mobile Save Button */}
                <div className="fixed bottom-4 left-4 right-4 md:relative md:bottom-0 md:left-0 md:right-0 z-50">
                    <button
                        onClick={handleSaveAttendance}
                        disabled={isSaving || students.length === 0}
                        className={`w-full py-4.5 rounded-2xl text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 ${
                            showOnlyDummy ? 'bg-rose-600' : 'bg-[#303972]'
                        }`}
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <HiOutlineSave className="text-lg" />
                                <span>Save Attendance</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AttendancePage;