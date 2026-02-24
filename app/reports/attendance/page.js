'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { 
    HiOutlineCalendar, 
    HiOutlineClipboardList, 
    HiUserGroup, 
    HiRefresh, 
    HiPrinter,
    HiOutlineLightningBolt 
} from 'react-icons/hi';

const MOCK_CLASSES = [ 'LKG','UKG','PREP' , '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const getMonthDetails = (year, month) => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    
    return {
        daysInMonth,
        year,
        month
    };
};

export default function MonthlyAttendanceReport() {
    const today = new Date();
    const [selectedClass, setSelectedClass] = useState(MOCK_CLASSES[0]);
    const [selectedMonthYear, setSelectedMonthYear] = useState(today.toISOString().slice(0, 7)); 
    const [activeSession, setActiveSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState([]);
    const [showOnlyDummy, setShowOnlyDummy] = useState(false);

    const { year, month, daysInMonth } = (() => {
        const [yearStr, monthStr] = selectedMonthYear.split('-');
        return getMonthDetails(parseInt(yearStr), parseInt(monthStr));
    })();

    const syncGlobalSession = useCallback(async () => {
        try {
            const configRef = doc(db, 'config', 'settings');
            const configSnap = await getDoc(configRef);
            if (configSnap.exists()) {
                const session = configSnap.data().activeSession;
                setActiveSession(session);
                return session;
            }
        } catch (err) {
            console.error("Session Sync Error:", err);
        }
        return null;
    }, []);

    const generateReport = useCallback(async () => {
        setLoading(true);
        const currentSession = await syncGlobalSession();
        
        if (!selectedClass || !currentSession) {
            setLoading(false);
            return;
        }

        try {
            // 1. Fetch Students
            const studentsRef = collection(db, 'sessions', currentSession, 'students');
            const studentSnapshot = await getDocs(studentsRef);
            
           const studentsList = studentSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(student => {
        const matchesClass = String(student.grade) === String(selectedClass);
        let matchesType = showOnlyDummy ? student.isDummy === true : (student.isDummy === false || student.isDummy === undefined);
        return matchesClass && matchesType;
    })
    // Updated Sort Logic for A-Z
    .sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
    });
            // 2. Fetch Attendance by generating Document IDs: {date}_{class}
            const dailyRecords = [];
            const attendancePromises = [];

            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const docId = `${dateStr}_${selectedClass}`;
                const docRef = doc(db, 'sessions', currentSession, 'attendance', docId);
                attendancePromises.push(getDoc(docRef));
            }

            const snapshots = await Promise.all(attendancePromises);
            
            snapshots.forEach((snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    // Local filter for dummy records if you have that field
                    const isRecordDummy = data.isDummyRecord === true;
                    if (showOnlyDummy ? isRecordDummy : !isRecordDummy) {
                        dailyRecords.push({
                            date: snap.id.split('_')[0], // Extract date from ID
                            records: data.records || {}
                        });
                    }
                }
            });

            // 3. Map Data to Students
            const studentMap = studentsList.reduce((acc, s) => {
                acc[s.id] = { 
                    ...s, 
                    attendanceDays: {}, 
                    summary: { P: 0, A: 0, L: 0 } 
                };
                return acc;
            }, {});

            dailyRecords.forEach(record => {
                const date = record.date;
                Object.entries(record.records).forEach(([sId, status]) => {
                    if (studentMap[sId]) {
                        const char = String(status).charAt(0).toUpperCase();
                        studentMap[sId].attendanceDays[date] = char;
                        if (['P', 'A', 'L'].includes(char)) {
                            studentMap[sId].summary[char]++;
                        }
                    }
                });
            });

            setReportData(Object.values(studentMap));
        } catch (error) {
            console.error("Report Generation Error:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedClass, selectedMonthYear, syncGlobalSession, showOnlyDummy, year, month, daysInMonth]);

    useEffect(() => {
        generateReport();
    }, [generateReport]);

    const renderStatus = (status) => {
        if (status === 'P') return <span className="text-emerald-500 font-black">P</span>;
        if (status === 'A') return <span className="text-rose-500 font-black">A</span>;
        if (status === 'L') return <span className="text-amber-500 font-black">L</span>;
        return <span className="text-slate-200">-</span>;
    };

    if (loading && !reportData.length) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#F4F7FE]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-400 font-black text-xs tracking-widest uppercase">Syncing Records...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F4F7FE] p-4 md:p-10 text-slate-800">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 no-print">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Monthly Report</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                Session: {activeSession || '...'}
                            </p>
                        </div>
                        {showOnlyDummy && (
                            <span className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Dummy Mode</span>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                    <button 
                        onClick={() => setShowOnlyDummy(!showOnlyDummy)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all font-black text-xs uppercase tracking-widest ${
                            showOnlyDummy 
                            ? 'bg-rose-500 border-rose-600 text-white' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-400'
                        }`}
                    >
                        <HiOutlineLightningBolt />
                        {showOnlyDummy ? 'Dummy' : 'Normal'}
                    </button>

                    <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                        <input 
                            type="month" 
                            value={selectedMonthYear} 
                            onChange={(e) => setSelectedMonthYear(e.target.value)}
                            className="bg-transparent font-black px-4 py-1 outline-none text-sm border-r border-slate-100"
                        />
                        <select 
                            value={selectedClass} 
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="bg-transparent font-black px-4 py-1 outline-none text-sm"
                        >
                            {MOCK_CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>
                        <button onClick={generateReport} className="px-3 text-slate-400 hover:text-indigo-600">
                            <HiRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    
                    <button onClick={() => window.print()} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition shadow-lg">
                        <HiPrinter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    {reportData.length === 0 ? (
                        <div className="py-20 text-center">
                            <HiUserGroup className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                            <p className="font-black text-slate-300 uppercase text-xs tracking-widest">
                                No {showOnlyDummy ? 'Dummy' : 'Normal'} Students Found
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-50 bg-slate-50/50">
                                    <th className="px-8 py-6 sticky left-0 bg-slate-50 z-20 min-w-[200px]">Student</th>
                                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                                        <th key={d} className="px-2 py-6 text-center w-10 border-r border-slate-100/30">{d}</th>
                                    ))}
                                    <th className="px-4 py-6 text-center bg-emerald-50 text-emerald-700">P</th>
                                    <th className="px-4 py-6 text-center bg-rose-50 text-rose-700">A</th>
                                    <th className="px-4 py-6 text-center bg-amber-50 text-amber-700">L</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {reportData.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50 transition group">
                                        <td className="px-8 py-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100">
                                            <p className="font-black text-slate-700 text-sm uppercase leading-tight">{student.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400">SR: {student.srNo || 'N/A'}</p>
                                        </td>
                                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                            const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                            return (
                                                <td key={day} className="px-1 py-4 text-center border-r border-slate-50/30">
                                                    {renderStatus(student.attendanceDays[dateKey])}
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-4 text-center font-black text-emerald-600 bg-emerald-50/30">{student.summary.P}</td>
                                        <td className="px-4 py-4 text-center font-black text-rose-600 bg-rose-50/30">{student.summary.A}</td>
                                        <td className="px-4 py-4 text-center font-black text-amber-600 bg-amber-50/30">{student.summary.L}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; }
                    .rounded-[2.5rem] { border-radius: 0 !important; border: none !important; box-shadow: none !important; }
                }
            `}</style>
        </div>
    );
}