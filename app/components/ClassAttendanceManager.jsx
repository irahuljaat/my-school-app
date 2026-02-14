// components/ClassAttendanceManager.jsx (COMPLETE FINAL VERSION)

'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { LuCircleCheck, LuCircleAlert, LuCircleX } from 'react-icons/lu'; // Icons for status indicators (FINAL SET)

// Helper function to format date as YYYY-MM-DD for use in Firestore key
const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};

function ClassAttendanceManager({ students, className }) {
    
    const [attendanceDate, setAttendanceDate] = useState(formatDate(new Date()));
    // State to hold the attendance status { studentId: 'Present'/'Absent'/'Late', ... }
    const [attendanceState, setAttendanceState] = useState({});
    const [loading, setLoading] = useState(false);
    
    // 1. Initialize attendance state when students or date change
    useEffect(() => {
        // Set all students to 'Present' by default when the student list or date changes
        const initialAttendance = {};
        students.forEach(student => {
            initialAttendance[student.id] = 'Present'; 
        });
        setAttendanceState(initialAttendance);
        
        // NOTE: In a production app, you would attempt to fetch and load 
        // existing attendance records for the selected date and class here.
        
    }, [students, attendanceDate]);
    
    // 2. Handle status change for an individual student
    const handleStatusChange = (studentId, status) => {
        setAttendanceState(prev => ({
            ...prev,
            [studentId]: status,
        }));
    };
    
    // 3. Handle saving the optimized attendance data to Firestore
    const handleSaveAttendance = async () => {
        if (!students.length) {
            alert("No students to save attendance for.");
            return;
        }

        setLoading(true);
        try {
            // Create the unique document ID: ClassName_YYYY-MM-DD
            const docId = `${className}_${attendanceDate}`;
            
            // Create a Map where the key is the studentId and the value is their status
            const studentStatusMap = {};
            students.forEach(student => {
                studentStatusMap[student.id] = attendanceState[student.id];
            });

            // The single document to save (optimized structure)
            const attendanceDocument = {
                class: className,
                date: attendanceDate,
                totalStudents: students.length,
                markedBy: 'AdminUser', // Placeholder - in a real app, use request.auth.uid
                markedAt: serverTimestamp(),
                studentStatuses: studentStatusMap, // Store the core data here
            };

            const attendanceRef = collection(db, 'attendance');
            
            // Use setDoc with the custom docId to create/overwrite the daily class record
            await setDoc(doc(attendanceRef, docId), attendanceDocument);

            alert(`Attendance for ${className} on ${attendanceDate} saved successfully!`);

        } catch (error) {
            console.error("Error saving optimized attendance:", error);
            alert(`Failed to save attendance: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!students || students.length === 0) {
        return (
            <div className="text-center p-10 text-gray-500 bg-white rounded-xl shadow-lg">
                No students found in {className}.
            </div>
        );
    }

    // --- RENDER BLOCK ---
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
            <h3 className="text-xl font-bold text-indigo-700">
                Mark Attendance for {className} ({students.length} Students)
            </h3>
            
            <div className="flex items-center space-x-4">
                <label htmlFor="attendance-date" className="text-sm font-medium text-gray-700">Date:</label>
                <input 
                    type="date" 
                    id="attendance-date" 
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="border border-gray-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mark Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((student) => (
                            <tr key={student.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.studentId}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-3">
                                    <div className="flex items-center space-x-3">
                                        {['Present', 'Absent', 'Late'].map((status) => (
                                            <label key={status} className="inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name={`att-${student.id}`} 
                                                    value={status}
                                                    checked={attendanceState[student.id] === status}
                                                    onChange={() => handleStatusChange(student.id, status)}
                                                    className="sr-only" // Hide default radio button
                                                />
                                                <span 
                                                    className={`px-3 py-1 text-sm font-medium rounded-full border transition-all duration-150 flex items-center 
                                                    ${attendanceState[student.id] === status
                                                        ? status === 'Present' ? 'bg-green-500 text-white border-green-500 shadow-md'
                                                        : status === 'Absent' ? 'bg-red-500 text-white border-red-500 shadow-md'
                                                        : 'bg-orange-400 text-white border-orange-400 shadow-md'
                                                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {status === 'Present' && <LuCircleCheck className="w-4 h-4 mr-1" />}
                                                    {status === 'Absent' && <LuCircleAlert className="w-4 h-4 mr-1" />}
                                                    {status === 'Late' && <LuCircleX className="w-4 h-4 mr-1" />}
                                                    {status}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="text-right pt-4">
                <button
                    onClick={handleSaveAttendance}
                    disabled={loading}
                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 transition disabled:bg-indigo-400"
                >
                    {loading ? 'Saving...' : 'Save Attendance'}
                </button>
            </div>
        </div>
    );
}

export default ClassAttendanceManager;