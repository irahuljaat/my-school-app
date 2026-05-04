'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, query, where, onSnapshot } from 'firebase/firestore';
import { 
    HiOutlineRefresh, 
    HiOutlineChevronLeft, 
    HiPrinter, 
    HiOutlineUserGroup, 
    HiCheckCircle,
    HiOutlineCalendar,
    HiSelector
} from 'react-icons/hi'; 
import MarksheetTemplate from './MarksheetTemplate';

function MarksheetGenerator({ onBack }) {
    const [exams, setExams] = useState([]);
    const [classes] = useState(['LKG','UKG','PREP' ,'1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
    const [selectedExams, setSelectedExams] = useState([]); 
    const [selectedClass, setSelectedClass] = useState('');
    const [generatedData, setGeneratedData] = useState([]); 
    const [selectedStudentIds, setSelectedStudentIds] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [activeSession, setActiveSession] = useState('');
    const [resultDate, setResultDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'config', 'settings'), (docSnap) => {
            if (docSnap.exists()) {
                setActiveSession(docSnap.data().activeSession);
            }
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const fetchExams = async () => {
            if (!activeSession) return;
            try {
                const snap = await getDocs(collection(db, 'sessions', activeSession, 'exams'));
                setExams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) { console.error("Error fetching exams:", err); }
        };
        fetchExams();
    }, [activeSession]);

    const toggleExamSelection = (examId) => {
        setSelectedExams(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            return safePrev.includes(examId) 
                ? safePrev.filter(id => id !== examId) 
                : [...safePrev, examId];
        });
    };

                            const fetchData = async () => {
                if (!selectedClass || selectedExams.length === 0 || !activeSession) return;
                setLoading(true);
                setGeneratedData([]); // Clear previous data
                setSelectedStudentIds([]);

                try {
                    // 1. Fetch Students
                    let sSnap = await getDocs(query(collection(db, 'sessions', activeSession, 'students'), where('grade', '==', selectedClass)));
                    if (sSnap.empty) {
                        sSnap = await getDocs(query(collection(db, 'students'), where('grade', '==', selectedClass)));
                    }
                    
                    // 2. Fetch Exam Configurations (Marks and Assignments)
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
                        
                        const filteredExams = examData.map(ex => {
                            // Logic to determine which subjects to show
                            let validSubs = ex.subjects.filter(sub => {
                                const subName = sub.name.trim().toLowerCase();
                                
                                // Always show for Lower Classes
                                if (!['11', '12'].includes(selectedClass)) return true;

                                // Always show mandatory subjects for 11/12
                                const mandatory = ['hindi', 'english', 'gk', 'g.k', 'computer', 'drawing', 'art'];
                                if (mandatory.some(m => subName.includes(m))) return true;

                                // Check student's specific assigned subjects
                                const rawStudentSubs = s.subjects || [];
                                const subjectsArray = Array.isArray(rawStudentSubs) ? rawStudentSubs : [];
                                
                                return subjectsArray.some(studentSub => {
                                    const studentSubName = (typeof studentSub === 'string' 
                                        ? studentSub 
                                        : studentSub?.name || ''
                                    ).trim().toLowerCase();
                                    return subName.includes(studentSubName) || studentSubName.includes(subName);
                                });
                            });

                            // FALLBACK: If Class 11/12 student has NO matching subjects, 
                            // show ALL assigned subjects so the table isn't empty.
                            if (validSubs.length === 0 && ex.subjects.length > 0) {
                                validSubs = ex.subjects;
                            }

                            return { ...ex, subjects: validSubs };
                        });

                        return {
                            student: { 
                                ...s, 
                                id: sId, 
                                dob: s.dob ? s.dob.split('-').reverse().join('-') : '—',
                            },
                            examResults: filteredExams
                        };
                    });

                    results.sort((a, b) => (a.student.name || "").localeCompare(b.student.name || ""));
                    setGeneratedData(results);
                    setSelectedStudentIds(results.map(r => r.student.id)); 
                } catch (e) { 
                    console.error("Fetch Error:", e); 
                } finally { 
                    setLoading(false); 
                }
            };      

    const toggleStudent = (id) => {
        setSelectedStudentIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const printData = useMemo(() => {
        return generatedData.filter(d => selectedStudentIds.includes(d.student.id));
    }, [generatedData, selectedStudentIds]);

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 print:p-0 print:bg-white">
            <div className="max-w-6xl mx-auto no-print space-y-6">
                <div className="flex justify-between items-center">
                    <button onClick={onBack} className="text-indigo-600 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                        <HiOutlineChevronLeft/> Back
                    </button>
                    <div className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm">
                        Session {activeSession || '...'}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">1. Select Class</label>
                            <select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none ring-1 ring-slate-100 outline-none">
                                <option value="">Choose Class</option>
                                {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">2. Result Date</label>
                            <input type="date" value={resultDate} onChange={e => setResultDate(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl font-bold ring-1 ring-slate-100 outline-none" />
                        </div>
                        <div className="flex items-end gap-2">
                            <button onClick={fetchData} className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all">
                                {loading ? 'Processing...' : 'Generate Marksheets'}
                            </button>
                            <button onClick={()=>window.print()} disabled={!printData.length} className="bg-slate-800 text-white p-3 rounded-xl disabled:opacity-50">
                                <HiPrinter size={20}/>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">3. Select Exams in Order of Priority (Left to Right)</label>
                        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            {exams.map(e => {
                                const orderIndex = selectedExams.indexOf(e.id);
                                const isSelected = orderIndex !== -1;
                                return (
                                    <button 
                                        key={e.id} 
                                        onClick={() => toggleExamSelection(e.id)}
                                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-2 ${
                                            isSelected ? 'bg-indigo-600 text-white shadow-md scale-105' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300'
                                        }`}
                                    >
                                        {isSelected && <span className="bg-white text-indigo-600 w-4 h-4 rounded-full flex items-center justify-center text-[8px]">{orderIndex + 1}</span>}
                                        {e.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {generatedData.length > 0 && (
                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <HiOutlineUserGroup size={16}/> Students found: {generatedData.length} | Selected: {selectedStudentIds.length}
                            </h3>
                            <button onClick={() => setSelectedStudentIds(selectedStudentIds.length === generatedData.length ? [] : generatedData.map(r => r.student.id))} className="text-[10px] font-bold text-indigo-600 uppercase">
                                Toggle All
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 p-4 max-h-60 overflow-y-auto">
                            {generatedData.map((d) => {
                                const active = selectedStudentIds.includes(d.student.id);
                                return (
                                    <div key={d.student.id} onClick={() => toggleStudent(d.student.id)} className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${active ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`}>
                                        <span className={`text-[10px] font-bold ${active ? 'text-indigo-700' : 'text-slate-600'}`}>{d.student.name}</span>
                                        {active && <HiCheckCircle className="text-indigo-600"/>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div id="print-area">
                {printData.map((data, idx) => (
                    <div key={idx} className="marksheet-page-wrapper">
                        <MarksheetTemplate 
                            student={data.student} 
                            examResults={data.examResults} 
                            activeSession={activeSession} 
                            resultDate={resultDate}
                        />
                    </div>
                ))}
            </div>

            <style jsx global>{`
                @media screen {
                    .marksheet-page-wrapper {
                        background: white; 
                        width: 210mm; 
                        min-height: 297mm;
                        margin: 40px auto; 
                        box-shadow: 0 20px 50px rgba(0,0,0,0.1);
                        overflow: hidden;
                    }
                }
                @media print {
                    body * { visibility: hidden !important; }
                    #print-area, #print-area * { visibility: visible !important; }
                    #print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                    .marksheet-page-wrapper {
                        width: 210mm !important; 
                        height: 297mm !important;
                        padding-top: 15mm !important; 
                        page-break-after: always !important;
                        break-after: page !important;
                        page-break-inside: avoid !important;
                        display: block !important; 
                        margin: 0 !important; 
                        box-sizing: border-box;
                        position: relative;
                        overflow: hidden;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
                @page { size: A4 portrait; margin: 0; }
            `}</style>
        </div>
    );
}

export default MarksheetGenerator;