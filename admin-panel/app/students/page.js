'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { 
    HiOutlineSearch, HiOutlinePlus, HiOutlinePencilAlt, 
    HiOutlineTrash, HiOutlineUserGroup, HiOutlineFilter,
    HiOutlineEye
} from 'react-icons/hi';
import AddStudentForm from '../components/AddStudentForm';
import EditStudentForm from '../components/EditStudentForm';
import ViewStudentProfile from '../components/ViewStudentProfile';
import { useColors } from '../components/ColorComponent';

const MOCK_CLASSES = [ 'LKG', 'UKG', 'PREP', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12' ];
const MOCK_SECTIONS = [ 'A', 'B', 'C', 'D' ]; 

export default function StudentListPage() {
    const colors = useColors();

    const [activeSession, setActiveSession] = useState(null); 
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState(''); 
    const [showAddForm, setShowAddForm] = useState(false); 
    const [editingStudent, setEditingStudent] = useState(null); 
    const [viewingStudent, setViewingStudent] = useState(null); 
    const [showOnlyDummy, setShowOnlyDummy] = useState(false);

    // Real-time listener for site configuration active session
    useEffect(() => {
        const unsubSettings = onSnapshot(doc(db, 'config', 'settings'), (snap) => {
            if (snap.exists()) setActiveSession(snap.data().activeSession);
        });

        return () => {
            unsubSettings();
        };
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

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || student.name?.toLowerCase().includes(term) || String(student.rollNumber || '').toLowerCase().includes(term); 
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
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-300 relative overflow-hidden antialiased" style={{ backgroundColor: colors.background }}>
            {/* Subtle Ambient Background Gradients */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none opacity-[0.06] blur-3xl -mr-32 -mt-32" style={{ backgroundColor: colors.primary }}></div>
            <div className="absolute bottom-10 left-0 w-[420px] h-[420px] rounded-full pointer-events-none opacity-[0.04] blur-3xl -ml-28" style={{ backgroundColor: colors.primary }}></div>

            <div className="max-w-[1440px] mx-auto space-y-6 relative z-10">
                
                {/* Header Management Bar */}
                <header 
                    className="flex flex-col md:flex-row md:items-center justify-between gap-5 p-6 sm:p-7 rounded-3xl shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)] border border-slate-200/80 transition-all duration-300 relative overflow-hidden"
                    style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                >
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Session: {activeSession || 'Loading...'}
                            </span>
                            <span className="text-xs text-slate-400 font-medium hidden sm:inline">• Academic Administration</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: colors.text }}>
                            Student Information Directory
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium">
                            Manage student profiles, grade allocations, roll numbers, and parent contacts
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Toggle Dummy Records */}
                        <button
                            onClick={() => setShowOnlyDummy(!showOnlyDummy)}
                            className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border flex items-center gap-2 shadow-xs ${
                                showOnlyDummy 
                                    ? 'bg-rose-500 text-white border-rose-500 shadow-rose-500/20' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${showOnlyDummy ? 'bg-white' : 'bg-slate-300'}`}></span>
                            {showOnlyDummy ? "Dummy Active" : "Filter Dummy"}
                        </button>

                        {/* Add Student Primary Action */}
                        <button
                            onClick={() => setShowAddForm(true)}
                            style={{ 
                                backgroundColor: colors.primary, 
                                color: colors.text === '#0f172a' ? '#ffffff' : colors.text 
                            }}
                            className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                        >
                            <HiOutlinePlus size={16} strokeWidth={2.5} /> Add New Student
                        </button>
                    </div>
                </header>

                {/* Main Records Container */}
                <div 
                    className="rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)] p-6 sm:p-7 space-y-6 transition-colors duration-300 relative overflow-hidden"
                    style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                >
                    {/* Filters & Search Toolbar */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div 
                                className="w-11 h-11 rounded-2xl flex items-center justify-center border transition-all" 
                                style={{ 
                                    backgroundColor: `${colors.primary}12`, 
                                    color: colors.primary,
                                    borderColor: `${colors.primary}25`
                                }}
                            >
                                <HiOutlineUserGroup size={22} strokeWidth={2}/>
                            </div>
                            <div>
                                <h2 className="text-sm font-bold tracking-tight" style={{ color: colors.text }}>Active Student Registry</h2>
                                <span className="text-[11px] font-semibold text-slate-400">
                                    Displaying {filteredStudents.length} of {students.length} recorded pupils
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search Input */}
                            <div className="relative flex-1 sm:flex-initial">
                                <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by name, roll no..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white rounded-xl text-xs font-semibold text-slate-700 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full sm:w-64 placeholder:text-slate-400"
                                />
                            </div>

                            {/* Class Selector */}
                            <div className="relative">
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white rounded-xl text-xs font-semibold text-slate-700 border border-slate-200 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none pr-8"
                                >
                                    <option value="">All Classes</option>
                                    {MOCK_CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                                </select>
                                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>

                            {/* Section Selector */}
                            <div className="relative">
                                <select
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    className="px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white rounded-xl text-xs font-semibold text-slate-700 border border-slate-200 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none pr-8"
                                >
                                    <option value="">All Sections</option>
                                    {MOCK_SECTIONS.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
                                </select>
                                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Student Data Table */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                                    <th className="px-5 py-3.5">Student Profile</th>
                                    <th className="px-5 py-3.5">Roll Number</th>
                                    <th className="px-5 py-3.5">Guardian / Father</th>
                                    <th className="px-5 py-3.5">Grade Allocation</th>
                                    <th className="px-5 py-3.5 text-right">Quick Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Syncing student database...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <HiOutlineFilter className="w-8 h-8 stroke-[1.5] text-slate-300 mb-2" />
                                                <p className="text-xs font-bold text-slate-600">No students matched your search criteria</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting query terms or clearing the grade filter</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredStudents.map((student) => {
                                    const studentPhoto = student.imageUrl || student.photoUrl || student.image || student.profilePic;

                                    return (
                                        <tr 
                                            key={student.id} 
                                            onClick={() => setViewingStudent(student)}
                                            className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                        >
                                            {/* Photo & Profile Name */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="relative w-10 h-10 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs flex-shrink-0 group-hover:border-indigo-400 transition-colors">
                                                        {studentPhoto ? (
                                                            <img 
                                                                src={studentPhoto} 
                                                                alt={student.name || 'Student Photo'}
                                                                className="w-full h-full object-cover object-top"
                                                                onError={(e) => {
                                                                    // Fallback if image fails to load or broken link
                                                                    e.currentTarget.style.display = 'none';
                                                                    e.currentTarget.nextSibling.style.display = 'flex';
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div 
                                                            className={`w-full h-full items-center justify-center font-bold text-xs text-slate-700 bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors ${
                                                                studentPhoto ? 'hidden' : 'flex'
                                                            }`}
                                                        >
                                                            {student.name?.charAt(0) || "S"}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition-colors">{student.name}</p>
                                                        <p className="text-[11px] font-medium text-slate-400">{student.category || 'General'}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Roll Number */}
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/60">
                                                    #{student.rollNumber || 'NA'}
                                                </span>
                                            </td>

                                            {/* Guardian */}
                                            <td className="px-5 py-3.5">
                                                <div className="text-xs font-medium text-slate-600">
                                                    {student.fatherName || <span className="text-slate-400 italic">Not Specified</span>}
                                                </div>
                                            </td>

                                            {/* Grade & Section Badge */}
                                            <td className="px-5 py-3.5">
                                                <span 
                                                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase border tracking-wide"
                                                    style={{ 
                                                        backgroundColor: `${colors.primary}12`, 
                                                        color: colors.primary, 
                                                        borderColor: `${colors.primary}30` 
                                                    }}
                                                >
                                                    Class {student.grade} {student.section ? `• Sec ${student.section}` : ''}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="inline-flex items-center gap-1">
                                                    <button 
                                                        onClick={() => setViewingStudent(student)} 
                                                        title="View Profile"
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                                                    >
                                                        <HiOutlineEye size={16} strokeWidth={2} />
                                                    </button>
                                                    <button 
                                                        onClick={() => setEditingStudent(student)} 
                                                        title="Edit Record"
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    >
                                                        <HiOutlinePencilAlt size={16} strokeWidth={2} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(student.id, student.name)} 
                                                        title="Delete Student"
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                    >
                                                        <HiOutlineTrash size={16} strokeWidth={2} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
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