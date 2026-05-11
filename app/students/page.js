'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { 
    HiOutlineSearch, HiOutlinePlus, HiOutlinePencilAlt, 
    HiOutlineTrash, HiOutlineAdjustments, HiOutlineCalendar, HiOutlineHome,
    HiOutlineUserGroup, HiOutlineIdentification, HiBadgeCheck
} from 'react-icons/hi';
import AddStudentForm from '../components/AddStudentForm';
import EditStudentForm from '../components/EditStudentForm';
import ViewStudentProfile from '../components/ViewStudentProfile';
import Image from 'next/image'; 

const MOCK_CLASSES = [ 'LKG','UKG','PREP' ,'1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

function StudentListPage() {
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
            studentList.sort((a, b) => (a.name || "").toLowerCase().trim().localeCompare((b.name || "").toLowerCase().trim()));
            setStudents(studentList);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (activeSession) fetchStudents(); }, [activeSession]);

    const filteredStudents = students.filter(student => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = searchTerm === '' || student.name?.toLowerCase().includes(term) || student.rollNumber?.toLowerCase().includes(term); 
        const matchesClass = selectedClass === '' || String(student.grade) === selectedClass;
        const matchesDummy = showOnlyDummy ? (student.isDummy === true) : (!student.isDummy);
        return matchesSearch && matchesClass && matchesDummy;
    });

    const handleDelete = async (studentId, studentName) => {
        if (!activeSession) return;
        if (window.confirm(`Permanently delete ${studentName}?`)) {
            try {
                await deleteDoc(doc(db, 'sessions', activeSession, 'students', studentId)); 
                fetchStudents();
            } catch (error) { alert("Failed to delete."); }
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F2FD] relative overflow-hidden p-4 lg:p-10 font-sans">
            {/* Background Decorative Glows - Crucial for Glassmorphism */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-300/30 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300/30 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-[1440px] mx-auto space-y-8 relative z-10">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h2 className="text-4xl font-black tracking-tighter text-slate-800 uppercase italic">
                            Student <span className="text-indigo-600">Directory</span>
                        </h2>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <HiOutlineHome /> Home / <span className="text-indigo-500">Students Management</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowOnlyDummy(!showOnlyDummy)}
                            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 shadow-lg ${
                                showOnlyDummy 
                                ? 'bg-rose-500 text-white border-rose-400 shadow-rose-200' 
                                : 'bg-white/70 backdrop-blur-md text-slate-500 border-white shadow-slate-200/50'
                            }`}
                        >
                            {showOnlyDummy ? "Viewing Dummy" : "Show Dummy"}
                        </button>

                        <button
                            onClick={() => setShowAddForm(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-200 transition-all active:scale-95"
                        >
                            <HiOutlinePlus size={18} /> Add New Entry
                        </button>
                    </div>
                </div>

                {/* Main Glass Card */}
                <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/80 shadow-[20px_20px_60px_rgba(0,0,0,0.05),-10px_-10px_60px_rgba(255,255,255,0.8)] overflow-hidden">
                    
                    {/* Glass Toolbar */}
                    <div className="p-8 border-b border-white/40 bg-white/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-200 text-white">
                                <HiOutlineUserGroup size={24}/>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">Information Hub</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Managing {filteredStudents.length} Students</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Search Box - Aggressive Neumorphic Inner Shadow style */}
                            <div className="relative min-w-[320px]">
                                <HiOutlineSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by Name, Roll..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-white/50 border border-white/80 rounded-[1.5rem] text-sm font-black text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                />
                            </div>

                            <div className="relative min-w-[160px]">
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="w-full pl-5 pr-10 py-4 bg-white/50 border border-white/80 rounded-[1.5rem] text-xs font-black uppercase tracking-widest text-slate-600 appearance-none cursor-pointer outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                >
                                    <option value="">All Classes</option>
                                    {MOCK_CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                                </select>
                                <HiOutlineAdjustments className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Table View with Row Cards */}
                    <div className="p-8 overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                            <thead>
                                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-6 py-2">Profile</th>
                                    <th className="px-6 py-2">Roll Number</th>
                                    <th className="px-6 py-2">Parental Info</th>
                                    <th className="px-6 py-2">Grade</th>
                                    <th className="px-6 py-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                                            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Records...</p>
                                        </td>
                                    </tr>
                                ) : filteredStudents.map((student) => (
                                    <tr 
                                        key={student.id} 
                                        onClick={() => setViewingStudent(student)}
                                        className="group cursor-pointer transition-all hover:scale-[1.01]"
                                    >
                                        {/* Row Background styling using pseudo-elements/shadows */}
                                        <td className="px-6 py-4 bg-white/40 group-hover:bg-white/80 rounded-l-[1.5rem] border-y border-l border-white/60 shadow-sm transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-slate-200 to-white overflow-hidden relative border border-white shadow-inner shrink-0">
                                                    {student.imageUrl ? (
                                                        <Image src={student.imageUrl} alt="" fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-black italic">NA</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none block">{student.name}</span>
                                                    {student.isDummy && <span className="text-[8px] text-rose-500 font-bold uppercase tracking-tighter">Dummy Entry</span>}
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-4 bg-white/40 group-hover:bg-white/80 border-y border-white/60 shadow-sm transition-all font-black text-indigo-600 text-sm italic">
                                            {student.rollNumber ? `#${student.rollNumber}` : '---'}
                                        </td>

                                        <td className="px-6 py-4 bg-white/40 group-hover:bg-white/80 border-y border-white/60 shadow-sm transition-all">
                                            <p className="text-[11px] font-black text-slate-700 uppercase">{student.fatherName || 'Unspecified'}</p>
                                            <p className="text-[9px] font-bold text-slate-400">Guardian</p>
                                        </td>

                                        <td className="px-6 py-4 bg-white/40 group-hover:bg-white/80 border-y border-white/60 shadow-sm transition-all">
                                            <span className="bg-indigo-100/50 text-indigo-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-200">
                                                Class {student.grade}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 bg-white/40 group-hover:bg-white/80 rounded-r-[1.5rem] border-y border-r border-white/60 shadow-sm transition-all">
                                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    onClick={() => setEditingStudent(student)}
                                                    className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-amber-500 hover:shadow-lg rounded-xl transition-all"
                                                >
                                                    <HiOutlinePencilAlt size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(student.id, student.name)}
                                                    className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:shadow-lg rounded-xl transition-all"
                                                >
                                                    <HiOutlineTrash size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {!loading && filteredStudents.length === 0 && (
                        <div className="m-8 py-20 text-center bg-white/30 rounded-[2rem] border-2 border-dashed border-white/60">
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No matching records found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals - Ensure these components also use the glassmorphism theme internally */}
            {showAddForm && (
                <AddStudentForm 
                    activeSession={activeSession} 
                    onClose={() => setShowAddForm(false)}
                    onStudentAdded={() => { setShowAddForm(false); fetchStudents(); }}
                />
            )}
            {editingStudent && (
                <EditStudentForm
                    activeSession={activeSession} 
                    studentData={editingStudent}
                    onClose={() => setEditingStudent(null)}
                    onStudentUpdated={() => { setEditingStudent(null); fetchStudents(); }}
                />
            )}
            {viewingStudent && (
                <ViewStudentProfile
                    studentData={viewingStudent}
                    onClose={() => setViewingStudent(null)}
                />
            )}
        </div>
    );
}

export default StudentListPage;