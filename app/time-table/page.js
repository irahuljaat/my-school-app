'use client';

import React, { useState, useEffect } from 'react';
import { HiSave, HiX, HiClock, HiCalendar, HiTrash, HiPrinter, HiBookOpen, HiPlus, HiCog, HiOfficeBuilding } from 'react-icons/hi';
import { doc, setDoc, collection, getDocs, getDoc, deleteDoc } from 'firebase/firestore'; 
import { db } from '../firebase/config'; 

export default function SchoolTimetableMatrixManager() {
    const [activeTab, setActiveTab] = useState('grid');
    const [activeSession, setActiveSession] = useState('2026-2027');
    const [schoolName, setSchoolName] = useState('MVG Public Sr. Sec. School');
    const [schoolLogo, setSchoolLogo] = useState(null);
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

    // --- AUTO-GENERATOR STATE ---
    const [teacherConfigs, setTeacherConfigs] = useState({});
    const [selectedConfigTeacher, setSelectedConfigTeacher] = useState('');
    const [assignClass, setAssignClass] = useState('');
    const [assignSubject, setAssignSubject] = useState('');

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
        if (val instanceof Date) return val.toUTCString();
        if (typeof val === 'object') return JSON.stringify(val);
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
                    const data = settingsSnap.data();
                    if (data.activeSession) {
                        currentSession = data.activeSession;
                        setActiveSession(currentSession);
                    }
                    if (data.schoolName) setSchoolName(data.schoolName);
                    if (data.schoolLogo) setSchoolLogo(data.schoolLogo);
                }
            } catch (err) {
                console.error("Error fetching system settings:", err);
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
                    if (subDocSnap.exists() && Array.isArray(subDocSnap.data().assignedSubjects)) {
                        subjectsMap[cls] = subDocSnap.data().assignedSubjects;
                    } else {
                        subjectsMap[cls] = [];
                    }
                } catch (err) {
                    subjectsMap[cls] = [];
                }
            }
            setClassSubjectsMap(subjectsMap);

            const ttSnap = await getDocs(collection(db, 'timetables'));
            setSavedTimetables(ttSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));

        } catch (err) {
            console.error("Error loading system metadata:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSystemData();
    }, [classesList]);

    useEffect(() => {
        if (teachers.length > 0) {
            setTeacherConfigs(prev => {
                const newConfigs = { ...prev };
                teachers.forEach(t => {
                    if (!newConfigs[t.id]) {
                        newConfigs[t.id] = {
                            inPeriod: periodsConfig.find(p => p.period)?.period || 1,
                            outPeriod: [...periodsConfig].reverse().find(p => p.period)?.period || 8,
                            assignments: []
                        };
                    }
                });
                return newConfigs;
            });
        }
    }, [teachers, periodsConfig]);

    const initializeMatrix = () => {
        const initial = {};
        classesList.forEach(cls => {
            initial[cls] = {};
            periodsConfig.forEach((p) => {
                if (p.period) initial[cls][p.period] = { subject: '', teacherId: '' };
            });
        });
        setMatrixData(initial);
    };

    useEffect(() => {
        initializeMatrix();
    }, [classesList, periodsConfig]);

    const updateTeacherConfig = (teacherId, field, value) => {
        setTeacherConfigs(prev => ({
            ...prev,
            [teacherId]: { ...prev[teacherId], [field]: value }
        }));
    };

    const handleAddAssignment = () => {
        if (!assignClass || !assignSubject) return;
        setTeacherConfigs(prev => ({
            ...prev,
            [selectedConfigTeacher]: {
                ...prev[selectedConfigTeacher],
                assignments: [
                    ...prev[selectedConfigTeacher].assignments,
                    { className: assignClass, subject: assignSubject, id: Date.now().toString() }
                ]
            }
        }));
        setAssignSubject(''); 
    };

    const handleRemoveAssignment = (teacherId, assignmentId) => {
        setTeacherConfigs(prev => ({
            ...prev,
            [teacherId]: {
                ...prev[teacherId],
                assignments: prev[teacherId].assignments.filter(a => a.id !== assignmentId)
            }
        }));
    };

    const handleAutoGenerate = () => {
        setIsLoading(true);
        setMessage(null);

        setTimeout(() => {
            const newMatrix = {};
            classesList.forEach(cls => {
                newMatrix[cls] = {};
                periodsConfig.forEach((p) => {
                    if (p.period) newMatrix[cls][p.period] = { subject: '', teacherId: '' };
                });
            });

            let reqs = [];
            Object.keys(teacherConfigs).forEach(tId => {
                const config = teacherConfigs[tId];
                config.assignments.forEach(a => {
                    reqs.push({ 
                        teacherId: tId, 
                        className: a.className, 
                        subject: a.subject, 
                        in: parseInt(config.inPeriod), 
                        out: parseInt(config.outPeriod) 
                    });
                });
            });

            reqs.sort((a, b) => (a.out - a.in) - (b.out - b.in));

            const solve = (reqIndex, currentMatrix) => {
                if (reqIndex >= reqs.length) return true; 
                
                let req = reqs[reqIndex];
                let validPeriods = periodsConfig.filter(p => p.period && p.period >= req.in && p.period <= req.out);
                
                validPeriods.sort(() => Math.random() - 0.5);

                for (let p of validPeriods) {
                    let period = p.period;
                    
                    if (currentMatrix[req.className][period].teacherId !== '') continue;
                    
                    let teacherConflict = false;
                    for (let c of classesList) {
                        if (currentMatrix[c][period].teacherId === req.teacherId) {
                            teacherConflict = true;
                            break;
                        }
                    }
                    if (teacherConflict) continue;

                    currentMatrix[req.className][period] = { subject: req.subject, teacherId: req.teacherId };
                    
                    if (solve(reqIndex + 1, currentMatrix)) return true;

                    currentMatrix[req.className][period] = { subject: '', teacherId: '' };
                }
                return false; 
            };

            const success = solve(0, newMatrix);
            
            if (success) {
                setMatrixData(newMatrix);
                setMessage({ type: 'success', text: 'Timetable mapped successfully! Review and save below.' });
            } else {
                setMessage({ type: 'error', text: 'Conflict detected! Adjust teacher availability or reduce overlaps.' });
            }
            setIsLoading(false);
        }, 50);
    };

    const handleCellChange = (className, periodNum, field, value) => {
        setMatrixData(prev => ({
            ...prev,
            [className]: {
                ...prev[className],
                [periodNum]: { ...prev[className]?.[periodNum], [field]: value }
            }
        }));
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
                        if (!teacherSchedules[slot.teacherId]) teacherSchedules[slot.teacherId] = [];

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
                setMessage({ type: 'error', text: 'Please assign at least one teacher before saving.' });
                setIsLoading(false);
                return;
            }

            for (const teacherId of teacherIds) {
                const docRef = doc(db, 'timetables', teacherId);
                const teacherObj = teachers.find(t => t.id === teacherId);
                
                await setDoc(docRef, {
                    teacherId: teacherId,
                    teacherName: teacherObj ? teacherObj.name : teacherId,
                    employeeId: teacherObj?.employeeId || teacherId,
                    session: activeSession,
                    lastUpdated: new Date(),
                    periods: teacherSchedules[teacherId]
                });
            }

            setMessage({ type: 'success', text: `Timetable saved successfully across ${teacherIds.length} staff members!` });

            const ttSnap = await getDocs(collection(db, 'timetables'));
            setSavedTimetables(ttSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));

            setTimeout(() => { setActiveTab('grid'); setMessage(null); }, 1500);

        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenAssignModal = () => {
        setSelectedClassForSubjects(classesList[0]);
        setTempAssignedSubjects(classSubjectsMap[classesList[0]] || []);
        setNewSubjectInput('');
        setIsAssignSubjectsModalOpen(true);
    };

    const handleSaveAssignedSubjects = async () => {
        setIsLoading(true);
        try {
            const subDocRef = doc(db, 'sessions', activeSession, 'subjects', selectedClassForSubjects);
            await setDoc(subDocRef, { assignedSubjects: tempAssignedSubjects }, { merge: true });

            setClassSubjectsMap(prev => ({ ...prev, [selectedClassForSubjects]: tempAssignedSubjects }));
            setMessage({ type: 'success', text: `Subjects for Class ${selectedClassForSubjects} updated!` });
            setIsAssignSubjectsModalOpen(false);
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 bg-white rounded-3xl mt-10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 font-sans">
            
            {/* BRANDED HEADER AREA DYNAMICALLY LINKED TO FIREBASE CONFIG */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b-2 border-slate-100">
                <div className="flex items-center gap-5">
                    {schoolLogo ? (
                        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-slate-100 bg-white flex items-center justify-center">
                            <img src={schoolLogo} alt={`${schoolName} Logo`} className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-[#303972] to-indigo-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg border border-indigo-900/50">
                            <HiOfficeBuilding size={32} className="text-white/90" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-[#303972] uppercase tracking-widest leading-tight">
                            {schoolName}
                        </h1>
                        <p className="text-sm font-bold text-slate-400 mt-1 flex items-center gap-2 tracking-wide">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Active Session: <span className="text-[#303972]">{formatDisplayValue(activeSession)}</span> 
                            <span className="text-slate-300">|</span> Administrative Portal
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleOpenAssignModal}
                        className="px-5 py-3 bg-[#F8F9FD] hover:bg-slate-100 text-[#303972] border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
                    >
                        <HiBookOpen size={18} className="text-indigo-600" /> Subjects Map
                    </button>

                    <div className="flex bg-[#F8F9FD] p-1.5 rounded-2xl border border-slate-200">
                        <button
                            onClick={() => setActiveTab('grid')}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'grid' ? 'bg-[#303972] text-white shadow-md' : 'text-slate-400 hover:text-[#303972]'}`}
                        >
                            Master Grid
                        </button>
                        <button
                            onClick={() => { setActiveTab('create'); initializeMatrix(); }}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'create' ? 'bg-[#303972] text-white shadow-md' : 'text-slate-400 hover:text-[#303972]'}`}
                        >
                            <HiCog size={16}/> Auto Generator
                        </button>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`mb-8 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest border ${
                    message.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                    {formatDisplayValue(message.text)}
                </div>
            )}

            {/* TAB 1: VIEW SAVED TIMETABLE */}
            {activeTab === 'grid' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black text-[#303972] flex items-center gap-3 uppercase tracking-wider">
                            <HiCalendar className="text-indigo-600" size={24} /> Official Master Timetable
                        </h3>
                        <div className="flex items-center gap-3">
                            {savedTimetables.length > 0 && (
                                <button
                                    onClick={async () => {
                                        if (window.confirm("Are you sure you want to clear all saved timetables?")) {
                                            for (const t of savedTimetables) {
                                                await deleteDoc(doc(db, 'timetables', t.id));
                                            }
                                            setSavedTimetables([]);
                                        }
                                    }}
                                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                                >
                                    <HiTrash size={16} /> Clear All
                                </button>
                            )}
                            <button
                                onClick={() => window.print()}
                                className="px-5 py-2.5 bg-[#303972] hover:bg-indigo-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md"
                            >
                                <HiPrinter size={16} /> Print Layout
                            </button>
                        </div>
                    </div>

                    {savedTimetables.length === 0 ? (
                        <div className="text-center py-24 bg-[#F8F9FD] rounded-3xl border-2 border-dashed border-slate-200">
                            <HiCalendar className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No active timetable. Use the Auto Generator.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto bg-white p-6 rounded-3xl shadow-sm border border-slate-200 print:shadow-none print:p-0 print:border-none">
                            <table className="w-full border-collapse text-xs border-2 border-[#303972]">
                                <thead>
                                    <tr className="bg-[#303972] text-white text-[10px] font-black uppercase tracking-wider">
                                        <th className="p-4 border border-[#303972]/20 text-center w-24">Class</th>
                                        {periodsConfig.map((p, idx) => (
                                            <th key={idx} className="p-3 border border-[#303972]/20 text-center">
                                                {p.type === 'BREAK' ? (
                                                    <span className="text-amber-300 tracking-widest">BREAK</span>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div className="text-[11px]">PERIOD {p.period}</div>
                                                        <div className="text-[9px] font-medium text-indigo-200">{p.startTime} - {p.endTime}</div>
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
                                                        classPeriodsMap[p.period] = { subject: p.subject, teacherName: resolvedTeacherName };
                                                    }
                                                });
                                            }
                                        });

                                        return (
                                            <tr key={cls} className="hover:bg-indigo-50/30 transition-colors">
                                                <td className="p-4 font-black bg-[#F8F9FD] border border-slate-200 text-[#303972] text-center text-sm shadow-[inset_-4px_0_10px_rgba(0,0,0,0.02)]">
                                                    {cls}
                                                </td>
                                                {periodsConfig.map((p, idx) => {
                                                    if (p.type === 'BREAK') return <td key={idx} className="p-2 bg-slate-50 border border-slate-200 text-center font-black text-slate-300 text-[10px] uppercase tracking-widest shadow-[inset_0_4px_10px_rgba(0,0,0,0.02)]">Break</td>;
                                                    
                                                    const slotData = classPeriodsMap[p.period];
                                                    return (
                                                        <td key={idx} className="p-3 border border-slate-200 text-center min-w-[150px]">
                                                            {slotData && (slotData.subject || slotData.teacherName) ? (
                                                                <div className="space-y-1.5">
                                                                    <div className="font-black text-[#303972] uppercase tracking-wide">{formatDisplayValue(slotData.subject) || '—'}</div>
                                                                    <div className="text-[10px] font-bold text-indigo-700 bg-indigo-50 py-1 px-2.5 rounded-lg inline-block border border-indigo-100">
                                                                        {formatDisplayValue(slotData.teacherName) || '—'}
                                                                    </div>
                                                                </div>
                                                            ) : <span className="text-slate-200 font-bold text-[11px]">—</span>}
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

            {/* TAB 2: WIZARD AUTO GENERATOR & EDITOR */}
            {activeTab === 'create' && (
                <div className="bg-[#F8F9FD] p-6 md:p-8 rounded-3xl border border-slate-200 space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                    
                    {/* SECTION 1: TEACHER CONFIGURATION WIZARD */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
                        <h4 className="text-sm font-black text-[#303972] mb-6 uppercase tracking-widest flex items-center gap-3">
                            <span className="bg-[#303972] text-white w-8 h-8 flex items-center justify-center rounded-xl shadow-md">1</span>
                            Staff Constraints & Workload Matrix
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Left: Teacher List */}
                            <div className="md:col-span-1 border-r border-slate-100 pr-6">
                                <label className="block text-xs font-black text-slate-400 mb-4 uppercase tracking-wider">Select Faculty Member</label>
                                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                    {teachers.map(t => {
                                        const assignCount = teacherConfigs[t.id]?.assignments?.length || 0;
                                        return (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setSelectedConfigTeacher(t.id)}
                                                className={`w-full text-left p-3.5 rounded-xl text-xs font-bold transition-all border-2 ${selectedConfigTeacher === t.id ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm' : 'bg-white border-slate-100 text-[#303972] hover:border-slate-300'}`}
                                            >
                                                {t.name}
                                                <span className="float-right text-[10px] bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 shadow-sm font-black">{assignCount} hrs</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right: Configuration Panel */}
                            <div className="md:col-span-2">
                                {!selectedConfigTeacher ? (
                                    <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold border-2 border-dashed border-slate-200 rounded-3xl p-8 bg-slate-50 text-center uppercase tracking-widest">
                                        Select a faculty member <br/> to configure their availability.
                                    </div>
                                ) : (
                                    <div className="space-y-8 animate-in fade-in duration-200">
                                        
                                        {/* In & Out Bounds */}
                                        <div className="flex flex-col sm:flex-row gap-5 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><HiClock className="text-indigo-600"/> Clock In (Start)</label>
                                                <select
                                                    value={teacherConfigs[selectedConfigTeacher]?.inPeriod || 1}
                                                    onChange={(e) => updateTeacherConfig(selectedConfigTeacher, 'inPeriod', e.target.value)}
                                                    className="w-full p-3.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-[#303972] outline-none shadow-sm focus:border-indigo-600 transition-colors"
                                                >
                                                    {periodsConfig.filter(p => p.period).map(p => <option key={p.period} value={p.period}>Period {p.period} ({p.startTime})</option>)}
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><HiClock className="text-indigo-600"/> Clock Out (End)</label>
                                                <select
                                                    value={teacherConfigs[selectedConfigTeacher]?.outPeriod || 8}
                                                    onChange={(e) => updateTeacherConfig(selectedConfigTeacher, 'outPeriod', e.target.value)}
                                                    className="w-full p-3.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-[#303972] outline-none shadow-sm focus:border-indigo-600 transition-colors"
                                                >
                                                    {periodsConfig.filter(p => p.period).map(p => <option key={p.period} value={p.period}>Period {p.period} ({p.endTime})</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Multi-Select Assignment Form */}
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Assign Duties (1 Entry = 1 Period Slot)</label>
                                            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                                <select 
                                                    value={assignClass} 
                                                    onChange={e => { setAssignClass(e.target.value); setAssignSubject(''); }}
                                                    className="flex-1 p-3.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-[#303972] outline-none focus:border-indigo-600 transition-colors"
                                                >
                                                    <option value="">Select Class...</option>
                                                    {classesList.map(c => <option key={c} value={c}>Class {c}</option>)}
                                                </select>
                                                <select 
                                                    value={assignSubject} 
                                                    onChange={e => setAssignSubject(e.target.value)}
                                                    disabled={!assignClass}
                                                    className="flex-1 p-3.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-[#303972] outline-none disabled:opacity-50 focus:border-indigo-600 transition-colors"
                                                >
                                                    <option value="">Select Subject...</option>
                                                    {(classSubjectsMap[assignClass] || []).map((s, idx) => <option key={idx} value={s}>{s}</option>)}
                                                </select>
                                                <button 
                                                    type="button"
                                                    onClick={handleAddAssignment}
                                                    disabled={!assignClass || !assignSubject}
                                                    className="px-8 bg-[#303972] text-white rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50 hover:bg-indigo-900 transition-all shadow-md active:scale-95 py-3.5 sm:py-0"
                                                >
                                                    Add Layer
                                                </button>
                                            </div>

                                            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                {teacherConfigs[selectedConfigTeacher]?.assignments?.length === 0 ? (
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 p-4 rounded-xl text-center border-2 border-dashed border-slate-200">
                                                        No duties added for this faculty member.
                                                    </p>
                                                ) : (
                                                    teacherConfigs[selectedConfigTeacher]?.assignments?.map((a, i) => (
                                                        <div key={a.id} className="flex justify-between items-center p-3.5 bg-white border-2 border-slate-100 rounded-xl shadow-sm group hover:border-indigo-100 transition-colors">
                                                            <div className="flex items-center gap-4">
                                                                <span className="w-6 h-6 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                                                                <span className="text-xs font-black text-[#303972] uppercase tracking-wide">Class {a.className} <span className="text-slate-300 mx-2">|</span> <span className="text-indigo-600">{a.subject}</span></span>
                                                            </div>
                                                            <button type="button" onClick={() => handleRemoveAssignment(selectedConfigTeacher, a.id)} className="text-rose-400 hover:text-white hover:bg-rose-500 p-2 rounded-lg transition-all">
                                                                <HiTrash size={16} />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-10 pt-8 flex justify-end border-t-2 border-slate-100">
                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={handleAutoGenerate}
                                className="px-8 py-4 bg-[#303972] hover:bg-indigo-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-900/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                            >
                                <HiCog size={20} className={isLoading ? "animate-spin" : ""} /> 
                                {isLoading ? 'Processing Algorithm...' : 'Run Auto-Generator Engine'}
                            </button>
                        </div>
                    </div>

                    {/* SECTION 2: GRID PREVIEW & MANUAL EDIT */}
                    <form onSubmit={handleSaveMasterTimetable} className="space-y-6">
                        <h4 className="text-sm font-black text-[#303972] flex items-center gap-3 uppercase tracking-widest mb-6">
                            <span className="bg-[#303972] text-white w-8 h-8 flex items-center justify-center rounded-xl shadow-md">2</span>
                            Review, Adjust & Distribute Data
                        </h4>

                        <div className="overflow-x-auto bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                            <table className="w-full border-collapse text-xs border-2 border-[#303972]">
                                <thead>
                                    <tr className="bg-[#303972] text-white text-[10px] font-black uppercase tracking-wider">
                                        <th className="p-4 border border-[#303972]/20 text-center w-24">Class</th>
                                        {periodsConfig.map((p, idx) => (
                                            <th key={idx} className="p-3 border border-[#303972]/20 text-center">
                                                {p.type === 'BREAK' ? (
                                                    <span className="text-amber-300 tracking-widest">BREAK</span>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div className="text-[11px]">PERIOD {p.period}</div>
                                                        <div className="text-[9px] font-medium text-indigo-200">{p.startTime} - {p.endTime}</div>
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
                                            <tr key={cls} className="hover:bg-indigo-50/30 transition-colors">
                                                <td className="p-4 font-black bg-[#F8F9FD] border border-slate-200 text-[#303972] text-center text-sm shadow-[inset_-4px_0_10px_rgba(0,0,0,0.02)]">{cls}</td>
                                                {periodsConfig.map((p, idx) => {
                                                    if (p.type === 'BREAK') return <td key={idx} className="p-2 bg-slate-50 border border-slate-200 text-center font-black text-slate-300 text-[10px] uppercase tracking-widest shadow-[inset_0_4px_10px_rgba(0,0,0,0.02)]">Break</td>;
                                                    
                                                    const cellState = matrixData[cls]?.[p.period] || { subject: '', teacherId: '' };

                                                    return (
                                                        <td key={idx} className="p-3 border border-slate-200 space-y-2.5 min-w-[170px]">
                                                            <select
                                                                value={cellState.subject}
                                                                onChange={(e) => handleCellChange(cls, p.period, 'subject', e.target.value)}
                                                                className={`w-full p-2.5 border-2 ${cellState.subject ? 'border-indigo-300 bg-indigo-50/50 text-indigo-900' : 'border-slate-200 bg-[#F8F9FD] text-slate-500'} rounded-xl text-[11px] font-black uppercase tracking-wide outline-none transition-colors focus:border-indigo-600`}
                                                            >
                                                                <option value="">- Subject -</option>
                                                                {availableSubjects.map((sub, sIdx) => <option key={sIdx} value={sub}>{formatDisplayValue(sub)}</option>)}
                                                            </select>

                                                            <select
                                                                value={cellState.teacherId}
                                                                onChange={(e) => handleCellChange(cls, p.period, 'teacherId', e.target.value)}
                                                                className={`w-full p-2.5 border-2 ${cellState.teacherId ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900' : 'border-slate-200 bg-[#F8F9FD] text-slate-500'} rounded-xl text-[11px] font-bold outline-none transition-colors focus:border-emerald-600`}
                                                            >
                                                                <option value="">- Teacher -</option>
                                                                {teachers.map((t) => <option key={t.id} value={t.id}>{formatDisplayValue(t.name)}</option>)}
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

                        <div className="flex justify-end gap-4 pt-6">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[11px] font-black tracking-widest uppercase shadow-xl shadow-emerald-600/20 flex items-center gap-3 transition-all active:scale-95"
                            >
                                <HiSave size={20} /> {isLoading ? 'Processing...' : 'Save & Publish to Portals'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ASSIGN SUBJECTS MODAL */}
            {isAssignSubjectsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#303972]/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full p-8 space-y-8 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center pb-5 border-b-2 border-slate-100">
                            <div>
                                <h3 className="text-xl font-black text-[#303972] flex items-center gap-3 uppercase tracking-wider">
                                    <HiBookOpen className="text-indigo-600" size={24} /> Subject Mapping
                                </h3>
                            </div>
                            <button onClick={() => setIsAssignSubjectsModalOpen(false)} className="text-slate-400 hover:text-[#303972] p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                <HiX size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[11px] font-black text-[#303972] uppercase tracking-widest mb-3">Target Class</label>
                                <select
                                    value={selectedClassForSubjects}
                                    onChange={(e) => {
                                        setSelectedClassForSubjects(e.target.value);
                                        setTempAssignedSubjects(classSubjectsMap[e.target.value] || []);
                                        setNewSubjectInput('');
                                    }}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-bold text-[#303972] outline-none focus:border-indigo-600 transition-colors"
                                >
                                    {classesList.map((cls) => <option key={cls} value={cls}>Class {cls}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-[#303972] uppercase tracking-widest mb-3">Add Subject Record</label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="e.g. Mathematics"
                                        value={newSubjectInput}
                                        onChange={(e) => setNewSubjectInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if(newSubjectInput.trim() && !tempAssignedSubjects.includes(newSubjectInput.trim())) setTempAssignedSubjects([...tempAssignedSubjects, newSubjectInput.trim()]); setNewSubjectInput(''); } }}
                                        className="flex-1 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-bold text-[#303972] outline-none focus:border-indigo-600 transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { if(newSubjectInput.trim() && !tempAssignedSubjects.includes(newSubjectInput.trim())) setTempAssignedSubjects([...tempAssignedSubjects, newSubjectInput.trim()]); setNewSubjectInput(''); }}
                                        className="px-6 bg-[#303972] hover:bg-indigo-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95"
                                    >
                                        <HiPlus size={18} /> Add
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-[#303972] uppercase tracking-widest mb-3">Active Dictionary</label>
                                <div className="max-h-56 overflow-y-auto p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3 custom-scrollbar">
                                    {tempAssignedSubjects.length === 0 ? (
                                        <p className="text-[11px] font-bold text-slate-400 text-center py-6 uppercase tracking-widest">No subjects recorded.</p>
                                    ) : (
                                        tempAssignedSubjects.map((sub, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-white p-3.5 rounded-xl border-2 border-slate-100 shadow-sm">
                                                <span className="text-xs font-black text-[#303972] uppercase tracking-wide">{formatDisplayValue(sub)}</span>
                                                <button type="button" onClick={() => setTempAssignedSubjects(tempAssignedSubjects.filter(s => s !== sub))} className="text-rose-400 hover:text-white p-1.5 rounded-lg hover:bg-rose-500 transition-colors">
                                                    <HiTrash size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-6 border-t-2 border-slate-100">
                            <button type="button" onClick={() => setIsAssignSubjectsModalOpen(false)} className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-[#303972] uppercase tracking-wider">Cancel</button>
                            <button type="button" disabled={isLoading} onClick={handleSaveAssignedSubjects} className="px-8 py-3 bg-[#303972] hover:bg-indigo-900 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all active:scale-95">
                                <HiSave size={18} /> Save Registry
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}