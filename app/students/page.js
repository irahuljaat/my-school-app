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

const MOCK_CLASSES = [ 'LKG', 'UKG', 'PREP', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12' ];
const MOCK_SECTIONS = [ 'A', 'B', 'C', 'D' ]; // Define your available sections here

export default function StudentListPage() {
    const [activeSession, setActiveSession] = useState(null); 
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState(''); // Added section filter state
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

    // Updated filter to include section matching
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || student.name?.toLowerCase().includes(term) || student.rollNumber?.toLowerCase().includes(term); 
            const matchesClass = !selectedClass || String(student.grade) === selectedClass;
            const matchesSection = !selectedSection || String(student.section)?.toUpperCase() === selectedSection;
            const matchesDummy = showOnlyDummy ? (student.isDummy === true) : (!student.isDummy);
            return matchesSearch && matchesClass && matchesSection && matchesDummy;
        });
    }, [students, searchTerm, selectedClass, selectedSection, showOnlyDummy]);

    const handleDelete = async (studentId, studentName) => {
        if (window.confirm(`Permanently delete ${studentName}?`)) {
            try {
                await deleteDoc(doc(db, 'sessions', activeSession, 'students', studentId)); 
                fetchStudents();
            } catch (error) { alert("Failed to delete."); }
        }
    };

    return (
        <div className="min-h-screen bg-[#fafbfe] p-6 lg:p-8 font-sans">
            <div className="max-w-[1440px] mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Student Directory</h2>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Management Console</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowOnlyDummy(!showOnlyDummy)}
                            className={`px-5 py-3 rounded-xl font-bold text-xs uppercase transition-all border ${
                                showOnlyDummy ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/20' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            {showOnlyDummy ? "Viewing Dummy" : "Show Dummy"}
                        </button>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="bg-[#9853eb] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase flex items-center gap-2 shadow-sm shadow-purple-500/20 hover:bg-[#8643d6] transition-all"
                        >
                            <HiOutlinePlus size={18} strokeWidth={2.5} /> Add New Entry
                        </button>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="p-3.5 bg-purple-50 text-[#9853eb] rounded-2xl">
                                <HiOutlineUserGroup size={24} strokeWidth={1.8}/>
                            </div>
                            <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Information Hub</h3>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by Name, Roll..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-11 pr-4 py-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:border-[#9853eb] focus:ring-2 focus:ring-[#9853eb]/20 transition-all w-64"
                                />
                            </div>

                            {/* Class Filter */}
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold uppercase text-slate-700 border border-slate-200 cursor-pointer outline-none focus:border-[#9853eb] transition-all"
                            >
                                <option value="">All Classes</option>
                                {MOCK_CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                            </select>

                            {/* Section Filter Dropdown */}
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                className="px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold uppercase text-slate-700 border border-slate-200 cursor-pointer outline-none focus:border-[#9853eb] transition-all"
                            >
                                <option value="">All Sections</option>
                                {MOCK_SECTIONS.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50 rounded-xl">
                                <tr>
                                    <th className="px-6 py-4 rounded-l-xl">Profile</th>
                                    <th className="px-6 py-4">Roll</th>
                                    <th className="px-6 py-4">Guardian</th>
                                    <th className="px-6 py-4">Grade & Section</th>
                                    <th className="px-6 py-4 text-right rounded-r-xl">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan="5" className="py-20 text-center font-bold text-slate-400 text-xs">Syncing students...</td></tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr><td colSpan="5" className="py-20 text-center font-bold text-slate-400 text-xs">No students found matching your criteria.</td></tr>
                                ) : filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer group" onClick={() => setViewingStudent(student)}>
                                        <td className="px-6 py-4 font-bold text-sm text-slate-800">{student.name}</td>
                                        <td className="px-6 py-4 text-[#9853eb] font-black">#{student.rollNumber || 'NA'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{student.fatherName || 'Unspecified'}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-[#f3efff] text-[#9853eb] px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                                                Class {student.grade} {student.section ? `- ${student.section}` : ''}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => setEditingStudent(student)} className="p-2 text-slate-400 hover:text-[#9853eb] hover:bg-purple-50 rounded-lg transition-colors"><HiOutlinePencilAlt size={18} /></button>
                                            <button onClick={() => handleDelete(student.id, student.name)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><HiOutlineTrash size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showAddForm && <AddStudentForm activeSession={activeSession} onClose={() => setShowAddForm(false)} onStudentAdded={() => { setShowAddForm(false); fetchStudents(); }} />}
            {editingStudent && <EditStudentForm activeSession={activeSession} studentData={editingStudent} onClose={() => setEditingStudent(null)} onStudentUpdated={() => { setEditingStudent(null); fetchStudents(); }} />}
            {viewingStudent && <ViewStudentProfile studentData={viewingStudent} onClose={() => setViewingStudent(null)} />}
        </div>
    );
}