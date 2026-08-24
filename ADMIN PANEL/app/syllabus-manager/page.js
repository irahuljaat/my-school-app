'use client';

import React, { useState, useEffect } from 'react';
import { HiSave, HiX, HiBookOpen, HiCheckCircle, HiClock, HiExclamationCircle, HiPlus, HiTrash, HiChartPie } from 'react-icons/hi';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useColors } from '../components/ColorComponent';

function SyllabusManager() {
    const colors = useColors();
    const [activeTab, setActiveTab] = useState('view');
    const [activeSession, setActiveSession] = useState('2026-27');
    const [classesList] = useState(['LKG', 'UKG', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
    
    const [classSubjectsMap, setClassSubjectsMap] = useState({});
    const [allSyllabi, setAllSyllabi] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Filter states for View Tab
    const [selectedViewClass, setSelectedViewClass] = useState('10');

    // Form states for Add/Edit Tab
    const [formClass, setFormClass] = useState('10');
    const [formSubject, setFormSubject] = useState('');
    const [chaptersList, setChaptersList] = useState([
        { chapterNo: 1, title: '', status: 'Not Started', teacherNotes: '' }
    ]);

    const formatDisplayValue = (val) => {
        if (!val) return 'N/A';
        if (typeof val === 'string' || typeof val === 'number') return val;
        if (typeof val === 'object' && 'seconds' in val && 'nanoseconds' in val) {
            return new Date(val.seconds * 1000).toUTCString();
        }
        return String(val);
    };

    // Fetch active session, subjects, and existing syllabi
    useEffect(() => {
        const fetchSystemData = async () => {
            setIsLoading(true);
            try {
                let currentSession = '2026-27';
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
                    console.error("Error fetching active session:", err);
                }

                // Fetch assigned subjects per class
                const subjectsMap = {};
                for (const cls of classesList) {
                    try {
                        const subDocRef = doc(db, 'sessions', currentSession, 'subjects', cls);
                        const subDocSnap = await getDoc(subDocRef);
                        if (subDocSnap.exists()) {
                            const data = subDocSnap.data();
                            subjectsMap[cls] = Array.isArray(data.assignedSubjects) ? data.assignedSubjects : [];
                        } else {
                            subjectsMap[cls] = [];
                        }
                    } catch (err) {
                        console.error(`Error fetching subjects for class ${cls}:`, err);
                        subjectsMap[cls] = [];
                    }
                }
                setClassSubjectsMap(subjectsMap);

                // Initialize default form subject if available for class '10'
                const defaultClassSubjects = subjectsMap['10'] || [];
                if (defaultClassSubjects.length > 0 && !formSubject) {
                    setFormSubject(defaultClassSubjects[0]);
                }

                // Fetch all syllabus documents from sessions/{activeSession}/syllabus
                const syllabusCollectionRef = collection(db, 'sessions', currentSession, 'syllabus');
                const syllabusSnap = await getDocs(syllabusCollectionRef);
                const syllabiData = {};
                syllabusSnap.docs.forEach(docSnap => {
                    syllabiData[docSnap.id] = docSnap.data();
                });
                setAllSyllabi(syllabiData);

            } catch (err) {
                console.error("Error loading syllabus manager data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSystemData();
    }, [classesList]);

    // Handle adding a new chapter row in the editor
    const handleAddChapterRow = () => {
        setChaptersList(prev => [
            ...prev,
            { chapterNo: prev.length + 1, title: '', status: 'Not Started', teacherNotes: '' }
        ]);
    };

    const handleChapterChange = (index, field, value) => {
        setChaptersList(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleRemoveChapterRow = (index) => {
        if (chaptersList.length === 1) return;
        const updated = chaptersList.filter((_, idx) => idx !== index);
        const reindexed = updated.map((ch, idx) => ({ ...ch, chapterNo: idx + 1 }));
        setChaptersList(reindexed);
    };

    // Load existing syllabus into editor if class & subject selected
    const handleLoadExistingForEdit = (cls, sub) => {
        setFormClass(cls);
        setFormSubject(sub);
        const docKey = `${cls}_${sub}`;
        if (allSyllabi[docKey] && Array.isArray(allSyllabi[docKey].chapters) && allSyllabi[docKey].chapters.length > 0) {
            setChaptersList(allSyllabi[docKey].chapters.map(ch => ({ ...ch })));
        } else {
            setChaptersList([{ chapterNo: 1, title: '', status: 'Not Started', teacherNotes: '' }]);
        }
    };

    // Save syllabus to sessions/{activeSession}/syllabus/{class}_{subject}
    const handleSaveSyllabus = async (e) => {
        e.preventDefault();
        if (!formClass || !formSubject) {
            setMessage({ type: 'error', text: 'Please select both class and subject.' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            const docKey = `${formClass}_${formSubject}`;
            const docRef = doc(db, 'sessions', activeSession, 'syllabus', docKey);

            const payload = {
                class: formClass,
                subject: formSubject,
                chapters: chaptersList,
                lastUpdated: new Date()
            };

            await setDoc(docRef, payload);

            setAllSyllabi(prev => ({
                ...prev,
                [docKey]: payload
            }));

            setMessage({ type: 'success', text: `Syllabus for Class ${formClass} - ${formSubject} successfully saved!` });
            setTimeout(() => {
                setActiveTab('view');
                setMessage(null);
            }, 1500);

        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    // Calculations for All Subjects in the Selected Class
    const classSubjects = classSubjectsMap[selectedViewClass] || [];
    
    let totalClassChapters = 0;
    let completedClassChapters = 0;
    let inProgressClassChapters = 0;
    let notStartedClassChapters = 0;

    classSubjects.forEach(sub => {
        const key = `${selectedViewClass}_${sub}`;
        const data = allSyllabi[key];
        if (data && Array.isArray(data.chapters)) {
            totalClassChapters += data.chapters.length;
            completedClassChapters += data.chapters.filter(ch => ch.status === 'Completed').length;
            inProgressClassChapters += data.chapters.filter(ch => ch.status === 'In Progress').length;
            notStartedClassChapters += data.chapters.filter(ch => ch.status === 'Not Started').length;
        }
    });

    const classCompletionPercentage = totalClassChapters > 0 ? Math.round((completedClassChapters / totalClassChapters) * 100) : 0;

    return (
        <div className="min-h-screen p-6 lg:p-8 font-sans transition-colors duration-300 relative overflow-hidden" style={{ backgroundColor: colors.background }}>
            {/* Background Decorative Graphic Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none opacity-10 blur-3xl -mr-20 -mt-20" style={{ backgroundColor: colors.primary }}></div>
            <div className="absolute bottom-10 left-0 w-72 h-72 rounded-full pointer-events-none opacity-5 blur-2xl -ml-20" style={{ backgroundColor: colors.primary }}></div>

            <div className="max-w-[1440px] mx-auto space-y-8 relative z-10">
                
                {/* Header Card */}
                <div 
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-[28px] shadow-sm border border-slate-100 transition-colors duration-300 relative overflow-hidden"
                    style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                >
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 text-slate-500">
                                Active Session: <span style={{ color: colors.primary }}>{formatDisplayValue(activeSession)}</span>
                            </span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2" style={{ color: colors.text }}>
                            <div className="p-2 rounded-xl" style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
                                <HiBookOpen size={20} />
                            </div>
                            Syllabus Progress & Manager
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setActiveTab('view')}
                            className={`px-6 py-3 rounded-full font-bold text-xs uppercase transition-all border ${
                                activeTab === 'view' 
                                    ? 'shadow-md' 
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                            style={activeTab === 'view' ? { backgroundColor: colors.primary, color: '#ffffff', borderColor: colors.primary } : {}}
                        >
                            View Status
                        </button>
                        <button
                            onClick={() => { 
                                setActiveTab('add'); 
                                const defaultSub = classSubjectsMap[formClass]?.[0] || '';
                                handleLoadExistingForEdit(formClass, formSubject || defaultSub); 
                            }}
                            className={`px-6 py-3 rounded-full font-bold text-xs uppercase transition-all border ${
                                activeTab === 'add' 
                                    ? 'shadow-md' 
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                            style={activeTab === 'add' ? { backgroundColor: colors.primary, color: '#ffffff', borderColor: colors.primary } : {}}
                        >
                            + Add / Edit Syllabus
                        </button>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-2xl text-xs font-bold uppercase tracking-widest border ${
                        message.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                        {formatDisplayValue(message.text)}
                    </div>
                )}

                {/* TAB 1: VIEW SYLLABUS GRAPHICAL DASHBOARD */}
                {activeTab === 'view' && (
                    <div className="space-y-8">
                        {/* Filter Bar Card */}
                        <div 
                            className="rounded-[28px] border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center justify-between transition-colors duration-300"
                            style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                        >
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="p-3.5 rounded-full" style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
                                    <HiChartPie size={22} strokeWidth={2}/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Class</label>
                                    <select
                                        value={selectedViewClass}
                                        onChange={(e) => setSelectedViewClass(e.target.value)}
                                        className="mt-1 px-5 py-3 bg-slate-50/80 rounded-full text-xs font-bold uppercase text-slate-700 border border-slate-200 cursor-pointer outline-none focus:bg-white transition-all min-w-[200px]"
                                    >
                                        {classesList.map(cls => (
                                            <option key={cls} value={cls}>Class {cls}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Showing all subjects assigned for Class <span className="font-black" style={{ color: colors.primary }}>{selectedViewClass}</span>
                            </div>
                        </div>

                        {/* Overall Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="text-white p-6 rounded-[28px] shadow-lg flex flex-col justify-between" style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primary}cc)` }}>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Class Completion</p>
                                    <h3 className="text-4xl font-black mt-2">{classCompletionPercentage}%</h3>
                                </div>
                                <div className="w-full bg-white/20 h-2 rounded-full mt-4 overflow-hidden">
                                    <div className="bg-white h-full transition-all duration-500" style={{ width: `${classCompletionPercentage}%` }}></div>
                                </div>
                            </div>

                            <div className="border border-slate-100 p-6 rounded-[28px] flex items-center gap-4 shadow-sm" style={{ backgroundColor: colors.cardBackground, color: colors.text }}>
                                <div className="p-4 bg-emerald-100 text-emerald-700 rounded-2xl shadow-inner">
                                    <HiCheckCircle size={28} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</p>
                                    <h4 className="text-2xl font-black mt-1" style={{ color: colors.text }}>{completedClassChapters} <span className="text-xs font-medium text-slate-400">/ {totalClassChapters}</span></h4>
                                </div>
                            </div>

                            <div className="border border-slate-100 p-6 rounded-[28px] flex items-center gap-4 shadow-sm" style={{ backgroundColor: colors.cardBackground, color: colors.text }}>
                                <div className="p-4 bg-amber-100 text-amber-700 rounded-2xl shadow-inner">
                                    <HiClock size={28} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Progress</p>
                                    <h4 className="text-2xl font-black mt-1" style={{ color: colors.text }}>{inProgressClassChapters} <span className="text-xs font-medium text-slate-400">/ {totalClassChapters}</span></h4>
                                </div>
                            </div>

                            <div className="border border-slate-100 p-6 rounded-[28px] flex items-center gap-4 shadow-sm" style={{ backgroundColor: colors.cardBackground, color: colors.text }}>
                                <div className="p-4 bg-rose-100 text-rose-700 rounded-2xl shadow-inner">
                                    <HiExclamationCircle size={28} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Not Started</p>
                                    <h4 className="text-2xl font-black mt-1" style={{ color: colors.text }}>{notStartedClassChapters} <span className="text-xs font-medium text-slate-400">/ {totalClassChapters}</span></h4>
                                </div>
                            </div>
                        </div>

                        {/* Subjects Breakdown List */}
                        <div className="space-y-6">
                            {classSubjects.length === 0 ? (
                                <div className="text-center py-20 rounded-[28px] border border-slate-100 shadow-sm bg-white">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No subjects assigned for Class {selectedViewClass}. Please configure subjects first.</p>
                                </div>
                            ) : (
                                classSubjects.map((subName) => {
                                    const docKey = `${selectedViewClass}_${subName}`;
                                    const syllabusData = allSyllabi[docKey];
                                    const subjectChapters = syllabusData?.chapters || [];
                                    
                                    const subTotal = subjectChapters.length;
                                    const subCompleted = subjectChapters.filter(ch => ch.status === 'Completed').length;
                                    const subPercentage = subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0;

                                    return (
                                        <div key={subName} className="rounded-[28px] border border-slate-100 shadow-sm p-6 md:p-8 space-y-6 transition-colors duration-300" style={{ backgroundColor: colors.cardBackground, color: colors.text }}>
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-6 gap-4">
                                                <div>
                                                    <h3 className="text-lg font-black tracking-tight flex items-center gap-2" style={{ color: colors.text }}>
                                                        <HiBookOpen style={{ color: colors.primary }} /> {formatDisplayValue(subName)}
                                                    </h3>
                                                    <p className="text-xs font-medium text-slate-400 mt-1">
                                                        Completion: <span className="font-bold" style={{ color: colors.primary }}>{subPercentage}%</span> ({subCompleted}/{subTotal} Chapters) | Last Updated: {syllabusData?.lastUpdated ? formatDisplayValue(syllabusData.lastUpdated) : 'Never'}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setActiveTab('add');
                                                        handleLoadExistingForEdit(selectedViewClass, subName);
                                                    }}
                                                    className="px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                                                >
                                                    <HiChartPie size={16} /> Edit This Subject
                                                </button>
                                            </div>

                                            {subjectChapters.length === 0 ? (
                                                <div className="text-center py-10 rounded-2xl bg-slate-50/50 border border-slate-100">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No chapters added yet for {subName}.</p>
                                                    <button
                                                        onClick={() => {
                                                            setActiveTab('add');
                                                            handleLoadExistingForEdit(selectedViewClass, subName);
                                                        }}
                                                        style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                                                        className="mt-4 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
                                                    >
                                                        + Add Chapters
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-3">
                                                    {subjectChapters.map((ch, idx) => {
                                                        const statusColor = 
                                                            ch.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                            ch.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                                            'bg-slate-50 text-slate-500 border-slate-200';

                                                        return (
                                                            <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm" style={{ backgroundColor: colors.primary }}>
                                                                        {ch.chapterNo}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-extrabold text-xs" style={{ color: colors.text }}>{formatDisplayValue(ch.title) || 'Untitled Chapter'}</h4>
                                                                        {ch.teacherNotes && (
                                                                            <p className="text-[11px] text-slate-500 mt-0.5 italic">Notes: {formatDisplayValue(ch.teacherNotes)}</p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${statusColor}`}>
                                                                    {formatDisplayValue(ch.status)}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 2: ADD / EDIT SYLLABUS FORM */}
                {activeTab === 'add' && (
                    <div className="rounded-[28px] border border-slate-100 shadow-sm p-6 md:p-8 bg-white space-y-6" style={{ backgroundColor: colors.cardBackground, color: colors.text }}>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                            <div>
                                <h3 className="text-xl font-black tracking-tight" style={{ color: colors.text }}>Curriculum Syllabus Builder & Updater</h3>
                                <p className="text-xs font-medium text-slate-400 mt-1">Configure chapters, statuses, and notes for any class and assigned subject.</p>
                            </div>
                            <button onClick={() => setActiveTab('view')} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                                <HiX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveSyllabus} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-slate-50/50 border border-slate-100">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Class</label>
                                    <select
                                        value={formClass}
                                        onChange={(e) => {
                                            const cls = e.target.value;
                                            setFormClass(cls);
                                            const subs = classSubjectsMap[cls] || [];
                                            const firstSub = subs[0] || '';
                                            setFormSubject(firstSub);
                                            handleLoadExistingForEdit(cls, firstSub);
                                        }}
                                        className="w-full px-5 py-3 bg-white rounded-full text-xs font-bold uppercase text-slate-700 border border-slate-200 outline-none focus:ring-2 transition-all cursor-pointer"
                                    >
                                        {classesList.map(cls => (
                                            <option key={cls} value={cls}>Class {cls}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Subject</label>
                                    <select
                                        value={formSubject}
                                        onChange={(e) => {
                                            const sub = e.target.value;
                                            setFormSubject(sub);
                                            handleLoadExistingForEdit(formClass, sub);
                                        }}
                                        className="w-full px-5 py-3 bg-white rounded-full text-xs font-bold uppercase text-slate-700 border border-slate-200 outline-none focus:ring-2 transition-all cursor-pointer"
                                    >
                                        <option value="">-- Select Subject --</option>
                                        {(classSubjectsMap[formClass] || []).length > 0 ? (
                                            (classSubjectsMap[formClass] || []).map(sub => (
                                                <option key={sub} value={sub}>{formatDisplayValue(sub)}</option>
                                            ))
                                        ) : (
                                            <option disabled value="">No subjects assigned for this class</option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            {/* Chapters Repeater Matrix */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Chapters Configuration</h4>
                                    <button
                                        type="button"
                                        onClick={handleAddChapterRow}
                                        className="px-5 py-2.5 rounded-full font-bold text-xs uppercase transition-all border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                                    >
                                        <HiPlus size={16} /> Add Chapter
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {chaptersList.map((chapter, index) => (
                                        <div key={index} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center">
                                            <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm" style={{ backgroundColor: colors.primary }}>
                                                {chapter.chapterNo}
                                            </div>

                                            <div className="flex-1 w-full space-y-3 md:space-y-0 md:flex md:gap-4">
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        placeholder="Chapter Title"
                                                        value={chapter.title || ''}
                                                        onChange={(e) => handleChapterChange(index, 'title', e.target.value)}
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 outline-none focus:ring-2 transition-all"
                                                        required
                                                    />
                                                </div>

                                                <div className="w-full md:w-48">
                                                    <select
                                                        value={chapter.status || 'Not Started'}
                                                        onChange={(e) => handleChapterChange(index, 'status', e.target.value)}
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 outline-none focus:ring-2 transition-all cursor-pointer"
                                                    >
                                                        <option value="Not Started">Not Started</option>
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Completed">Completed</option>
                                                    </select>
                                                </div>

                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        placeholder="Teacher Notes (optional)"
                                                        value={chapter.teacherNotes || ''}
                                                        onChange={(e) => handleChapterChange(index, 'teacherNotes', e.target.value)}
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 outline-none focus:ring-2 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveChapterRow(index)}
                                                className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors shrink-0"
                                                title="Remove Chapter"
                                            >
                                                <HiTrash size={16} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('view')}
                                    className="px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                                    className="px-8 py-3 rounded-full font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center gap-2 active:scale-[0.99]"
                                >
                                    <HiSave size={16} /> {isLoading ? 'Saving Syllabus...' : 'Save Syllabus Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SyllabusManager;