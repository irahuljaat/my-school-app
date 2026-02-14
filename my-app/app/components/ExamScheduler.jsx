// components/ExamScheduler.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config'; 
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, setDoc, where } from 'firebase/firestore'; 
import { HiOutlinePlus, HiOutlineTrash, HiOutlineAcademicCap } from 'react-icons/hi';

// Mock list of all available subjects (Admin can edit this if needed)
const ALL_SUBJECTS = ['Math', 'Science', 'English', 'Social Science', 'Computer Science', 'Hindi', 'G.K' , 'Drawing'];
const MOCK_CLASSES = ['LKG','UKG','PREP' ,'1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];


function ExamScheduler({ onNavigate }) {
    // --- State for New Exam ---
    const [examName, setExamName] = useState('');
    // [CHANGE 1: Removed maxMarks state from Exam Pool creation]
    const [isSaving, setIsSaving] = useState(false);
    
    // --- State for Subject Assignment (Refactored) ---
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedClass, setSelectedClass] = useState(MOCK_CLASSES[0]);
    
    // [CHANGE 2: Refactored state for subject assignment to hold objects]
    // assignedSubjects: [{ name: 'Math', maxMarks: 80 }, { name: 'Science', maxMarks: 100 }]
    const [assignedSubjects, setAssignedSubjects] = useState([]); 
    
    // --- State for Lists ---
    const [examsList, setExamsList] = useState([]);
    const [loading, setLoading] = useState(true);
    

    // --- Data Fetching ---
    const fetchExams = async () => {
        setLoading(true);
        try {
            const examsRef = collection(db, 'exams');
            const q = query(examsRef, orderBy('createdAt', 'desc')); 
            const snapshot = await getDocs(q);
            
            const exams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setExamsList(exams);

            if (exams.length > 0) {
                // Initialize selection to the latest exam
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
    }, []);

    // Effect to fetch subject assignments when exam or class changes
    useEffect(() => {
        const fetchAssignment = async () => {
            if (!selectedExamId || !selectedClass) return;
            
            try {
                const docId = `${selectedExamId}_${selectedClass}`;
                // Using Firestore query by document ID field name
                const docSnap = await getDocs(query(collection(db, 'examAssignments'), where('__name__', '==', docId)));
                
                if (!docSnap.empty) {
                    // Subjects are now expected to be an array of objects
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
    }, [selectedExamId, selectedClass, examsList]);


    // --- Handlers ---
    
    // Save New Exam (Definition)
    const handleSaveExam = async (e) => {
        e.preventDefault();
        // [CHANGE 1: Max Marks validation removed]
        if (!examName) {
            alert("Please fill in the Exam Name.");
            return;
        }

        setIsSaving(true);
        try {
            const newExam = {
                name: examName,
                // maxMarks field removed
                subjects: ALL_SUBJECTS, // All subjects are available in the pool
                createdAt: new Date().toISOString(),
            };
            
            await addDoc(collection(db, 'exams'), newExam);
            
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
    
    // [CHANGE 3: Handler for updating Max Marks per subject]
    const handleSubjectChange = (subjectName, isChecked, marks) => {
        setAssignedSubjects(prevSubjects => {
            const existingIndex = prevSubjects.findIndex(s => s.name === subjectName);

            if (isChecked) {
                // Add or update the subject
                if (existingIndex > -1) {
                    // Update marks if subject already exists
                    return prevSubjects.map(s => s.name === subjectName ? { ...s, maxMarks: parseInt(marks || 1) } : s);
                } else {
                    // Add new subject
                    return [...prevSubjects, { name: subjectName, maxMarks: parseInt(marks || 1) }];
                }
            } else {
                // Remove the subject
                return prevSubjects.filter(s => s.name !== subjectName);
            }
        });
    };
    
    // [CHANGE 3: Handler for updating Max Marks input]
    const handleMarksChange = (subjectName, marks) => {
        const newMarks = parseInt(marks) || 1; // Ensure it's a number, default to 1
        
        setAssignedSubjects(prevSubjects => 
            prevSubjects.map(s => s.name === subjectName ? { ...s, maxMarks: newMarks } : s)
        );
    };

    // Save Subject Assignment (New Feature)
    const handleSaveAssignment = async () => {
        if (!selectedExamId || !selectedClass || assignedSubjects.length === 0) {
            alert("Please select an exam, a class, and assign at least one subject.");
            return;
        }
        
        // Final validation: check if all assigned subjects have valid marks
        const invalidMarks = assignedSubjects.some(s => s.maxMarks <= 0 || isNaN(s.maxMarks));
        if (invalidMarks) {
            alert("All assigned subjects must have valid Max Marks (greater than 0).");
            return;
        }

        setIsSaving(true);
        try {
            const docId = `${selectedExamId}_${selectedClass}`;
            await setDoc(doc(db, 'examAssignments', docId), {
                examId: selectedExamId,
                grade: selectedClass,
                subjects: assignedSubjects, // Array of { name, maxMarks }
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

    // Delete Exam
    const handleDeleteExam = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete the exam: "${name}"? This will affect all associated marks and assignments.`)) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'exams', id));
            // NOTE: You should also delete related documents in 'marks', 'examAssignments', etc., for a clean slate.
            alert(`Exam "${name}" deleted.`);
            fetchExams(); 
        } catch (error) {
            console.error("Error deleting exam:", error);
            alert("Failed to delete exam.");
        }
    };
    
    // Helper to get max marks for a subject (used in UI)
    const getSubjectMarks = (subjectName) => {
        return assignedSubjects.find(s => s.name === subjectName)?.maxMarks || '';
    };

    return (
        <div className="space-y-6">
            
            {/* -------------------- 1. Exam Creation Form (Max Marks REMOVED) -------------------- */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-red-600">
                <h3 className="text-2xl font-bold text-red-600 mb-4 border-b pb-2 flex items-center">
                    <HiOutlinePlus className="w-6 h-6 mr-2" /> 1. Create New Exam Pool
                </h3>
                <form onSubmit={handleSaveExam} className="grid grid-cols-3 gap-4">
                    <div className="col-span-3">
                        <label className="block text-sm font-medium text-gray-700">Exam Name</label>
                        <input
                            type="text"
                            value={examName}
                            onChange={(e) => setExamName(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500"
                            required
                        />
                    </div>
                    {/* Max Marks input field REMOVED from Exam Pool creation */}

                    <div className="col-span-3">
                        <p className="text-sm font-medium text-gray-700">Available Subjects Pool:</p>
                        <p className="text-xs text-gray-500 mt-1">{ALL_SUBJECTS.join(', ')}</p>
                    </div>
                    <div className="col-span-3">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:bg-red-400 transition"
                        >
                            {isSaving ? 'Scheduling...' : 'Create Exam Pool'}
                        </button>
                    </div>
                </form>
            </div>

            {/* -------------------- 2. Subject Assignment (Max Marks ADDED per Subject) -------------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Assignment Controls */}
                <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-indigo-600">
                    <h3 className="text-2xl font-bold text-indigo-600 mb-4 border-b pb-2 flex items-center">
                        <HiOutlineAcademicCap className="w-6 h-6 mr-2" /> 2. Assign Subjects & Max Marks
                    </h3>
                    
                    <div className="space-y-4">
                        {/* Exam Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Select Exam</label>
                            <select
                                value={selectedExamId}
                                onChange={(e) => setSelectedExamId(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            >
                                {examsList.map(exam => (
                                    <option key={exam.id} value={exam.id}>{exam.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Class Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Select Class</label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            >
                                {MOCK_CLASSES.map(cls => (
                                    <option key={cls} value={cls}>Class {cls}</option>
                                ))}
                            </select>
                        </div>

                        {/* Subject Checkboxes and Max Marks Inputs */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Subjects for Class {selectedClass}:</label>
                            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto p-3 border rounded-md">
                                {ALL_SUBJECTS.map(subject => {
                                    const isAssigned = assignedSubjects.some(s => s.name === subject);
                                    const currentMarks = getSubjectMarks(subject);

                                    return (
                                        <div key={subject} className="flex items-center p-1 border-b last:border-b-0">
                                            <div className="flex items-center flex-1">
                                                <input
                                                    type="checkbox"
                                                    id={`sub-${subject}`}
                                                    checked={isAssigned}
                                                    onChange={(e) => handleSubjectChange(subject, e.target.checked, currentMarks || 100)} // Pass default marks on check
                                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                />
                                                <label htmlFor={`sub-${subject}`} className="ml-2 text-sm text-gray-900 font-medium w-32">{subject}</label>
                                            </div>
                                            
                                            {/* MAX MARKS INPUT FIELD (Conditional) */}
                                            {isAssigned && (
                                                <div className="flex items-center ml-4">
                                                    <span className="text-xs text-gray-600 mr-2 whitespace-nowrap">Max Marks:</span>
                                                    <input
                                                        type="number"
                                                        value={currentMarks}
                                                        onChange={(e) => handleMarksChange(subject, e.target.value)}
                                                        min="1"
                                                        placeholder="Marks"
                                                        className="w-16 p-1 border border-gray-300 rounded-md text-sm text-center focus:ring-indigo-500"
                                                        required
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Check a subject to include it in the exam schedule for this class, and set its maximum score.</p>
                        </div>
                        
                        <button
                            onClick={handleSaveAssignment}
                            disabled={isSaving || !selectedExamId || assignedSubjects.length === 0}
                            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400 transition"
                        >
                            {isSaving ? 'Assigning...' : 'Save Subject Assignment & Marks'}
                        </button>
                        
                        {/* Button to Time Table Creation */}
                        {assignedSubjects.length > 0 && (
                            <button
                                onClick={onNavigate}
                                className="w-full py-2 px-4 border border-indigo-600 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none transition"
                            >
                                Go to Create Time Table for Class {selectedClass}
                            </button>
                        )}
                    </div>
                </div>

                {/* Existing Exams List (Updated to remove Max Marks from display) */}
                <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-gray-400">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
                        Existing Exam Pools ({examsList.length})
                    </h3>
                    
                    {loading ? (
                        <p className="p-10 text-center text-gray-500">Loading exam schedule...</p>
                    ) : examsList.length === 0 ? (
                        <p className="p-10 text-center text-gray-500">No exams scheduled.</p>
                    ) : (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {examsList.map((exam) => (
                                <div key={exam.id} className="border border-gray-200 p-4 rounded-lg flex justify-between items-center hover:bg-gray-50 transition">
                                    <div className="flex-1">
                                        <p className="text-lg font-semibold text-gray-900">{exam.name}</p>
                                        {/* Max Marks display removed from this view */}
                                        <p className="text-xs text-gray-500 mt-1">
                                            Subjects Pool: {(exam.subjects?.length ?? 0)} subjects
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleDeleteExam(exam.id, exam.name)}
                                            className="p-2 text-red-500 hover:text-red-700 transition"
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
    );
}

export default ExamScheduler;