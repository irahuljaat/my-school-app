'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase/config';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { 
    HiOutlineDocumentAdd, 
    HiOutlineSave, 
    HiOutlineInformationCircle,
    HiOutlineDatabase,
    HiOutlineCheckCircle,
    HiOutlinePlusCircle,
    HiOutlineViewGridAdd
} from 'react-icons/hi';

const MOCK_CLASSES = ['LKG','UKG','PREP' , '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const MOCK_ALL_SUBJECTS = ['Hindi' , 'English' , 'Mathematics' , 'Science' , 'Social Science' , 'Computer' , 'G.K' , 'Sanskrit', 'EVS', 'Physics', 'Chemistry', 'Biology', 'English Literature', 'Hindi Literature', 'Drawing', 'Political Science' , 'Geography' ,'Home Science' , 'Computer Applications'];

function ExamDefinitionAndAssignment({ activeSession }) {
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
            const docId = `${examId}_${classes[0]}`;
            const docRef = doc(db, 'sessions', activeSession, 'examAssignments', docId);
            const snap = await getDoc(docRef);
            const baseSubjects = MOCK_ALL_SUBJECTS.map(name => ({ name, isSelected: false, maxMarks: 100 }));

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
        <div className="max-w-4xl mx-auto space-y-6 lg:space-y-10 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight m-8 flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
                            <HiOutlineDocumentAdd className="w-6 h-6 lg:w-8 lg:h-8" />
                        </div>
                        Exam Configuration
                    </h2>
                    <p className="text-slate-400 text-sm mt-1 font-medium italic">Define structures and assign subjects to classes.</p>
                </div>
                {message && (
                    <div className={`px-4 py-2 rounded-2xl flex items-center text-[11px] font-bold uppercase tracking-wider animate-bounce ${
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
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                            <HiOutlinePlusCircle className="text-indigo-500 w-5 h-5" />
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">New Exam Title</h3>
                        </div>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={examNameInput}
                                onChange={(e) => setExamNameInput(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium placeholder:text-slate-300"
                                placeholder="e.g. Annual 2026"
                            />
                            <button onClick={handleSaveExamName} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-md hover:shadow-indigo-200 active:scale-95 transition-all">
                                Create Exam
                            </button>
                        </div>
                    </div>

                    {/* Step 2: Selectors */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Select Exam</label>
                            <select
                                value={selectedExamId}
                                onChange={(e) => setSelectedExamId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                            >
                                {examsList.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Target Classes</label>
                            <div className="grid grid-cols-4 gap-2 h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {MOCK_CLASSES.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => {
                                            setSelectedClasses(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
                                        }}
                                        className={`py-2 rounded-lg text-[11px] font-bold transition-all border ${
                                            selectedClasses.includes(c) 
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                                            : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'
                                        }`}
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
                    <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <HiOutlineViewGridAdd className="text-indigo-500 w-6 h-6" />
                                <h4 className="text-xl font-black text-slate-800 tracking-tight">Subject Matrix</h4>
                            </div>
                            <button
                                onClick={handleAssignSubjects}
                                disabled={loading}
                                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
                            >
                                <HiOutlineSave className="w-5 h-5" />
                                <span className="hidden sm:inline">{loading ? 'Saving...' : 'Finalize Selection'}</span>
                            </button>
                        </div>

                        {/* Subject Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                            {subjectAssignments.map((sub) => (
                                <div 
                                    key={sub.name}
                                    onClick={() => handleToggleSubject(sub.name)}
                                    className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer group ${
                                        sub.isSelected 
                                        ? 'border-indigo-600 bg-white shadow-xl shadow-indigo-100/50' 
                                        : 'border-slate-50 bg-[#FBFBFE] hover:border-slate-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-sm font-black tracking-tight ${sub.isSelected ? 'text-indigo-700' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                            {sub.name}
                                        </span>
                                        {sub.isSelected ? (
                                            <HiOutlineCheckCircle className="text-indigo-600 w-5 h-5" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                                        )}
                                    </div>

                                    {sub.isSelected && (
                                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-indigo-50 animate-in slide-in-from-top-1" onClick={e => e.stopPropagation()}>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Max Score</span>
                                            <input
                                                type="number"
                                                value={sub.maxMarks}
                                                onChange={(e) => handleMaxMarksChange(sub.name, e.target.value)}
                                                className="w-full bg-slate-50 border-none ring-1 ring-indigo-100 rounded-lg px-3 py-1.5 text-xs font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExamDefinitionAndAssignment;