// components/TeacherAttendance.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { HiCalendar, HiClock, HiCheckCircle, HiXCircle, HiSave } from 'react-icons/hi';
import { 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    query, 
    where, 
    getFirestore 
} from 'firebase/firestore';
import { db } from '../firebase/config'; 



// --- HELPER FUNCTION TO REMOVE UNDEFINED ---
/**
 * Removes all properties with the value 'undefined' from an object.
 * This is CRITICAL for Firestore, which does not allow 'undefined' values.
 */
const cleanDataForFirestore = (data) => {
    return Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined)
    );
};

// --- FIRESTORE INTEGRATION LOGIC ---

const fetchTeacherList = async () => {
    try {
        const teachersCollection = collection(db, 'teachers');
        // Filter for only 'Active' teachers for daily attendance marking
        const q = query(teachersCollection, where('status', '==', 'Active')); 
        const teacherSnapshot = await getDocs(q); 
        
        const teacherList = teacherSnapshot.docs.map(doc => ({
            id: doc.id, 
            ...doc.data() 
        }));
        return teacherList;
    } catch (error) {
        console.error("Firestore Teacher Fetch Error:", error);
        throw new Error(`Failed to fetch active teacher data: ${error.message}`);
    }
};

const fetchAttendanceByDate = async (date) => {
    try {
        const dateDocRef = doc(db, 'teacherAttendance', date);
        const recordsCollectionRef = collection(dateDocRef, 'records');
        
        const attendanceSnapshot = await getDocs(recordsCollectionRef);
        
        const records = {};
        attendanceSnapshot.docs.forEach(doc => {
            records[doc.id] = doc.data();
        });
        return records;
    } catch (error) {
        console.error("Firestore Attendance Fetch Error:", error);
        throw new Error(`Failed to fetch attendance for ${date}: ${error.message}`);
    }
};

const saveAttendance = async (teacherId, date, record) => {
    // 🛑 FIX APPLIED HERE: Clean the record before saving!
    const cleanedRecord = cleanDataForFirestore(record);
    
    if (Object.keys(cleanedRecord).length === 0) {
        console.warn(`Skipping save for ${teacherId}: Record is empty after cleaning.`);
        return { success: false, message: 'Skipped empty record.' };
    }
    
    try {
        const recordDocRef = doc(db, 'teacherAttendance', date, 'records', teacherId);
        await setDoc(recordDocRef, cleanedRecord, { merge: true });
        
        return { success: true };
    } catch (error) {
        console.error("Firestore Save Error:", error);
        throw new Error(`Failed to save attendance for ${teacherId} on ${date}: ${error.message}`);
    }
};
// -----------------------------------------------------------------

const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
};

