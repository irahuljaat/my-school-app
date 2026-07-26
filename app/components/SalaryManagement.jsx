'use client';

import React, { useState, useEffect } from 'react';
import { 
    HiCreditCard, 
    HiPrinter, 
    HiCheckCircle, 
    HiUserGroup, 
    HiDotsVertical, 
    HiCurrencyRupee,
    HiCalendar
} from 'react-icons/hi';
import SalaryBatchPrint from './SalaryBatchPrint'; 
import { 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    query, 
    Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config'; 

// --- HELPER FUNCTIONS ---
const getCurrentMonthYear = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

const getCurrentMonthDisplayName = () => {
    return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

// --- FIRESTORE INTEGRATION LOGIC ---
const fetchTeacherListWithSalary = async () => {
    try {
        const teachersCollection = collection(db, 'teachers');
        const teacherSnapshot = await getDocs(teachersCollection); 
        
        return teacherSnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            const rawSalary = data.grossSalary || data.baseSalary || data.salary; 
            return {
                id: docSnap.id, 
                name: data.teacherName || data.name || 'Unknown Teacher',
                designation: data.designation || 'Staff Member',
                salary: parseFloat(rawSalary) || 0, 
                bankAccount: data.bankAccount || 'N/A',
                srNo: data.employeeId || data.employId || data.srNo || 'N/A', 
            };
        });
    } catch (error) {
        console.error("Firestore Teacher Fetch Error:", error);
        throw new Error(`Failed to fetch teacher salary data: ${error.message}`);
    }
};

const fetchPaymentStatus = async (monthYear) => {
    try {
        const paymentsCollection = collection(db, 'salaryPayments');
        const q = query(paymentsCollection);
        const paymentSnapshot = await getDocs(q);
        const statusMap = {};
        paymentSnapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            if (data.monthYear === monthYear) {
                statusMap[data.teacherId] = {
                    status: 'Paid',
                    paymentDate: data.paymentDate ? data.paymentDate.toDate().toLocaleDateString() : 'N/A'
                };
            }
        });
        return statusMap;
    } catch (error) {
        return {}; 
    }
};

const savePaymentRecord = async (teacherId, teacherName, monthYear) => {
    try {
        const paymentsCollection = collection(db, 'salaryPayments');
        const paymentDocId = `${teacherId}_${monthYear}`; 
        await setDoc(doc(paymentsCollection, paymentDocId), {
            teacherId,
            teacherName,
            monthYear,
            status: 'Paid',
            paymentDate: Timestamp.now(),
        });
        return { success: true, paymentDate: new Date().toLocaleDateString() };
    } catch (error) {
        throw new Error(`Failed to mark salary as paid: ${error.message}`);
    }
};

const calculateSalarySlipData = (teacher) => {
    const grossSalary = teacher.salary; 
    const EPF_RATE = 0.05; 
    const TDS_RATE = 0.05; 
    const epf = grossSalary * EPF_RATE;
    const tds = grossSalary * TDS_RATE;
    return {
        ...teacher,
        month: getCurrentMonthDisplayName(),
        datePaid: new Date().toLocaleDateString(),
        grossSalary: grossSalary.toFixed(2),
        epf: epf.toFixed(2),
        tds: tds.toFixed(2),
        totalDeductions: (epf + tds).toFixed(2),
        netSalary: grossSalary.toFixed(2),
    };
};

