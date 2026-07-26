'use client';

import React, { useState, useEffect } from 'react';
import { HiSave, HiX, HiBookOpen, HiCheckCircle, HiClock, HiExclamationCircle, HiPlus, HiTrash, HiChartPie } from 'react-icons/hi';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase/config';

function SyllabusManager() {
    const [activeTab, setActiveTab] = useState('view');
    const [activeSession, setActiveSession] = useState('2026-27');
    const [classesList] = useState(['LKG', 'UKG', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
    
    const [classSubjectsMap, setClassSubjectsMap] = useState({});
    const [allSyllabi, setAllSyllabi] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Filter states for View Tab (Class only now)
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

                // Fetch assigned subjects per class from sessions/{activeSession}/subjects/{class}
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

                // Initialize default form subject if available for default class '10'
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
    
    // Aggregated metrics across all subjects for this class
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
        <div className="max-w-7xl mx-auto p-6 md:p-10 bg-white rounded-3xl mt-10 shadow-2xl border border-slate-100 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                <div>
                    <h2 className="text-3xl font-extrabold text-[#303972] flex items-center gap-3">
                        <div className="p-2.5 bg-purple-50 rounded-2xl text-purple-600 shadow-inner">
                            <HiBookOpen size={28} />
                        </div>
                        Syllabus Progress & Manager
                    </h2>
                    <p className="text-sm font-medium text-slate-400 mt-1">
                        Active Session: <span className="font-bold text-purple-600">{formatDisplayValue(activeSession)}</span> | Track and update institutional curriculum status.
                    </p>
                </div>

                <div className="flex bg-[#F8F9FD] p-1.5 rounded-2xl border border-slate-200/60">
                    <button
                        onClick={() => setActiveTab('view')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'view' ? 'bg-[#303972] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        View Syllabus Status
                    </button>
                    <button
                        onClick={() => { 
                            setActiveTab('add'); 
                            const defaultSub = classSubjectsMap[formClass]?.[0] || '';
                            handleLoadExistingForEdit(formClass, formSubject || defaultSub); 
                        }}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'add' ? 'bg-[#303972] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        + Add / Edit Syllabus
                    </button>
                </div>
            </div>

            {message && (
                <div className={`mb-8 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest border ${
                    message.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                    {formatDisplayValue(message.text)}
                </div>
            )}

            {/* TAB 1: VIEW SYLLABUS GRAPHICAL DASHBOARD */}
            {activeTab === 'view' && (
                <div className="space-y-8">
                    {/* Filter Bar - Class Only */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#F8F9FD] p-6 rounded-3xl border border-slate-200/60">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Class To View All Subjects</label>
                            <select
                                value={selectedViewClass}
                                onChange={(e) => setSelectedViewClass(e.target.value)}
                                className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#303972] outline-none min-w-[200px]"
                            >
                                {classesList.map(cls => (
                                    <option key={cls} value={cls}>Class {cls}</option>
                                ))}
                            </select>
                        </div>

                        <div className="text-xs font-bold text-slate-500">
                            Showing all subjects assigned for Class <span className="text-purple-600">{selectedViewClass}</span>
                        </div>
                    </div>

                    {/* Overall Graphical Metrics for the Class */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-3xl shadow-lg shadow-purple-100 flex flex-col justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-purple-200">Class Completion</p>
                                <h3 className="text-4xl font-black mt-2">{classCompletionPercentage}%</h3>
                            </div>
                            <div className="w-full bg-white/20 h-2 rounded-full mt-4 overflow-hidden">
                                <div className="bg-white h-full transition-all duration-500" style={{ width: `${classCompletionPercentage}%` }}></div>
                            </div>
                        </div>

                        <div className="bg-[#F8F9FD] border border-slate-200/60 p-6 rounded-3xl flex items-center gap-4">
                            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner">
                                <HiCheckCircle size={28} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</p>
                                <h4 className="text-2xl font-black text-[#303972] mt-1">{completedClassChapters} <span className="text-xs font-medium text-slate-400">/ {totalClassChapters}</span></h4>
                            </div>
                        </div>

                        <div className="bg-[#F8F9FD] border border-slate-200/60 p-6 rounded-3xl flex items-center gap-4">
                            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl shadow-inner">
                                <HiClock size={28} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Progress</p>
                                <h4 className="text-2xl font-black text-[#303972] mt-1">{inProgressClassChapters} <span className="text-xs font-medium text-slate-400">/ {totalClassChapters}</span></h4>
                            </div>
                        </div>

                        <div className="bg-[#F8F9FD] border border-slate-200/60 p-6 rounded-3xl flex items-center gap-4">
                            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl shadow-inner">
                                <HiExclamationCircle size={28} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Not Started</p>
                                <h4 className="text-2xl font-black text-[#303972] mt-1">{notStartedClassChapters} <span className="text-xs font-medium text-slate-400">/ {totalClassChapters}</span></h4>
                            </div>
                        </div>
                    </div>

                    {/* All Subjects Breakdown for the Class */}
                    <div className="space-y-6">
                        {classSubjects.length === 0 ? (
                            <div className="text-center py-16 bg-[#F8F9FD] rounded-3xl border border-dashed border-slate-200">
                                <p className="text-sm font-medium text-slate-400">No subjects assigned for Class {selectedViewClass}. Please configure subjects first.</p>
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
                                    <div key={subName} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 gap-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-[#303972] flex items-center gap-2">
                                                    <HiBookOpen className="text-purple-600" /> {formatDisplayValue(subName)}
                                                </h3>
                                                <p className="text-xs font-medium text-slate-400 mt-0.5">
                                                    Completion: <span className="font-bold text-purple-600">{subPercentage}%</span> ({subCompleted}/{subTotal} Chapters) | Last Updated: {syllabusData?.lastUpdated ? formatDisplayValue(syllabusData.lastUpdated) : 'Never'}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setActiveTab('add');
                                                    handleLoadExistingForEdit(selectedViewClass, subName);
                                                }}
                                                className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                                            >
                                                <HiChartPie size={14} /> Edit This Subject
                                            </button>
                                        </div>

                                        {subjectChapters.length === 0 ? (
                                            <div className="text-center py-8 bg-[#F8F9FD] rounded-2xl border border-dashed border-slate-200">
                                                <p className="text-xs font-medium text-slate-400">No chapters added yet for {subName}.</p>
                                                <button
                                                    onClick={() => {
                                                        setActiveTab('add');
                                                        handleLoadExistingForEdit(selectedViewClass, subName);
                                                    }}
                                                    className="mt-3 px-3 py-1.5 bg-[#303972] text-white rounded-xl text-xs font-bold shadow-sm"
                                                >
                                                    + Add Chapters
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-3">
                                                {subjectChapters.map((ch, idx) => {
                                                    const statusColor = 
                                                        ch.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                        ch.status === 'In Progress' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                                                        'bg-slate-50 text-slate-500 border-slate-200';

                                                    return (
                                                        <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-[#F8F9FD]/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-8 h-8 rounded-xl bg-[#303972] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                                                                    {ch.chapterNo}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-extrabold text-[#303972] text-xs">{formatDisplayValue(ch.title) || 'Untitled Chapter'}</h4>
                                                                    {ch.teacherNotes && (
                                                                        <p className="text-[11px] text-slate-500 mt-0.5 italic">Notes: {formatDisplayValue(ch.teacherNotes)}</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border uppercase tracking-wider ${statusColor}`}>
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
                <div className="bg-[#F8F9FD] p-6 md:p-8 rounded-3xl border border-slate-200/60">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-[#303972]">Curriculum Syllabus Builder & Updater</h3>
                            <p className="text-xs text-slate-400 mt-1">Configure chapters, statuses, and notes for any class and assigned subject.</p>
                        </div>
                        <button onClick={() => setActiveTab('view')} className="text-slate-400 hover:text-slate-600">
                            <HiX size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSaveSyllabus} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Class</label>
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
                                    className="w-full p-3 bg-[#F8F9FD] border border-slate-200 rounded-xl text-xs font-bold text-[#303972] outline-none"
                                >
                                    {classesList.map(cls => (
                                        <option key={cls} value={cls}>Class {cls}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Subject</label>
                                <select
                                    value={formSubject}
                                    onChange={(e) => {
                                        const sub = e.target.value;
                                        setFormSubject(sub);
                                        handleLoadExistingForEdit(formClass, sub);
                                    }}
                                    className="w-full p-3 bg-[#F8F9FD] border border-slate-200 rounded-xl text-xs font-bold text-[#303972] outline-none"
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
                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-bold text-[#303972] uppercase tracking-wider">Chapters Configuration</h4>
                                <button
                                    type="button"
                                    onClick={handleAddChapterRow}
                                    className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                                >
                                    <HiPlus size={16} /> Add Chapter
                                </button>
                            </div>

                            <div className="space-y-4">
                                {chaptersList.map((chapter, index) => (
                                    <div key={index} className="p-4 bg-[#F8F9FD] rounded-2xl border border-slate-200/60 flex flex-col md:flex-row gap-4 items-center">
                                        <div className="w-12 h-12 rounded-xl bg-[#303972] text-white flex items-center justify-center font-black text-sm shrink-0">
                                            {chapter.chapterNo}
                                        </div>

                                        <div className="flex-1 w-full space-y-3 md:space-y-0 md:flex md:gap-4">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Chapter Title"
                                                    value={chapter.title || ''}
                                                    onChange={(e) => handleChapterChange(index, 'title', e.target.value)}
                                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#303972] outline-none focus:ring-2 focus:ring-purple-400"
                                                    required
                                                />
                                            </div>

                                            <div className="w-full md:w-48">
                                                <select
                                                    value={chapter.status || 'Not Started'}
                                                    onChange={(e) => handleChapterChange(index, 'status', e.target.value)}
                                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#303972] outline-none focus:ring-2 focus:ring-purple-400"
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
                                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-purple-400"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveChapterRow(index)}
                                            className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all shrink-0"
                                            title="Remove Chapter"
                                        >
                                            <HiTrash size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setActiveTab('view')}
                                className="px-6 py-3 text-xs font-bold text-slate-400 hover:text-slate-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-purple-100 flex items-center gap-2 transition-all"
                            >
                                <HiSave size={16} /> {isLoading ? 'Saving Syllabus...' : 'Save Syllabus Record'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default SyllabusManager;