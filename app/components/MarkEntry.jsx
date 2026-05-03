'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../firebase/config';
import { collection, doc, getDoc, getDocs, query, where, setDoc } from 'firebase/firestore';
import { 
    HiOutlinePencilAlt, 
    HiOutlineLightningBolt, 
    HiOutlineDownload, 
    HiOutlineUpload,
    HiOutlineCalendar 
} from 'react-icons/hi';
import * as XLSX from 'xlsx';

function MarksEntry({ activeSession }) {
    const router = useRouter();
    const [examsList, setExamsList] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedClass, setSelectedClass] = useState('LKG');
    const [assignedSubjects, setAssignedSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [marksData, setMarksData] = useState({});
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showOnlyDummy, setShowOnlyDummy] = useState(false);
    const fileInputRef = useRef(null);

    const MOCK_CLASSES = ['LKG', 'UKG', 'PREP', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const COMPULSORY_SUBJECTS = ['hindi', 'english'];

    const isSubjectApplicable = (student, subjectName) => {
        const name = subjectName.toLowerCase().trim();
        const classNum = parseInt(selectedClass);
        if (COMPULSORY_SUBJECTS.includes(name)) return true;
        if (classNum <= 10) return true;
        const studentSubs = student.subjects || student.optionalSubjects || [];
        let searchList = Array.isArray(studentSubs) ? studentSubs : [studentSubs];
        return searchList.some(s => String(s).toLowerCase().trim() === name);
    };

    const downloadTemplate = () => {
        if (students.length === 0) return alert("No students loaded to create template");
        const templateData = students.map(s => {
            const row = { "Student ID": s.id, "Student Name": s.name, "Class": selectedClass };
            assignedSubjects.forEach(sub => { row[sub.name] = ""; });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Marks_Template");
        XLSX.writeFile(wb, `Marks_Template_${selectedClass}.xlsx`);
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
                alert(`✅ Uploaded marks for classes: ${Object.keys(classGroups).join(', ')}`);
                loadData();
            } catch (err) { alert("❌ Error processing Excel file"); }
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
                        if (isSubjectApplicable(stu, sub.name)) newMarks[stu.id][sub.name] = savedMarks[stu.id]?.[sub.name] ?? '';
                    });
                });
                setMarksData(newMarks);
            }
        } catch (error) { console.error(error); }
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
            alert("✅ Marks Saved!");
        } catch (e) { alert("❌ Save Failed"); }
        finally { setIsSaving(false); }
    };

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 border-b flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white"><HiOutlinePencilAlt size={24} /></div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase italic">Marks Entry</h2>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                {activeSession} Session • {showOnlyDummy ? 'DUMMY' : 'NORMAL'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {/* REDIRECT TO ATTENDANCE PAGE */}
                        <button 
                            onClick={() => router.push('/exam-manage/attendance')}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 font-black text-[10px] uppercase hover:bg-indigo-100 transition-all"
                        >
                            <HiOutlineCalendar size={16} /> Attendance
                        </button>

                        <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-white text-slate-600 border-slate-200 font-black text-[10px] uppercase hover:bg-slate-50">
                            <HiOutlineDownload size={16} /> Template
                        </button>
                        
                        <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-white text-emerald-600 border-emerald-100 font-black text-[10px] uppercase hover:bg-emerald-50">
                            <HiOutlineUpload size={16} /> Upload
                        </button>
                        <input type="file" ref={fileInputRef} hidden accept=".xlsx, .xls" onChange={handleFileUpload} />

                        <button
                            onClick={() => setShowOnlyDummy(!showOnlyDummy)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-black text-[10px] uppercase tracking-widest ${showOnlyDummy ? 'bg-rose-500 border-rose-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-400'}`}
                        >
                            <HiOutlineLightningBolt className={showOnlyDummy ? "animate-bounce" : ""} />
                            {showOnlyDummy ? 'Dummy' : 'Normal'}
                        </button>

                        <select className="p-3 bg-slate-100 rounded-xl font-bold text-xs outline-none" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
                            {examsList.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                        </select>
                        <select className="p-3 bg-slate-100 rounded-xl font-bold text-xs outline-none" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                            {MOCK_CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>
                        <button onClick={handleSave} disabled={isSaving || loading} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50">
                            {isSaving ? 'Saving...' : 'Save Marks'}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-20 text-center font-black text-slate-300 uppercase tracking-tighter text-3xl italic animate-pulse">Loading...</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b">
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50 z-10">Student</th>
                                    {assignedSubjects.map(sub => (
                                        <th key={sub.name} className="p-6 text-center border-l min-w-[120px]">
                                            <div className="text-slate-800 font-bold text-xs">{sub.name}</div>
                                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Max: {sub.maxMarks}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.map(stu => (
                                    <tr key={stu.id} className="hover:bg-slate-50">
                                        <td className="p-6 sticky left-0 bg-white border-r z-10 font-bold text-slate-700 text-sm uppercase">{stu.name}</td>
                                        {assignedSubjects.map(sub => (
                                            <td key={sub.name} className="p-4 border-l text-center">
                                                {isSubjectApplicable(stu, sub.name) ? (
                                                    <input
                                                        type="text"
                                                        value={marksData[stu.id]?.[sub.name] ?? ''}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            const max = Number(sub.maxMarks) || 100;
                                                            
                                                            if (val === '') {
                                                                setMarksData(p => ({ ...p, [stu.id]: { ...p[stu.id], [sub.name]: '' } }));
                                                                return;
                                                            }

                                                            const numVal = Number(val);
                                                            if (!isNaN(numVal)) {
                                                                // Capping logic: if input > max, set it to max
                                                                const finalVal = numVal > max ? max : numVal;
                                                                setMarksData(p => ({ 
                                                                    ...p, 
                                                                    [stu.id]: { ...p[stu.id], [sub.name]: String(finalVal) } 
                                                                }));
                                                            }
                                                        }}
                                                        className="w-16 p-2 text-center font-bold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    />
                                                ) : <span className="text-[10px] text-slate-200 font-black">-</span>}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MarksEntry;