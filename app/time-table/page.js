'use client';

import React, { useState, useEffect } from 'react';
import { HiSave, HiX, HiClock, HiCalendar, HiTrash, HiPrinter, HiBookOpen, HiPlus } from 'react-icons/hi';
import { doc, setDoc, collection, getDocs, getDoc, deleteDoc } from 'firebase/firestore'; 
import { db } from '../firebase/config'; 

function SchoolTimetableMatrixManager() {
    const [activeTab, setActiveTab] = useState('grid');
    const [activeSession, setActiveSession] = useState('2026-2027');
    const [classesList] = useState(['LKG', 'UKG', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
    
    const [periodsConfig] = useState([
        { period: 1, startTime: '08:00 AM', endTime: '08:45 AM' },
        { period: 2, startTime: '08:45 AM', endTime: '09:30 AM' },
        { period: 3, startTime: '09:30 AM', endTime: '10:15 AM' },
        { period: 4, startTime: '10:15 AM', endTime: '11:00 AM' },
        { type: 'BREAK', startTime: '11:00 AM', endTime: '11:10 AM' },
        { period: 5, startTime: '11:10 AM', endTime: '11:55 AM' },
        { period: 6, startTime: '11:55 AM', endTime: '12:25 PM' },
        { period: 7, startTime: '12:25 PM', endTime: '01:00 PM' },
        { period: 8, startTime: '01:00 PM', endTime: '01:40 PM' }
    ]);

    const [teachers, setTeachers] = useState([]);
    const [classSubjectsMap, setClassSubjectsMap] = useState({});
    const [savedTimetables, setSavedTimetables] = useState([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const [matrixData, setMatrixData] = useState({});

    // State for Assign Subjects Popup Modal
    const [isAssignSubjectsModalOpen, setIsAssignSubjectsModalOpen] = useState(false);
    const [selectedClassForSubjects, setSelectedClassForSubjects] = useState('1');
    const [tempAssignedSubjects, setTempAssignedSubjects] = useState([]);
    const [newSubjectInput, setNewSubjectInput] = useState('');

    const formatDisplayValue = (val) => {
        if (!val) return 'N/A';
        if (typeof val === 'string' || typeof val === 'number') return val;
        if (typeof val === 'object' && 'seconds' in val && 'nanoseconds' in val) {
            return new Date(val.seconds * 1000).toUTCString();
        }
        if (val instanceof Date) {
            return val.toUTCString();
        }
        if (typeof val === 'object') {
            return JSON.stringify(val);
        }
        return String(val);
    };

    const fetchSystemData = async () => {
        setIsLoading(true);
        try {
            let currentSession = '2026-2027';
            try {
                const settingsDocRef = doc(db, 'config', 'settings');
                const settingsSnap = await getDoc(settingsDocRef);
                if (settingsSnap.exists()) {
                    const settingsData = settingsSnap.data();
                    if (settingsData.activeSession) {
                        currentSession = settingsData.activeSession;
                        setActiveSession(currentSession);
                    }
                }
            } catch (err) {
                console.error("Error fetching active session from config/settings:", err);
            }

            const teachersSnap = await getDocs(collection(db, 'teachers'));
            const teacherList = teachersSnap.docs.map(docSnap => ({
                id: docSnap.id,
                name: docSnap.data().name || docSnap.id,
                employeeId: docSnap.data().employeeId || docSnap.id
            }));
            setTeachers(teacherList);

            const subjectsMap = {};
            for (const cls of classesList) {
                try {
                    const subDocRef = doc(db, 'sessions', currentSession, 'subjects', cls);
                    const subDocSnap = await getDoc(subDocRef);
                    if (subDocSnap.exists()) {
                        const data = subDocSnap.data();
                        if (Array.isArray(data.assignedSubjects)) {
                            subjectsMap[cls] = data.assignedSubjects;
                        } else {
                            subjectsMap[cls] = [];
                        }
                    } else {
                        subjectsMap[cls] = [];
                    }
                } catch (err) {
                    console.error(`Error fetching subjects for class ${cls}:`, err);
                    subjectsMap[cls] = [];
                }
            }
            setClassSubjectsMap(subjectsMap);

            const ttSnap = await getDocs(collection(db, 'timetables'));
            const ttList = ttSnap.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            }));
            setSavedTimetables(ttList);

        } catch (err) {
            console.error("Error loading system metadata:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSystemData();
    }, [classesList]);

    const initializeMatrix = () => {
        const initial = {};
        classesList.forEach(cls => {
            initial[cls] = {};
            periodsConfig.forEach((p) => {
                if (p.period) {
                    initial[cls][p.period] = { subject: '', teacherId: '' };
                }
            });
        });
        setMatrixData(initial);
    };

    useEffect(() => {
        initializeMatrix();
    }, [classesList, periodsConfig]);

    const handleCellChange = (className, periodNum, field, value) => {
        setMatrixData(prev => ({
            ...prev,
            [className]: {
                ...prev[className],
                [periodNum]: {
                    ...prev[className]?.[periodNum],
                    [field]: value
                }
            }
        }));
    };

    const handleOpenAssignModal = () => {
        setSelectedClassForSubjects(classesList[0]);
        setTempAssignedSubjects(classSubjectsMap[classesList[0]] || []);
        setNewSubjectInput('');
        setIsAssignSubjectsModalOpen(true);
    };

    const handleClassChangeInModal = (cls) => {
        setSelectedClassForSubjects(cls);
        setTempAssignedSubjects(classSubjectsMap[cls] || []);
        setNewSubjectInput('');
    };

    const handleAddSubjectTemp = () => {
        if (!newSubjectInput.trim()) return;
        if (tempAssignedSubjects.includes(newSubjectInput.trim())) return;
        setTempAssignedSubjects([...tempAssignedSubjects, newSubjectInput.trim()]);
        setNewSubjectInput('');
    };

    const handleRemoveSubjectTemp = (subToRemove) => {
        setTempAssignedSubjects(tempAssignedSubjects.filter(sub => sub !== subToRemove));
    };

    const handleSaveAssignedSubjects = async () => {
        setIsLoading(true);
        try {
            const subDocRef = doc(db, 'sessions', activeSession, 'subjects', selectedClassForSubjects);
            await setDoc(subDocRef, { assignedSubjects: tempAssignedSubjects }, { merge: true });

            setClassSubjectsMap(prev => ({
                ...prev,
                [selectedClassForSubjects]: tempAssignedSubjects
            }));

            setMessage({ type: 'success', text: `Subjects for Class ${selectedClassForSubjects} successfully updated!` });
            setIsAssignSubjectsModalOpen(false);
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error("Error saving assigned subjects:", error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveMasterTimetable = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const teacherSchedules = {};

            Object.keys(matrixData).forEach(className => {
                const classPeriods = matrixData[className];
                Object.keys(classPeriods).forEach(periodNum => {
                    const slot = classPeriods[periodNum];
                    if (slot.teacherId) {
                        if (!teacherSchedules[slot.teacherId]) {
                            teacherSchedules[slot.teacherId] = [];
                        }

                        const periodMeta = periodsConfig.find(p => p.period === Number(periodNum));

                        teacherSchedules[slot.teacherId].push({
                            period: Number(periodNum),
                            className: className,
                            subject: slot.subject || '',
                            startTime: periodMeta?.startTime || '',
                            endTime: periodMeta?.endTime || ''
                        });
                    }
                });
            });

            const teacherIds = Object.keys(teacherSchedules);
            if (teacherIds.length === 0) {
                setMessage({ type: 'error', text: 'Please assign at least one teacher in the matrix before saving.' });
                setIsLoading(false);
                return;
            }

            for (const teacherId of teacherIds) {
                const docRef = doc(db, 'timetables', teacherId);
                const teacherObj = teachers.find(t => t.id === teacherId);
                
                const dataToSave = {
                    teacherId: teacherId,
                    teacherName: teacherObj ? teacherObj.name : teacherId,
                    employeeId: teacherObj?.employeeId || teacherId,
                    session: activeSession,
                    lastUpdated: new Date(),
                    periods: teacherSchedules[teacherId]
                };
                await setDoc(docRef, dataToSave);
            }

            setMessage({ type: 'success', text: `Master timetable successfully split and saved across ${teacherIds.length} teachers!` });

            const ttSnap = await getDocs(collection(db, 'timetables'));
            setSavedTimetables(ttSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));

            setTimeout(() => {
                setActiveTab('grid');
                setMessage(null);
            }, 1500);

        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 bg-white rounded-3xl mt-10 shadow-2xl border border-slate-100 font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                <div>
                    <h2 className="text-3xl font-extrabold text-[#303972] flex items-center gap-3">
                        <div className="p-2.5 bg-purple-50 rounded-2xl text-purple-600 shadow-inner">
                            <HiCalendar size={28} />
                        </div>
                        School Master Timetable Manager
                    </h2>
                    <p className="text-sm font-medium text-slate-400 mt-1">
                        Active Session: <span className="font-bold text-purple-600">{formatDisplayValue(activeSession)}</span> | Master School Timetable Layout.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleOpenAssignModal}
                        className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                    >
                        <HiBookOpen size={16} /> Assign Subjects
                    </button>

                    <div className="flex bg-[#F8F9FD] p-1.5 rounded-2xl border border-slate-200/60">
                        <button
                            onClick={() => setActiveTab('grid')}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'grid' ? 'bg-[#303972] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            View Master Timetable
                        </button>
                        <button
                            onClick={() => { setActiveTab('create'); initializeMatrix(); }}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'create' ? 'bg-[#303972] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            + Master Matrix Grid Entry
                        </button>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`mb-8 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest border ${
                    message.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                    {formatDisplayValue(message.text)}
                </div>
            )}

            {/* TAB 1: VIEW MASTER TIMETABLE IN A SINGLE LAYOUT */}
            {activeTab === 'grid' && (
                <div className="space-y-8">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-[#303972] flex items-center gap-2">
                            <HiClock className="text-purple-600" /> Complete Master School Timetable
                        </h3>
                        <div className="flex items-center gap-3">
                            {savedTimetables.length > 0 && (
                                <button
                                    onClick={async () => {
                                        if (window.confirm("Are you sure you want to clear all saved timetables?")) {
                                            try {
                                                for (const t of savedTimetables) {
                                                    await deleteDoc(doc(db, 'timetables', t.id));
                                                }
                                                setSavedTimetables([]);
                                            } catch (err) {
                                                console.error("Error clearing timetables:", err);
                                            }
                                        }
                                    }}
                                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                                >
                                    <HiTrash size={16} /> Clear All Records
                                </button>
                            )}
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#303972] rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                            >
                                <HiPrinter size={16} /> Print Timetable
                            </button>
                        </div>
                    </div>

                    {savedTimetables.length === 0 ? (
                        <div className="text-center py-20 bg-[#F8F9FD] rounded-3xl border border-dashed border-slate-200">
                            <p className="text-sm font-medium text-slate-400">No master timetable generated yet. Use '+ Master Matrix Grid Entry' to create and save.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:shadow-none print:p-0">
                            <table className="w-full border-collapse text-xs border border-slate-300">
                                <thead>
                                    <tr className="bg-[#303972] text-white text-[10px] font-black uppercase tracking-wider">
                                        <th className="p-3 border border-slate-300 text-center">Classes / Time</th>
                                        {periodsConfig.map((p, idx) => (
                                            <th key={idx} className="p-3 border border-slate-300 text-center">
                                                {p.type === 'BREAK' ? (
                                                    <span className="text-amber-300">BREAK</span>
                                                ) : (
                                                    <div>
                                                        <div>PERIOD {p.period}</div>
                                                        <div className="text-[9px] font-normal text-slate-300 mt-0.5">{p.startTime} - {p.endTime}</div>
                                                    </div>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 text-[#303972]">
                                    {classesList.map((cls) => {
                                        const classPeriodsMap = {};
                                        savedTimetables.forEach(t => {
                                            const teacherObj = teachers.find(tr => tr.id === (t.teacherId || t.id));
                                            const resolvedTeacherName = t.teacherName || (teacherObj ? teacherObj.name : (t.teacherId || t.id));

                                            if (t.periods) {
                                                t.periods.forEach(p => {
                                                    if (p.className === cls) {
                                                        classPeriodsMap[p.period] = {
                                                            subject: p.subject,
                                                            teacherName: resolvedTeacherName
                                                        };
                                                    }
                                                });
                                            }
                                        });

                                        return (
                                            <tr key={cls} className="hover:bg-slate-50/50">
                                                <td className="p-4 font-black bg-[#F8F9FD] border border-slate-300 text-[#303972] text-center">
                                                    {cls}
                                                </td>
                                                {periodsConfig.map((p, idx) => {
                                                    if (p.type === 'BREAK') {
                                                        return (
                                                            <td key={idx} className="p-2 bg-slate-100 border border-slate-300 text-center font-bold text-slate-400 text-[10px] uppercase tracking-widest">
                                                                Break
                                                            </td>
                                                        );
                                                    }

                                                    const slotData = classPeriodsMap[p.period];

                                                    return (
                                                        <td key={idx} className="p-2.5 border border-slate-300 text-center min-w-[150px]">
                                                            {slotData && (slotData.subject || slotData.teacherName) ? (
                                                                <div className="space-y-1">
                                                                    <div className="font-extrabold text-indigo-900">{formatDisplayValue(slotData.subject) || '—'}</div>
                                                                    <div className="text-[10px] font-semibold text-slate-500 bg-slate-100 py-0.5 px-2 rounded-md inline-block">
                                                                        {formatDisplayValue(slotData.teacherName) || '—'}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-300 text-[11px]">—</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: MASTER MATRIX ENTRY */}
            {activeTab === 'create' && (
                <div className="bg-[#F8F9FD] p-6 md:p-8 rounded-3xl border border-slate-200/60">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-[#303972]">Master School Timetable Grid Editor</h3>
                            <p className="text-xs text-slate-400 mt-1">Subjects are dynamically loaded from session configurations.</p>
                        </div>
                        <button onClick={() => setActiveTab('grid')} className="text-slate-400 hover:text-slate-600">
                            <HiX size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSaveMasterTimetable} className="space-y-8">
                        <div className="overflow-x-auto bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <table className="w-full border-collapse text-xs border border-slate-300">
                                <thead>
                                    <tr className="bg-[#303972] text-white text-[10px] font-black uppercase tracking-wider">
                                        <th className="p-3 border border-slate-300 text-center">Classes / Time</th>
                                        {periodsConfig.map((p, idx) => (
                                            <th key={idx} className="p-3 border border-slate-300 text-center">
                                                {p.type === 'BREAK' ? (
                                                    <span className="text-amber-300">BREAK</span>
                                                ) : (
                                                    <div>
                                                        <div>PERIOD {p.period}</div>
                                                        <div className="text-[9px] font-normal text-slate-300 mt-0.5">{p.startTime} - {p.endTime}</div>
                                                    </div>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 text-[#303972]">
                                    {classesList.map((cls) => {
                                        const availableSubjects = classSubjectsMap[cls] || [];
                                        
                                        return (
                                            <tr key={cls} className="hover:bg-slate-50/50">
                                                <td className="p-4 font-black bg-[#F8F9FD] border border-slate-300 text-[#303972] text-center">
                                                    {cls}
                                                </td>
                                                {periodsConfig.map((p, idx) => {
                                                    if (p.type === 'BREAK') {
                                                        return (
                                                            <td key={idx} className="p-2 bg-slate-100 border border-slate-300 text-center font-bold text-slate-400 text-[10px] uppercase tracking-widest">
                                                                Break
                                                            </td>
                                                        );
                                                    }

                                                    const cellState = matrixData[cls]?.[p.period] || { subject: '', teacherId: '' };

                                                    return (
                                                        <td key={idx} className="p-2 border border-slate-300 space-y-2 min-w-[160px]">
                                                            <select
                                                                value={cellState.subject}
                                                                onChange={(e) => handleCellChange(cls, p.period, 'subject', e.target.value)}
                                                                className="w-full p-2 bg-[#F8F9FD] border border-slate-200 rounded-xl text-[11px] font-bold text-[#303972] outline-none"
                                                            >
                                                                <option value="">-- Select Subject --</option>
                                                                {availableSubjects.length > 0 ? (
                                                                    availableSubjects.map((sub, sIdx) => (
                                                                        <option key={sIdx} value={sub}>{formatDisplayValue(sub)}</option>
                                                                    ))
                                                                ) : (
                                                                    <option disabled value="">No subjects configured</option>
                                                                )}
                                                            </select>

                                                            <select
                                                                value={cellState.teacherId}
                                                                onChange={(e) => handleCellChange(cls, p.period, 'teacherId', e.target.value)}
                                                                className="w-full p-2 bg-[#F8F9FD] border border-slate-200 rounded-xl text-[11px] font-medium text-slate-600 outline-none"
                                                            >
                                                                <option value="">-- Select Teacher --</option>
                                                                {teachers.map((t) => (
                                                                    <option key={t.id} value={t.id}>{formatDisplayValue(t.name)}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setActiveTab('grid')}
                                className="px-6 py-3 text-xs font-bold text-slate-400 hover:text-slate-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-purple-100 flex items-center gap-2 transition-all"
                            >
                                <HiSave size={16} /> {isLoading ? 'Processing & Saving...' : 'Save & Split Staff Timetables'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ASSIGN SUBJECTS POPUP MODAL */}
            {isAssignSubjectsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-bold text-[#303972] flex items-center gap-2">
                                    <HiBookOpen className="text-purple-600" /> Manage & Assign Class Subjects
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">Configure active subjects for individual classes.</p>
                            </div>
                            <button 
                                onClick={() => setIsAssignSubjectsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all"
                            >
                                <HiX size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#303972] uppercase tracking-wider mb-2">Select Class</label>
                                <select
                                    value={selectedClassForSubjects}
                                    onChange={(e) => handleClassChangeInModal(e.target.value)}
                                    className="w-full p-3 bg-[#F8F9FD] border border-slate-200 rounded-2xl text-xs font-bold text-[#303972] outline-none"
                                >
                                    {classesList.map((cls) => (
                                        <option key={cls} value={cls}>Class {cls}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#303972] uppercase tracking-wider mb-2">Add New Subject</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="e.g. Mathematics, Physics..."
                                        value={newSubjectInput}
                                        onChange={(e) => setNewSubjectInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubjectTemp(); } }}
                                        className="flex-1 p-3 bg-[#F8F9FD] border border-slate-200 rounded-2xl text-xs font-medium text-[#303972] outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddSubjectTemp}
                                        className="px-5 py-3 bg-[#303972] hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                                    >
                                        <HiPlus size={16} /> Add
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#303972] uppercase tracking-wider mb-2">
                                    Assigned Subjects for Class {selectedClassForSubjects} ({tempAssignedSubjects.length})
                                </label>
                                <div className="max-h-48 overflow-y-auto p-3 bg-[#F8F9FD] border border-slate-200 rounded-2xl space-y-2">
                                    {tempAssignedSubjects.length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center py-4">No subjects assigned yet. Add one above.</p>
                                    ) : (
                                        tempAssignedSubjects.map((sub, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                                                <span className="text-xs font-bold text-[#303972]">{formatDisplayValue(sub)}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSubjectTemp(sub)}
                                                    className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-all"
                                                >
                                                    <HiTrash size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsAssignSubjectsModalOpen(false)}
                                className="px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={handleSaveAssignedSubjects}
                                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-100 flex items-center gap-2 transition-all"
                            >
                                <HiSave size={16} /> {isLoading ? 'Saving...' : 'Save Subjects'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SchoolTimetableMatrixManager;