'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { 
    HiOutlineSearch, HiOutlinePlus, HiOutlinePencilAlt, 
    HiOutlineTrash, HiOutlineAdjustments, HiOutlineHome,
    HiOutlineUserGroup
} from 'react-icons/hi';
import AddStudentForm from '../components/AddStudentForm';
import EditStudentForm from '../components/EditStudentForm';
import ViewStudentProfile from '../components/ViewStudentProfile';
import Image from 'next/image'; 

const MOCK_CLASSES = [ 'LKG','UKG','PREP' ,'1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export default function StudentListPage() {
    const [activeSession, setActiveSession] = useState(null); 
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [showAddForm, setShowAddForm] = useState(false); 
    const [editingStudent, setEditingStudent] = useState(null); 
    const [viewingStudent, setViewingStudent] = useState(null); 
    const [showOnlyDummy, setShowOnlyDummy] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'config', 'settings'), (snap) => {
            if (snap.exists()) setActiveSession(snap.data().activeSession);
        });
        return () => unsub();
    }, []);

    const fetchStudents = async () => {
        if (!activeSession) return;
        setLoading(true);
        try {
            const snapshot = await getDocs(collection(db, 'sessions', activeSession, 'students'));
            const studentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            studentList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            setStudents(studentList);
        } catch (error) { console.error("Error:", error); } 
        finally { setLoading(false); }
    };

    useEffect(() => { if (activeSession) fetchStudents(); }, [activeSession]);

    // Use useMemo to prevent filtering lag on every re-render
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || student.name?.toLowerCase().includes(term) || student.rollNumber?.toLowerCase().includes(term); 
            const matchesClass = !selectedClass || String(student.grade) === selectedClass;
            const matchesDummy = showOnlyDummy ? (student.isDummy === true) : (!student.isDummy);
            return matchesSearch && matchesClass && matchesDummy;
        });
    }, [students, searchTerm, selectedClass, showOnlyDummy]);

    const handleDelete = async (studentId, studentName) => {
        if (window.confirm(`Permanently delete ${studentName}?`)) {
            try {
                await deleteDoc(doc(db, 'sessions', activeSession, 'students', studentId)); 
                fetchStudents();
            } catch (error) { alert("Failed to delete."); }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 lg:p-10 font-sans">
            <div className="max-w-[1440px] mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-black text-slate-800 uppercase italic">Student Directory</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Management Console</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowOnlyDummy(!showOnlyDummy)}
                            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase transition-all border-2 ${
                                showOnlyDummy ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-500 border-slate-200'
                            }`}
                        >
                            {showOnlyDummy ? "Viewing Dummy" : "Show Dummy"}
                        </button>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg hover:bg-indigo-700"
                        >
                            <HiOutlinePlus size={18} /> Add New Entry
                        </button>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                                <HiOutlineUserGroup size={24}/>
                            </div>
                            <h3 className="text-lg font-black text-slate-800 uppercase">Information Hub</h3>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4">
                            <input
                                type="text"
                                placeholder="Search by Name, Roll..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-6 py-3 bg-slate-50 rounded-xl text-sm font-bold border outline-none focus:border-indigo-500"
                            />
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="px-6 py-3 bg-slate-50 rounded-xl text-xs font-bold uppercase cursor-pointer outline-none"
                            >
                                <option value="">All Classes</option>
                                {MOCK_CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto mt-4">
                        <table className="w-full text-left">
                            <thead className="text-slate-400 text-[10px] font-black uppercase">
                                <tr>
                                    <th className="px-6 py-4">Profile</th>
                                    <th className="px-6 py-4">Roll</th>
                                    <th className="px-6 py-4">Guardian</th>
                                    <th className="px-6 py-4">Grade</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan="5" className="py-20 text-center font-bold text-slate-400">Syncing...</td></tr>
                                ) : filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setViewingStudent(student)}>
                                        <td className="px-6 py-4 font-bold text-sm">{student.name}</td>
                                        <td className="px-6 py-4 text-indigo-600 font-black">#{student.rollNumber || 'NA'}</td>
                                        <td className="px-6 py-4 text-sm">{student.fatherName || 'Unspecified'}</td>
                                        <td className="px-6 py-4"><span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black">CLASS {student.grade}</span></td>
                                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => setEditingStudent(student)} className="p-2 text-slate-400 hover:text-indigo-600"><HiOutlinePencilAlt size={18} /></button>
                                            <button onClick={() => handleDelete(student.id, student.name)} className="p-2 text-slate-400 hover:text-rose-600"><HiOutlineTrash size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modals remain as before */}
            {showAddForm && <AddStudentForm activeSession={activeSession} onClose={() => setShowAddForm(false)} onStudentAdded={() => { setShowAddForm(false); fetchStudents(); }} />}
            {editingStudent && <EditStudentForm activeSession={activeSession} studentData={editingStudent} onClose={() => setEditingStudent(null)} onStudentUpdated={() => { setEditingStudent(null); fetchStudents(); }} />}
            {viewingStudent && <ViewStudentProfile studentData={viewingStudent} onClose={() => setViewingStudent(null)} />}
        </div>
    );
}