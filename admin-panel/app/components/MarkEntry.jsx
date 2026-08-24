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
import { useColors } from './ColorComponent';

function MarksEntry({ activeSession }) {
    const colors = useColors();
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

    const isSubjectApplicable = (student, subjectName) => {
        const name = subjectName.toLowerCase().trim();
        if (COMPULSORY_SUBJECTS.includes(name)) return true;
        if (!['11', '12'].includes(selectedClass)) return true;
        
        const studentSubs = student.subjects || student.optionalSubjects || [];
        let searchList = Array.isArray(studentSubs) ? studentSubs : [studentSubs];
        const cleanSearchList = searchList.filter(Boolean).map(s => String(s).toLowerCase().trim());
        
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
        <div className="max-w-[1440px] mx-auto p-6 lg:p-8 font-sans relative overflow-hidden" style={{ backgroundColor: colors.background }}>
            {/* Soft Background Decorative Blur Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-10 pointer-events-none -mr-20 -mt-20" style={{ backgroundColor: colors.primary }}></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-10 pointer-events-none -ml-20 -mb-20" style={{ backgroundColor: colors.primary }}></div>

            <div className="relative z-10 space-y-8 animate-in fade-in duration-700">
                
                {/* --- HEADER --- */}
                <div className="bg-white rounded-[28px] shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-3 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                            <HiOutlineArrowLeft size={20} />
                        </button>
                        <div className="p-3 rounded-2xl text-white shadow-md" style={{ backgroundColor: colors.primary }}>
                            <HiOutlinePencilAlt size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Academic Grading</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full">{activeSession}</span>
                                <span 
                                    onClick={() => setShowOnlyDummy(!showOnlyDummy)}
                                    className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full cursor-pointer transition-all ${showOnlyDummy ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200' : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'}`}
                                >
                                    {showOnlyDummy ? 'DUMMY VIEW' : 'LIVE VIEW'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        
                        <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden lg:block" />
                        
                        <div className="relative group">
                            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                placeholder="Quick search..."
                                className="pl-10 pr-5 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-full font-medium text-xs text-slate-700 outline-none w-44 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <select className="px-5 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-full font-bold text-xs text-slate-700 outline-none cursor-pointer transition-all" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
                            {examsList.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                        </select>

                        <select className="px-5 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-full font-bold text-xs text-slate-700 outline-none cursor-pointer transition-all" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                            {MOCK_CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>

                        <div className="flex items-center gap-1.5 ml-1">
                            <button onClick={() => fileInputRef.current.click()} className="p-3 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50 transition-all shadow-sm" title="Upload Marks">
                                <HiOutlineUpload size={18} />
                            </button>
                            <input type="file" ref={fileInputRef} hidden accept=".xlsx, .xls" onChange={handleFileUpload} />
                            <button onClick={downloadTemplate} className="p-3 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50 transition-all shadow-sm" title="Download Excel Template">
                                <HiOutlineDownload size={18} />
                            </button>
                        </div>

                        <button 
                            onClick={handleSave} 
                            disabled={isSaving} 
                            className="flex items-center gap-2 px-6 py-3 text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.99] disabled:opacity-50 ml-2"
                            style={{ backgroundColor: colors.primary }}
                        >
                            {isSaving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <HiOutlineCheckCircle size={16}/>}
                            {isSaving ? 'Processing' : 'Save Marks'}
                        </button>
                    </div>
                </div>

                {/* --- MAIN DATA GRID --- */}
                <div className="bg-white rounded-[28px] shadow-sm border border-slate-100 overflow-hidden">
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
                                        <th className="sticky left-0 z-20 bg-slate-50 p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-r border-slate-100 min-w-[220px]">
                                            Student Information
                                        </th>
                                        {assignedSubjects.map(sub => (
                                            <th key={sub.name} className="p-6 border-b border-slate-100 min-w-[120px] text-center">
                                                <div className="text-xs font-black text-slate-800 uppercase tracking-tight">{sub.name}</div>
                                                <div className="text-[9px] text-indigo-600 font-black tracking-widest mt-1 bg-indigo-50 inline-block px-2.5 py-0.5 rounded-full uppercase">MAX: {sub.maxMarks}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredStudents.length > 0 ? (
                                        filteredStudents.map((stu, idx) => (
                                            <tr key={stu.id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/80 p-6 border-r border-slate-100 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.02)] transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold text-slate-400 w-5">{idx + 1}.</span>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{stu.name}</span>
                                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ID: {stu.id.slice(-6).toUpperCase()}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                {assignedSubjects.map((sub) => {
                                                    const subNameClean = sub.name.toLowerCase().trim();
                                                    const isGradeSub = ['gk', 'computer', 'drawing', 'g.k.'].includes(subNameClean);
                                                    const isHigherClass = ['11', '12'].includes(selectedClass);
                                                    const isApplicable = isSubjectApplicable(stu, sub.name);

                                                    return (
                                                        <td key={sub.name} className="p-4 text-center">
                                                            {isApplicable ? (
                                                                <input
                                                                    type="text"
                                                                    placeholder="--"
                                                                    value={marksData[stu.id]?.[sub.name] ?? ''}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value.toUpperCase();
                                                                        const subName = sub.name.toUpperCase().trim();
                                                                        
                                                                        const isGk = subName === 'G.K' || subName === 'GK' || subName === 'G.K.' || subName === 'GENERAL KNOWLEDGE';
                                                                        const isComputer = subName === 'COMPUTER' || subName === 'IT';
                                                                        const isDrawing = subName === 'DRAWING' || subName === 'ART';
                                                                        
                                                                        const isGradeSubField = isGk || isComputer || isDrawing;
                                                                        const isHigherClassField = ['11', '12'].includes(selectedClass);

                                                                        if (val === '') {
                                                                            setMarksData(p => ({ ...p, [stu.id]: { ...p[stu.id], [sub.name]: '' } }));
                                                                            return;
                                                                        }

                                                                        if (isGradeSubField && !isHigherClassField) {
                                                                            if (/^[A-E][+-]?$/.test(val)) {
                                                                                setMarksData(p => ({ ...p, [stu.id]: { ...p[stu.id], [sub.name]: val } }));
                                                                            }
                                                                            return; 
                                                                        }

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
                                                                    className={`w-20 py-3 text-center text-xs font-black border rounded-full focus:bg-white focus:border-indigo-400 outline-none transition-all shadow-sm ${
                                                                        (['gk', 'g.k.', 'computer', 'drawing'].includes(sub.name.toLowerCase().trim()) && !['11', '12'].includes(selectedClass)) 
                                                                        ? 'bg-blue-50/50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200'
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
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No matching student records found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* --- FOOTER --- */}
                <div className="flex flex-col sm:flex-row justify-between items-center px-6 md:px-8 py-6 bg-white border border-slate-100 rounded-[28px] shadow-sm gap-4">
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loaded: {filteredStudents.length} Students</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Exam: {examsList.find(e => e.id === selectedExamId)?.name || 'None'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
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