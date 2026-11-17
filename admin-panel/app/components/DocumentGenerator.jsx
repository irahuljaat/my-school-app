'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, query, where } from 'firebase/firestore';
import { 
    HiOutlineRefresh, 
    HiOutlinePrinter, 
    HiOutlineChevronLeft, 
    HiOutlineDatabase,
    HiOutlineLightningBolt,
    HiOutlineUserGroup,
    HiCheckCircle
} from 'react-icons/hi';
import AdmitCardTemplate from './AdmitCardTemplate';

function DocumentGenerator({ onBack, activeSession }) {
    const [exams, setExams] = useState([]);
    const [classes] = useState(['LKG','UKG','PREP' ,'1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
    const [selectedExams, setSelectedExams] = useState([]); 
    const [selectedClass, setSelectedClass] = useState('');
    const [generatedData, setGeneratedData] = useState([]); 
    const [selectedStudentIds, setSelectedStudentIds] = useState([]); 
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
        setSelectedStudentIds([]); 
        
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
            setSelectedStudentIds(finalData.map(item => item.student.id));
            setMessage({ type: 'success', text: `Loaded ${finalData.length} students.` });
        } catch (e) {
            setMessage({ type: 'error', text: 'Error fetching data.' });
        }
        setLoading(false);
    };

    const toggleStudentSelection = (id) => {
        setSelectedStudentIds(prev => 
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedStudentIds.length === generatedData.length) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(generatedData.map(item => item.student.id));
        }
    };

    const printData = useMemo(() => {
        return generatedData.filter(item => selectedStudentIds.includes(item.student.id));
    }, [generatedData, selectedStudentIds]);

    // Function to open a clean new tab containing ONLY the admit cards for printing
    const handleOpenPrintTab = () => {
        const printContent = document.getElementById('printable-content');
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Admit Cards - MVG Public Sr. Sec. School</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @page { 
                            size: A4 portrait; 
                            margin: 0; 
                        }
                        body { 
                            margin: 0; 
                            padding: 0; 
                            background: white; 
                            -webkit-print-color-adjust: exact; 
                            print-color-adjust: exact; 
                        }
                        .print-area { 
                            display: block; 
                            width: 100%; 
                        }
                        .admit-card-wrapper { 
                            display: block;
                            height: 148.5mm; 
                            width: 210mm; 
                            box-sizing: border-box;
                            overflow: hidden; 
                            padding: 6mm 10mm;
                            page-break-inside: avoid;
                            break-inside: avoid;
                        }
                        .admit-card-wrapper:nth-child(2n) { 
                            page-break-after: always; 
                            break-after: page;
                        }
                    </style>
                </head>
                <body>
                    <div id="printable-content" class="print-area">
                        ${printContent.innerHTML}
                    </div>
                    <script>
                        window.onload = function() {
                            setTimeout(() => {
                                window.focus();
                                window.print();
                            }, 500);
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="bg-slate-50 min-h-screen p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
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
                            <button onClick={fetchData} disabled={loading} className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-transform">
                                {loading ? 'Loading...' : 'Fetch Students'}
                            </button>
                            <button onClick={handleOpenPrintTab} disabled={selectedStudentIds.length === 0} title="Open Print View in New Tab" className="bg-slate-800 text-white px-6 rounded-2xl font-black shadow-lg disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center">
                                <HiOutlinePrinter size={24}/>
                            </button>
                        </div>
                    </div>
                </div>

                {generatedData.length > 0 && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <HiOutlineUserGroup className="text-slate-400" />
                                <h3 className="font-bold text-slate-700 text-sm uppercase">Select Students ({selectedStudentIds.length}/{generatedData.length})</h3>
                            </div>
                            <button onClick={handleSelectAll} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                                {selectedStudentIds.length === generatedData.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4 max-h-[400px] overflow-y-auto">
                            {generatedData.map((item) => {
                                const isSelected = selectedStudentIds.includes(item.student.id);
                                return (
                                    <div key={item.student.id} 
                                        onClick={() => toggleStudentSelection(item.student.id)}
                                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                            </div>
                                            <div>
                                                <p className={`text-xs font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{item.student.name}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Roll No: {item.student.rollNo || 'N/A'}</p>
                                            </div>
                                        </div>
                                        {isSelected && <HiCheckCircle className="text-indigo-600" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Hidden container used to generate HTML markup for the new print window */}
                <div id="printable-content" className="hidden">
                    {printData.map((item, idx) => (
                        <div key={idx} className="admit-card-wrapper">
                            <AdmitCardTemplate student={item.student} data={item.data} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default DocumentGenerator;