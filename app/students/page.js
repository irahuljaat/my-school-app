'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { 
    HiOutlineSearch, HiOutlinePlus, HiOutlinePencilAlt, 
    HiOutlineTrash, HiOutlineUserGroup, HiOutlineSparkles 
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
        <div className="min-h-screen p-6 lg:p-8 font-sans transition-colors duration-300 relative overflow-hidden" style={{ backgroundColor: colors.background }}>
            {/* Background Decorative Graphic Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none opacity-10 blur-3xl -mr-20 -mt-20" style={{ backgroundColor: colors.primary }}></div>
            <div className="absolute bottom-10 left-0 w-72 h-72 rounded-full pointer-events-none opacity-5 blur-2xl -ml-20" style={{ backgroundColor: colors.primary }}></div>

            <div className="max-w-[1440px] mx-auto space-y-8 relative z-10">
                
                {/* Header Card */}
                <div 
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-[28px] shadow-sm border border-slate-100 transition-colors duration-300 relative overflow-hidden"
                    style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                >
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 text-slate-500">Management Console</span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight" style={{ color: colors.text }}>Student Directory</h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowOnlyDummy(!showOnlyDummy)}
                            className={`px-6 py-3 rounded-full font-bold text-xs uppercase transition-all border ${
                                showOnlyDummy 
                                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20' 
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            {showOnlyDummy ? "Viewing Dummy" : "Show Dummy"}
                        </button>
                        <button
                            onClick={() => setShowAddForm(true)}
                            style={{ 
                                backgroundColor: colors.primary, 
                                color: colors.text === '#0f172a' ? '#ffffff' : colors.text 
                            }}
                            className="px-6 py-3 rounded-full font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-[0.99]"
                        >
                            <HiOutlinePlus size={16} strokeWidth={3} /> Add New Entry
                        </button>
                    </div>
                </div>

                {/* Main Content Card */}
                <div 
                    className="rounded-[28px] border border-slate-100 shadow-sm p-6 md:p-8 space-y-6 transition-colors duration-300 relative overflow-hidden"
                    style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                >
                    {/* Filters Header Section */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div 
                                className="p-3.5 rounded-full" 
                                style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
                            >
                                <HiOutlineUserGroup size={22} strokeWidth={2}/>
                            </div>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: colors.text }}>Information Hub</h3>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredStudents.length} Students Listed</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search Bar */}
                            <div className="relative">
                                <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by Name, Roll..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-11 pr-4 py-3 bg-slate-50/80 rounded-full text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white focus:ring-2 transition-all w-64"
                                />
                            </div>

                            {/* Class Filter */}
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="px-5 py-3 bg-slate-50/80 rounded-full text-xs font-bold uppercase text-slate-700 border border-slate-200 cursor-pointer outline-none focus:bg-white transition-all"
                            >
                                <option value="">All Classes</option>
                                {MOCK_CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                            </select>

                            {/* Section Filter */}
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                className="px-5 py-3 bg-slate-50/80 rounded-full text-xs font-bold uppercase text-slate-700 border border-slate-200 cursor-pointer outline-none focus:bg-white transition-all"
                            >
                                <option value="">All Sections</option>
                                {MOCK_SECTIONS.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 rounded-l-full">Profile</th>
                                    <th className="px-6 py-4">Roll</th>
                                    <th className="px-6 py-4">Guardian</th>
                                    <th className="px-6 py-4">Grade & Section</th>
                                    <th className="px-6 py-4 text-right rounded-r-full">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan="5" className="py-20 text-center font-bold text-slate-400 text-xs uppercase tracking-wider">Syncing students...</td></tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr><td colSpan="5" className="py-20 text-center font-bold text-slate-400 text-xs uppercase tracking-wider">No students found matching your criteria.</td></tr>
                                ) : filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer group" onClick={() => setViewingStudent(student)}>
                                        <td className="px-6 py-4 font-bold text-xs" style={{ color: colors.text }}>{student.name}</td>
                                        <td className="px-6 py-4 font-black text-xs" style={{ color: colors.primary }}>#{student.rollNumber || 'NA'}</td>
                                        <td className="px-6 py-4 text-xs text-slate-600 font-semibold">{student.fatherName || 'Unspecified'}</td>
                                        <td className="px-6 py-4">
                                            <span 
                                                className="px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase border tracking-wider"
                                                style={{ 
                                                    backgroundColor: `${colors.primary}15`, 
                                                    color: colors.text, 
                                                    borderColor: `${colors.primary}40` 
                                                }}
                                            >
                                                Class {student.grade} {student.section ? `- ${student.section}` : ''}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                                            <button 
                                                onClick={() => setEditingStudent(student)} 
                                                className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                                            >
                                                <HiOutlinePencilAlt size={16} strokeWidth={2.5} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(student.id, student.name)} 
                                                className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                                            >
                                                <HiOutlineTrash size={16} strokeWidth={2.5} />
                                            </button>
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