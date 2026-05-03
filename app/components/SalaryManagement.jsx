// components/SalaryManagement.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { HiCreditCard, HiPrinter, HiCheckCircle } from 'react-icons/hi';
// 🛑 We only need SalaryBatchPrint now, as it handles both cases
import SalaryBatchPrint from './SalaryBatchPrint'; 

// 🛑 IMPORTANT: Correct the path to your Firebase config file
import { 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    query, 
    where, 
    getFirestore,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config'; 



// --- HELPER FUNCTIONS (UNCHANGED) ---
const getCurrentMonthYear = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};
const getCurrentMonthDisplayName = () => {
    return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
};
// --- FIRESTORE INTEGRATION LOGIC (UNCHANGED) ---
const fetchTeacherListWithSalary = async () => {
    try {
        const teachersCollection = collection(db, 'teachers');
        const q = query(teachersCollection, where('status', '==', 'Active'));
        const teacherSnapshot = await getDocs(q); 
        
        const teacherList = teacherSnapshot.docs.map(doc => {
            const data = doc.data();
            const rawSalary = data.grossSalary || data.baseSalary || data.salary; 

            return {
                id: doc.id, 
                name: data.name,
                designation: data.designation || 'Staff',
                salary: parseFloat(rawSalary) || 0, 
                bankAccount: data.bankAccount || 'N/A',
                srNo: data.srNo || 'N/A', 
            };
        });
        return teacherList;
    } catch (error) {
        console.error("Firestore Teacher Fetch Error:", error);
        throw new Error(`Failed to fetch teacher salary data: ${error.message}`);
    }
};
const fetchPaymentStatus = async (monthYear) => {
    try {
        const paymentsCollection = collection(db, 'salaryPayments');
        const q = query(paymentsCollection, where('monthYear', '==', monthYear));
        const paymentSnapshot = await getDocs(q);
        
        const statusMap = {};
        paymentSnapshot.docs.forEach(doc => {
            const data = doc.data();
            statusMap[data.teacherId] = {
                status: 'Paid',
                paymentDate: data.paymentDate ? data.paymentDate.toDate().toLocaleDateString() : 'N/A'
            };
        });
        return statusMap;
    } catch (error) {
        console.error("Firestore Payment Status Fetch Error:", error);
        return {}; 
    }
};
const savePaymentRecord = async (teacherId, teacherName, monthYear) => {
    try {
        const paymentsCollection = collection(db, 'salaryPayments');
        const paymentDocId = `${teacherId}_${monthYear}`; 
        
        await setDoc(doc(paymentsCollection, paymentDocId), {
            teacherId: teacherId,
            teacherName: teacherName,
            monthYear: monthYear,
            status: 'Paid',
            paymentDate: Timestamp.now(),
        });
        
        return { success: true, paymentDate: new Date().toLocaleDateString() };
    } catch (error) {
        console.error("Firestore Save Payment Error:", error);
        throw new Error(`Failed to mark salary as paid: ${error.message}`);
    }
};
const calculateSalarySlipData = (teacher) => {
    const grossSalary = teacher.salary; 
    const EPF_RATE = 0.05; 
    const TDS_RATE = 0.05; 
    
    const epf = grossSalary * EPF_RATE;
    const tds = grossSalary * TDS_RATE;
    const deductions = epf + tds; 
    const netSalary = grossSalary;

    return {
        ...teacher,
        month: getCurrentMonthDisplayName(),
        datePaid: new Date().toLocaleDateString(),
        grossSalary: grossSalary.toFixed(2),
        epf: epf.toFixed(2),
        tds: tds.toFixed(2),
        totalDeductions: deductions.toFixed(2),
        netSalary: netSalary.toFixed(2),
    };
};
// -----------------------------------------------------------------


