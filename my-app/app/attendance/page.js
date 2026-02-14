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

    // 1. Setup & Fetch Global Session Settings
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

    // 2. Statistics Calculation
    const stats = useMemo(() => {
        const values = Object.values(attendanceData);
        return {
            total: students.length,
            present: values.filter(v => v === 'Present').length,
            absent: values.filter(v => v === 'Absent').length,
            leave: values.filter(v => v === 'Leave').length,
        };
    }, [attendanceData, students]);

    // 3. Bulletproof Fetch Logic
    const fetchStudentsAndAttendance = async () => {
        if (!selectedClass || !selectedDate || !hasMounted || !activeSession) return;
        
        setLoading(true);
        try {
            // Path: sessions/{sessionID}/students
            const studentsRef = collection(db, 'sessions', activeSession, 'students');
            
            // We fetch the whole class to avoid index errors and handle missing fields
            const studentSnapshot = await getDocs(studentsRef);
            
            const studentList = studentSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(student => {
                    // Normalize types (ensure string comparison)
                    const matchesClass = String(student.grade) === String(selectedClass);
                    
                    // Logic for Dummy Toggle
                    let matchesType = false;
                    if (showOnlyDummy) {
                        matchesType = student.isDummy === true;
                    } else {
                        // Show if isDummy is false OR missing (undefined)
                        matchesType = student.isDummy === false || student.isDummy === undefined;
                    }
                    
                    return matchesClass && matchesType;
                });
            
            setStudents(studentList);
            
            // Generate unique doc ID for attendance
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
            
            // Set default status to 'Present' for new records
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
            alert(`Attendance saved successfully for ${showOnlyDummy ? 'Dummy' : 'Regular'} list.`);
            setRecordExists(true); 
        } catch (error) {
            alert("Failed to save attendance.");
        } finally { setIsSaving(false); }
    };

    if (!hasMounted) return null;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <button 
                        onClick={() => setShowOnlyDummy(!showOnlyDummy)}
                        className={`flex items-center gap-2 px-5 py-2 rounded-full border transition-all duration-300 ${
                            showOnlyDummy 
                            ? 'bg-rose-500 border-rose-600 text-white shadow-lg' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
                        }`}
                    >
                        <HiOutlineLightningBolt className={showOnlyDummy ? 'animate-pulse' : ''} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {showOnlyDummy ? 'Viewing Dummy List' : 'Switch to Dummy'}
                        </span>
                    </button>

                    {activeSession && (
                        <div className="bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full flex items-center gap-2">
                            <HiOutlineDatabase className="text-indigo-600 w-4 h-4" />
                            <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Active: {activeSession}</span>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-2xl text-white shadow-lg transition-colors ${showOnlyDummy ? 'bg-rose-500' : 'bg-indigo-600'}`}>
                                <HiOutlineClipboardCheck className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Attendance Roll</h2>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">
                                    {showOnlyDummy ? 'Dummy Record Management' : 'Regular Student Presence'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative">
                                <HiOutlineCalendar className="absolute left-3 top-3 text-slate-400" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="relative">
                                <HiUserGroup className="absolute left-3 top-3 text-slate-400" />
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="pl-10 pr-8 py-2 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                >
                                    {MOCK_CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-slate-400 text-xs font-bold uppercase">Showing</p>
                        <h4 className="text-2xl font-black text-slate-800">{stats.total}</h4>
                    </div>
                    <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100">
                        <p className="text-emerald-600 text-xs font-bold uppercase">Present</p>
                        <h4 className="text-2xl font-black text-emerald-700">{stats.present}</h4>
                    </div>
                    <div className="bg-rose-50 p-5 rounded-3xl border border-rose-100">
                        <p className="text-rose-600 text-xs font-bold uppercase">Absent</p>
                        <h4 className="text-2xl font-black text-rose-700">{stats.absent}</h4>
                    </div>
                    <div className="bg-amber-50 p-5 rounded-3xl border border-amber-100">
                        <p className="text-amber-600 text-xs font-bold uppercase">Leave</p>
                        <h4 className="text-2xl font-black text-amber-700">{stats.leave}</h4>
                    </div>
                </div>

                {/* Main Table */}
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-700 flex items-center">
                            <HiOutlineTrendingUp className={`mr-2 ${showOnlyDummy ? 'text-rose-500' : 'text-indigo-500'}`} /> 
                            {recordExists ? 'Editing Log' : 'New Log'}
                        </h3>
                        <button 
                            onClick={markAllPresent}
                            className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase transition-all ${
                                showOnlyDummy 
                                ? 'bg-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white' 
                                : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                            }`}
                        >
                            <HiCheckCircle className="mr-1 w-4 h-4" /> Mark All Present
                        </button>
                    </div>

                    <div className="p-4">
                        {loading ? (
                            <div className="py-20 text-center animate-pulse text-slate-400 font-bold tracking-widest">CONNECTING TO DATABASE...</div>
                        ) : !activeSession ? (
                            <div className="py-20 text-center text-amber-500 font-bold">NO ACTIVE SESSION SET IN CONFIG</div>
                        ) : students.length === 0 ? (
                            <div className="py-20 text-center text-slate-400 font-medium italic">
                                No {showOnlyDummy ? 'dummy' : 'regular'} students found in Class {selectedClass}
                            </div>
                        ) : (
                            <div className="overflow-x-auto px-4 pb-4">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left">
                                            <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Student</th>
                                            <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {students.map((student) => (
                                            <tr key={student.id} className="group hover:bg-slate-50/80 transition-colors">
                                                <td className="py-4 pl-4">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 rounded-xl bg-slate-100 mr-4 overflow-hidden shadow-sm">
                                                            {student.imageUrl ? (
                                                                <Image 
                                                                    src={student.imageUrl.replace('/upload/', '/upload/w_100,h_100,c_fill/')} 
                                                                    alt="" width={40} height={40} className="object-cover h-full w-full"
                                                                />
                                                            ) : <HiOutlineUserCircle className="h-full w-full text-slate-300" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-800 text-sm">{student.name}</div>
                                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ID: {student.srNo || student.id.slice(0,5)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex justify-center items-center gap-2">
                                                        {['Present', 'Absent', 'Leave'].map((id) => {
                                                            const colors = {
                                                                Present: 'bg-emerald-500 text-emerald-600 bg-emerald-50',
                                                                Absent: 'bg-rose-500 text-rose-600 bg-rose-50',
                                                                Leave: 'bg-amber-500 text-amber-600 bg-amber-50'
                                                            };
                                                            const isActive = attendanceData[student.id] === id;
                                                            return (
                                                                <button
                                                                    key={id}
                                                                    onClick={() => handleAttendanceChange(student.id, id)}
                                                                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                                                        isActive 
                                                                        ? `${colors[id].split(' ')[0]} text-white shadow-md scale-105` 
                                                                        : `${colors[id].split(' ').slice(1).join(' ')} opacity-40 hover:opacity-100`
                                                                    }`}
                                                                >
                                                                    {id}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                
                                <div className="mt-10 mb-4">
                                    <button
                                        onClick={handleSaveAttendance}
                                        disabled={isSaving}
                                        className={`w-full py-4 text-white rounded-2xl font-bold shadow-2xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center ${
                                            showOnlyDummy ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-indigo-600'
                                        }`}
                                    >
                                        <HiOutlineSave className="w-5 h-5 mr-3" />
                                        {isSaving ? 'Saving...' : `Save ${showOnlyDummy ? 'Dummy' : 'Regular'} Attendance`}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Debug Footer */}
                <div className="text-center py-4">
                    <p className="text-[9px] text-slate-300 font-mono uppercase tracking-[0.2em]">
                        Database Path: sessions / {activeSession || '???'} / students
                    </p>
                </div>

            </div>
        </div>
    );
}

export default AttendancePage;