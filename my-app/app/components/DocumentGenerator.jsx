'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { 
    HiOutlineRefresh, 
    HiOutlinePrinter, 
    HiOutlineChevronLeft, 
    HiOutlineDatabase,
    HiOutlineLightningBolt
} from 'react-icons/hi';
import AdmitCardTemplate from './AdmitCardTemplate';

function DocumentGenerator({ onBack, activeSession }) {
    const [exams, setExams] = useState([]);
    const [classes] = useState(['LKG','UKG','PREP' ,'1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
    const [selectedExams, setSelectedExams] = useState([]); 
    const [selectedClass, setSelectedClass] = useState('');
    const [generatedData, setGeneratedData] = useState([]); 
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showOnlyDummy, setShowOnlyDummy] = useState(false); // NEW: Dummy Toggle State

    // Load Exams for the session
    const fetchDropdownData = useCallback(async () => {
        if (!activeSession) return;
        try {
            const examsSnap = await getDocs(collection(db, 'sessions', activeSession, 'exams'));
            setExams(examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            setMessage({ type: 'error', text: 'Could not load exams.' });
        }
    }, [activeSession]);

    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    const fetchData = async () => {
        if (!selectedClass || !selectedExams[0]) {
            setMessage({ type: 'error', text: 'Select Class and Exam.' });
            return;
        }
        setLoading(true);
        setGeneratedData([]);
        
        try {
            // 1. Fetch ALL Students for the class from the correct session collection
            let studentRef = collection(db, 'sessions', activeSession, 'students');
            let studentSnap = await getDocs(query(studentRef, where('grade', '==', selectedClass)));
            
            // Fallback to global collection if session collection is empty
            if (studentSnap.empty) {
                studentRef = collection(db, 'students');
                studentSnap = await getDocs(query(studentRef, where('grade', '==', selectedClass)));
            }

            // LOCAL FILTERING: Handle Normal vs Dummy logic
            let students = studentSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(student => {
                    if (showOnlyDummy) {
                        return student.isDummy === true;
                    } else {
                        // Show if false OR if the field doesn't exist (legacy/normal students)
                        return student.isDummy === false || student.isDummy === undefined;
                    }
                });

            if (students.length === 0) {
                setMessage({ type: 'error', text: `No ${showOnlyDummy ? 'Dummy' : 'Normal'} students found for Class ${selectedClass}.` });
                setLoading(false);
                return;
            }

            // --- ALPHABETICAL SORT (A-Z) ---
            students.sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: 'base' }));

            // 2. Fetch Timetable for the selected Exam
            const examId = selectedExams[0];
            const tq = query(
                collection(db, 'sessions', activeSession, 'timetables'),
                where('examId', '==', examId),
                where('grades', 'array-contains', selectedClass)
            );
            const tSnap = await getDocs(tq);
            const globalSchedule = tSnap.empty ? [] : tSnap.docs[0].data().schedule || [];

            // 3. Process data for each student
            const finalData = students.map(student => {
                let schedule = globalSchedule;
                
                // Subject Filtering for 11/12 or Optional Subjects
                if (parseInt(selectedClass) >= 11) {
                    const getCleanList = (val) => {
                        if (!val) return [];
                        const list = Array.isArray(val) ? val : [val];
                        return list.map(s => String(s).toLowerCase().trim());
                    };

                    const enrolledSubjects = [
                        ...getCleanList(student.subjects),
                        ...getCleanList(student.optionalSubject),
                        ...getCleanList(student.optionalSubjects),
                        ...getCleanList(student.additionalSubject)
                    ];

                    schedule = globalSchedule.filter(item => {
                        const subName = item.subject.toLowerCase().trim();
                        return enrolledSubjects.includes(subName) || 
                               subName === 'hindi' || 
                               subName === 'english';
                    });
                }

                return {
                    student,
                    data: {
                        examName: exams.find(e => e.id === examId)?.name || 'Examination',
                        schedule: schedule.map(s => ({
                            date: s.date,
                            time: `${s.startTime} - ${s.endTime}`,
                            subjectName: s.subject
                        }))
                    }
                };
            });

            setGeneratedData(finalData);
            setMessage({ type: 'success', text: `Generated ${finalData.length} ${showOnlyDummy ? 'Dummy' : 'Normal'} cards.` });
        } catch (e) {
            console.error("Generator Error:", e);
            setMessage({ type: 'error', text: 'Error fetching data.' });
        }
        setLoading(false);
    };

    return (
        <div className="bg-slate-50 min-h-screen p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
                    <div>
                        <button onClick={onBack} className="flex items-center text-indigo-600 font-bold mb-2 uppercase text-[10px] tracking-widest">
                            <HiOutlineChevronLeft className="w-4 h-4 mr-1"/> Back
                        </button>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Admit Card Desk</h1>
                    </div>
                    
                    <div className="flex gap-3">
                        {/* DUMMY TOGGLE BUTTON */}
                        <button 
                            onClick={() => {
                                setShowOnlyDummy(!showOnlyDummy);
                                setGeneratedData([]); // Clear previous cards to avoid confusion
                            }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest shadow-sm ${
                                showOnlyDummy 
                                ? 'bg-rose-500 border-rose-600 text-white shadow-rose-100' 
                                : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-400'
                            }`}
                        >
                            <HiOutlineLightningBolt className={showOnlyDummy ? "animate-bounce" : ""} />
                            {showOnlyDummy ? 'Dummy' : 'Normal'}
                        </button>

                        <div className="px-5 py-2.5 bg-white rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm">
                            <HiOutlineDatabase className="text-indigo-500 w-5 h-5" />
                            <p className="font-black text-slate-700 text-xs uppercase tracking-widest">{activeSession}</p>
                        </div>
                    </div>
                </div>

                {/* Control Panel */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 no-print">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-2">Class</label>
                            <select 
                                value={selectedClass} 
                                onChange={(e) => {setSelectedClass(e.target.value); setGeneratedData([]);}}
                                className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-slate-700 outline-none ring-1 ring-slate-100 focus:ring-indigo-500"
                            >
                                <option value="">Select Class</option>
                                {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-2">Exam</label>
                            <select 
                                value={selectedExams[0] || ''} 
                                onChange={(e) => {setSelectedExams([e.target.value]); setGeneratedData([]);}}
                                className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-slate-700 outline-none ring-1 ring-slate-100 focus:ring-indigo-500"
                            >
                                <option value="">Select Exam</option>
                                {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                            </select>
                        </div>

                        <div className="flex items-end gap-3">
                            <button onClick={fetchData} disabled={loading} className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
                                <HiOutlineRefresh className={loading ? 'animate-spin' : ''}/> {loading ? 'Loading...' : `Get ${showOnlyDummy ? 'Dummy' : 'Normal'} Cards`}
                            </button>
                            <button onClick={() => window.print()} disabled={generatedData.length === 0} className="bg-slate-800 text-white p-4 rounded-2xl font-black transition-all hover:bg-slate-700 disabled:opacity-30">
                                <HiOutlinePrinter size={24}/>
                            </button>
                        </div>
                    </div>
                    {message && <div className={`mt-4 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg ${message.type === 'error' ? 'text-rose-500 bg-rose-50' : 'text-emerald-600 bg-emerald-50'}`}>{message.text}</div>}
                </div>

                {/* THE PRINT AREA */}
                <div id="printable-content" className="print-area">
                    {generatedData.map((item, idx) => (
                        <div key={idx} className="admit-card-wrapper">
                            <AdmitCardTemplate student={item.student} data={item.data} />
                        </div>
                    ))}
                </div>
            </div>

            <style jsx global>{`
                .print-area { width: 100%; display: block; }

                @media print {
                    .no-print { display: none !important; }
                    body * { visibility: hidden !important; }
                    #printable-content, #printable-content * { visibility: visible !important; }
                    #printable-content {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                    }
                    .admit-card-wrapper { 
                        display: block !important;
                        height: 48.5vh !important; 
                        box-sizing: border-box !important;
                        padding: 5mm 5mm !important;
                        position: relative !important;
                    }
                    .admit-card-wrapper:nth-child(odd) { padding-top: 7mm !important; }
                    .admit-card-wrapper:nth-child(2n) {
                        page-break-after: always !important;
                    }
                    @page { size: A4 portrait; margin: 0; }
                }
            `}</style>
        </div>
    );
}

export default DocumentGenerator;