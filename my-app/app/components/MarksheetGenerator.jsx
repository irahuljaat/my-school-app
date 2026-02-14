'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { HiOutlineRefresh, HiOutlineChevronLeft, HiPrinter, HiOutlineDatabase } from 'react-icons/hi'; 
import MarksheetTemplate from './MarksheetTemplate';

function MarksheetGenerator({ onBack, activeSession }) {
    const [exams, setExams] = useState([]);
    const [classes] = useState(['LKG','UKG','PREP' ,'1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
    const [selectedExams, setSelectedExams] = useState([]); 
    const [selectedClass, setSelectedClass] = useState('');
    const [generatedData, setGeneratedData] = useState([]); 
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchExams = async () => {
            if (!activeSession) return;
            const snap = await getDocs(collection(db, 'sessions', activeSession, 'exams'));
            setExams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchExams();
    }, [activeSession]);

    const fetchData = async () => {
        if (!selectedClass || selectedExams.length === 0) return;
        setLoading(true);

        try {
            // 1. Fetch Students (A-Z approach)
            let sSnap = await getDocs(query(collection(db, 'sessions', activeSession, 'students'), where('grade', '==', selectedClass)));
            if (sSnap.empty) {
                sSnap = await getDocs(query(collection(db, 'students'), where('grade', '==', selectedClass)));
            }
            
            // 2. Fetch Exams Setup
            const examData = await Promise.all(selectedExams.map(async (examId) => {
                const docId = `${examId}_${selectedClass}`;
                const mSnap = await getDoc(doc(db, 'sessions', activeSession, 'examMarks', docId));
                const aSnap = await getDoc(doc(db, 'sessions', activeSession, 'examAssignments', docId));
                return {
                    examId, examName: exams.find(e => e.id === examId)?.name || "Exam",
                    marks: mSnap.data()?.marks || {}, subjects: aSnap.data()?.subjects || []
                };
            }));

            // 3. Calculate Results for all students
            const results = sSnap.docs.map((sd) => {
                const s = sd.data();
                const sId = sd.id;
                let tObtained = 0, tMax = 0;

                const filteredExams = examData.map(ex => {
                    const validSubs = ex.subjects.filter(sub => {
                        const name = sub.name.toLowerCase();
                        return parseInt(selectedClass) < 11 || (s.subjects || []).includes(name) || ['hindi', 'english'].includes(name);
                    });
                    validSubs.forEach(sub => {
                        tObtained += parseFloat(ex.marks[sId]?.[sub.name] || 0);
                        tMax += parseFloat(sub.maxMarks || 100);
                    });
                    return { ...ex, subjects: validSubs };
                });

                return {
                    student: { ...s, id: sId, totalObtained: tObtained, totalMax: tMax, percentage: tMax > 0 ? ((tObtained/tMax)*100).toFixed(2) : 0 },
                    examResults: filteredExams
                };
            });

            // --- STEP A: RANK BY PERCENTAGE (Highest first) ---
            results.sort((a, b) => b.student.percentage - a.student.percentage);
            results.forEach((r, i) => r.student.classRank = i + 1);

            // --- STEP B: SORT ALPHABETICALLY FOR PRINTING (A-Z) ---
            results.sort((a, b) => (a.student.name || "").localeCompare(b.student.name || "", undefined, { sensitivity: 'base' }));

            setGeneratedData(results);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-5xl mx-auto no-print">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onBack} className="text-slate-500 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                        <HiOutlineChevronLeft/> Back
                    </button>
                    <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                        Session {activeSession}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end mb-10">
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Class</label>
                        <select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none outline-none ring-1 ring-slate-100 focus:ring-indigo-600">
                            <option value="">Select</option>
                            {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Exams</label>
                        <select multiple value={selectedExams} onChange={e=>setSelectedExams(Array.from(e.target.selectedOptions, o=>o.value))} className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none outline-none ring-1 ring-slate-100 h-14">
                            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <button onClick={fetchData} className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
                        <HiOutlineRefresh className={loading ? 'animate-spin' : ''}/> {loading ? 'Processing...' : 'Generate A-Z'}
                    </button>
                    <button onClick={()=>window.print()} disabled={!generatedData.length} className="bg-slate-800 text-white p-4 rounded-xl hover:bg-slate-700 transition-all">
                        <HiPrinter size={20}/>
                    </button>
                </div>
            </div>

            <div id="print-area">
                {generatedData.map((data, idx) => (
                    <div key={idx} className="marksheet-page">
                        <MarksheetTemplate student={data.student} examResults={data.examResults} />
                    </div>
                ))}
            </div>

            <style jsx global>{`
                @media screen { .marksheet-page { background: white; width: 210mm; margin: 0 auto 30px auto; box-shadow: 0 10px 30px rgba(0,0,0,0.05); } }
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0; padding: 0; }
                    #print-area { visibility: visible; width: 100%; }
                    .marksheet-page { width: 210mm; height: 297mm; page-break-after: always !important; }
                }
                @page { size: A4 portrait; margin: 0; }
            `}</style>
        </div>
    );
}

export default MarksheetGenerator;