'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { 
    HiOutlineSearch, 
    HiOutlineFilter, 
    HiOutlineUserAdd, 
    HiOutlinePencilAlt, 
    HiOutlineEye, 
    HiOutlineTrash,
    HiOutlineAcademicCap,
    HiOutlineDatabase,
    HiOutlineLightningBolt 
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
        const matchesSearch = searchTerm === '' || 
                              student.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              student.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
        
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
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-24 md:pb-8">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center italic uppercase tracking-tight">
                            <HiOutlineAcademicCap className="mr-3 text-indigo-600 w-8 h-8 md:w-10 md:h-10" />
                            {showOnlyDummy ? "Dummy Records" : "Student Directory"}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <HiOutlineDatabase className="text-indigo-400 w-4 h-4" />
                            <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest">
                                Session: <span className="text-indigo-600">{activeSession || '...'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowOnlyDummy(!showOnlyDummy)}
                            className={`flex-1 md:flex-none flex items-center justify-center px-4 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${
                                showOnlyDummy ? 'bg-rose-500 text-white' : 'bg-white text-slate-400 border border-slate-200'
                            }`}
                        >
                            <HiOutlineLightningBolt className="w-4 h-4 mr-1" />
                            {showOnlyDummy ? "Dummy" : "Show Dummy"}
                        </button>

                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex-1 md:flex-none bg-indigo-600 text-white px-4 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center"
                        >
                            <HiOutlineUserAdd className="w-4 h-4 mr-1" />
                            Enroll
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative md:col-span-1">
                        <HiOutlineFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-white border-none rounded-2xl text-[10px] font-black uppercase tracking-widest ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                        >
                            <option value="">All Classes</option>
                            {MOCK_CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                        </select>
                    </div>
                    <div className="relative md:col-span-2">
                        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-white border-none rounded-2xl text-[10px] font-black uppercase tracking-widest ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>

                {/* --- RESPONSIVE LIST/TABLE --- */}
                {loading ? (
                    <div className="py-20 text-center font-black text-slate-300 uppercase tracking-widest animate-pulse">Loading...</div>
                ) : (
                    <div className="space-y-4 md:space-y-0">
                        {/* Desktop Table View (Hidden on Mobile) */}
                        <div className="hidden md:block bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                            <table className="w-full border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Class</th>
                                        <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 relative">
                                                        {student.imageUrl ? (
                                                            <Image src={student.imageUrl} alt="" fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">IMG</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800 text-sm uppercase">{student.name}</p>
                                                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">ID: {student.studentId || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">Class {student.grade}</span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => setViewingStudent(student)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"><HiOutlineEye size={18} /></button>
                                                    <button onClick={() => setEditingStudent(student)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-amber-600 rounded-xl transition-all"><HiOutlinePencilAlt size={18} /></button>
                                                    <button onClick={() => handleDelete(student.id, student.name)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all"><HiOutlineTrash size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View (Visible on Mobile Only) */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {filteredStudents.map((student) => (
                                <div key={student.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative shrink-0">
                                            {student.imageUrl ? (
                                                <Image src={student.imageUrl} alt="" fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-300 font-bold uppercase">No Img</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-slate-800 text-base uppercase truncate leading-tight">{student.name}</p>
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">ROLL: {student.studentId || 'N/A'}</p>
                                            <div className="mt-2 flex gap-2">
                                                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter">Class {student.grade}</span>
                                                <span className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter">{student.fatherName || 'No Parent Info'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Action Buttons for Mobile */}
                                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50">
                                        <button 
                                            onClick={() => setViewingStudent(student)}
                                            className="flex flex-col items-center justify-center py-3 bg-slate-50 rounded-2xl text-slate-500 active:bg-indigo-50 active:text-indigo-600 transition-colors"
                                        >
                                            <HiOutlineEye size={20} />
                                            <span className="text-[8px] font-black uppercase mt-1">View</span>
                                        </button>
                                        <button 
                                            onClick={() => setEditingStudent(student)}
                                            className="flex flex-col items-center justify-center py-3 bg-slate-50 rounded-2xl text-slate-500 active:bg-amber-50 active:text-amber-600 transition-colors"
                                        >
                                            <HiOutlinePencilAlt size={20} />
                                            <span className="text-[8px] font-black uppercase mt-1">Edit</span>
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(student.id, student.name)}
                                            className="flex flex-col items-center justify-center py-3 bg-slate-50 rounded-2xl text-slate-500 active:bg-rose-50 active:text-rose-600 transition-colors"
                                        >
                                            <HiOutlineTrash size={20} />
                                            <span className="text-[8px] font-black uppercase mt-1">Delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredStudents.length === 0 && (
                            <div className="py-20 text-center bg-white rounded-[2rem] border border-slate-100 font-black text-slate-300 uppercase tracking-widest text-xs">
                                No records found
                            </div>
                        )}
                    </div>
                )}
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