'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { 
    HiOutlineSearch, 
    HiOutlinePlus, 
    HiOutlinePencilAlt, 
    HiOutlineTrash,
    HiOutlineAdjustments,
    HiOutlineCalendar
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
            if (snap.exists()) {
                setActiveSession(snap.data().activeSession);
            }
        });
        return () => unsub();
    }, []);

    const fetchStudents = async () => {
        if (!activeSession) return;
        setLoading(true);
        try {
            const snapshot = await getDocs(collection(db, 'sessions', activeSession, 'students'));
            const studentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            studentList.sort((a, b) => {
                const nameA = (a.name || "").toLowerCase().trim();
                const nameB = (b.name || "").toLowerCase().trim();
                return nameA.localeCompare(nameB);
            });

            setStudents(studentList);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        if (activeSession) fetchStudents(); 
    }, [activeSession]);

    const filteredStudents = students.filter(student => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = searchTerm === '' || 
                              student.name?.toLowerCase().includes(term) || 
                              // Updated to search by rollNumber
                              student.rollNumber?.toLowerCase().includes(term); 
        
        const matchesClass = selectedClass === '' || String(student.grade) === selectedClass;
        const matchesDummy = showOnlyDummy ? (student.isDummy === true) : (!student.isDummy);

        return matchesSearch && matchesClass && matchesDummy;
    });

    const handleDelete = async (studentId, studentName) => {
        if (!activeSession) return;
        if (window.confirm(`Permanently delete record for ${studentName}?`)) {
            try {
                await deleteDoc(doc(db, 'sessions', activeSession, 'students', studentId)); 
                fetchStudents();
            } catch (error) {
                alert("Failed to delete student.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FD] p-6 lg:p-10">
            <div className="max-w-[1400px] mx-auto space-y-8">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-[#303972]">Students List</h2>
                        <p className="text-sm text-[#A0A3BD] mt-1 font-medium">Home / Students</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowOnlyDummy(!showOnlyDummy)}
                            className={`px-6 py-2.5 rounded-lg font-bold text-xs transition-all border ${
                                showOnlyDummy 
                                ? 'bg-rose-50 text-rose-500 border-rose-200 shadow-sm' 
                                : 'bg-white text-[#A0A3BD] border-slate-200'
                            }`}
                        >
                            {showOnlyDummy ? "Dummy Records" : "Show Dummy"}
                        </button>

                        <button
                            onClick={() => setShowAddForm(true)}
                            className="bg-[#6B46C1] hover:bg-[#553C9A] text-white px-6 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-100 transition-all active:scale-95"
                        >
                            <HiOutlinePlus size={18} />
                            Add Students
                        </button>
                    </div>
                </div>

                {/* Content Container (Card) */}
                <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100">
                    
                    {/* Toolbar Area */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                        <h3 className="text-lg font-bold text-[#303972]">Students Information</h3>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative min-w-[140px]">
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="w-full pl-4 pr-10 py-2.5 bg-[#F8F9FD] border-none rounded-xl text-sm font-semibold text-[#A0A3BD] appearance-none cursor-pointer focus:ring-2 focus:ring-purple-200 transition-all"
                                >
                                    <option value="">All Classes</option>
                                    {MOCK_CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                                </select>
                                <HiOutlineAdjustments className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A3BD] pointer-events-none" />
                            </div>

                            <div className="relative min-w-[280px]">
                                <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A3BD]" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by name or roll number..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-[#F8F9FD] border-none rounded-xl text-sm font-semibold text-[#303972] placeholder-[#A0A3BD] focus:ring-2 focus:ring-purple-200 transition-all"
                                />
                            </div>

                            <div className="hidden sm:flex items-center gap-2 bg-[#F8F9FD] px-4 py-2.5 rounded-xl text-[#A0A3BD] text-xs font-bold border border-transparent">
                                <HiOutlineCalendar size={18} />
                                Last 30 days
                            </div>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-y-2">
                            <thead>
                                <tr className="text-[#303972] text-[13px] font-bold">
                                    <th className="px-4 py-4 w-12"><input type="checkbox" className="rounded-md border-slate-300 accent-purple-600" /></th>
                                    <th className="px-4 py-4">Students Name</th>
                                    <th className="px-4 py-4">Roll No</th>
                                    <th className="px-4 py-4">Parent Name</th>
                                    <th className="px-4 py-4">Class</th>
                                    <th className="px-4 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center text-[#A0A3BD] font-bold animate-pulse uppercase tracking-widest text-xs">Processing Directory...</td>
                                    </tr>
                                ) : filteredStudents.map((student) => (
                                    <tr 
                                        key={student.id} 
                                        onClick={() => setViewingStudent(student)}
                                        className="group hover:bg-[#F8F9FD] cursor-pointer transition-colors"
                                    >
                                        <td className="px-4 py-3 rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100">
                                            <input type="checkbox" className="rounded-md border-slate-300 accent-purple-600" onClick={(e) => e.stopPropagation()} />
                                        </td>
                                        <td className="px-4 py-3 border-y border-transparent group-hover:border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-100 overflow-hidden relative border border-slate-200 shrink-0">
                                                    {student.imageUrl ? (
                                                        <Image src={student.imageUrl} alt="" fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400 font-bold">IMG</div>
                                                    )}
                                                </div>
                                                <span className="font-bold text-[#303972] text-sm">{student.name}</span>
                                            </div>
                                        </td>
                                        
                                        {/* CORRECTED: Getting Roll Number from Firestore field rollNumber */}
                                        <td className="px-4 py-3 border-y border-transparent group-hover:border-slate-100 font-bold text-[#303972] text-sm">
                                            {student.rollNumber ? `#${student.rollNumber}` : '---'}
                                        </td>

                                        <td className="px-4 py-3 border-y border-transparent group-hover:border-slate-100 text-[#303972] text-sm font-medium">
                                            {student.fatherName || 'Not Specified'}
                                        </td>
                                        <td className="px-4 py-3 border-y border-transparent group-hover:border-slate-100">
                                            <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-xs font-bold">
                                                {student.grade}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 border-y border-r border-transparent rounded-r-2xl group-hover:border-slate-100">
                                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    onClick={() => setEditingStudent(student)}
                                                    className="p-2 text-[#A0A3BD] hover:text-amber-500 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100"
                                                >
                                                    <HiOutlinePencilAlt size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(student.id, student.name)}
                                                    className="p-2 text-[#A0A3BD] hover:text-rose-500 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100"
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
                        <div className="py-20 text-center text-[#A0A3BD] font-bold text-sm bg-[#F8F9FD] rounded-2xl border border-dashed border-slate-200">
                            No students found in the directory for this criteria.
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
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