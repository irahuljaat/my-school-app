'use client';

import React, { useState, useEffect } from 'react';
import { 
    HiOutlineCalendar, 
    HiOutlineSave, 
    HiOutlineCheckCircle, 
    HiOutlineXCircle,
    HiOutlineClock
} from 'react-icons/hi';
import { 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    query, 
    where 
} from 'firebase/firestore';
import { db } from '../firebase/config'; 
import Image from 'next/image';

// --- STYLING CONSTANTS ---
const TEXT_NAVY = "#303972";
const TEXT_MUTED = "#A0A3BD";

// --- HELPER FUNCTIONS ---
const cleanDataForFirestore = (data) => {
    return Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined)
    );
};

const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
};

// --- FIRESTORE LOGIC ---
const fetchTeacherList = async () => {
    const q = query(collection(db, 'teachers'), where('status', '==', 'Active')); 
    const snapshot = await getDocs(q); 
    return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            name: data.teacherName || data.name || 'Unknown Teacher',
            srNo: data.employeeId || data.employId || data.srNo || 'N/A',
            imageUrl: data.imageUrl || '',
            ...data
        };
    });
};

const fetchAttendanceByDate = async (date) => {
    const recordsCollectionRef = collection(doc(db, 'teacherAttendance', date), 'records');
    const snapshot = await getDocs(recordsCollectionRef);
    const records = {};
    snapshot.docs.forEach(doc => { records[doc.id] = doc.data(); });
    return records;
};

