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
    HiOutlineLightningBolt // Icon for Dummy students
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

    // --- NEW STATE FOR DUMMY TOGGLE ---
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

    // --- UPDATED FILTER LOGIC ---
    const filteredStudents = students.filter(student => {
        const matchesSearch = searchTerm === '' || 
                              student.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              student.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesClass = selectedClass === '' || String(student.grade) === selectedClass;

        // Logic: If toggle is ON, only show isDummy: true. If OFF, only show isDummy: false/undefined
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
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 flex items-center italic uppercase tracking-tight">
                            <HiOutlineAcademicCap className="mr-3 text-indigo-600 w-10 h-10" />
                            {showOnlyDummy ? "Dummy Records" : "Student Directory"}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <HiOutlineDatabase className="text-indigo-400 w-4 h-4" />
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
                                Active Session: <span className="text-indigo-600">{activeSession || 'Loading...'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {/* --- DUMMY TOGGLE BUTTON --- */}
                        <button
                            onClick={() => setShowOnlyDummy(!showOnlyDummy)}
                            className={`flex items-center px-6 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all shadow-lg ${
                                showOnlyDummy 
                                ? 'bg-rose-500 text-white shadow-rose-100' 
                                : 'bg-white text-slate-400 border border-slate-200'
                            }`}
                        >
                            <HiOutlineLightningBolt className={`w-5 h-5 mr-2 ${showOnlyDummy ? 'animate-pulse' : ''}`} />
                            {showOnlyDummy ? "Viewing Dummy" : "Show Dummy"}
                        </button>

                        <button
                            onClick={() => setShowAddForm(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 transition-all flex items-center justify-center"
                        >
                            <HiOutlineUserAdd className="w-5 h-5 mr-2" />
                            Enroll Student
                        </button>
                    </div>
                </div>

                {/* Filters & Search Card */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative w-full md:w-1/3">
                        <HiOutlineFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-xs font-black uppercase tracking-widest text-slate-700 ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500 appearance-none outline-none"
                        >
                            <option value="">All Classes</option>
                            {MOCK_CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                        </select>
                    </div>

                    <div className="relative w-full md:w-2/3">
                        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={showOnlyDummy ? "SEARCH DUMMY STUDENTS..." : "SEARCH NORMAL STUDENTS..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-300"
                        />
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                    {loading ? (
                        <div className="py-24 text-center animate-pulse text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Loading Database...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className={`border-b ${showOnlyDummy ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50/50 border-slate-100'}`}>
                                    <tr>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Student Profile</th>
                                        <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Parentage</th>
                                        <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Grade</th>
                                        <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">D.O.B</th>
                                        <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Manage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                                        <tr key={student.id} className={`group transition-all ${showOnlyDummy ? 'hover:bg-rose-50/30' : 'hover:bg-indigo-50/30'}`}>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center">
                                                    <div className={`h-14 w-14 rounded-[1.25rem] bg-slate-100 mr-5 overflow-hidden ring-4 ring-white shadow-sm border group-hover:scale-110 transition-transform ${showOnlyDummy ? 'border-rose-100' : 'border-slate-100'}`}>
                                                        {student.imageUrl ? (
                                                            <Image 
                                                                src={student.imageUrl.replace('/upload/', '/upload/w_100,h_100,c_fill/')} 
                                                                alt="" width={56} height={56} className="object-cover h-full w-full"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-slate-300 bg-slate-50">IMAGE</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800 text-sm uppercase tracking-tight">
                                                            {student.name}
                                                            {student.isDummy && <span className="ml-2 text-[8px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded shadow-sm">DUMMY</span>}
                                                        </div>
                                                        <div className={`text-[10px] font-black uppercase mt-0.5 tracking-tighter ${showOnlyDummy ? 'text-rose-500' : 'text-indigo-500'}`}>ROLL: {student.studentId || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-xs font-bold text-slate-600 uppercase italic">{student.fatherName || '—'}</td>
                                            <td className="px-6 py-5">
                                                <span className={`${showOnlyDummy ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-100 text-slate-700 border-slate-200'} px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border`}>
                                                    CL {student.grade}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-[11px] font-bold text-slate-500">{student.dob || '—'}</td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="flex justify-center items-center gap-2">
                                                    <button onClick={() => setViewingStudent(student)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-md rounded-2xl transition-all">
                                                        <HiOutlineEye size={20} />
                                                    </button>
                                                    <button onClick={() => setEditingStudent(student)} className="p-3 text-slate-400 hover:text-amber-600 hover:bg-white hover:shadow-md rounded-2xl transition-all">
                                                        <HiOutlinePencilAlt size={20} />
                                                    </button>
                                                    <button onClick={() => handleDelete(student.id, student.name)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-md rounded-2xl transition-all">
                                                        <HiOutlineTrash size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="py-20 text-center font-black text-slate-300 uppercase tracking-widest text-xs">
                                                {showOnlyDummy ? "No Dummy Students Recorded" : "No Normal Students Found"}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals remain the same */}
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