function SalaryManagement() {
    const currentMonthYear = getCurrentMonthYear();
    const currentMonthName = getCurrentMonthDisplayName();

    const [teachers, setTeachers] = useState([]);
    const [paymentStatus, setPaymentStatus] = useState({}); 
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [selectedTeacherIds, setSelectedTeacherIds] = useState(new Set());
    const [isPrintingModalOpen, setIsPrintingModalOpen] = useState(false);
    const [slipsToPrint, setSlipsToPrint] = useState([]);

    useEffect(() => {
        const loadSalaryData = async () => {
            setLoading(true);
            try {
                const [teacherList, statusMap] = await Promise.all([
                    fetchTeacherListWithSalary(),
                    fetchPaymentStatus(currentMonthYear)
                ]);
                setTeachers(teacherList);
                setPaymentStatus(statusMap);
            } catch (err) {
                setMessage({ type: 'error', text: err.message });
            } finally {
                setLoading(false);
            }
        };
        loadSalaryData();
    }, [currentMonthYear]);

    const handleSelectTeacher = (teacherId, isChecked) => {
        setSelectedTeacherIds(prevIds => {
            const newIds = new Set(prevIds);
            isChecked ? newIds.add(teacherId) : newIds.delete(teacherId);
            return newIds;
        });
    };
    
    const handleSelectAll = (isChecked) => {
        setSelectedTeacherIds(isChecked ? new Set(teachers.map(t => t.id)) : new Set());
    };
    
    const handleMarkPaid = async (teacherId, teacherName) => {
        setLoading(true);
        try {
            const result = await savePaymentRecord(teacherId, teacherName, currentMonthYear);
            if (result.success) {
                setPaymentStatus(prev => ({ 
                    ...prev, 
                    [teacherId]: { status: 'Paid', paymentDate: result.paymentDate } 
                }));
                setMessage({ type: 'success', text: `${teacherName}: Salary Paid.` });
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateSingleReceipt = (teacher) => {
        setSlipsToPrint([calculateSalarySlipData(teacher)]);
        setIsPrintingModalOpen(true);
    };
    
    const handleBatchPrint = () => {
        if (selectedTeacherIds.size === 0) return;
        const selectedSlips = teachers
            .filter(t => selectedTeacherIds.has(t.id))
            .map(t => calculateSalarySlipData(t));
        setSlipsToPrint(selectedSlips);
        setIsPrintingModalOpen(true);
    };

    const isAllSelected = selectedTeacherIds.size === teachers.length && teachers.length > 0;
        
    return (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            {/* Header Section */}
            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-[#303972] flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                            <HiCurrencyRupee size={28} />
                        </div>
                        Salary Management
                    </h2>
                    <div className="flex items-center gap-2 text-slate-400 mt-2 font-medium">
                        <HiCalendar className="text-indigo-400" />
                        <span>Payroll for {currentMonthName}</span>
                    </div>
                </div>

                <button
                    onClick={handleBatchPrint}
                    disabled={selectedTeacherIds.size === 0 || loading}
                    className="flex items-center gap-2 bg-[#303972] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-[#3f4b94] transition-all disabled:opacity-30 disabled:shadow-none"
                >
                    <HiPrinter size={20} />
                    Print Selected ({selectedTeacherIds.size})
                </button>
            </div>

            {/* Notification Bar */}
            {message && (
                <div className={`mx-8 mt-6 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest border animate-pulse ${
                    message.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                    {message.text}
                </div>
            )}
            
            <div className="p-8">
                {loading && teachers.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-slate-400 font-bold italic tracking-tighter uppercase">Synchronizing Ledger...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="p-5 text-center">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            className="w-5 h-5 rounded-lg border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">ID / SR No</th>
                                    <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Educator Details</th>
                                    <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Gross Salary</th>
                                    <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Payment Status</th>
                                    <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {teachers.map((teacher) => {
                                    const statusRecord = paymentStatus[teacher.id] || { status: 'Unpaid', paymentDate: 'N/A' };
                                    const isPaid = statusRecord.status === 'Paid';
                                    
                                    return (
                                        <tr key={teacher.id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="p-5 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTeacherIds.has(teacher.id)}
                                                    onChange={(e) => handleSelectTeacher(teacher.id, e.target.checked)}
                                                    className="w-5 h-5 rounded-lg border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-5">
                                                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold">
                                                    {teacher.srNo}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#303972] font-bold">
                                                        {teacher.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#303972]">{teacher.name}</p>
                                                        <p className="text-[11px] text-slate-400 font-medium tracking-tight">{teacher.designation}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5 text-right font-black text-[#303972] text-sm">
                                                ₹{teacher.salary.toLocaleString('en-IN')}
                                            </td>
                                            <td className="p-5 text-center">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                                    isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                                    {isPaid ? `Paid: ${statusRecord.paymentDate}` : 'Pending'}
                                                </div>
                                            </td>
                                            <td className="p-5 text-center space-x-2">
                                                {!isPaid && (
                                                    <button 
                                                        onClick={() => handleMarkPaid(teacher.id, teacher.name)}
                                                        className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl transition-all shadow-md shadow-emerald-100"
                                                        title="Confirm Payment"
                                                        disabled={loading}
                                                    >
                                                        <HiCheckCircle size={18} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleGenerateSingleReceipt(teacher)}
                                                    className="bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 p-2 rounded-xl transition-all shadow-sm"
                                                    title="Generate Payslip"
                                                    disabled={loading}
                                                >
                                                    <HiPrinter size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Print Modal */}
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