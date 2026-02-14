// components/TeacherList.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { HiEye, HiPencilAlt, HiTrash, HiSearch } from 'react-icons/hi';
// 🛑 IMPORTANT: Correct the path to your Firebase config file
import { collection, getDocs, deleteDoc, doc, getFirestore } from 'firebase/firestore';
import { db } from '../firebase/config'; 



// --- FIRESTORE INTEGRATION LOGIC ---

const fetchTeachers = async () => {
    try {
        const teachersCollection = collection(db, 'teachers');
        const teacherSnapshot = await getDocs(teachersCollection); 
        
        const teacherList = teacherSnapshot.docs.map(doc => ({
            id: doc.id, 
            ...doc.data() 
        }));
        return teacherList;
    } catch (error) {
        console.error("Firestore Fetch Error:", error);
        throw new Error(`Failed to fetch teacher data: ${error.message}`);
    }
};

const deleteTeacher = async (id) => {
    try {
        const teacherDocRef = doc(db, 'teachers', id); 
        await deleteDoc(teacherDocRef);
        return true;
    } catch (error) {
        console.error("Firestore Delete Error:", error);
        throw new Error(`Failed to delete teacher with ID ${id}: ${error.message}`);
    }
};
// -----------------------------------------------------------------


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
            console.error("Failed to load teachers:", err);
            setError("Failed to load teacher data. Please check your Firebase connection and permissions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        reloadData();
    }, []);

    const handleView = (teacher) => {
        setSelectedTeacher(teacher);           
        setCurrentView('VIEW_PRINT'); // Uses the view key defined in the parent
    };
    
    const handleEdit = (teacher) => {
        setSelectedTeacher(teacher);           
        setCurrentView('EDIT');      // Uses the view key defined in the parent
    };

    const handleDelete = async (teacherId) => {
        if (!window.confirm("Are you sure you want to delete this teacher? This action cannot be undone.")) {
            return;
        }

        try {
            setLoading(true); 
            await deleteTeacher(teacherId);
            setTeachers(prev => prev.filter(t => t.id !== teacherId)); 
            setLoading(false);
        } catch (err) {
            setLoading(false);
            alert(`Failed to delete teacher: ${err.message}`);
            console.error(err);
        }
    };

    const filteredTeachers = teachers.filter(teacher => 
        (teacher.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (teacher.srNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (teacher.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );


    if (loading) {
        return (
            <div className="text-center py-10 text-lg text-indigo-600">
                Loading teacher list from Firebase...
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
                <button 
                    onClick={reloadData} 
                    className="mt-2 text-sm text-red-700 underline hover:text-red-900"
                >
                    Try Reloading Data
                </button>
            </div>
        );
    }


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <h2 className="text-xl font-semibold text-gray-800">Teacher Roster ({teachers.length})</h2>
                
                {/* Search Bar */}
                <div className="relative w-full sm:w-1/2">
                    <input
                        type="text"
                        placeholder="Search by Name,  ID No., or Email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
            </div>

            {/* Teacher Table */}
            <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID NO.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTeachers.length > 0 ? (
                            filteredTeachers.map((teacher) => (
                                <tr key={teacher.id}>
                                    <td className="px-3 py-4 whitespace-nowrap">
                                        <img className="h-10 w-10 rounded-full object-cover" 
                                            src={teacher.imageUrl || 'https://via.placeholder.com/40?text=U'} 
                                            alt={teacher.name} 
                                            onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/40?text=U" }}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.srNo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{teacher.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.qualification}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{(teacher.salary || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${teacher.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {teacher.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                        <button onClick={() => handleView(teacher)} className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition" title="View & Print Details">
                                            <HiEye className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleEdit(teacher)} className="text-yellow-600 hover:text-yellow-900 p-1 rounded-full hover:bg-yellow-50 transition" title="Edit Teacher">
                                            <HiPencilAlt className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(teacher.id)} className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition" title="Delete Teacher">
                                            <HiTrash className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                    No teachers found. Use the "Add New Teacher" tab to start.
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