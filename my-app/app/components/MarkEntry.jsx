'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase/config';
import { collection, doc, getDoc, getDocs, query, where, setDoc } from 'firebase/firestore';
import { HiOutlinePencilAlt, HiOutlineLightningBolt } from 'react-icons/hi';

const MOCK_CLASSES = [ 'LKG','UKG','PREP' ,'1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const COMPULSORY_SUBJECTS = ['hindi', 'english']; 

function MarksEntry({ activeSession }) {
    const [examsList, setExamsList] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedClass, setSelectedClass] = useState(MOCK_CLASSES[0]);
    const [assignedSubjects, setAssignedSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [marksData, setMarksData] = useState({}); 
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showOnlyDummy, setShowOnlyDummy] = useState(false); // NEW: Dummy State

    const isSubjectApplicable = (student, subjectName) => {
        const name = subjectName.toLowerCase().trim();
        const classNum = parseInt(selectedClass);
        if (COMPULSORY_SUBJECTS.includes(name)) return true;
        if (classNum <= 10) return true;
        const studentSubs = student.subjects || student.optionalSubjects || [];
        let searchList = Array.isArray(studentSubs) ? studentSubs : [studentSubs];
        return searchList.some(s => String(s).toLowerCase().trim() === name);
    };

    const loadData = useCallback(async () => {
        if (!activeSession || !selectedExamId || !selectedClass) return;
        setLoading(true);
        try {
            // Fetch session-based students
            let sSnap = await getDocs(query(collection(db, 'sessions', activeSession, 'students'), where('grade', '==', selectedClass)));
            
            // Fallback to global
            if (sSnap.empty) {
                sSnap = await getDocs(query(collection(db, 'students'), where('grade', '==', selectedClass)));
            }

            // LOCAL FILTERING: Logic for Normal vs Dummy
            const sList = sSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(student => {
                    if (showOnlyDummy) return student.isDummy === true;
                    return student.isDummy === false || student.isDummy === undefined;
                });

            // --- ALPHABETICAL SORT (A-Z) ---
            sList.sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: 'base' }));
            
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
        } catch (error) {
            console.error("Load Error:", error);
        } finally { setLoading(false); }
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
            // Use {merge: true} to ensure we don't wipe out marks for the other group (Dummy/Normal)
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
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white"><HiOutlinePencilAlt size={24}/></div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase italic">Marks Entry</h2>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                {activeSession} Session • {showOnlyDummy ? 'DUMMY ONLY' : 'NORMAL STUDENTS'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {/* DUMMY TOGGLE */}
                        <button 
                            onClick={() => setShowOnlyDummy(!showOnlyDummy)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-black text-[10px] uppercase tracking-widest ${
                                showOnlyDummy 
                                ? 'bg-rose-500 border-rose-600 text-white' 
                                : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-400'
                            }`}
                        >
                            <HiOutlineLightningBolt className={showOnlyDummy ? "animate-bounce" : ""} />
                            {showOnlyDummy ? 'Dummy' : 'Normal'}
                        </button>

                        <select className="p-3 bg-slate-100 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
                            {examsList.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                        </select>
                        <select className="p-3 bg-slate-100 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                            {MOCK_CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>
                        <button onClick={handleSave} disabled={isSaving || loading} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50">
                            {isSaving ? 'Saving...' : 'Save Marks'}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-20 text-center font-black text-slate-300 uppercase tracking-tighter text-3xl italic animate-pulse">Loading Students...</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b">
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50 z-10">Student</th>
                                    {assignedSubjects.map(sub => (
                                        <th key={sub.name} className="p-6 text-center border-l min-w-[120px]">
                                            <div className="text-slate-800 font-bold text-xs">{sub.name}</div>
                                            <div className="text-[9px] text-slate-400 font-bold">Max: {sub.maxMarks}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.length > 0 ? (
                                    students.map(stu => (
                                        <tr key={stu.id} className="hover:bg-slate-50">
                                            <td className="p-6 sticky left-0 bg-white border-r z-10 font-bold text-slate-700 text-sm uppercase">{stu.name}</td>
                                            {assignedSubjects.map(sub => {
                                                const active = isSubjectApplicable(stu, sub.name);
                                                return (
                                                    <td key={sub.name} className="p-4 border-l text-center">
                                                        {active ? (
                                                            <input 
                                                                type="text" // Using text to allow empty or special chars if needed, but styled for numbers
                                                                value={marksData[stu.id]?.[sub.name] ?? ''} 
                                                                onChange={e => setMarksData(p => ({...p, [stu.id]: {...p[stu.id], [sub.name]: e.target.value}}))}
                                                                placeholder="-"
                                                                className="w-16 p-2 text-center font-bold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                                                            />
                                                        ) : <span className="text-[10px] text-slate-200 font-black">-</span>}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={assignedSubjects.length + 1} className="p-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                                            No {showOnlyDummy ? 'Dummy' : 'Normal'} Students found for this class.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MarksEntry;