function TeacherAttendance() {
    const today = formatDate(new Date());
    const [selectedDate, setSelectedDate] = useState(today);
    const [attendanceData, setAttendanceData] = useState({});
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    const isToday = selectedDate === today;

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                const list = await fetchTeacherList();
                setTeachers(list);
                const records = await fetchAttendanceByDate(selectedDate);
                
                const mergedData = {};
                list.forEach(t => {
                    mergedData[t.id] = records[t.id] || { status: 'Pending' };
                });
                setAttendanceData(mergedData);
            } catch (err) {
                setMessage({ type: 'error', text: 'Failed to sync with database.' });
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [selectedDate]);

    const handleStatusChange = (teacherId, newStatus) => {
        if (!isToday && !window.confirm("Modifying historical data. Proceed?")) return;
        
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }).replace(':', '');

        setAttendanceData(prev => ({
            ...prev,
            [teacherId]: newStatus === 'Present' 
                ? { status: 'Present', timeIn: prev[teacherId]?.timeIn || currentTime, timeOut: '', reason: '' }
                : newStatus === 'Absent'
                ? { status: 'Absent', timeIn: '', timeOut: '', reason: prev[teacherId]?.reason || '' }
                : { status: 'Pending' }
        }));
    };

    const handleSaveAttendance = async () => {
        setLoading(true);
        setMessage({ type: 'info', text: 'Syncing records...' });

        try {
            const recordsToSave = Object.entries(attendanceData).filter(([, r]) => r.status !== 'Pending');
            if (recordsToSave.length === 0) {
                setMessage({ type: 'warning', text: 'No records marked.' });
                setLoading(false);
                return;
            }

            await Promise.all(recordsToSave.map(([id, record]) => {
                const cleaned = cleanDataForFirestore(record);
                return setDoc(doc(db, 'teacherAttendance', selectedDate, 'records', id), cleaned, { merge: true });
            }));
            
            setMessage({ type: 'success', text: 'Attendance updated successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Save failed. Check permissions.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
            {/* Header with Date Selection */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold" style={{ color: TEXT_NAVY }}>Daily Attendance</h2>
                    <p className="text-xs font-medium mt-1" style={{ color: TEXT_MUTED }}>Mark and manage staff presence for {selectedDate === today ? 'Today' : selectedDate}</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <HiOutlineCalendar className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: TEXT_MUTED }} />
                        <input
                            type="date"
                            value={selectedDate}
                            max={today}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="pl-11 pr-4 py-2.5 bg-[#F8F9FD] border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-200 transition-all"
                            style={{ color: TEXT_NAVY }}
                        />
                    </div>
                    <button
                        onClick={handleSaveAttendance}
                        disabled={loading}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-100 transition-all disabled:opacity-50"
                    >
                        <HiOutlineSave size={18} />
                        {loading ? 'Processing...' : 'Save Records'}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-2 ${
                    message.type === 'error' ? 'bg-rose-50 text-rose-600' : message.type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Attendance Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                        <tr className="text-[13px] font-bold" style={{ color: TEXT_NAVY }}>
                            <th className="px-6 py-4">Educator</th>
                            <th className="px-4 py-4 text-center">Status</th>
                            <th className="px-4 py-4 text-center">Check-In</th>
                            <th className="px-4 py-4 text-center">Check-Out</th>
                            <th className="px-4 py-4">Remarks / Reason</th>
                        </tr>
                    </thead>
                    <tbody className="bg-transparent">
                        {teachers.map((teacher) => {
                            const record = attendanceData[teacher.id] || { status: 'Pending' };
                            return (
                                <tr key={teacher.id} className="group hover:bg-[#F8F9FD] transition-all">
                                    <td className="px-6 py-4 rounded-l-2xl bg-white border-y border-l border-transparent group-hover:border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 overflow-hidden relative border border-slate-200 shrink-0 flex items-center justify-center font-bold text-[#303972]">
                                                {teacher.imageUrl ? (
                                                    <Image src={teacher.imageUrl} alt="" fill className="object-cover" />
                                                ) : (
                                                    teacher.name.charAt(0)
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm" style={{ color: TEXT_NAVY }}>{teacher.name}</div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-purple-500">{teacher.srNo}</div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4 bg-white border-y border-transparent group-hover:border-slate-100">
                                        <div className="flex justify-center gap-2">
                                            <button 
                                                onClick={() => handleStatusChange(teacher.id, 'Present')}
                                                className={`p-2 rounded-lg transition-all ${record.status === 'Present' ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-slate-300 hover:text-emerald-500'}`}
                                            >
                                                <HiOutlineCheckCircle size={22} />
                                            </button>
                                            <button 
                                                onClick={() => handleStatusChange(teacher.id, 'Absent')}
                                                className={`p-2 rounded-lg transition-all ${record.status === 'Absent' ? 'bg-rose-50 text-rose-600 shadow-sm' : 'text-slate-300 hover:text-rose-500'}`}
                                            >
                                                <HiOutlineXCircle size={22} />
                                            </button>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4 bg-white border-y border-transparent group-hover:border-slate-100 text-center">
                                        {record.status === 'Present' ? (
                                            <input 
                                                type="time" 
                                                value={record.timeIn || ''} 
                                                onChange={(e) => setAttendanceData(prev => ({...prev, [teacher.id]: {...prev[teacher.id], timeIn: e.target.value}}))}
                                                className="text-xs font-bold p-1.5 bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-purple-200"
                                                style={{ color: TEXT_NAVY }}
                                            />
                                        ) : <span className="text-[10px] font-bold text-slate-300">--:--</span>}
                                    </td>

                                    <td className="px-4 py-4 bg-white border-y border-transparent group-hover:border-slate-100 text-center">
                                        {record.status === 'Present' ? (
                                            <input 
                                                type="time" 
                                                value={record.timeOut || ''} 
                                                onChange={(e) => setAttendanceData(prev => ({...prev, [teacher.id]: {...prev[teacher.id], timeOut: e.target.value}}))}
                                                className="text-xs font-bold p-1.5 bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-purple-200"
                                                style={{ color: TEXT_NAVY }}
                                            />
                                        ) : <span className="text-[10px] font-bold text-slate-300">--:--</span>}
                                    </td>

                                    <td className="px-4 py-4 rounded-r-2xl bg-white border-y border-r border-transparent group-hover:border-slate-100">
                                        <input 
                                            type="text"
                                            placeholder={record.status === 'Absent' ? "Specify reason..." : "Remarks..."}
                                            value={record.reason || ''}
                                            onChange={(e) => setAttendanceData(prev => ({...prev, [teacher.id]: {...prev[teacher.id], reason: e.target.value}}))}
                                            className="w-full text-xs bg-transparent border-none placeholder:text-slate-300 focus:ring-0"
                                            style={{ color: TEXT_NAVY }}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default TeacherAttendance;