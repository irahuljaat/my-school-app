'use client';

import React, { useState, useEffect } from 'react';
import { 
    HiOutlineCalendar, 
    HiOutlineSave, 
    HiOutlineCheckCircle, 
    HiOutlineXCircle,
    HiOutlineClock,
    HiUserGroup,
    HiSearch
} from 'react-icons/hi';
import { 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    query 
} from 'firebase/firestore';
import { db } from '../firebase/config'; 
import Image from 'next/image';
import { useColors } from '../components/ColorComponent';

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

export default function TeacherAttendance() {
    const colors = useColors();
    const today = formatDate(new Date());
    const [selectedDate, setSelectedDate] = useState(today);
    const [attendanceData, setAttendanceData] = useState({});
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const isToday = selectedDate === today;

    // --- FIRESTORE LOGIC ---
    const fetchTeacherList = async () => {
        const q = query(collection(db, 'teachers')); 
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
        snapshot.docs.forEach(docSnap => { records[docSnap.id] = docSnap.data(); });
        return records;
    };

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

    const handleMarkAllPresent = () => {
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }).replace(':', '');
        
        setAttendanceData(prev => {
            const updated = { ...prev };
            filteredTeachers.forEach(t => {
                updated[t.id] = {
                    status: 'Present',
                    timeIn: updated[t.id]?.timeIn || currentTime,
                    timeOut: updated[t.id]?.timeOut || '',
                    reason: updated[t.id]?.reason || ''
                };
            });
            return updated;
        });
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
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Save failed. Check permissions.' });
        } finally {
            setLoading(false);
        }
    };

    // Filtered teachers list based on search query
    const filteredTeachers = teachers.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        String(t.srNo).toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate Summary Stats
    const totalTeachers = teachers.length;
    const presentCount = Object.values(attendanceData).filter(r => r.status === 'Present').length;
    const absentCount = Object.values(attendanceData).filter(r => r.status === 'Absent').length;
    const pendingCount = totalTeachers - presentCount - absentCount;

    return (
        <div className="space-y-8 p-6 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden transition-colors duration-300"
             style={{ backgroundColor: colors.background }}>
            
            {/* Background Decorative Accent Blobs */}
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-10"
                 style={{ backgroundColor: colors.primary }}></div>
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-10"
                 style={{ backgroundColor: colors.primary }}></div>

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 rounded-full text-white shadow-lg"
                         style={{ backgroundColor: colors.primary, boxShadow: `0 10px 25px -5px ${colors.primary}40` }}>
                        <HiUserGroup size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight" style={{ color: colors.text }}>
                            Staff Attendance Portal
                        </h2>
                        <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                            Manage daily presence for {selectedDate === today ? 'Today' : selectedDate}
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <HiOutlineCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="date"
                            value={selectedDate}
                            max={today}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="pl-11 pr-4 py-3 border-2 border-slate-100 rounded-full text-xs font-bold focus:ring-4 transition-all outline-none shadow-sm cursor-pointer"
                            style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleMarkAllPresent}
                        className="px-5 py-3 border border-slate-200 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-sm hover:brightness-110"
                        style={{ color: colors.primary, backgroundColor: colors.cardBackground }}
                    >
                        Mark All Present
                    </button>
                    <button
                        onClick={handleSaveAttendance}
                        disabled={loading}
                        className="flex items-center gap-2 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 hover:brightness-110"
                        style={{ backgroundColor: colors.primary, boxShadow: `0 10px 25px -5px ${colors.primary}40` }}
                    >
                        <HiOutlineSave size={18} />
                        {loading ? 'Processing...' : 'Save Records'}
                    </button>
                </div>
            </div>

            {/* Quick Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                <div className="p-4 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
                     style={{ backgroundColor: colors.cardBackground }}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Educators</p>
                        <h4 className="text-2xl font-black mt-1" style={{ color: colors.text }}>{totalTeachers}</h4>
                    </div>
                    <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}><HiUserGroup size={20} /></div>
                </div>
                <div className="p-4 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
                     style={{ backgroundColor: colors.cardBackground }}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Present</p>
                        <h4 className="text-2xl font-black text-emerald-600 mt-1">{presentCount}</h4>
                    </div>
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><HiOutlineCheckCircle size={20} /></div>
                </div>
                <div className="p-4 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
                     style={{ backgroundColor: colors.cardBackground }}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Absent</p>
                        <h4 className="text-2xl font-black text-rose-500 mt-1">{absentCount}</h4>
                    </div>
                    <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl"><HiOutlineXCircle size={20} /></div>
                </div>
                <div className="p-4 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
                     style={{ backgroundColor: colors.cardBackground }}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Pending</p>
                        <h4 className="text-2xl font-black text-amber-500 mt-1">{pendingCount}</h4>
                    </div>
                    <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl"><HiOutlineClock size={20} /></div>
                </div>
            </div>

            {/* Search Bar filter */}
            <div className="relative z-10 flex items-center gap-4 backdrop-blur-md p-3 rounded-full border border-slate-100 shadow-sm"
                 style={{ backgroundColor: colors.cardBackground }}>
                <HiSearch className="text-slate-400 ml-3" size={20} />
                <input
                    type="text"
                    placeholder="Search educator by name or employee ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none text-xs font-bold placeholder:text-slate-400 focus:ring-0 outline-none"
                    style={{ color: colors.text }}
                />
            </div>

            {message && (
                <div className={`p-4 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all duration-300 shadow-sm relative z-10 ${
                    message.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-200' : 
                    message.type === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                    'bg-blue-50 border-blue-200'
                }`} style={message.type === 'info' ? { color: colors.primary } : {}}>
                    {message.text}
                </div>
            )}

            {/* Attendance Table */}
            <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                        <tr className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                            <th className="px-6 py-2">Educator</th>
                            <th className="px-4 py-2 text-center">Status</th>
                            <th className="px-4 py-2 text-center">Check-In</th>
                            <th className="px-4 py-2 text-center">Check-Out</th>
                            <th className="px-4 py-2">Remarks / Reason</th>
                        </tr>
                    </thead>
                    <tbody className="bg-transparent">
                        {filteredTeachers.length > 0 ? (
                            filteredTeachers.map((teacher) => {
                                const record = attendanceData[teacher.id] || { status: 'Pending' };
                                return (
                                    <tr key={teacher.id} className="group hover:scale-[1.002] transition-all">
                                        <td className="px-6 py-4 rounded-l-3xl backdrop-blur-sm border-y border-l border-slate-100 shadow-sm"
                                            style={{ backgroundColor: colors.cardBackground }}>
                                            <div className="flex items-center gap-4">
                                                <div className="h-11 w-11 rounded-full bg-slate-100 overflow-hidden relative border-2 border-white shadow-md shrink-0 flex items-center justify-center font-bold"
                                                     style={{ color: colors.primary }}>
                                                    {teacher.imageUrl ? (
                                                        <Image src={teacher.imageUrl} alt="" fill className="object-cover" unoptimized />
                                                    ) : (
                                                        teacher.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-extrabold text-sm" style={{ color: colors.text }}>{teacher.name}</div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.primary }}>ID: {teacher.srNo}</div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 backdrop-blur-sm border-y border-slate-100 shadow-sm"
                                            style={{ backgroundColor: colors.cardBackground }}>
                                            <div className="flex justify-center gap-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => handleStatusChange(teacher.id, 'Present')}
                                                    className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                                        record.status === 'Present' 
                                                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                                                            : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                                                    }`}
                                                >
                                                    <HiOutlineCheckCircle size={16} /> Present
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleStatusChange(teacher.id, 'Absent')}
                                                    className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                                        record.status === 'Absent' 
                                                            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' 
                                                            : 'bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                                                    }`}
                                                >
                                                    <HiOutlineXCircle size={16} /> Absent
                                                </button>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 backdrop-blur-sm border-y border-slate-100 shadow-sm text-center"
                                            style={{ backgroundColor: colors.cardBackground }}>
                                            {record.status === 'Present' ? (
                                                <input 
                                                    type="time" 
                                                    value={record.timeIn || ''} 
                                                    onChange={(e) => setAttendanceData(prev => ({...prev, [teacher.id]: {...prev[teacher.id], timeIn: e.target.value}}))}
                                                    className="text-xs font-bold p-2 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none"
                                                    style={{ color: colors.text }}
                                                />
                                            ) : <span className="text-[10px] font-bold text-slate-300">--:--</span>}
                                        </td>

                                        <td className="px-4 py-4 backdrop-blur-sm border-y border-slate-100 shadow-sm text-center"
                                            style={{ backgroundColor: colors.cardBackground }}>
                                            {record.status === 'Present' ? (
                                                <input 
                                                    type="time" 
                                                    value={record.timeOut || ''} 
                                                    onChange={(e) => setAttendanceData(prev => ({...prev, [teacher.id]: {...prev[teacher.id], timeOut: e.target.value}}))}
                                                    className="text-xs font-bold p-2 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none"
                                                    style={{ color: colors.text }}
                                                />
                                            ) : <span className="text-[10px] font-bold text-slate-300">--:--</span>}
                                        </td>

                                        <td className="px-4 py-4 rounded-r-3xl backdrop-blur-sm border-y border-r border-slate-100 shadow-sm"
                                            style={{ backgroundColor: colors.cardBackground }}>
                                            <input 
                                                type="text"
                                                placeholder={record.status === 'Absent' ? "Specify reason..." : "Remarks..."}
                                                value={record.reason || ''}
                                                onChange={(e) => setAttendanceData(prev => ({...prev, [teacher.id]: {...prev[teacher.id], reason: e.target.value}}))}
                                                className="w-full text-xs font-bold p-2 bg-slate-50 border-2 border-slate-100 rounded-xl placeholder:text-slate-300 outline-none"
                                                style={{ color: colors.text }}
                                            />
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-12 rounded-2xl text-slate-400 font-bold text-xs"
                                    style={{ backgroundColor: colors.cardBackground }}>
                                    No educators found matching your query.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}