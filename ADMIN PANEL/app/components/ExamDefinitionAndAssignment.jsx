'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase/config';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { 
    HiOutlineDocumentAdd, 
    HiOutlineSave, 
    HiOutlineCheckCircle,
    HiOutlinePlusCircle,
    HiOutlineViewGridAdd
} from 'react-icons/hi';
import { useColors } from './ColorComponent';

const MOCK_CLASSES = ['LKG','UKG','PREP' , '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

function ExamDefinitionAndAssignment({ activeSession }) {
    const colors = useColors();
    const [examNameInput, setExamNameInput] = useState('');
    const [examsList, setExamsList] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedClasses, setSelectedClasses] = useState([MOCK_CLASSES[0]]);
    const [subjectAssignments, setSubjectAssignments] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const fetchExams = useCallback(async () => {
        if (!activeSession) return;
        try {
            const snapshot = await getDocs(collection(db, 'sessions', activeSession, 'exams'));
            const fetchedExams = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
            setExamsList(fetchedExams);
            if (fetchedExams.length > 0 && !selectedExamId) {
                setSelectedExamId(fetchedExams[0].id);
            }
        } catch (error) { console.error("Error fetching exams:", error); }
    }, [activeSession, selectedExamId]);

    const fetchCurrentAssignments = useCallback(async (examId, classes) => {
        if (!examId || classes.length === 0 || !activeSession) return;
        setLoading(true);
        try {
            // 1. Fetch subjects assigned to the first selected class from sessions > activeSession > subjects > classId
            const firstClass = classes[0];
            const classSubjectRef = doc(db, 'sessions', activeSession, 'subjects', firstClass);
            const classSubjectSnap = await getDoc(classSubjectRef);
            
            let sessionSubjects = [];
            if (classSubjectSnap.exists() && Array.isArray(classSubjectSnap.data().assignedSubjects)) {
                sessionSubjects = classSubjectSnap.data().assignedSubjects;
            }

            const baseSubjects = sessionSubjects.map(name => ({ name, isSelected: false, maxMarks: 100 }));

            // 2. Fetch existing exam assignments
            const docId = `${examId}_${firstClass}`;
            const docRef = doc(db, 'sessions', activeSession, 'examAssignments', docId);
            const snap = await getDoc(docRef);

            if (snap.exists()) {
                const savedSubjects = snap.data().subjects || [];
                const updatedList = baseSubjects.map(base => {
                    const saved = savedSubjects.find(s => s.name === base.name);
                    return saved ? { ...base, isSelected: true, maxMarks: saved.maxMarks } : base;
                });
                setSubjectAssignments(updatedList);
            } else {
                setSubjectAssignments(baseSubjects);
            }
        } catch (error) { console.error("Error fetching assignments:", error); }
        finally { setLoading(false); }
    }, [activeSession]);

    useEffect(() => { fetchExams(); }, [fetchExams]);
    useEffect(() => {
        if (selectedExamId && selectedClasses.length > 0) {
            fetchCurrentAssignments(selectedExamId, selectedClasses);
        }
    }, [selectedExamId, selectedClasses, fetchCurrentAssignments]);

    const handleSaveExamName = async () => {
        if (!examNameInput.trim() || !activeSession) return;
        setLoading(true);
        const name = examNameInput.trim();
        const examId = name.toLowerCase().replace(/\s+/g, '-');
        try {
            await setDoc(doc(db, 'sessions', activeSession, 'exams', examId), { 
                name, createdAt: new Date().toISOString() 
            }, { merge: true });
            setMessage({ type: 'success', text: `Exam "${name}" created successfully!` });
            setExamNameInput('');
            setSelectedExamId(examId);
            fetchExams();
        } catch (error) { setMessage({ type: 'error', text: 'Failed to save exam.' }); }
        finally { setLoading(false); }
    };

    const handleAssignSubjects = async () => {
        const selectedSubjects = subjectAssignments.filter(sub => sub.isSelected);
        if (!selectedExamId || selectedClasses.length === 0 || selectedSubjects.length === 0 || !activeSession) {
            setMessage({ type: 'error', text: 'Please select subjects before saving.' });
            return;
        }
        setLoading(true);
        try {
            const subjectsData = selectedSubjects.map(sub => ({ name: sub.name, maxMarks: sub.maxMarks }));
            const promises = selectedClasses.map(classId => {
                const docId = `${selectedExamId}_${classId}`; 
                return setDoc(doc(db, 'sessions', activeSession, 'examAssignments', docId), {
                    examId: selectedExamId, classId, subjects: subjectsData, updatedAt: new Date().toISOString(),
                });
            });
            await Promise.all(promises);
            setMessage({ type: 'success', text: `Configuration saved for Class ${selectedClasses.join(', ')}` });
        } catch (error) { setMessage({ type: 'error', text: 'Failed to assign subjects.' }); }
        finally { setLoading(false); }
    };

    const handleToggleSubject = (name) => {
        setSubjectAssignments(prev => prev.map(sub => sub.name === name ? { ...sub, isSelected: !sub.isSelected } : sub));
    };

    const handleMaxMarksChange = (name, val) => {
        setSubjectAssignments(prev => prev.map(sub => sub.name === name ? { ...sub, maxMarks: parseInt(val) || 0 } : sub));
    };

    return (
        <div className="max-w-[1440px] mx-auto p-6 lg:p-8 font-sans relative overflow-hidden" style={{ backgroundColor: colors.background }}>
            {/* Soft Background Decorative Blur Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-10 pointer-events-none -mr-20 -mt-20" style={{ backgroundColor: colors.primary }}></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-10 pointer-events-none -ml-20 -mb-20" style={{ backgroundColor: colors.primary }}></div>

            <div className="relative z-10 space-y-8 animate-in fade-in duration-700">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-[28px] shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl text-white shadow-md" style={{ backgroundColor: colors.primary }}>
                            <HiOutlineDocumentAdd className="w-6 h-6 lg:w-8 lg:h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Exam Configuration</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Define structures and assign subjects to classes.</p>
                        </div>
                    </div>
                    {message && (
                        <div className={`px-5 py-3 rounded-full flex items-center text-[10px] font-black uppercase tracking-widest animate-bounce ${
                            message.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                            {message.text}
                        </div>
                    )}
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                    
                    {/* Left Column: Controls */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Step 1: Create Exam */}
                        <div className="bg-white rounded-[28px] p-6 md:p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 mb-4">
                                <HiOutlinePlusCircle className="w-5 h-5" style={{ color: colors.primary }} />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">New Exam Title</h3>
                            </div>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={examNameInput}
                                    onChange={(e) => setExamNameInput(e.target.value)}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-full font-medium text-slate-700 outline-none transition-all placeholder:text-slate-300"
                                    placeholder="e.g. Annual 2026"
                                    style={{ '--tw-ring-color': colors.primary }}
                                />
                                <button 
                                    onClick={handleSaveExamName} 
                                    className="w-full text-white py-3 rounded-full font-bold text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.99]"
                                    style={{ backgroundColor: colors.primary }}
                                >
                                    Create Exam
                                </button>
                            </div>
                        </div>

                        {/* Step 2: Selectors */}
                        <div className="bg-white rounded-[28px] p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Select Exam</label>
                                <select
                                    value={selectedExamId}
                                    onChange={(e) => setSelectedExamId(e.target.value)}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-full font-bold text-slate-700 outline-none transition-all cursor-pointer"
                                    style={{ '--tw-ring-color': colors.primary }}
                                >
                                    {examsList.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Target Classes</label>
                                <div className="grid grid-cols-4 gap-2 h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {MOCK_CLASSES.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => {
                                                setSelectedClasses(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
                                            }}
                                            className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                                selectedClasses.includes(c) 
                                                ? 'text-white shadow-sm border-transparent' 
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                            }`}
                                            style={{ backgroundColor: selectedClasses.includes(c) ? colors.primary : undefined }}
                                        >
                                            Cl- {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Subject Grid */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white rounded-[28px] p-6 md:p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <HiOutlineViewGridAdd className="w-6 h-6" style={{ color: colors.primary }} />
                                    <h4 className="text-xl font-black text-slate-800 tracking-tight">Subject Matrix</h4>
                                </div>
                                <button
                                    onClick={handleAssignSubjects}
                                    disabled={loading}
                                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest shadow-md hover:bg-slate-800 transition-colors disabled:opacity-50"
                                >
                                    <HiOutlineSave className="w-4 h-4" />
                                    <span className="hidden sm:inline">{loading ? 'Saving...' : 'Finalize Selection'}</span>
                                </button>
                            </div>

                            {/* Subject Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                {subjectAssignments.map((sub) => (
                                    <div 
                                        key={sub.name}
                                        onClick={() => handleToggleSubject(sub.name)}
                                        className={`relative p-4 rounded-2xl border transition-all cursor-pointer group ${
                                            sub.isSelected 
                                            ? 'bg-white shadow-md' 
                                            : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                                        }`}
                                        style={{ borderColor: sub.isSelected ? colors.primary : undefined }}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className={`text-xs font-black tracking-tight ${sub.isSelected ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                                {sub.name}
                                            </span>
                                            {sub.isSelected ? (
                                                <HiOutlineCheckCircle className="w-5 h-5" style={{ color: colors.primary }} />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border border-slate-200" />
                                            )}
                                        </div>

                                        {sub.isSelected && (
                                            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-1" onClick={e => e.stopPropagation()}>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Max Score</span>
                                                <input
                                                    type="number"
                                                    value={sub.maxMarks}
                                                    onChange={(e) => handleMaxMarksChange(sub.name, e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:bg-white transition-all"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {subjectAssignments.length === 0 && !loading && (
                                    <div className="col-span-full py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                        No subjects found for this class in Firestore.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExamDefinitionAndAssignment;