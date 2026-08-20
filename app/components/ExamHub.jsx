'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';
import { LuListOrdered, LuFileText, LuSave, LuTicket, LuClipboardCheck } from 'react-icons/lu';
import MarkEntry from './MarkEntry';
import MarksheetGenerator from './MarksheetGenerator';
import { useColors } from '../components/ColorComponent';

async function fetchStudentsByClass(className) {
    if (!className) return [];
    const studentsRef = collection(db, 'students');
    const q = query(studentsRef, where('grade', '==', className));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

function ExamHub({ classes, exams, refreshExams, activeSession }) {
    const colors = useColors();

    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    
    const [rollNumberMap, setRollNumberMap] = useState({}); 
    const [isSavingRollNos, setIsSavingRollNos] = useState(false);
    
    const [showMarksheets, setShowMarksheets] = useState(false); 

    const selectedExam = exams.find(e => e.id === selectedExamId);
    const applicableClasses = selectedExam ? selectedExam.applicableClasses : [];
    
    useEffect(() => {
        if (selectedClass) {
            setLoadingStudents(true);
            fetchStudentsByClass(selectedClass)
                .then(students => {
                    setFilteredStudents(students);
                    const initialRolls = students.reduce((acc, student, index) => {
                        const existingRolls = student.examRollNos || {};
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
        setShowMarksheets(false);
    }, [selectedClass, selectedExamId]);
    
    const handleRollNoChange = (studentId, rollNo) => {
        setRollNumberMap(prev => ({
            ...prev,
            [studentId]: rollNo.trim(),
        }));
    };
    
    const handleSaveRollNumbers = async () => {
        if (!selectedExamId || !selectedClass) return alert("Please select both an Exam and a Class.");
        if (filteredStudents.length === 0) return;

        setIsSavingRollNos(true);
        const batch = writeBatch(db);
        
        try {
            filteredStudents.forEach(student => {
                const studentRef = doc(db, 'students', student.id);
                const rollNoValue = rollNumberMap[student.id] || ''; 
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

    if (showMarksheets) {
        return (
            <MarksheetGenerator
                students={filteredStudents}
                examId={selectedExamId}
                examName={selectedExam?.name}
                className={selectedClass}
                onClose={() => setShowMarksheets(false)}
            />
        );
    }

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
                            <LuFileText className="w-6 h-6 lg:w-8 lg:h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Exam Actions Hub</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Manage exam roll numbers, mark entries, and print official documents.</p>
                        </div>
                    </div>
                </div>
                
                {/* Filter Controls */}
                <div className="bg-white rounded-[28px] p-6 md:p-8 shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Select Exam</label>
                        <select
                            value={selectedExamId}
                            onChange={(e) => {
                                setSelectedExamId(e.target.value);
                                setSelectedClass('');
                            }}
                            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-full font-bold text-slate-700 outline-none transition-all cursor-pointer"
                        >
                            <option value="">-- Choose Exam --</option>
                            {exams.map(exam => (
                                <option key={exam.id} value={exam.id}>{exam.name} ({exam.type})</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Select Class</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            disabled={!selectedExamId}
                            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-full font-bold text-slate-700 outline-none transition-all cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
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
                    
                    <div>
                        <button 
                            onClick={handleSaveRollNumbers}
                            disabled={!selectedClass || filteredStudents.length === 0 || isSavingRollNos}
                            className="w-full py-3 px-6 rounded-full font-bold text-xs uppercase tracking-widest text-white shadow-md transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ backgroundColor: colors.primary }}
                        >
                            <LuSave className="w-4 h-4" />
                            {isSavingRollNos ? 'Saving...' : 'Save Exam Roll Numbers'}
                        </button>
                    </div>
                </div>

                {/* Roll Number Assignment Table */}
                {selectedClass && (
                    <div className="bg-white rounded-[28px] p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <LuListOrdered className="w-6 h-6" style={{ color: colors.primary }} />
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Assign/Update Roll Numbers for: Class {selectedClass}</h3>
                        </div>
                        
                        {loadingStudents ? (
                            <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Loading students...</div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No students found in {selectedClass} to assign roll numbers.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Student Name</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Student ID</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Exam Roll No.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filteredStudents.map((student) => (
                                            <tr key={student.id} className="hover:bg-slate-50/80 transition">
                                                <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-800">{student.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-500">{student.studentId}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                                                    <input
                                                        type="text"
                                                        value={rollNumberMap[student.id] || ''}
                                                        onChange={(e) => handleRollNoChange(student.id, e.target.value)}
                                                        placeholder="e.g., 101"
                                                        className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-bold text-slate-800 outline-none text-center transition-all"
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
                        activeSession={activeSession}
                    />
                )}

                {/* --- Generation Panel --- */}
                {selectedClass && filteredStudents.length > 0 && selectedExam && (
                    <div className="bg-white rounded-[28px] p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight pb-2 border-b border-slate-100">Generate Documents</h3>
                            <p className="text-xs font-medium text-slate-400 mt-2">Select an action to generate and print official documents for the selected class.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => alert(`Generating Admit Cards for ${selectedExam.name} - ${selectedClass}. This requires a dedicated print component to format the data.`)}
                                className="flex items-center justify-center space-x-2 px-6 py-3 border border-slate-200 bg-white hover:bg-slate-50 rounded-full font-bold text-xs uppercase tracking-widest text-slate-700 transition-all active:scale-[0.99]"
                            >
                                <LuTicket className="w-4 h-4" />
                                <span>Generate & Print Admit Cards</span>
                            </button>

                            <button
                                onClick={() => setShowMarksheets(true)}
                                className="flex items-center justify-center space-x-2 px-6 py-3 text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.99]"
                                style={{ backgroundColor: colors.primary }}
                            >
                                <LuClipboardCheck className="w-4 h-4" />
                                <span>Generate & Print Marksheets</span>
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="h-6"></div>
            </div>
        </div>
    );
}

export default ExamHub;