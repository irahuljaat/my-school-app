'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config'; 
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, setDoc, where } from 'firebase/firestore'; 
import { HiOutlinePlus, HiOutlineTrash, HiOutlineAcademicCap, HiOutlineDocumentAdd, HiOutlineSave, HiOutlineCheckCircle } from 'react-icons/hi';
import { useColors } from './ColorComponent';

// Mock list of all available subjects (Admin can edit this if needed)
const ALL_SUBJECTS = ['Math', 'Science', 'English', 'Social Science', 'Computer Science', 'Hindi', 'G.K' , 'Drawing'];
const MOCK_CLASSES = ['LKG','UKG','PREP' ,'1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

function ExamScheduler({ onNavigate, activeSession }) {
    const colors = useColors();

    // --- State for New Exam ---
    const [examName, setExamName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // --- State for Subject Assignment ---
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedClass, setSelectedClass] = useState(MOCK_CLASSES[0]);
    const [assignedSubjects, setAssignedSubjects] = useState([]); 
    
    // --- State for Lists ---
    const [examsList, setExamsList] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Data Fetching ---
    const fetchExams = async () => {
        setLoading(true);
        try {
            // Updated to fetch from activeSession path if available, or fallback to top-level collection
            const examsRef = activeSession ? collection(db, 'sessions', activeSession, 'exams') : collection(db, 'exams');
            const q = query(examsRef, orderBy('createdAt', 'desc')); 
            const snapshot = await getDocs(q);
            
            const exams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setExamsList(exams);

            if (exams.length > 0 && !selectedExamId) {
                setSelectedExamId(exams[0].id);
            }
        } catch (error) {
            console.error("Error fetching exams:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExams();
    }, [activeSession]);

    // Effect to fetch subject assignments when exam or class changes
    useEffect(() => {
        const fetchAssignment = async () => {
            if (!selectedExamId || !selectedClass) return;
            
            try {
                const docId = `${selectedExamId}_${selectedClass}`;
                const assignmentsRef = activeSession ? collection(db, 'sessions', activeSession, 'examAssignments') : collection(db, 'examAssignments');
                const docSnap = await getDocs(query(assignmentsRef, where('__name__', '==', docId)));
                
                if (!docSnap.empty) {
                    setAssignedSubjects(docSnap.docs[0].data().subjects || []);
                } else {
                    setAssignedSubjects([]);
                }
            } catch (error) {
                console.error("Error fetching assignment:", error);
                setAssignedSubjects([]);
            }
        };

        fetchAssignment();
    }, [selectedExamId, selectedClass, examsList, activeSession]);

    // --- Handlers ---
    const handleSaveExam = async (e) => {
        e.preventDefault();
        if (!examName) {
            alert("Please fill in the Exam Name.");
            return;
        }

        setIsSaving(true);
        try {
            const newExam = {
                name: examName,
                subjects: ALL_SUBJECTS,
                createdAt: new Date().toISOString(),
            };
            
            const examsRef = activeSession ? collection(db, 'sessions', activeSession, 'exams') : collection(db, 'exams');
            await addDoc(examsRef, newExam);
            
            alert(`Exam Pool "${examName}" created successfully.`);
            setExamName('');
            fetchExams(); 
        } catch (error) {
            console.error("Error saving exam:", error);
            alert("Failed to save exam. Check console/security rules.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSubjectChange = (subjectName, isChecked, marks) => {
        setAssignedSubjects(prevSubjects => {
            const existingIndex = prevSubjects.findIndex(s => s.name === subjectName);

            if (isChecked) {
                if (existingIndex > -1) {
                    return prevSubjects.map(s => s.name === subjectName ? { ...s, maxMarks: parseInt(marks || 1) } : s);
                } else {
                    return [...prevSubjects, { name: subjectName, maxMarks: parseInt(marks || 1) }];
                }
            } else {
                return prevSubjects.filter(s => s.name !== subjectName);
            }
        });
    };
    
    const handleMarksChange = (subjectName, marks) => {
        const newMarks = parseInt(marks) || 1;
        setAssignedSubjects(prevSubjects => 
            prevSubjects.map(s => s.name === subjectName ? { ...s, maxMarks: newMarks } : s)
        );
    };

    const handleSaveAssignment = async () => {
        if (!selectedExamId || !selectedClass || assignedSubjects.length === 0) {
            alert("Please select an exam, a class, and assign at least one subject.");
            return;
        }
        
        const invalidMarks = assignedSubjects.some(s => s.maxMarks <= 0 || isNaN(s.maxMarks));
        if (invalidMarks) {
            alert("All assigned subjects must have valid Max Marks (greater than 0).");
            return;
        }

        setIsSaving(true);
        try {
            const docId = `${selectedExamId}_${selectedClass}`;
            const assignmentDocRef = activeSession ? doc(db, 'sessions', activeSession, 'examAssignments', docId) : doc(db, 'examAssignments', docId);
            
            await setDoc(assignmentDocRef, {
                examId: selectedExamId,
                grade: selectedClass,
                subjects: assignedSubjects,
                updatedAt: new Date().toISOString(),
            }, { merge: true });

            alert(`Subjects and Max Marks assigned successfully for Class ${selectedClass} in this exam.`);
        } catch (error) {
            console.error("Error saving assignment:", error);
            alert("Failed to save assignment.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteExam = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete the exam: "${name}"? This will affect all associated marks and assignments.`)) {
            return;
        }

        try {
            const examDocRef = activeSession ? doc(db, 'sessions', activeSession, 'exams', id) : doc(db, 'exams', id);
            await deleteDoc(examDocRef);
            alert(`Exam "${name}" deleted.`);
            fetchExams(); 
        } catch (error) {
            console.error("Error deleting exam:", error);
            alert("Failed to delete exam.");
        }
    };
    
    const getSubjectMarks = (subjectName) => {
        return assignedSubjects.find(s => s.name === subjectName)?.maxMarks || '';
    };

    return (
        <div className="max-w-[1440px] mx-auto p-6 lg:p-8 font-sans relative overflow-hidden" style={{ backgroundColor: colors.background }}>
            {/* Soft Background Decorative Blur Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-10 pointer-events-none -mr-20 -mt-20" style={{ backgroundColor: colors.primary }}></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-10 pointer-events-none -ml-20 -mb-20" style={{ backgroundColor: colors.primary }}></div>

            <div className="relative z-10 space-y-8 animate-in fade-in duration-700">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-[28px] shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl text-white shadow-md" style={{ backgroundColor: colors.primary }}>
                            <HiOutlineDocumentAdd className="w-6 h-6 lg:w-8 lg:h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Exam Scheduler & Assignment</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Manage exam pools, configure structures, and assign marks.</p>
                        </div>
                    </div>
                </div>

                {/* -------------------- 1. Exam Creation Form -------------------- */}
                <div className="bg-white rounded-[28px] p-6 md:p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                        <HiOutlinePlus className="w-5 h-5" style={{ color: colors.primary }} />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">1. Create New Exam Pool</h3>
                    </div>
                    <form onSubmit={handleSaveExam} className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Exam Name</label>
                            <input
                                type="text"
                                value={examName}
                                onChange={(e) => setExamName(e.target.value)}
                                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-full font-medium text-slate-700 outline-none transition-all placeholder:text-slate-300"
                                placeholder="e.g. Annual Examination 2026"
                                required
                            />
                        </div>

                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Subjects Pool</p>
                            <p className="text-xs font-semibold text-slate-600">{ALL_SUBJECTS.join(', ')}</p>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full text-white py-3 rounded-full font-bold text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
                            style={{ backgroundColor: colors.primary }}
                        >
                            {isSaving ? 'Scheduling...' : 'Create Exam Pool'}
                        </button>
                    </form>
                </div>

                {/* -------------------- 2. Subject Assignment & Existing Exams Grid -------------------- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    
                    {/* Assignment Controls */}
                    <div className="bg-white rounded-[28px] p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <HiOutlineAcademicCap className="w-6 h-6" style={{ color: colors.primary }} />
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">2. Assign Subjects & Max Marks</h3>
                        </div>
                        
                        <div className="space-y-4">
                            {/* Exam Selector */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Select Exam</label>
                                <select
                                    value={selectedExamId}
                                    onChange={(e) => setSelectedExamId(e.target.value)}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-full font-bold text-slate-700 outline-none transition-all cursor-pointer"
                                >
                                    {examsList.map(exam => (
                                        <option key={exam.id} value={exam.id}>{exam.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Class Selector */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Select Class</label>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-full font-bold text-slate-700 outline-none transition-all cursor-pointer"
                                >
                                    {MOCK_CLASSES.map(cls => (
                                        <option key={cls} value={cls}>Class {cls}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject Checkboxes and Max Marks Inputs */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Subjects for Class {selectedClass}</label>
                                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto p-3 border border-slate-200 rounded-2xl bg-slate-50/50 custom-scrollbar">
                                    {ALL_SUBJECTS.map(subject => {
                                        const isAssigned = assignedSubjects.some(s => s.name === subject);
                                        const currentMarks = getSubjectMarks(subject);

                                        return (
                                            <div key={subject} className="flex items-center justify-between p-2.5 border-b border-slate-100 last:border-b-0 hover:bg-white/80 rounded-xl transition">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <input
                                                        type="checkbox"
                                                        id={`sub-${subject}`}
                                                        checked={isAssigned}
                                                        onChange={(e) => handleSubjectChange(subject, e.target.checked, currentMarks || 100)}
                                                        className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                    />
                                                    <label htmlFor={`sub-${subject}`} className="text-xs font-bold text-slate-800">{subject}</label>
                                                </div>
                                                
                                                {isAssigned && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Max Marks:</span>
                                                        <input
                                                            type="number"
                                                            value={currentMarks}
                                                            onChange={(e) => handleMarksChange(subject, e.target.value)}
                                                            min="1"
                                                            placeholder="Marks"
                                                            className="w-20 px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none text-center"
                                                            required
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] font-medium text-slate-400 mt-2 italic">Check a subject to include it in the exam schedule for this class, and set its maximum score.</p>
                            </div>
                            
                            <button
                                onClick={handleSaveAssignment}
                                disabled={isSaving || !selectedExamId || assignedSubjects.length === 0}
                                className="w-full py-3 px-6 rounded-full font-bold text-xs uppercase tracking-widest text-white shadow-md transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ backgroundColor: colors.primary }}
                            >
                                <HiOutlineSave className="w-4 h-4" />
                                {isSaving ? 'Assigning...' : 'Save Subject Assignment & Marks'}
                            </button>
                            
                            {/* Button to Time Table Creation */}
                            {assignedSubjects.length > 0 && onNavigate && (
                                <button
                                    onClick={onNavigate}
                                    className="w-full py-3 px-6 rounded-full font-bold text-xs uppercase tracking-widest border border-slate-200 bg-white hover:bg-slate-50 transition-all text-slate-700"
                                >
                                    Go to Create Time Table for Class {selectedClass}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Existing Exams List */}
                    <div className="bg-white rounded-[28px] p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                Existing Exam Pools ({examsList.length})
                            </h3>
                        </div>
                        
                        {loading ? (
                            <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Loading exam schedule...</div>
                        ) : examsList.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No exams scheduled.</div>
                        ) : (
                            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                                {examsList.map((exam) => (
                                    <div key={exam.id} className="border border-slate-100 p-4 rounded-2xl flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 transition">
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-slate-800">{exam.name}</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                                Subjects Pool: {(exam.subjects?.length ?? 0)} subjects
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleDeleteExam(exam.id, exam.name)}
                                                className="p-2 text-rose-500 hover:text-rose-700 rounded-xl hover:bg-rose-50 transition"
                                                title="Delete Exam"
                                            >
                                                <HiOutlineTrash className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExamScheduler;