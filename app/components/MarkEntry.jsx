'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../firebase/config';
import { collection, doc, getDoc, getDocs, query, where, setDoc } from 'firebase/firestore';
import { 
    HiOutlinePencilAlt, 
    HiOutlineDownload, 
    HiOutlineUpload,
    HiOutlineCalendar,
    HiOutlineCheckCircle,
    HiOutlineSearch,
    HiOutlineArrowLeft
} from 'react-icons/hi';
import * as XLSX from 'xlsx';

function MarksEntry({ activeSession }) {
    const router = useRouter();
    const [examsList, setExamsList] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedClass, setSelectedClass] = useState('10');
    const [assignedSubjects, setAssignedSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [marksData, setMarksData] = useState({});
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showOnlyDummy, setShowOnlyDummy] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef(null);

    const MOCK_CLASSES = ['LKG', 'UKG', 'PREP', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const COMPULSORY_SUBJECTS = ['hindi', 'english'];

    // --- Core Logic Functions ---

    const isSubjectApplicable = (student, subjectName) => {
        const name = subjectName.toLowerCase().trim();
        
        // 1. Hindi and English are always compulsory
        if (COMPULSORY_SUBJECTS.includes(name)) return true;
        
        // 2. For LKG to Class 10, all assigned subjects are applicable
        if (!['11', '12'].includes(selectedClass)) return true;
        
        // 3. For Class 11 & 12: Check optional subjects
        const studentSubs = student.subjects || student.optionalSubjects || [];
        let searchList = Array.isArray(studentSubs) ? studentSubs : [studentSubs];
        
        // Clean the list for comparison
        const cleanSearchList = searchList.filter(Boolean).map(s => String(s).toLowerCase().trim());
        
        // FIX: If student has no subjects defined in DB, show the input anyway to prevent blocking
        if (cleanSearchList.length === 0) return true;
        
        return cleanSearchList.includes(name);
    };

    const downloadTemplate = () => {
        if (students.length === 0) return;
        const templateData = students.map(s => {
            const row = { "Student ID": s.id, "Student Name": s.name, "Class": selectedClass };
            assignedSubjects.forEach(sub => { row[sub.name] = ""; });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Marks");
        XLSX.writeFile(wb, `Marks_Template_${selectedClass}_${selectedExamId}.xlsx`);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                if (data.length === 0) return;

                const classGroups = {};
                data.forEach(row => {
                    const studentClass = String(row["Class"]);
                    const studentId = row["Student ID"];
                    if (!classGroups[studentClass]) classGroups[studentClass] = {};
                    const studentMarks = {};
                    Object.keys(row).forEach(key => {
                        if (!["Student ID", "Student Name", "Class"].includes(key)) {
                            studentMarks[key] = row[key];
                        }
                    });
                    classGroups[studentClass][studentId] = studentMarks;
                });

                setIsSaving(true);
                for (const studentClass in classGroups) {
                    const docId = `${selectedExamId}_${studentClass}`;
                    const docRef = doc(db, 'sessions', activeSession, 'examMarks', docId);
                    const existingDoc = await getDoc(docRef);
                    const existingMarks = existingDoc.exists() ? existingDoc.data().marks : {};
                    await setDoc(docRef, {
                        marks: { ...existingMarks, ...classGroups[studentClass] },
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                }
                loadData();
            } catch (err) { console.error("Upload Error:", err); }
            finally { setIsSaving(false); e.target.value = null; }
        };
        reader.readAsBinaryString(file);
    };

    const loadData = useCallback(async () => {
        if (!activeSession || !selectedExamId || !selectedClass) return;
        setLoading(true);
        try {
            let sSnap = await getDocs(query(collection(db, 'sessions', activeSession, 'students'), where('grade', '==', selectedClass)));
            if (sSnap.empty) sSnap = await getDocs(query(collection(db, 'students'), where('grade', '==', selectedClass)));

            const sList = sSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(student => showOnlyDummy ? student.isDummy === true : (student.isDummy === false || student.isDummy === undefined));

            sList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            setStudents(sList);

            const assignmentId = `${selectedExamId}_${selectedClass}`;
            const aSnap = await getDoc(doc(db, 'sessions', activeSession, 'examAssignments', assignmentId));

            if (aSnap.exists()) {
                const subs = aSnap.data().subjects || [];
                setAssignedSubjects(subs);
                const mSnap = await getDoc(doc(db, 'sessions', activeSession, 'examMarks', assignmentId));
                const savedMarks = mSnap.exists() ? mSnap.data().marks : {};
                const newMarks = {};
                sList.forEach(stu => {
                    newMarks[stu.id] = {};
                    subs.forEach(sub => {
                        if (isSubjectApplicable(stu, sub.name)) {
                            newMarks[stu.id][sub.name] = savedMarks[stu.id]?.[sub.name] ?? '';
                        }
                    });
                });
                setMarksData(newMarks);
            } else {
                setAssignedSubjects([]);
                setMarksData({});
            }
        } catch (error) { console.error("Load Error:", error); }
        finally { setLoading(false); }
    }, [activeSession, selectedExamId, selectedClass, showOnlyDummy]);

    useEffect(() => {
        const fetchExams = async () => {
            if (!activeSession) return;
            const snap = await getDocs(collection(db, 'sessions', activeSession, 'exams'));
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setExamsList(list);
            if (list.length > 0) setSelectedExamId(list[0].id);
        };
        fetchExams();
    }, [activeSession]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSave = async () => {
        if (students.length === 0) return;
        setIsSaving(true);
        try {
            await setDoc(doc(db, 'sessions', activeSession, 'examMarks', `${selectedExamId}_${selectedClass}`), {
                marks: marksData,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            alert("Marks saved successfully!");
        } catch (e) { console.error("Save Error:", e); }
        finally { setIsSaving(false); }
    };

    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
   

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-6 font-sans">
            <div className="max-w-[1600px] mx-auto space-y-4">
                
                {/* --- HEADER --- */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                            <HiOutlineArrowLeft size={20} />
                        </button>
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <HiOutlinePencilAlt size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Academic Grading</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">{activeSession}</span>
                                <span 
                                    onClick={() => setShowOnlyDummy(!showOnlyDummy)}
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-all ${showOnlyDummy ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200' : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'}`}
                                >
                                    {showOnlyDummy ? 'DUMMY VIEW' : 'LIVE VIEW'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => router.push('/exam-manage/attendance')} className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 rounded-xl font-bold text-[11px] uppercase tracking-wider hover:bg-amber-100 border border-amber-200/50">
                            <HiOutlineCalendar size={16}/>
                            <span>Attendance</span>
                        </button>
                        <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden lg:block" />
                        <div className="relative group">
                            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                placeholder="Quick search..."
                                className="pl-9 pr-4 py-2 bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none w-40"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select className="px-3 py-2 bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl text-[11px] font-bold text-slate-600 outline-none cursor-pointer" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
                            {examsList.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                        </select>
                        <select className="px-3 py-2 bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl text-[11px] font-bold text-slate-600 outline-none cursor-pointer" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                            {MOCK_CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>
                        <div className="flex items-center gap-1.5 ml-1">
                            <button onClick={() => fileInputRef.current.click()} className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50" title="Upload Marks">
                                <HiOutlineUpload size={18} />
                            </button>
                            <input type="file" ref={fileInputRef} hidden accept=".xlsx, .xls" onChange={handleFileUpload} />
                            <button onClick={downloadTemplate} className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50" title="Download Excel Template">
                                <HiOutlineDownload size={18} />
                            </button>
                        </div>
                        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-lg shadow-slate-200 ml-2">
                            {isSaving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <HiOutlineCheckCircle size={16}/>}
                            {isSaving ? 'Processing' : 'Save Marks'}
                        </button>
                    </div>
                </div>

                {/* --- MAIN DATA GRID --- */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        {loading ? (
                            <div className="py-32 text-center space-y-4">
                                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Synchronizing Student Records</p>
                            </div>
                        ) : (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80">
                                        <th className="sticky left-0 z-20 bg-slate-50 p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-r border-slate-200 min-w-[220px]">
                                            Student Information
                                        </th>
                                        {assignedSubjects.map(sub => (
                                            <th key={sub.name} className="p-4 border-b border-slate-200 min-w-[120px] text-center">
                                                <div className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{sub.name}</div>
                                                <div className="text-[9px] text-indigo-500 font-bold mt-0.5 bg-indigo-50 inline-block px-2 rounded-full">MAX: {sub.maxMarks}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredStudents.length > 0 ? (
                                        filteredStudents.map((stu, idx) => (
                                            <tr key={stu.id} className="hover:bg-indigo-50/30 transition-colors group">
                                                <td className="sticky left-0 z-10 bg-white group-hover:bg-indigo-50/30 p-4 border-r border-slate-100 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.05)] transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold text-slate-300 w-5">{idx + 1}.</span>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-slate-700 uppercase tracking-tight truncate">{stu.name}</span>
                                                            <span className="text-[9px] text-slate-400 font-medium tracking-wide">ID: {stu.id.slice(-6).toUpperCase()}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                               {assignedSubjects.map((sub) => {
    // --- 1. DEFINE CONSTANTS HERE ---
    // This makes 'sub' accessible to everything inside this block
    const subNameClean = sub.name.toLowerCase().trim();
    const isGradeSub = ['gk', 'computer', 'drawing', 'g.k.'].includes(subNameClean);
    const isHigherClass = ['11', '12'].includes(selectedClass);
    const isApplicable = isSubjectApplicable(stu, sub.name);

    return (
        <td key={sub.name} className="p-2 text-center">
            {isApplicable ? (
               <input
    type="text"
    placeholder="--"
    value={marksData[stu.id]?.[sub.name] ?? ''}
   onChange={(e) => {
    const val = e.target.value.toUpperCase();
    const subName = sub.name.toUpperCase().trim(); // Convert to Uppercase for easier matching
    
    // Check all possible variations of the subject name
    const isGk = subName === 'G.K' || subName === 'GK' || subName === 'G.K.' || subName === 'GENERAL KNOWLEDGE';
    const isComputer = subName === 'COMPUTER' || subName === 'IT';
    const isDrawing = subName === 'DRAWING' || subName === 'ART';
    
    const isGradeSub = isGk || isComputer || isDrawing;
    const isHigherClass = ['11', '12'].includes(selectedClass);

    // 1. Always allow clearing the field
    if (val === '') {
        setMarksData(p => ({ ...p, [stu.id]: { ...p[stu.id], [sub.name]: '' } }));
        return;
    }

    // 2. STRICT GRADE LOGIC (Priority)
    if (isGradeSub && !isHigherClass) {
        // Regex allows A, B, C, D, E and optionally + or -
        // It will REJECT numbers entirely
        if (/^[A-E][+-]?$/.test(val)) {
            setMarksData(p => ({ ...p, [stu.id]: { ...p[stu.id], [sub.name]: val } }));
        }
        // IMPORTANT: We return here so the Numeric Logic below never runs for GK
        return; 
    }

    // 3. NUMERIC LOGIC (For standard subjects)
    const numVal = Number(val);
    const max = Number(sub.maxMarks) || 100;
    
    if (!isNaN(numVal)) {
        const finalVal = numVal > max ? max : numVal;
        setMarksData(p => ({ 
            ...p, 
            [stu.id]: { ...p[stu.id], [sub.name]: String(finalVal) } 
        }));
    }
}}
    className={`w-16 py-2.5 text-center text-xs font-black border border-transparent rounded-xl focus:bg-white focus:border-indigo-400 outline-none transition-all ${
        (['gk', 'g.k.', 'computer', 'drawing'].includes(sub.name.toLowerCase().trim()) && !['11', '12'].includes(selectedClass)) 
        ? 'bg-blue-50 text-blue-700' : 'bg-slate-50'
    }`}
/>
            ) : (
                <div className="h-1 w-6 bg-slate-100 mx-auto rounded-full" />
            )}
        </td>
    );
})}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={assignedSubjects.length + 1} className="py-20 text-center">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching student records found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* --- FOOTER --- */}
                <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-white border border-slate-200 rounded-3xl gap-4">
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Loaded: {filteredStudents.length} Students</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-200" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Exam: {examsList.find(e => e.id === selectedExamId)?.name || 'None'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                            Auto-Sync Active | {new Date().toLocaleDateString('en-IN')}
                        </p>
                    </div>
                </div>

            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #F8FAFC; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
            `}</style>
        </div>
    );
}

export default MarksEntry;