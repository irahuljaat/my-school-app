'use client';

import React, { useState, useEffect } from 'react';
import { 
    HiOutlineEye, 
    HiOutlinePencilAlt, 
    HiOutlineTrash, 
    HiOutlineSearch,
    HiUserGroup,
    HiAcademicCap,
    HiCurrencyRupee,
    HiRefresh
} from 'react-icons/hi';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Image from 'next/image';

// External Component & Color Context Imports
import EditTeacherForm from './TeacherEditForm';
import TeacherViewPrint from './TeacherViewPrint';
import { useColors } from './ColorComponent';

const fetchTeachers = async () => {
    const teachersCollection = collection(db, 'teachers');
    const teacherSnapshot = await getDocs(teachersCollection); 
    return teacherSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const deleteTeacherFromDb = async (id) => {
    await deleteDoc(doc(db, 'teachers', id));
};

export default function TeacherPageController() {
    const colors = useColors();
    const [currentView, setCurrentView] = useState('LIST'); // 'LIST' | 'EDIT' | 'VIEW'
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await fetchTeachers();
            setTeachers(data);
        } catch (err) {
            console.error('Error fetching teachers:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        loadData(); 
    }, []);

    const handleAction = (view, teacher) => {
        setSelectedTeacher(teacher); 
        setCurrentView(view); 
    };

    const handleBackToList = () => {
        setSelectedTeacher(null);
        setCurrentView('LIST');
        loadData();
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Permanently delete records for ${name}?`)) return;
        try {
            await deleteTeacherFromDb(id);
            setTeachers(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            alert(`Delete failed: ${err.message}`);
        }
    };

    const filteredTeachers = teachers.filter(teacher => 
        (teacher.name || teacher.teacherName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (teacher.srNo || teacher.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (teacher.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (teacher.qualification || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculated Overview Metrics
    const totalTeachers = teachers.length;
    const activeCount = teachers.filter(t => (t.status || 'Active') === 'Active').length;
    const totalPayroll = teachers.reduce((acc, t) => acc + (parseFloat(t.salary || t.grossSalary || 0)), 0);

    // Render Edit Form View
    if (currentView === 'EDIT') {
        return (
            <EditTeacherForm 
                teacherData={selectedTeacher}
                teacher={selectedTeacher}
                onSuccess={handleBackToList}
                onClose={handleBackToList}
                onCancel={handleBackToList}
            />
        );
    }

    // Render View / Print View
    if (currentView === 'VIEW') {
        return (
            <TeacherViewPrint 
                teacherData={selectedTeacher}
                teacher={selectedTeacher}
                onClose={handleBackToList}
                onBack={handleBackToList}
            />
        );
    }

    // Render Teacher Roster List
    return (
        <div className="space-y-8 p-6 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden transition-colors duration-300"
             style={{ backgroundColor: colors.background }}>
            
            {/* Background Accent Blobs using dynamic primary color */}
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-10"
                 style={{ backgroundColor: colors.primary }}></div>
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-10"
                 style={{ backgroundColor: colors.primary }}></div>

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 pb-4">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 rounded-full text-white shadow-lg"
                         style={{ backgroundColor: colors.primary, boxShadow: `0 10px 25px -5px ${colors.primary}40` }}>
                        <HiAcademicCap size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight" style={{ color: colors.text }}>
                            Educators Directory
                        </h2>
                        <p className="text-xs font-semibold text-slate-400 mt-1">
                            Manage staff profiles, qualifications, and payroll allocations
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={loadData}
                        className="p-3.5 bg-white/80 hover:bg-white border border-slate-200 text-slate-600 rounded-full transition-all shadow-sm flex items-center justify-center hover:scale-105"
                        style={{ '--tw-hover-border-color': colors.primary }}
                        title="Refresh Roster"
                    >
                        <HiRefresh size={18} className={loading ? "animate-spin" : ""} style={{ color: colors.primary }} />
                    </button>
                    <div className="relative min-w-[280px] md:min-w-[340px]">
                        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, ID, qualification..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-5 py-3.5 bg-white/90 border border-slate-200 rounded-full text-xs font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-sm"
                            style={{ color: colors.text, '--tw-ring-color': `${colors.primary}33`, borderColor: 'border-slate-200' }}
                        />
                    </div>
                </div>
            </div>

            {/* Overview Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                <div className="p-5 backdrop-blur-md rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all"
                     style={{ backgroundColor: colors.cardBackground }}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Educators</p>
                        <h4 className="text-2xl font-black mt-1" style={{ color: colors.primary }}>{totalTeachers}</h4>
                    </div>
                    <div className="p-3 rounded-full" style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
                        <HiUserGroup size={22} />
                    </div>
                </div>

                <div className="p-5 backdrop-blur-md rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all"
                     style={{ backgroundColor: colors.cardBackground }}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Active Staff</p>
                        <h4 className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</h4>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full"><HiAcademicCap size={22} /></div>
                </div>

                <div className="p-5 backdrop-blur-md rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all"
                     style={{ backgroundColor: colors.cardBackground }}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Payroll Outlay</p>
                        <h4 className="text-2xl font-black mt-1" style={{ color: colors.text }}>₹{totalPayroll.toLocaleString('en-IN')}</h4>
                    </div>
                    <div className="p-3 rounded-full" style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
                        <HiCurrencyRupee size={22} />
                    </div>
                </div>
            </div>

            {/* Teachers Data Table */}
            <div className="relative z-10">
                {loading && teachers.length === 0 ? (
                    <div className="py-20 text-center space-y-4 rounded-[2rem] border border-slate-100" style={{ backgroundColor: colors.cardBackground }}>
                        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: colors.primary, borderTopColor: 'transparent' }}></div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Teacher Roster...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-y-3">
                            <thead>
                                <tr className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-4">
                                    <th className="px-6 py-2">Teacher Name</th>
                                    <th className="px-4 py-2">ID No.</th>
                                    <th className="px-4 py-2">Qualification</th>
                                    <th className="px-4 py-2">Salary</th>
                                    <th className="px-4 py-2 text-center">Status</th>
                                    <th className="px-6 py-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTeachers.length > 0 ? (
                                    filteredTeachers.map((teacher) => {
                                        const teacherName = teacher.name || teacher.teacherName || 'Unknown';
                                        const srNo = teacher.srNo || teacher.employeeId || '0000';
                                        const salaryVal = parseFloat(teacher.salary || teacher.grossSalary || 0);

                                        return (
                                            <tr key={teacher.id} className="group hover:scale-[1.001] transition-all">
                                                {/* Profile Name & Email */}
                                                <td className="px-6 py-4 rounded-l-[1.5rem] backdrop-blur-sm border-y border-l border-slate-100 shadow-sm"
                                                    style={{ backgroundColor: colors.cardBackground }}>
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-full bg-slate-100 overflow-hidden relative border-2 border-white shadow-sm shrink-0 flex items-center justify-center font-black"
                                                             style={{ color: colors.primary }}>
                                                            {teacher.imageUrl ? (
                                                                <Image 
                                                                    src={teacher.imageUrl} 
                                                                    alt={teacherName} 
                                                                    fill 
                                                                    className="object-cover" 
                                                                    unoptimized
                                                                />
                                                            ) : (
                                                                <span>{teacherName.charAt(0)}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-extrabold text-sm" style={{ color: colors.text }}>{teacherName}</div>
                                                            <div className="text-[11px] font-semibold text-slate-400">{teacher.email || 'No Email Registered'}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* ID Number */}
                                                <td className="px-4 py-4 backdrop-blur-sm border-y border-slate-100 shadow-sm"
                                                    style={{ backgroundColor: colors.cardBackground }}>
                                                    <span className="px-3.5 py-1.5 rounded-full text-xs font-black"
                                                          style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
                                                        #{srNo}
                                                    </span>
                                                </td>

                                                {/* Qualification */}
                                                <td className="px-4 py-4 backdrop-blur-sm border-y border-slate-100 shadow-sm"
                                                    style={{ backgroundColor: colors.cardBackground }}>
                                                    <div className="text-xs font-bold text-slate-700">{teacher.qualification || 'N/A'}</div>
                                                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{teacher.designation || 'Staff'}</div>
                                                </td>

                                                {/* Salary */}
                                                <td className="px-4 py-4 backdrop-blur-sm border-y border-slate-100 shadow-sm text-sm font-black"
                                                    style={{ backgroundColor: colors.cardBackground, color: colors.primary }}>
                                                    ₹{salaryVal.toLocaleString('en-IN')}
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-4 backdrop-blur-sm border-y border-slate-100 shadow-sm text-center"
                                                    style={{ backgroundColor: colors.cardBackground }}>
                                                    <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                        (teacher.status || 'Active') === 'Active' 
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                            : 'bg-rose-50 text-rose-600 border border-rose-200'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${(teacher.status || 'Active') === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                                        {teacher.status || 'Active'}
                                                    </span>
                                                </td>

                                                {/* Actions Column */}
                                                <td className="px-6 py-4 rounded-r-[1.5rem] backdrop-blur-sm border-y border-r border-slate-100 shadow-sm text-right"
                                                    style={{ backgroundColor: colors.cardBackground }}>
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* View Profile & Print */}
                                                        <button 
                                                            onClick={() => handleAction('VIEW', teacher)} 
                                                            className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-full transition-all shadow-sm hover:shadow"
                                                            style={{ '--tw-hover-text-color': colors.primary }}
                                                            title="View & Print Profile"
                                                        >
                                                            <HiOutlineEye size={18} />
                                                        </button>

                                                        {/* Edit Record */}
                                                        <button 
                                                            onClick={() => handleAction('EDIT', teacher)} 
                                                            className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-all shadow-sm hover:shadow"
                                                            title="Edit Teacher Profile"
                                                        >
                                                            <HiOutlinePencilAlt size={18} />
                                                        </button>

                                                        {/* Delete Record */}
                                                        <button 
                                                            onClick={() => handleDelete(teacher.id, teacherName)} 
                                                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all shadow-sm hover:shadow"
                                                            title="Delete Teacher Record"
                                                        >
                                                            <HiOutlineTrash size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-12 rounded-[2rem] text-slate-400 font-bold text-xs"
                                            style={{ backgroundColor: colors.cardBackground }}>
                                            No educators found matching your search criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}