function SalaryManagement() {
    const currentMonthYear = getCurrentMonthYear();
    const currentMonthName = getCurrentMonthDisplayName();

    const [teachers, setTeachers] = useState([]);
    const [paymentStatus, setPaymentStatus] = useState({}); 
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    // 🛑 Streamlined Print State
    const [selectedTeacherIds, setSelectedTeacherIds] = useState(new Set());
    const [isPrintingModalOpen, setIsPrintingModalOpen] = useState(false);
    const [slipsToPrint, setSlipsToPrint] = useState([]); // List of calculated slip data objects
    
    // --- Data Fetching Effect (UNCHANGED) ---
    useEffect(() => {
        const loadSalaryData = async () => {
            setLoading(true);
            setMessage(null);
            try {
                const [teacherList, statusMap] = await Promise.all([
                    fetchTeacherListWithSalary(),
                    fetchPaymentStatus(currentMonthYear)
                ]);
                
                setTeachers(teacherList);
                setPaymentStatus(statusMap);

            } catch (err) {
                console.error(err);
                setMessage({ type: 'error', text: err.message || 'Failed to load salary data. Check network and Firebase rules.' });
            } finally {
                setLoading(false);
            }
        };

        loadSalaryData();
    }, [currentMonthYear]);

    // --- Selection Handlers (UNCHANGED) ---

    const handleSelectTeacher = (teacherId, isChecked) => {
        setSelectedTeacherIds(prevIds => {
            const newIds = new Set(prevIds);
            if (isChecked) {
                newIds.add(teacherId);
            } else {
                newIds.delete(teacherId);
            }
            return newIds;
        });
    };
    
    const handleSelectAll = (isChecked) => {
        if (isChecked) {
            const allIds = new Set(teachers.map(t => t.id));
            setSelectedTeacherIds(allIds);
        } else {
            setSelectedTeacherIds(new Set());
        }
    };
    
    // --- Action Handlers ---

    const handleMarkPaid = async (teacherId, teacherName) => {
        setLoading(true);
        setMessage({ type: 'info', text: `Marking ${teacherName}'s salary as Paid...` });
        
        try {
            const result = await savePaymentRecord(teacherId, teacherName, currentMonthYear);
            
            if (result.success) {
                setPaymentStatus(prev => ({ 
                    ...prev, 
                    [teacherId]: { status: 'Paid', paymentDate: result.paymentDate } 
                }));
                setMessage({ type: 'success', text: `${teacherName}'s salary successfully marked as PAID for ${currentMonthName}.` });
            }
        } catch (error) {
            console.error("Payment mark failed:", error);
            setMessage({ type: 'error', text: `Failed to mark payment: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    // 🛑 UPDATED: Handler for single receipt printing. Passes one teacher to the batch logic.
    const handleGenerateSingleReceipt = (teacher) => {
        const slipData = calculateSalarySlipData(teacher);
        setSlipsToPrint([slipData]); // Set the list to contain only this one slip
        setIsPrintingModalOpen(true); // Open the batch print modal
    };
    
    // 🛑 UPDATED: Handler for batch printing. Passes all selected teachers to the batch logic.
    const handleBatchPrint = () => {
        if (selectedTeacherIds.size === 0) {
            setMessage({ type: 'warning', text: 'Please select at least one teacher to print.' });
            return;
        }
        
        // Prepare data for selected teachers
        const selectedSlips = teachers
            .filter(t => selectedTeacherIds.has(t.id))
            .map(t => calculateSalarySlipData(t));
            
        setSlipsToPrint(selectedSlips);
        setIsPrintingModalOpen(true);
    };

    const isAllSelected = selectedTeacherIds.size === teachers.length && teachers.length > 0;
        
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-4">💰 Teacher Salary Management</h2>

            <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-lg text-indigo-800 font-medium shadow-inner">
                <span className="flex items-center">
                    <HiCreditCard className="w-5 h-5 inline mr-2" /> 
                    Showing overview for: **{currentMonthName}**
                </span>
                
                {/* Batch Print Button */}
                <button
                    onClick={handleBatchPrint}
                    disabled={selectedTeacherIds.size === 0 || loading}
                    className={`px-4 py-2 rounded-lg text-white font-semibold transition flex items-center ${
                        selectedTeacherIds.size === 0 || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-md'
                    }`}
                >
                    <HiPrinter className="w-5 h-5 mr-2" />
                    Print Selected ({selectedTeacherIds.size})
                </button>
            </div>

            {/* Notification Bar */}
            {message && (
                <div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {message.text}
                </div>
            )}
            
            {loading ? (
                <div className="text-center py-8 text-lg text-indigo-600">Loading salary data...</div>
            ) : (
                <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {/* Checkbox Column */}
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SR No.</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Salary</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {teachers.map((teacher) => {
                                const statusRecord = paymentStatus[teacher.id] || { status: 'Unpaid', paymentDate: 'N/A' };
                                const isPaid = statusRecord.status === 'Paid';
                                
                                return (
                                    <tr key={teacher.id}>
                                        {/* Checkbox Cell */}
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedTeacherIds.has(teacher.id)}
                                                onChange={(e) => handleSelectTeacher(teacher.id, e.target.checked)}
                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.srNo}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{teacher.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.designation}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right">₹{teacher.salary.toLocaleString('en-IN')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {isPaid ? `Paid (${statusRecord.paymentDate})` : 'Unpaid'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                            {!isPaid && (
                                                <button 
                                                    onClick={() => handleMarkPaid(teacher.id, teacher.name)}
                                                    className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50 transition text-xs font-semibold"
                                                    title="Mark as Paid"
                                                    disabled={loading}
                                                >
                                                    <HiCheckCircle className="w-4 h-4 inline mr-1" /> Mark Paid
                                                </button>
                                            )}
                                            {isPaid && (
                                                <span className="text-gray-500 text-xs">Payment Complete</span>
                                            )}
                                            
                                            {/* 🛑 UPDATED: Single print button now calls the new handler */}
                                            <button 
                                                onClick={() => handleGenerateSingleReceipt(teacher)}
                                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-600 transition"
                                                title="Generate Payslip"
                                                disabled={loading}
                                            >
                                                <HiPrinter className="w-5 h-5 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- Unified Print Modal/View --- */}
            {/* 🛑 Pass the list of slips (which might contain just one) to the batch component */}
            {isPrintingModalOpen && (
                <SalaryBatchPrint 
                    slipDataList={slipsToPrint} 
                    onClose={() => setIsPrintingModalOpen(false)}
                />
            )}
        </div>
    );
}

export default SalaryManagement;