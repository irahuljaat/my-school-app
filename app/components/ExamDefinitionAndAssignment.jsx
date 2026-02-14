'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase/config';
import { collection, doc, getDoc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { 
    HiOutlineDocumentAdd, 
    HiOutlineAcademicCap, 
    HiOutlineSave, 
    HiOutlineX, 
    HiOutlineArrowRight, 
    HiOutlineInformationCircle,
    HiOutlineDatabase
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

    // 1. Fetch Existing Exams for this specific session
    const fetchExams = useCallback(async () => {
        if (!activeSession) return;
        try {
            // Path updated to session-specific location
            const snapshot = await getDocs(collection(db, 'sessions', activeSession, 'exams'));
            const fetchedExams = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
            setExamsList(fetchedExams);
            if (fetchedExams.length > 0 && !selectedExamId) {
                setSelectedExamId(fetchedExams[0].id);
            }
        } catch (error) {
            console.error("Error fetching exams:", error);
        }
    }, [activeSession, selectedExamId]);

    // 2. Fetch current assignments from the session sub-collection
    const fetchCurrentAssignments = useCallback(async (examId, classes) => {
        if (!examId || classes.length === 0 || !activeSession) return;
        setLoading(true);

        try {
            const docId = `${examId}_${classes[0]}`;
            // Path updated to session-specific location
            const docRef = doc(db, 'sessions', activeSession, 'examAssignments', docId);
            const snap = await getDoc(docRef);

            const baseSubjects = MOCK_ALL_SUBJECTS.map(name => ({
                name,
                isSelected: false,
                maxMarks: 100
            }));

            if (snap.exists()) {
                const savedSubjects = snap.data().subjects || [];
                const updatedList = baseSubjects.map(base => {
                    const saved = savedSubjects.find(s => s.name === base.name);
                    if (saved) {
                        return { ...base, isSelected: true, maxMarks: saved.maxMarks };
                    }
                    return base;
                });
                setSubjectAssignments(updatedList);
                setMessage({ type: 'info', text: `Loaded assignments for ${activeSession}` });
            } else {
                setSubjectAssignments(baseSubjects);
                setMessage(null);
            }
        } catch (error) {
            console.error("Error fetching existing assignments:", error);
        } finally {
            setLoading(false);
        }
    }, [activeSession]);

    useEffect(() => {
        fetchExams();
    }, [fetchExams]);

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
            // Save inside the session
            await setDoc(doc(db, 'sessions', activeSession, 'exams', examId), { 
                name, 
                createdAt: new Date().toISOString() 
            }, { merge: true });
            
            setMessage({ type: 'success', text: `Exam "${name}" created for ${activeSession}!` });
            setExamNameInput('');
            setSelectedExamId(examId);
            fetchExams();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save exam.' });
        } finally {
            setLoading(false);
        }
    };

    const handleAssignSubjects = async () => {
        const selectedSubjects = subjectAssignments.filter(sub => sub.isSelected);
        if (!selectedExamId || selectedClasses.length === 0 || selectedSubjects.length === 0 || !activeSession) {
            setMessage({ type: 'error', text: 'Please complete all selections.' });
            return;
        }

        setLoading(true);
        try {
            const assignmentSubjectsData = selectedSubjects.map(sub => ({
                name: sub.name,
                maxMarks: sub.maxMarks,
            }));

            const assignmentPromises = selectedClasses.map(classId => {
                const assignmentDocId = `${selectedExamId}_${classId}`; 
                // Save inside the session sub-collection
                return setDoc(doc(db, 'sessions', activeSession, 'examAssignments', assignmentDocId), {
                    examId: selectedExamId,
                    classId: classId,
                    subjects: assignmentSubjectsData,
                    updatedAt: new Date().toISOString(),
                });
            });

            await Promise.all(assignmentPromises);
            setMessage({ type: 'success', text: `Configuration saved for ${activeSession}!` });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to assign.' });
        } finally {
            setLoading(false);
        }
    };

    // UI Render logic remains the same...
    const handleToggleSubject = (subjectName) => {
        setSubjectAssignments(prev => prev.map(sub => 
            sub.name === subjectName ? { ...sub, isSelected: !sub.isSelected } : sub
        ));
    };

    const handleMaxMarksChange = (subjectName, value) => {
        const numericValue = parseInt(value);
        setSubjectAssignments(prev => prev.map(sub => 
            sub.name === subjectName ? { ...sub, maxMarks: numericValue || 0 } : sub
        ));
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-purple-600 space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-purple-600 flex items-center">
                    <HiOutlineDocumentAdd className="w-8 h-8 mr-2" /> Exam Setup
                </h2>
                <div className="bg-purple-100 text-purple-700 px-4 py-1 rounded-full font-black text-sm flex items-center">
                    <HiOutlineDatabase className="mr-2" /> {activeSession}
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center text-sm font-medium ${
                    message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 
                    message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
                    'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                    <HiOutlineInformationCircle className="w-5 h-5 mr-2" />
                    {message.text}
                </div>
            )}

            {/* Step 1: Create Exam */}
            <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100 shadow-sm">
                <h3 className="text-lg font-bold text-purple-800 mb-4">Step 1: Define Exam Title</h3>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={examNameInput}
                        onChange={(e) => setExamNameInput(e.target.value)}
                        className="flex-1 p-3 rounded-xl border-2 border-white focus:border-purple-500 outline-none transition-all shadow-inner"
                        placeholder="e.g. Annual Exam"
                    />
                    <button onClick={handleSaveExamName} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 shadow-lg">
                        Create Exam
                    </button>
                </div>
            </div>

            {/* Step 2: Subject Assignment */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Active Exam</label>
                        <select
                            value={selectedExamId}
                            onChange={(e) => setSelectedExamId(e.target.value)}
                            className="w-full p-3 bg-gray-50 rounded-xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            {examsList.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Apply to Classes</label>
                        <select
                            multiple
                            value={selectedClasses}
                            onChange={(e) => setSelectedClasses(Array.from(e.target.selectedOptions, o => o.value))}
                            className="w-full p-3 bg-gray-50 rounded-xl border-none ring-1 ring-gray-200 h-24 outline-none"
                        >
                            {MOCK_CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-xl font-bold text-gray-800">Subject Configuration</h4>
                        <button
                            onClick={handleAssignSubjects}
                            disabled={loading}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg"
                        >
                            {loading ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subjectAssignments.map((sub) => (
                            <div 
                                key={sub.name}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                                    sub.isSelected 
                                    ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                                    : 'border-gray-100 bg-white hover:border-gray-300'
                                }`}
                                onClick={() => handleToggleSubject(sub.name)}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`font-bold ${sub.isSelected ? 'text-indigo-800' : 'text-gray-500'}`}>{sub.name}</span>
                                    <input type="checkbox" checked={sub.isSelected} readOnly className="rounded text-indigo-600 h-5 w-5" />
                                </div>
                                {sub.isSelected && (
                                    <div className="mt-auto pt-3 border-t border-indigo-200 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                                        <span className="text-xs font-bold text-indigo-400 uppercase">Max Marks</span>
                                        <input
                                            type="number"
                                            value={sub.maxMarks}
                                            onChange={(e) => handleMaxMarksChange(sub.name, e.target.value)}
                                            className="w-20 p-1 text-center font-bold bg-white border border-indigo-300 rounded-lg text-indigo-600"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExamDefinitionAndAssignment;