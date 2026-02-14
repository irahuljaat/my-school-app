// components/StudentManager.jsx (Major Update for CRUD)

'use client'; 
import React, { useState } from 'react';
import StudentFormModal from './StudentForm'; // We will create this next
import { LuPencil, LuTrash } from 'react-icons/lu';
import { db } from '../firebase/config'; // Use relative path for internal component
import { doc, deleteDoc } from 'firebase/firestore'; 

// Component receives pre-fetched data and a refresh function
function StudentManager({ simplified = false, studentData, onDataChange }) {
    const students = studentData || []; 
    
    // State for the Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStudent, setCurrentStudent] = useState(null); // Used for editing

    // Handlers
    const handleAdd = () => {
        setCurrentStudent(null); // Clear any existing student data
        setIsModalOpen(true);
    };

    const handleEdit = (student) => {
        setCurrentStudent(student); // Load student data into the form
        setIsModalOpen(true);
    };

    const handleDelete = async (studentId, studentName) => {
        if (window.confirm(`Are you sure you want to delete ${studentName}? This action is irreversible.`)) {
            try {
                // Delete from Firestore
                await deleteDoc(doc(db, 'students', studentId));
                
                // Call the refresh function passed from the parent page
                onDataChange(); 
            } catch (error) {
                console.error("Error deleting student:", error);
                alert("Failed to delete student. Check console for details.");
            }
        }
    };

    if (simplified) {
        // Simple display for the dashboard (Star Students)
        const simplifiedStudents = students.slice(0, 5); // Show only top 5
        return (
            <div className="bg-white rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    {/* ... (THEAD and simplified display logic) ... */}
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {simplifiedStudents.map((student) => (
                        <tr key={student.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.studentId}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.grade}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.dob}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    }
    
    // --- FULL CRUD VIEW (simplified=false) ---
    
    if (!students.length) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">No students found. Start by adding one.</p>
                <button
                    onClick={handleAdd}
                    className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 transition"
                >
                    + Add New Student
                </button>
                <StudentFormModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSuccess={onDataChange}
                    studentToEdit={currentStudent}
                />
            </div>
        );
    }

    return (
        <div className="p-0"> {/* No padding here, handled by parent page */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Student Manager ({students.length})</h2>
                <button
                    onClick={handleAdd}
                    className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 transition"
                >
                    + Add New Student
                </button>
            </div>
            
            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                            <th className="relative px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((student) => (
                            <tr key={student.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.studentId}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.grade}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.gender || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.dob}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(student)} className="text-indigo-600 hover:text-indigo-900 mr-4 p-1 rounded-full hover:bg-indigo-50 transition">
                                        <LuPencil className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDelete(student.id, student.name)} className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition">
                                        <LuTrash className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal for Add/Edit */}
            <StudentFormModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={onDataChange} // Refreshes data after submission
                studentToEdit={currentStudent} // Passes data for editing
            />
        </div>
    );
}

export default StudentManager;