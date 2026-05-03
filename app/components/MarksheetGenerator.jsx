'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, query, where, onSnapshot } from 'firebase/firestore';
import { HiOutlineRefresh, HiOutlineChevronLeft, HiPrinter } from 'react-icons/hi'; 
import MarksheetTemplate from './MarksheetTemplate';

function MarksheetGenerator({ onBack }) {
    const [exams, setExams] = useState([]);
    const [classes] = useState(['LKG','UKG','PREP' ,'1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
    const [selectedExams, setSelectedExams] = useState([]); 
    const [selectedClass, setSelectedClass] = useState('');
    const [generatedData, setGeneratedData] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [activeSession, setActiveSession] = useState('');

    // 1. Fetch Active Session from config/settings (based on image_4e9c78.png)
    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'config', 'settings'), (docSnap) => {
            if (docSnap.exists()) {
                const session = docSnap.data().activeSession;
                setActiveSession(session);
            }
        });
        return () => unsub();
    }, []);

    // 2. Fetch Exams for the active session
    useEffect(() => {
        const fetchExams = async () => {
            if (!activeSession) return;
            try {
                const snap = await getDocs(collection(db, 'sessions', activeSession, 'exams'));
                setExams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error("Error fetching exams:", err);
            }
        };
        fetchExams();
    }, [activeSession]);

    const fetchData = async () => {
        if (!selectedClass || selectedExams.length === 0 || !activeSession) return;
        setLoading(true);

        try {
            let sSnap = await getDocs(query(collection(db, 'sessions', activeSession, 'students'), where('grade', '==', selectedClass)));
            if (sSnap.empty) {
                sSnap = await getDocs(query(collection(db, 'students'), where('grade', '==', selectedClass)));
            }
            
            const examData = await Promise.all(selectedExams.map(async (examId) => {
                const docId = `${examId}_${selectedClass}`;
                const mSnap = await getDoc(doc(db, 'sessions', activeSession, 'examMarks', docId));
                const aSnap = await getDoc(doc(db, 'sessions', activeSession, 'examAssignments', docId));
                return {
                    examId, 
                    examName: exams.find(e => e.id === examId)?.name || "Exam",
                    marks: mSnap.data()?.marks || {}, 
                    subjects: aSnap.data()?.subjects || []
                };
            }));

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
                    student: { 
                        ...s, 
                        id: sId, 
                        dob: s.dob ? s.dob.split('-').reverse().join('-') : '—',
                        totalObtained: tObtained, 
                        totalMax: tMax, 
                        percentage: tMax > 0 ? ((tObtained / tMax) * 100).toFixed(2) : 0,
                        attendance: s.totalWorkingDays > 0 ? `${s.presentCount || 0}/${s.totalWorkingDays}` : "—" 
                    },
                    examResults: filteredExams
                };
            });

            results.sort((a, b) => b.student.percentage - a.student.percentage);
            results.forEach((r, i) => r.student.classRank = i + 1);
            results.sort((a, b) => (a.student.name || "").localeCompare(b.student.name || ""));

            setGeneratedData(results);
        } catch (e) { 
            console.error("Fetch Error:", e); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-6 print:p-0 print:bg-white">
            <div className="max-w-5xl mx-auto no-print">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onBack} className="text-slate-500 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                        <HiOutlineChevronLeft/> Back
                    </button>
                    <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                        Session {activeSession || 'Loading...'}
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
                        <select multiple value={selectedExams} onChange={e=>setSelectedExams(Array.from(e.target.selectedOptions, o=>o.value))} className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none outline-none ring-1 ring-slate-100 h-24">
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
                    <div key={idx} className="marksheet-page-wrapper">
                        <MarksheetTemplate student={data.student} examResults={data.examResults} activeSession={activeSession} />
                    </div>
                ))}
            </div>

            <style jsx global>{`
                @media screen {
                    .marksheet-page-wrapper {
                        background: white;
                        width: 210mm;
                        min-height: 297mm;
                        margin: 0 auto 40px auto;
                        box-shadow: 0 20px 50px rgba(0,0,0,0.1);
                    }
                }
                @media print {
                    body * { visibility: hidden !important; }
                    #print-area, #print-area * { visibility: visible !important; }
                    #print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                    .marksheet-page-wrapper {
                        width: 210mm;
                        height: 297mm;
                        page-break-after: always !important;
                        break-after: page !important;
                        display: block !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                }
                @page { size: A4 portrait; margin: 0; }
            `}</style>
        </div>
    );
}

export default MarksheetGenerator;