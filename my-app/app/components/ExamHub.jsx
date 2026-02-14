// components/ExamHub.jsx (Finalized with Roll Nos, Mark Entry, and Generation Actions)

'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';
import { LuListOrdered, LuFileText, LuSave, LuTicket, LuClipboardCheck, LuXCircle } from 'react-icons/lu';
import MarkEntry from './MarkEntry'; // Import the Mark Entry component
import MarksheetGenerator from './MarksheetGenerator'; // Import the Marksheet Generator

// Dedicated function to fetch students filtered by their 'grade' field
async function fetchStudentsByClass(className) {
    if (!className) return [];
    const studentsRef = collection(db, 'students');
    const q = query(studentsRef, where('grade', '==', className));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}


function ExamHub({ classes, exams, refreshExams }) {
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    
    // State to hold and modify the exam roll numbers: { studentId: rollNo }
    const [rollNumberMap, setRollNumberMap] = useState({}); 
    const [isSavingRollNos, setIsSavingRollNos] = useState(false);
    
    // State to toggle Marksheet view
    const [showMarksheets, setShowMarksheets] = useState(false); 

    // Get selected exam details
    const selectedExam = exams.find(e => e.id === selectedExamId);
    const applicableClasses = selectedExam ? selectedExam.applicableClasses : [];
    
    
    // 1. Fetch Students and initialize roll numbers when filters change
    useEffect(() => {
        if (selectedClass) {
            setLoadingStudents(true);
            fetchStudentsByClass(selectedClass)
                .then(students => {
                    setFilteredStudents(students);
                    // Initialize roll numbers based on existing data (from examRollNos map)
                    const initialRolls = students.reduce((acc, student, index) => {
                        const existingRolls = student.examRollNos || {};
                        
                        // Fetches saved roll number or assigns a default sequential one
                        acc[student.id] = existingRolls[selectedExamId] || (index + 1).toString().padStart(2, '0');
                        return acc;
                    }, {});
                    setRollNumberMap(initialRolls);
                    setLoadingStudents(false);
                })
                .catch(err => {
                    console.error("Error fetching students:", err);
                    setLoadingStudents(false);
                });
        } else {
            setFilteredStudents([]);
            setRollNumberMap({});
        }
        // Reset Marksheet view when filters change
        setShowMarksheets(false);
    }, [selectedClass, selectedExamId]);
    
    // 2. Handle Roll Number Input Change
    const handleRollNoChange = (studentId, rollNo) => {
        setRollNumberMap(prev => ({
            ...prev,
            [studentId]: rollNo.trim(),
        }));
    };
    
    // 3. Save All Assigned Exam Roll Numbers to the 'examRollNos' map field
    const handleSaveRollNumbers = async () => {
        if (!selectedExamId || !selectedClass) return alert("Please select both an Exam and a Class.");
        if (filteredStudents.length === 0) return;

        setIsSavingRollNos(true);
        const batch = writeBatch(db);
        
        try {
            filteredStudents.forEach(student => {
                const studentRef = doc(db, 'students', student.id);
                const rollNoValue = rollNumberMap[student.id] || ''; 
                
                // Use dot notation to update a specific key within the 'examRollNos' map.
                const updateField = `examRollNos.${selectedExamId}`;

                batch.update(studentRef, {
                    [updateField]: rollNoValue,
                    [`examClasses.${selectedExamId}`]: selectedClass 
                });
            });

            await batch.commit();
            alert(`Exam Roll Numbers for ${selectedExam.name} - ${selectedClass} saved successfully!`);

        } catch (error) {
            console.error("Error saving roll numbers:", error);
            alert(`Failed to save roll numbers: ${error.message}`);
        } finally {
            setIsSavingRollNos(false);
        }
    };

    // If Marksheet view is active, render only the MarksheetGenerator
    if (showMarksheets) {
        return (
            <MarksheetGenerator
                students={filteredStudents}
                examId={selectedExamId}
                examName={selectedExam?.name}
                className={selectedClass}
                onClose={() => setShowMarksheets(false)} // Pass close function
            />
        );
    }
    
    // --- RENDER BLOCK (Hub View) ---

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-800 flex items-center mb-4">
                <LuFileText className="w-6 h-6 mr-2 text-indigo-600" /> Exam Actions Hub
            </h3>
            
            {/* Filter Controls */}
            <div className="bg-white p-6 rounded-xl shadow-md grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Select Exam</label>
                    <select
                        value={selectedExamId}
                        onChange={(e) => {
                            setSelectedExamId(e.target.value);
                            setSelectedClass(''); // Reset class when exam changes
                        }}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">-- Choose Exam --</option>
                        {exams.map(exam => (
                            <option key={exam.id} value={exam.id}>{exam.name} ({exam.type})</option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Select Class</label>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        disabled={!selectedExamId}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                    >
                        <option value="">-- Filter Class --</option>
                        {classes
                            .filter(cls => applicableClasses.includes(cls.name))
                            .map(cls => (
                                <option key={cls.id} value={cls.name}>{cls.name}</option>
                            ))
                        }
                    </select>
                </div>
                
                <div className="flex items-end">
                    <button 
                        onClick={handleSaveRollNumbers}
                        disabled={!selectedClass || filteredStudents.length === 0 || isSavingRollNos}
                        className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 transition disabled:bg-green-400 flex items-center justify-center"
                    >
                        <LuSave className="w-5 h-5 mr-2" />
                        {isSavingRollNos ? 'Saving...' : 'Save Exam Roll Numbers'}
                    </button>
                </div>
            </div>

            {/* Roll Number Assignment Table */}
            {selectedClass && (
                <div className="mt-6 bg-white p-6 rounded-xl shadow-md space-y-4">
                    <h4 className="text-lg font-bold text-indigo-700 flex items-center">
                        <LuListOrdered className="w-5 h-5 mr-2" /> Assign/Update Roll Numbers for: {selectedClass}
                    </h4>
                    
                    {loadingStudents ? (
                        <p className="text-center p-8">Loading students...</p>
                    ) : filteredStudents.length === 0 ? (
                        <p className="text-center p-8 text-gray-500">No students found in {selectedClass} to assign roll numbers.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Roll No.</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredStudents.map((student) => (
                                        <tr key={student.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.studentId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <input
                                                    type="text"
                                                    value={rollNumberMap[student.id] || ''}
                                                    onChange={(e) => handleRollNoChange(student.id, e.target.value)}
                                                    placeholder="e.g., 101"
                                                    className="border border-gray-300 rounded-md p-1.5 w-24 text-center focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            
            {/* Mark Entry Component Integration */}
            {selectedClass && filteredStudents.length > 0 && selectedExam && (
                <MarkEntry
                    students={filteredStudents}
                    className={selectedClass}
                    examId={selectedExamId}
                    examName={selectedExam.name}
                />
            )}

            {/* --- Generation Panel --- */}
            {selectedClass && filteredStudents.length > 0 && selectedExam && (
                <div className="mt-6 bg-white p-6 rounded-xl shadow-md space-y-4">
                    <h4 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center">
                        Generate Documents
                    </h4>
                    <p className="text-sm text-gray-600">Select an action to generate and print official documents for the selected class.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        
                        {/* Admit Card Button (Remains as alert for now) */}
                        <button
                            onClick={() => alert(`Generating Admit Cards for ${selectedExam.name} - ${selectedClass}. This requires a dedicated print component to format the data.`)}
                            className="flex items-center justify-center space-x-2 px-6 py-3 border border-indigo-600 text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition"
                        >
                            <LuTicket className="w-5 h-5" />
                            <span>Generate & Print Admit Cards</span>
                        </button>

                        {/* Marksheet Button (Toggles Marksheet View) */}
                        <button
                            onClick={() => setShowMarksheets(true)}
                            className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                        >
                            <LuClipboardCheck className="w-5 h-5" />
                            <span>Generate & Print Marksheets</span>
                        </button>

                    </div>
                </div>
            )}
            
            <div className="h-6"></div> {/* Spacer */}
        </div>
    );
}

export default ExamHub;