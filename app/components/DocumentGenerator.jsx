'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    const [showOnlyDummy, setShowOnlyDummy] = useState(false);

    const fetchDropdownData = useCallback(async () => {
        if (!activeSession) return;
        try {
            const examsSnap = await getDocs(collection(db, 'sessions', activeSession, 'exams'));
            setExams(examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            setMessage({ type: 'error', text: 'Could not load exams.' });
        }
    }, [activeSession]);

    useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);

    const fetchData = async () => {
        if (!selectedClass || !selectedExams[0]) {
            setMessage({ type: 'error', text: 'Select Class and Exam.' });
            return;
        }
        setLoading(true);
        setGeneratedData([]);
        
        try {
            let studentRef = collection(db, 'sessions', activeSession, 'students');
            let studentSnap = await getDocs(query(studentRef, where('grade', '==', selectedClass)));
            
            if (studentSnap.empty) {
                studentRef = collection(db, 'students');
                studentSnap = await getDocs(query(studentRef, where('grade', '==', selectedClass)));
            }

            let students = studentSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(student => showOnlyDummy ? student.isDummy === true : (student.isDummy === false || student.isDummy === undefined));

            if (students.length === 0) {
                setMessage({ type: 'error', text: `No students found.` });
                setLoading(false);
                return;
            }

            students.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

            const examId = selectedExams[0];
            const tq = query(
                collection(db, 'sessions', activeSession, 'timetables'),
                where('examId', '==', examId),
                where('grades', 'array-contains', selectedClass)
            );
            const tSnap = await getDocs(tq);
            const globalSchedule = tSnap.empty ? [] : tSnap.docs[0].data().schedule || [];

            const finalData = students.map(student => {
                let schedule = globalSchedule;
                if (parseInt(selectedClass) >= 11) {
                    const getCleanList = (val) => {
                        if (!val) return [];
                        return (Array.isArray(val) ? val : [val]).map(s => String(s).toLowerCase().trim());
                    };
                    const enrolled = [...getCleanList(student.subjects), ...getCleanList(student.optionalSubjects)];
                    schedule = globalSchedule.filter(item => enrolled.includes(item.subject.toLowerCase().trim()) || ['hindi','english'].includes(item.subject.toLowerCase().trim()));
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
            setMessage({ type: 'success', text: `Loaded ${finalData.length} cards.` });
        } catch (e) {
            setMessage({ type: 'error', text: 'Error fetching data.' });
        }
        setLoading(false);
    };

    return (
        <div className="bg-slate-50 min-h-screen p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Dashboard Header (Hidden on Print) */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
                    <div>
                        <button onClick={onBack} className="flex items-center text-indigo-600 font-bold mb-2 uppercase text-[10px] tracking-widest">
                            <HiOutlineChevronLeft className="w-4 h-4 mr-1"/> Back
                        </button>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Admit Card Desk</h1>
                    </div>
                    
                    <div className="flex gap-3">
                        <button onClick={() => { setShowOnlyDummy(!showOnlyDummy); setGeneratedData([]); }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest ${showOnlyDummy ? 'bg-rose-500 border-rose-600 text-white' : 'bg-white text-slate-500'}`}>
                            <HiOutlineLightningBolt /> {showOnlyDummy ? 'Dummy' : 'Normal'}
                        </button>

                        <div className="px-5 py-2.5 bg-white rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm">
                            <HiOutlineDatabase className="text-indigo-500 w-5 h-5" />
                            <p className="font-black text-slate-700 text-xs uppercase tracking-widest">{activeSession}</p>
                        </div>
                    </div>
                </div>

                {/* Control Panel (Hidden on Print) */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 no-print">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <select value={selectedClass} onChange={(e) => {setSelectedClass(e.target.value); setGeneratedData([]);}}
                            className="w-full p-4 rounded-2xl bg-slate-50 font-bold outline-none ring-1 ring-slate-100">
                            <option value="">Select Class</option>
                            {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>

                        <select value={selectedExams[0] || ''} onChange={(e) => {setSelectedExams([e.target.value]); setGeneratedData([]);}}
                            className="w-full p-4 rounded-2xl bg-slate-50 font-bold outline-none ring-1 ring-slate-100">
                            <option value="">Select Exam</option>
                            {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                        </select>

                        <div className="flex gap-3">
                            <button onClick={fetchData} disabled={loading} className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">
                                {loading ? 'Loading...' : 'Generate Preview'}
                            </button>
                            <button onClick={() => window.print()} disabled={generatedData.length === 0} className="bg-slate-800 text-white p-4 rounded-2xl font-black">
                                <HiOutlinePrinter size={24}/>
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- OPTIMIZED PRINT AREA --- */}
                <div id="printable-content" className="print-area">
                    {generatedData.map((item, idx) => (
                        <div key={idx} className="admit-card-wrapper">
                            <AdmitCardTemplate student={item.student} data={item.data} />
                        </div>
                    ))}
                </div>
            </div>

            <style jsx global>{`
                /* Screen View: Grid for easier management */
                .print-area { 
                    display: grid; 
                    grid-template-columns: 1fr; 
                    gap: 20px; 
                    width: 100%; 
                }

                @media print {
                    /* 1. Reset Browser Print Engine */
                    @page { 
                        size: A4 portrait; 
                        margin: 0; 
                    }
                    
                    html, body { 
                        height: auto !important; 
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    .no-print { display: none !important; }
                    
                    /* 2. Hardware Acceleration & Rendering Optimization */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        text-shadow: none !important;
                        box-shadow: none !important;
                        transition: none !important;
                        animation: none !important;
                    }

                    body * { visibility: hidden !important; }
                    #printable-content, #printable-content * { visibility: visible !important; }
                    
                    #printable-content {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 210mm !important;
                        display: block !important;
                    }

                    /* 3. Perfect Half-Page Splitting */
                    .admit-card-wrapper { 
                        display: block !important;
                        height: 148.5mm !important; /* Perfect A4 half-height */
                        width: 210mm !important;
                        overflow: hidden !important;
                        box-sizing: border-box !important;
                        padding: 8mm 10mm !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        border-bottom: 1px dashed #eee; /* Light cutter guide */
                    }

                    .admit-card-wrapper:nth-child(2n) {
                        page-break-after: always !important;
                        break-after: page !important;
                        border-bottom: none;
                    }

                    /* Optimize photo rendering */
                    img {
                        image-rendering: -webkit-optimize-contrast;
                        max-height: 100%;
                    }
                }
            `}</style>
        </div>
    );
}

export default DocumentGenerator;