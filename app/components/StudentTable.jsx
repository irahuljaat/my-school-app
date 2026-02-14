// components/StudentTable.jsx

'use client';
import React from 'react';
import { LuFilePen, LuTrash2, LuUser } from 'react-icons/lu'; // Icons for actions and profile

function StudentTable({ students, onEdit, onDelete }) {
    
    // Fallback for students array if it's not ready
    if (!students || students.length === 0) {
        return (
            <div className="text-center p-10 bg-white rounded-xl shadow-lg">
                <LuUser className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">No Students Found</h3>
                <p className="text-gray-500">Use the "Add New Student" button to begin.</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-lg rounded-xl overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class/Grade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Phone</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50 transition duration-150">
                            
                            {/* Student Photo */}
                            <td className="px-6 py-4 whitespace-nowrap">
                                {student.imageURL ? (
                                    <img 
                                        src={student.imageURL} 
                                        alt={`${student.name}'s Photo`} 
                                        className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                    />
                                ) : (
                                    <LuUser className="h-10 w-10 text-gray-400 rounded-full bg-gray-100 p-1" />
                                )}
                            </td>
                            
                            {/* Student Name */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {student.name}
                            </td>
                            
                            {/* Student ID */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {student.studentId}
                            </td>
                            
                            {/* Class/Grade */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {student.grade}
                            </td>
                            
                            {/* Parent Phone */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {student.parentPhone || 'N/A'}
                            </td>
                            
                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                    <button 
                                        onClick={() => onEdit(student)}
                                        className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-50 transition"
                                        title="Edit Student Details"
                                    >
                                        <LuFilePen className="w-5 h-5" />
                                    </button>
                                    
                                    {/* Delete is optional, requires implementation in app/page.js */}
                                    <button 
                                        onClick={() => onDelete && onDelete(student)} 
                                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition"
                                        title="Delete Student"
                                    >
                                        <LuTrash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default StudentTable;