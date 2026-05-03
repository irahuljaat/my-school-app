// components/TeacherList.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
    HiOutlineEye, 
    HiOutlinePencilAlt, 
    HiOutlineTrash, 
    HiOutlineSearch 
} from 'react-icons/hi';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Image from 'next/image';

// --- STYLING CONSTANTS ---
const TEXT_NAVY = "#303972";
const TEXT_MUTED = "#A0A3BD";

// --- FIRESTORE INTEGRATION LOGIC ---
const fetchTeachers = async () => {
    try {
        const teachersCollection = collection(db, 'teachers');
        const teacherSnapshot = await getDocs(teachersCollection); 
        return teacherSnapshot.docs.map(doc => ({
            id: doc.id, 
            ...doc.data() 
        }));
    } catch (error) {
        console.error("Firestore Fetch Error:", error);
        throw new Error(`Failed to fetch teacher data: ${error.message}`);
    }
};

const deleteTeacherFromDb = async (id) => {
    try {
        const teacherDocRef = doc(db, 'teachers', id); 
        await deleteDoc(teacherDocRef);
        return true;
    } catch (error) {
        console.error("Firestore Delete Error:", error);
        throw new Error(`Failed to delete teacher: ${error.message}`);
    }
};

function TeacherList({ setCurrentView, setSelectedTeacher }) {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    
    const reloadData = async () => {
        try {
            setLoading(true);
            const data = await fetchTeachers();
            setTeachers(data);
            setError(null);
        } catch (err) {
            setError("Failed to load teacher data. Please check connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { reloadData(); }, []);

    const handleAction = (view, teacher) => {
        setSelectedTeacher(teacher);           
        setCurrentView(view); 
    };

    const handleDelete = async (teacherId, teacherName) => {
        if (!window.confirm(`Permanently delete records for ${teacherName}?`)) return;

        try {
            setLoading(true); 
            await deleteTeacherFromDb(teacherId);
            setTeachers(prev => prev.filter(t => t.id !== teacherId)); 
        } catch (err) {
            alert(`Delete failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredTeachers = teachers.filter(teacher => 
        (teacher.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (teacher.srNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (teacher.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && teachers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="text-sm font-bold tracking-widest uppercase text-purple-400">Syncing Directory...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Inner Header matching Spik UI */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <h2 className="text-xl font-bold" style={{ color: TEXT_NAVY }}>
                    Teachers Information
                </h2>
                
                <div className="relative min-w-[320px]">
                    <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: TEXT_MUTED }} size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, ID or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-[#F8F9FD] border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-200 transition-all"
                        style={{ color: TEXT_NAVY }}
                    />
                </div>
            </div>

            {/* Floating Row Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                        <tr className="text-[13px] font-bold" style={{ color: TEXT_NAVY }}>
                            <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded-md border-slate-300 accent-purple-600" /></th>
                            <th className="px-4 py-4">Teachers Name</th>
                            <th className="px-4 py-4">ID No.</th>
                            <th className="px-4 py-4">Qualification</th>
                            <th className="px-4 py-4">Salary</th>
                            <th className="px-4 py-4">Status</th>
                            <th className="px-4 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-transparent">
                        {filteredTeachers.length > 0 ? (
                            filteredTeachers.map((teacher) => (
                                <tr key={teacher.id} className="group hover:bg-[#F8F9FD] transition-all cursor-pointer">
                                    <td className="px-6 py-4 rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100 bg-white">
                                        <input type="checkbox" className="rounded-md border-slate-300 accent-purple-600" />
                                    </td>
                                    <td className="px-4 py-4 border-y border-transparent group-hover:border-slate-100 bg-white">
                                        <div className="flex items-center gap-4">
                                            <div className="h-11 w-11 rounded-full bg-slate-100 overflow-hidden relative border border-slate-200 shrink-0">
                                                <Image 
                                                    src={teacher.imageUrl || 'https://via.placeholder.com/150'} 
                                                    alt="" fill className="object-cover" 
                                                />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm" style={{ color: TEXT_NAVY }}>{teacher.name}</div>
                                                <div className="text-[11px] font-medium" style={{ color: TEXT_MUTED }}>{teacher.email || 'No Email'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 border-y border-transparent group-hover:border-slate-100 font-bold text-sm bg-white" style={{ color: TEXT_NAVY }}>
                                        #{teacher.srNo || '0000'}
                                    </td>
                                    <td className="px-4 py-4 border-y border-transparent group-hover:border-slate-100 text-sm font-semibold bg-white" style={{ color: TEXT_NAVY }}>
                                        {teacher.qualification || 'N/A'}
                                    </td>
                                    <td className="px-4 py-4 border-y border-transparent group-hover:border-slate-100 text-sm font-bold bg-white" style={{ color: TEXT_NAVY }}>
                                        ₹{(teacher.salary || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-4 border-y border-transparent group-hover:border-slate-100 bg-white">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            teacher.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'
                                        }`}>
                                            {teacher.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 border-y border-r border-transparent rounded-r-2xl group-hover:border-slate-100 bg-white">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => handleAction('VIEW_PRINT', teacher)} className="p-2 text-[#A0A3BD] hover:text-purple-600 hover:bg-slate-50 rounded-lg transition-all">
                                                <HiOutlineEye size={18} />
                                            </button>
                                            <button onClick={() => handleAction('EDIT', teacher)} className="p-2 text-[#A0A3BD] hover:text-amber-500 hover:bg-slate-50 rounded-lg transition-all">
                                                <HiOutlinePencilAlt size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(teacher.id, teacher.name)} className="p-2 text-[#A0A3BD] hover:text-rose-500 hover:bg-slate-50 rounded-lg transition-all">
                                                <HiOutlineTrash size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="py-20 text-center font-bold" style={{ color: TEXT_MUTED }}>
                                    No educators found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default TeacherList;