function TeacherAttendance() {
    const today = formatDate(new Date());
    const [selectedDate, setSelectedDate] = useState(today);
    const [attendanceData, setAttendanceData] = useState({});
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    const isToday = selectedDate === today;

    // Load Teacher List
    useEffect(() => {
        const loadTeachers = async () => {
            try {
                const list = await fetchTeacherList();
                setTeachers(list);
            } catch (err) {
                setMessage({ type: 'error', text: 'Failed to load teacher list. Check console for details.' });
            }
        };
        loadTeachers();
    }, []); 

    // Load Attendance Records
    useEffect(() => {
        if (teachers.length === 0) {
            if (!loading) setLoading(false);
            return;
        }

        const loadAttendance = async () => {
            setLoading(true);
            setMessage(null);
            try {
                const records = await fetchAttendanceByDate(selectedDate);
                
                const initialData = {};
                teachers.forEach(teacher => {
                    initialData[teacher.id] = records[teacher.id] || { status: 'Pending' };
                });
                
                setAttendanceData(initialData);

            } catch (err) {
                console.error("Failed to load attendance:", err);
                setMessage({ type: 'error', text: 'Could not load attendance data for the selected date.' });
            } finally {
                setLoading(false);
            }
        };

        loadAttendance();
    }, [selectedDate, teachers]);

    // Handler for Marking Attendance
    const handleStatusChange = (teacherId, newStatus) => {
        if (!isToday && !window.confirm("You are modifying a historical record. Are you sure?")) {
            return;
        }
        
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', ''); // Format HHMM (24h)

        setAttendanceData(prev => {
            const current = prev[teacherId] || {};
            
            let updatedRecord = { status: newStatus };

            if (newStatus === 'Present') {
                updatedRecord = { 
                    ...current, 
                    status: 'Present',
                    timeIn: current.timeIn || currentTime, 
                    timeOut: current.timeOut || '', // Set to empty string instead of undefined
                    reason: '',                     // Set to empty string instead of undefined
                };
            } else if (newStatus === 'Absent') {
                updatedRecord = { 
                    ...current, 
                    status: 'Absent', 
                    timeIn: '', // Set to empty string
                    timeOut: '', // Set to empty string
                    reason: current.reason || '', 
                };
            } else {
                updatedRecord = { status: 'Pending' }; 
            }

            // Ensure no fields are strictly 'undefined' in the state. 
            // We use empty string '' for optional blank fields.
            return { ...prev, [teacherId]: updatedRecord };
        });
    };

    // Handler for Time/Reason changes
    const handleDetailChange = (teacherId, field, value) => {
        if (!isToday && !window.confirm("You are modifying a historical record. Are you sure?")) {
            return;
        }

        setAttendanceData(prev => ({
            ...prev,
            [teacherId]: { ...prev[teacherId], [field]: value }
        }));
    };
    
    // --- Handler for Saving Today's Attendance ---
    const handleSaveAttendance = async () => {
        setLoading(true);
        setMessage({ type: 'info', text: 'Saving attendance records...' });

        try {
            const recordsToSave = Object.entries(attendanceData).filter(([, record]) => 
                record.status !== 'Pending' // Only save marked records
            );

            if (recordsToSave.length === 0) {
                setMessage({ type: 'warning', text: 'No attendance marked yet to save.' });
                setLoading(false);
                return;
            }

            // Execute all save operations concurrently
            const savePromises = recordsToSave.map(([teacherId, record]) => 
                saveAttendance(teacherId, selectedDate, record)
            );

            await Promise.all(savePromises);
            
            setMessage({ type: 'success', text: 'Attendance saved successfully!' });
        } catch (error) {
            console.error("Save error:", error);
            setMessage({ type: 'error', text: `Failed to save attendance records. ${error.message}` });
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-4">Teacher Attendance Log</h2>

            {/* --- Date Filter and Action --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-indigo-50 rounded-lg shadow-inner">
                <div className="flex items-center space-x-3 mb-3 md:mb-0">
                    <HiCalendar className="w-6 h-6 text-indigo-700" />
                    <label htmlFor="attendance-date" className="font-semibold text-gray-700">Select Date:</label>
                    <input
                        type="date"
                        id="attendance-date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="p-2 border border-indigo-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        max={today} 
                    />
                </div>
                
                <button
                    onClick={handleSaveAttendance}
                    disabled={loading}
                    className={`px-6 py-2 rounded-lg text-white font-semibold transition flex items-center ${
                        loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
                    }`}
                >
                    <HiSave className="w-5 h-5 mr-2" />
                    {loading ? 'Saving...' : `Save ${isToday ? "Today's" : "Selected Date's"} Attendance`}
                </button>
            </div>
            
            {/* Notification Bar */}
            {message && (
                <div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : message.type === 'success' ? 'bg-green-100 text-green-700' : message.type === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                    {message.text}
                </div>
            )}

            {loading && (
                <div className="text-center py-6 text-lg text-indigo-600">
                    Loading records...
                </div>
            )}
            
            {/* --- Attendance Table --- */}
            {!loading && teachers.length > 0 && (
                <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name (Teacher ID)</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Status</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Time In (HH:MM)</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Time Out (HH:MM)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks / Reason</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {teachers.map(teacher => {
                                const record = attendanceData[teacher.id] || { status: 'Pending' };
                                const statusColor = record.status === 'Present' ? 'text-green-600' : record.status === 'Absent' ? 'text-red-600' : 'text-gray-500';
                                
                                return (
                                    <tr key={teacher.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {teacher.name} <span className="text-gray-500">({teacher.srNo})</span>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex justify-center space-x-2">
                                                <button 
                                                    onClick={() => handleStatusChange(teacher.id, 'Present')}
                                                    className={`p-1 rounded-full ${record.status === 'Present' ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:text-green-500'} transition`}
                                                    title="Mark Present"
                                                    disabled={loading}
                                                >
                                                    <HiCheckCircle className="w-6 h-6" />
                                                </button>
                                                <button 
                                                    onClick={() => handleStatusChange(teacher.id, 'Absent')}
                                                    className={`p-1 rounded-full ${record.status === 'Absent' ? 'bg-red-100 text-red-700' : 'text-gray-400 hover:text-red-500'} transition`}
                                                    title="Mark Absent"
                                                    disabled={loading}
                                                >
                                                    <HiXCircle className="w-6 h-6" />
                                                </button>
                                            </div>
                                            <span className={`text-xs font-semibold mt-1 block ${statusColor}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        
                                        {/* Time In */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {record.status === 'Present' ? (
                                                <input 
                                                    type="time" 
                                                    value={record.timeIn || ''} 
                                                    onChange={(e) => handleDetailChange(teacher.id, 'timeIn', e.target.value)} 
                                                    className="w-24 p-1 border rounded disabled:bg-gray-100"
                                                    disabled={loading}
                                                />
                                            ) : (
                                                <span className="text-gray-400">N/A</span>
                                            )}
                                        </td>
                                        
                                        {/* Time Out */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {record.status === 'Present' ? (
                                                <input 
                                                    type="time" 
                                                    value={record.timeOut || ''} 
                                                    onChange={(e) => handleDetailChange(teacher.id, 'timeOut', e.target.value)} 
                                                    className="w-24 p-1 border rounded disabled:bg-gray-100"
                                                    disabled={loading}
                                                />
                                            ) : (
                                                <span className="text-gray-400">N/A</span>
                                            )}
                                        </td>
                                        
                                        {/* Remarks/Reason */}
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {record.status === 'Absent' ? (
                                                <input 
                                                    type="text" 
                                                    placeholder="Reason for Absence"
                                                    value={record.reason || ''} 
                                                    onChange={(e) => handleDetailChange(teacher.id, 'reason', e.target.value)} 
                                                    className="w-full p-1 border rounded disabled:bg-gray-100"
                                                    disabled={loading}
                                                />
                                            ) : (
                                                <span className="text-gray-400">{record.status === 'Present' ? 'On duty' : '---'}</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            {!loading && teachers.length === 0 && (
                <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                    No active teachers found. Please add teachers in the 'Add New Teacher' section.
                </div>
            )}
        </div>
    );
}

export default TeacherAttendance;