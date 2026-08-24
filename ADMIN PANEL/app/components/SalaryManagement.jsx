'use client';

import React, { useState, useEffect } from 'react';
import { 
    HiPrinter, 
    HiCheckCircle, 
    HiUserGroup, 
    HiCurrencyRupee,
    HiCalendar,
    HiSearch,
    HiOutlineClock,
    HiXCircle
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
import { useColors } from './ColorComponent';

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
    const colors = useColors();
    const currentMonthYear = getCurrentMonthYear();
    const currentMonthName = getCurrentMonthDisplayName();

    const [teachers, setTeachers] = useState([]);
    const [paymentStatus, setPaymentStatus] = useState({}); 
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [selectedTeacherIds, setSelectedTeacherIds] = useState(new Set());
    const [isPrintingModalOpen, setIsPrintingModalOpen] = useState(false);
    const [slipsToPrint, setSlipsToPrint] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

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
        setSelectedTeacherIds(isChecked ? new Set(filteredTeachers.map(t => t.id)) : new Set());
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
                setMessage({ type: 'success', text: `${teacherName}: Salary Paid successfully.` });
                setTimeout(() => setMessage(null), 3000);
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

    // Filtered Teachers
    const filteredTeachers = teachers.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        String(t.srNo).toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.designation.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculated Payroll Summary Metrics
    const totalStaff = teachers.length;
    const totalPayrollOutlay = teachers.reduce((acc, t) => acc + t.salary, 0);
    const paidStaffCount = Object.keys(paymentStatus).length;
    const paidOutlay = teachers
        .filter(t => paymentStatus[t.id]?.status === 'Paid')
        .reduce((acc, t) => acc + t.salary, 0);
    const pendingCount = totalStaff - paidStaffCount;
    const pendingOutlay = totalPayrollOutlay - paidOutlay;

    const isAllSelected = selectedTeacherIds.size === filteredTeachers.length && filteredTeachers.length > 0;
        
    return (
        <div className="space-y-8 p-6 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden transition-colors duration-300"
             style={{ backgroundColor: colors.background }}>
            
            {/* Background Decorative Accent Blobs */}
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-10"
                 style={{ backgroundColor: colors.primary }}></div>
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-10"
                 style={{ backgroundColor: colors.primary }}></div>

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 rounded-full text-white shadow-lg"
                         style={{ backgroundColor: colors.primary, boxShadow: `0 10px 25px -5px ${colors.primary}40` }}>
                        <HiCurrencyRupee size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight" style={{ color: colors.text }}>
                            Salary & Payroll Management
                        </h2>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                            <HiCalendar size={14} style={{ color: colors.primary }} />
                            <span>Payroll Cycle: {currentMonthName}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleBatchPrint}
                    disabled={selectedTeacherIds.size === 0 || loading}
                    className="flex items-center gap-2.5 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
                    style={{ backgroundColor: colors.primary, boxShadow: `0 10px 25px -5px ${colors.primary}40` }}
                >
                    <HiPrinter size={18} />
                    Print Selected ({selectedTeacherIds.size})
                </button>
            </div>

            {/* Executive Payroll Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                <div className="p-4 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
                     style={{ backgroundColor: colors.cardBackground }}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Staff</p>
                        <h4 className="text-2xl font-black mt-1" style={{ color: colors.text }}>{totalStaff}</h4>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">₹{totalPayrollOutlay.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}><HiUserGroup size={20} /></div>
                </div>

                <div className="p-4 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
                     style={{ backgroundColor: colors.cardBackground }}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Disbursed (Paid)</p>
                        <h4 className="text-2xl font-black text-emerald-600 mt-1">{paidStaffCount}</h4>
                        <p className="text-[10px] font-bold text-emerald-600/80 mt-0.5">₹{paidOutlay.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><HiCheckCircle size={20} /></div>
                </div>

                <div className="p-4 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
                     style={{ backgroundColor: colors.cardBackground }}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Pending</p>
                        <h4 className="text-2xl font-black text-amber-500 mt-1">{pendingCount}</h4>
                        <p className="text-[10px] font-bold text-amber-500/80 mt-0.5">₹{pendingOutlay.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl"><HiOutlineClock size={20} /></div>
                </div>

                <div className="p-4 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
                     style={{ backgroundColor: colors.cardBackground }}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Outlay</p>
                        <h4 className="text-2xl font-black mt-1" style={{ color: colors.text }}>₹{(totalPayrollOutlay / 1000).toFixed(1)}k</h4>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">Gross Budget</p>
                    </div>
                    <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl"><HiCurrencyRupee size={20} /></div>
                </div>
            </div>

            {/* Notification Banner */}
            {message && (
                <div className={`p-4 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all duration-300 shadow-sm relative z-10 flex items-center gap-2 ${
                    message.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                    {message.type === 'error' ? <HiXCircle size={18} /> : <HiCheckCircle size={18} />}
                    {message.text}
                </div>
            )}

            {/* Controls Bar: Search Filter & Quick Actions */}
            <div className="relative z-10 flex items-center gap-4 backdrop-blur-md p-3 rounded-full border border-slate-100 shadow-sm"
                 style={{ backgroundColor: colors.cardBackground }}>
                <HiSearch className="text-slate-400 ml-3" size={20} />
                <input
                    type="text"
                    placeholder="Search staff by name, designation, or SR No..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none text-xs font-bold placeholder:text-slate-400 focus:ring-0 outline-none"
                    style={{ color: colors.text }}
                />
            </div>
            
            {/* Table Area */}
            <div className="relative z-10">
                {loading && teachers.length === 0 ? (
                    <div className="py-20 text-center space-y-4 rounded-2xl border border-slate-100" style={{ backgroundColor: colors.cardBackground }}>
                        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: colors.primary, borderTopColor: 'transparent' }}></div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Synchronizing Ledger...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-y-3">
                            <thead>
                                <tr className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                    <th className="px-4 py-2 text-center">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            className="w-4 h-4 rounded border-2 border-slate-300 focus:ring-offset-0 cursor-pointer"
                                            style={{ accentColor: colors.primary }}
                                        />
                                    </th>
                                    <th className="px-4 py-2">ID / SR No</th>
                                    <th className="px-6 py-2">Educator Details</th>
                                    <th className="px-6 py-2 text-right">Gross Salary</th>
                                    <th className="px-4 py-2 text-center">Payment Status</th>
                                    <th className="px-6 py-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-transparent">
                                {filteredTeachers.length > 0 ? (
                                    filteredTeachers.map((teacher) => {
                                        const statusRecord = paymentStatus[teacher.id] || { status: 'Unpaid', paymentDate: 'N/A' };
                                        const isPaid = statusRecord.status === 'Paid';
                                        
                                        return (
                                            <tr key={teacher.id} className="group hover:scale-[1.001] transition-all">
                                                <td className="px-4 py-4 rounded-l-3xl backdrop-blur-sm border-y border-l border-slate-100 shadow-sm text-center"
                                                    style={{ backgroundColor: colors.cardBackground }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTeacherIds.has(teacher.id)}
                                                        onChange={(e) => handleSelectTeacher(teacher.id, e.target.checked)}
                                                        className="w-4 h-4 rounded border-2 border-slate-300 focus:ring-offset-0 cursor-pointer"
                                                        style={{ accentColor: colors.primary }}
                                                    />
                                                </td>

                                                <td className="px-4 py-4 backdrop-blur-sm border-y border-slate-100 shadow-sm"
                                                    style={{ backgroundColor: colors.cardBackground }}>
                                                    <span className="px-3 py-1.5 rounded-xl text-xs font-black"
                                                          style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
                                                        {teacher.srNo}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 backdrop-blur-sm border-y border-slate-100 shadow-sm"
                                                    style={{ backgroundColor: colors.cardBackground }}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-black border-2 border-white shadow-sm shrink-0"
                                                             style={{ color: colors.primary }}>
                                                            {teacher.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-extrabold text-sm" style={{ color: colors.text }}>{teacher.name}</div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{teacher.designation}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 backdrop-blur-sm border-y border-slate-100 shadow-sm text-right font-black text-sm"
                                                    style={{ backgroundColor: colors.cardBackground, color: colors.text }}>
                                                    ₹{teacher.salary.toLocaleString('en-IN')}
                                                </td>

                                                <td className="px-4 py-4 backdrop-blur-sm border-y border-slate-100 shadow-sm text-center"
                                                    style={{ backgroundColor: colors.cardBackground }}>
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                                                        isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                                        {isPaid ? `Paid: ${statusRecord.paymentDate}` : 'Pending'}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 rounded-r-3xl backdrop-blur-sm border-y border-r border-slate-100 shadow-sm text-center"
                                                    style={{ backgroundColor: colors.cardBackground }}>
                                                    <div className="flex items-center justify-center gap-2">
                                                        {!isPaid && (
                                                            <button 
                                                                onClick={() => handleMarkPaid(teacher.id, teacher.name)}
                                                                className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                                                                title="Confirm Payment"
                                                                disabled={loading}
                                                            >
                                                                <HiCheckCircle size={18} />
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleGenerateSingleReceipt(teacher)}
                                                            className="bg-slate-50 border border-slate-200 p-2 rounded-xl transition-all shadow-sm disabled:opacity-50 hover:brightness-110"
                                                            style={{ color: colors.text }}
                                                            title="Generate Payslip"
                                                            disabled={loading}
                                                        >
                                                            <HiPrinter size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-12 rounded-2xl text-slate-400 font-bold text-xs"
                                            style={{ backgroundColor: colors.cardBackground }}>
                                            No staff records found matching your query.
                                        </td>
                                    </tr>
                                )}
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