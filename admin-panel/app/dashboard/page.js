"use client";

import React, { useState, useEffect, memo } from "react";
import {
    HiOutlineAcademicCap,
    HiOutlineCurrencyRupee,
    HiOutlineExclamationCircle,
    HiOutlineClipboardCheck,
    HiOutlineChartBar,
    HiOutlineTrendingDown,
    HiOutlineCalendar,
    HiCheck,
    HiX,
    HiBell,
    HiOutlineChevronRight,
    HiOutlineCake,
    HiOutlineFilter
} from "react-icons/hi";

import { db } from "../firebase/config";
import {
    collection,
    onSnapshot,
    doc,
    collectionGroup,
    getDocs,
    updateDoc,
    query,
    where
} from "firebase/firestore";

// --- Attendance Modal Component ---
const AttendanceListModal = ({ isOpen, onClose, attendanceRecords, students, classes }) => {
    const [activeTab, setActiveTab] = useState("present");
    const [selectedClass, setSelectedClass] = useState("All");

    if (!isOpen) return null;

    const filteredStudents = students.filter(student => {
        if (selectedClass !== "All" && student.grade !== selectedClass) {
            return false;
        }

        const rawStatus = attendanceRecords[student.id || student.docId]; 
        const isPresent = rawStatus && rawStatus.toLowerCase() === "present";
        
        if (activeTab === "present") return isPresent;
        if (activeTab === "absent") return !isPresent && rawStatus;

        return false;
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200/80">
                {/* Modal Header */}
                <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80 shadow-sm">
                            <HiOutlineClipboardCheck size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Today's Attendance Report</h2>
                            <p className="text-xs font-medium text-slate-500">Live verification and student roster</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                    >
                        <HiX size={20} />
                    </button>
                </div>

                {/* Filters */}
                <div className="px-7 py-3.5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex p-1 bg-slate-200/60 rounded-xl w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab("present")}
                            className={`flex-1 sm:flex-none px-5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                activeTab === "present" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Present
                        </button>
                        <button
                            onClick={() => setActiveTab("absent")}
                            className={`flex-1 sm:flex-none px-5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                activeTab === "absent" ? "bg-white text-rose-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Absent
                        </button>
                    </div>

                    <div className="relative">
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full sm:w-48 bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm transition-all"
                        >
                            <option value="All">All Standard Classes</option>
                            {classes.map(cls => (
                                <option key={cls} value={cls}>Class {cls}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Students Roster */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    {filteredStudents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredStudents.map((student, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200/70 bg-white hover:border-indigo-300 hover:shadow-sm transition-all group">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs border border-slate-200/80 shadow-inner">
                                        {student.name?.charAt(0) || "-"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 text-xs truncate group-hover:text-indigo-600 transition-colors">{student.name}</p>
                                        <p className="text-[11px] font-medium text-slate-500 truncate">
                                            Class {student.grade} <span className="text-slate-300">•</span> Roll: {student.id || student.docId || 'N/A'}
                                        </p>
                                    </div>
                                    <span className={`w-2.5 h-2.5 rounded-full ${activeTab === 'present' ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-rose-500 ring-4 ring-rose-100'}`}></span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs font-medium">
                            <HiOutlineFilter className="w-8 h-8 text-slate-300 mb-2 stroke-[1.5]" />
                            No student records found under this filter.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Leave Action Popup Modal ---
const LeaveActionPopupModal = ({ isOpen, onClose, pendingLeaves, onAction, isWindowClosed }) => {
    if (!isOpen || pendingLeaves.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden border border-slate-200/80">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/80 via-white to-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm shadow-amber-500/20">
                            <HiBell size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Pending Leave Approvals</h2>
                            <p className="text-[11px] font-medium text-slate-500">Action window valid until 10:00 AM on end date</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <HiX size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-slate-50/40">
                    {pendingLeaves.map((leave) => (
                        <div key={leave.id} className="p-4 rounded-2xl bg-white border border-slate-200/80 flex flex-col gap-3 shadow-sm hover:border-amber-200 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                                        {leave.studentName?.charAt(0) || "S"}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-xs">{leave.studentName}</h4>
                                        <p className="text-[11px] text-slate-500">Class {leave.grade} • {leave.subject}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                    Pending
                                </span>
                            </div>

                            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                                "{leave.message}"
                            </p>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-100/80">
                                <span className="text-[11px] font-semibold text-slate-400">
                                    {leave.fromDate} → {leave.toDate}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button 
                                        onClick={() => onAction(leave.id, 'Approved')}
                                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm"
                                    >
                                        <HiCheck size={14} /> Approve
                                    </button>
                                    <button 
                                        onClick={() => onAction(leave.id, 'Declined')}
                                        className="flex items-center gap-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-all border border-slate-200"
                                    >
                                        <HiX size={14} /> Decline
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Metric Stat Card Component ---
const StatCard = memo(({ icon: Icon, label, value, iconStyles, badgeText }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] hover:shadow-md hover:border-slate-300 transition-all duration-300 relative overflow-hidden group">
        <div className="flex items-start justify-between">
            <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
                <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 duration-300 ${iconStyles}`}>
                <Icon size={24} strokeWidth={2} />
            </div>
        </div>
        {badgeText && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">{badgeText}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
        )}
    </div>
));
StatCard.displayName = "StatCard";

const ACADEMIC_MONTHS = [
    { name: "Apr", monthIndex: 3 }, { name: "May", monthIndex: 4 }, { name: "Jun", monthIndex: 5 },
    { name: "Jul", monthIndex: 6 }, { name: "Aug", monthIndex: 7 }, { name: "Sep", monthIndex: 8 },
    { name: "Oct", monthIndex: 9 }, { name: "Nov", monthIndex: 10 }, { name: "Dec", monthIndex: 11 },
    { name: "Jan", monthIndex: 0 }, { name: "Feb", monthIndex: 1 }, { name: "Mar", monthIndex: 2 },
];

export default function ProfessionalDashboard() {
    const [data, setData] = useState({ session: null, sessions: [], loading: true });
    
    const [allStudents, setAllStudents] = useState([]);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [todayAttendanceData, setTodayAttendanceData] = useState({});
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

    // State for Leave Applications
    const [leaveApplications, setLeaveApplications] = useState([]);
    const [isLeavePopupOpen, setIsLeavePopupOpen] = useState(false);

    const [stats, setStats] = useState({ 
        totalStudents: 0, 
        monthlyFeeColl: 0, 
        totalSessionColl: 0, 
        pendingFeesTotal: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
        todayAttendancePresent: 0,
        todayAttendanceTotal: 0
    });
    const [bdays, setBdays] = useState([]);
    const [classDistribution, setClassDistribution] = useState([]);
    const [monthlyFeeTrend, setMonthlyFeeTrend] = useState([]);
    const [incomeVsExpenseTrend, setIncomeVsExpenseTrend] = useState([]);

    // 1. Session Initialization
    useEffect(() => {
        return onSnapshot(doc(db, "config", "settings"), (snap) => {
            if (snap.exists()) {
                const d = snap.data();
                setData({ session: d.activeSession, sessions: d.sessions || [], loading: false });
            }
        });
    }, []);

    // 2. Main Data Fetching
    useEffect(() => {
        if (!data.session) return;
        
        const currentDate = new Date();
        const currentMonthIdx = currentDate.getMonth(); 
        const currentYear = currentDate.getFullYear();

        const fetchStudentsAndStructures = async () => {
            try {
                const feeStructSnap = await getDocs(collection(db, "sessions", data.session, "studentFeeStructures"));
                const classFeeMap = {};
                feeStructSnap.docs.forEach(docSnap => {
                    classFeeMap[docSnap.id] = Number(docSnap.data().totalFee || 0);
                });

                const studentsSnap = await getDocs(collection(db, "sessions", data.session, "students"));
                const studentDocs = studentsSnap.docs.map(d => ({ ...d.data(), docId: d.id }));
                const activeStudents = studentDocs.filter(s => s.grade !== "PASSED OUT");
                const totalActive = activeStudents.length;

                setAllStudents(activeStudents); 

                let totalExpectedFees = 0;
                const classCounts = {};
                const uniqueClasses = new Set();

                activeStudents.forEach(s => {
                    const grade = String(s.grade || "Unassigned").trim();
                    uniqueClasses.add(grade);
                    classCounts[grade] = (classCounts[grade] || 0) + 1;

                    if (s.isRte !== true && s.isRTE !== true) {
                        totalExpectedFees += (classFeeMap[grade] || 0);
                    }
                });

                setAvailableClasses(Array.from(uniqueClasses).sort());

                const distArray = Object.entries(classCounts).map(([grade, count]) => ({
                    grade,
                    count,
                    percentage: totalActive > 0 ? Math.round((count / totalActive) * 100) : 0
                })).sort((a, b) => b.count - a.count);
                
                setClassDistribution(distArray);

                const today = new Date();
                const upcoming = studentDocs.filter(s => s.dob && s.dob !== "N/A").map(s => {
                    const d = new Date(s.dob);
                    const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
                    if (next < today) next.setFullYear(today.getFullYear() + 1);
                    return { ...s, nextBirthday: next };
                }).sort((a, b) => a.nextBirthday - b.nextBirthday).slice(0, 5);
                
                setBdays(upcoming);
                setStats(prev => ({ 
                    ...prev, 
                    totalStudents: totalActive, 
                    totalExpectedFees,
                    todayAttendanceTotal: totalActive 
                }));
            } catch (err) {
                console.error("Error fetching students:", err);
            }
        };

        fetchStudentsAndStructures();

        // --- Fetch Leave Applications Real-time ---
        const unsubLeaves = onSnapshot(collection(db, "sessions", data.session, "leaveApplications"), (snapshot) => {
            const leaves = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            }));

            leaves.sort((a, b) => {
                const timeA = a.appliedAt?.toDate ? a.appliedAt.toDate() : new Date(a.appliedAt || a.fromDate || 0);
                const timeB = b.appliedAt?.toDate ? b.appliedAt.toDate() : new Date(b.appliedAt || b.fromDate || 0);
                return timeB - timeA;
            });

            setLeaveApplications(leaves);

            // Check if any pending leave is within the action window (toDate based)
            const nowCheck = new Date();
            const pendingList = leaves.filter(l => {
                if (l.status !== 'Pending' || !l.toDate) return false;
                const endDate = new Date(l.toDate);
                endDate.setHours(23, 59, 59, 999);

                // Window is open if today is before endDate, or today equals endDate and time < 10 AM
                const todayMidnight = new Date();
                todayMidnight.setHours(0, 0, 0, 0);
                const endMidnight = new Date(l.toDate);
                endMidnight.setHours(0, 0, 0, 0);

                if (todayMidnight < endMidnight) return true;
                if (todayMidnight.getTime() === endMidnight.getTime() && nowCheck.getHours() < 10) return true;
                return false;
            });

            if (pendingList.length > 0) {
                setIsLeavePopupOpen(true);
            }
        });

        // --- Fee Collections Real-time ---
        const unsubFees = onSnapshot(collectionGroup(db, 'feePayments'), async (snap) => {
            let sessionTotal = 0;
            let currentMonthTotal = 0;
            const monthlyMap = {}; 

            snap.docs.forEach(d => {
                if (!d.ref.path.includes(data.session)) return;
                const payData = d.data();
                const history = payData.history;

                if (history && typeof history === 'object') {
                    Object.entries(history).forEach(([dateKey, paidAmt]) => {
                        const amt = Number(paidAmt || 0);
                        if (amt <= 0) return;

                        let parsedDate = null;
                        if (dateKey.includes("-")) {
                            const parts = dateKey.split("-");
                            if (parts.length === 3) {
                                if (parts[0].length <= 2 && parts[2].length === 4) {
                                    parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                                } else {
                                    parsedDate = new Date(dateKey);
                                }
                            }
                        } else {
                            parsedDate = new Date(dateKey);
                        }

                        if (!parsedDate || isNaN(parsedDate.getTime()) || parsedDate > currentDate) return;

                        sessionTotal += amt;
                        if (parsedDate.getMonth() === currentMonthIdx && parsedDate.getFullYear() === currentYear) {
                            currentMonthTotal += amt;
                        }

                        const mShort = parsedDate.toLocaleString('default', { month: 'short' });
                        const yShort = String(parsedDate.getFullYear()).slice(-2);
                        const mKey = `${mShort}-${yShort}`;
                        monthlyMap[mKey] = (monthlyMap[mKey] || 0) + amt;
                    });
                }
            });

            try {
                const feeStructSnap = await getDocs(collection(db, "sessions", data.session, "studentFeeStructures"));
                const classFeeMap = {};
                feeStructSnap.docs.forEach(docSnap => classFeeMap[docSnap.id] = Number(docSnap.data().totalFee || 0));

                const studentsSnap = await getDocs(collection(db, "sessions", data.session, "students"));
                let totalExpectedFees = 0;
                
                studentsSnap.docs.map(d => d.data()).filter(s => s.grade !== "PASSED OUT").forEach(s => {
                    if (s.isRte !== true && s.isRTE !== true) {
                        totalExpectedFees += (classFeeMap[String(s.grade || "").trim()] || 0);
                    }
                });

                setStats(prev => ({
                    ...prev,
                    totalSessionColl: sessionTotal,
                    monthlyFeeColl: currentMonthTotal,
                    pendingFeesTotal: Math.max(0, totalExpectedFees - sessionTotal)
                }));
            } catch (err) {
                console.error("Error pending fees calculation:", err);
            }

            const sessionYearMatch = data.session.match(/\d{4}/);
            const baseYear = sessionYearMatch ? parseInt(sessionYearMatch[0], 10) : currentYear;

            const orderedTrend = ACADEMIC_MONTHS.map((mObj, idx) => {
                const year = idx >= 9 ? baseYear + 1 : baseYear;
                const mShort = mObj.name;
                const key = `${mShort}-${String(year).slice(-2)}`;
                return { month: mShort, amount: monthlyMap[key] || 0 };
            }).filter(item => item.amount > 0 || ACADEMIC_MONTHS.findIndex(m => m.name === item.month) <= currentMonthIdx);

            setMonthlyFeeTrend(orderedTrend);
        });

        // --- Income & Expenditure Real-time Listeners ---
        let unsubSalary = () => {};
        let unsubAccounts = () => {};
        let unsubFeePaymentsForGraph = () => {};

        const setupIncExpRealtime = () => {
            try {
                let localIncExpMap = {};
                let localTotalIncome = 0;
                let localExpense = 0;
                
                const updateGraphState = () => {
                    const sessionYearMatch = data.session.match(/\d{4}/);
                    const baseYear = sessionYearMatch ? parseInt(sessionYearMatch[0], 10) : currentYear;

                    const orderedIncExp = ACADEMIC_MONTHS.map((mObj, idx) => {
                        const year = idx >= 9 ? baseYear + 1 : baseYear;
                        const mShort = mObj.name;
                        const yShort = String(year).slice(-2);
                        const key = `${mShort}-${yShort}`;
                        
                        const val = localIncExpMap[key] || { income: 0, expense: 0 };
                        return {
                            month: mShort,
                            income: val.income,
                            expense: val.expense
                        };
                    }).filter(item => {
                        const monthCalendarIdx = ACADEMIC_MONTHS.findIndex(m => m.name === item.month);
                        const currentCalendarIdx = ACADEMIC_MONTHS.findIndex(m => m.monthIndex === currentMonthIdx);
                        return item.income > 0 || item.expense > 0 || monthCalendarIdx <= currentCalendarIdx;
                    });

                    setIncomeVsExpenseTrend(orderedIncExp);
                    setStats(prev => ({
                        ...prev,
                        monthlyIncome: localTotalIncome,
                        monthlyExpense: localExpense
                    }));
                };

                unsubSalary = onSnapshot(collection(db, 'salaryPayments'), (salarySnap) => {
                    salarySnap.docs.forEach(docSnap => {
                        const docData = docSnap.data();
                        const entries = Object.values(docData).filter(val => val && typeof val === 'object' && val.monthYear);
                        if (docData.monthYear) entries.push(docData);

                        entries.forEach(sData => {
                            if (sData.isPaid !== true && String(sData.isPaid).toLowerCase() !== "true") return;
                            const amt = Number(sData.salary || sData.amount || 0);
                            const my = String(sData.monthYear || ""); 
                            
                            if (my && my.includes('-')) {
                                const [y, m] = my.split('-').map(Number);
                                if (!isNaN(y) && !isNaN(m)) {
                                    const dateObj = new Date(y, m - 1, 1);
                                    if (dateObj > currentDate) return;

                                    const mShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][dateObj.getMonth()];
                                    const yShort = String(y).slice(-2);
                                    const mKey = `${mShort}-${yShort}`;
                                    
                                    if (!localIncExpMap[mKey]) localIncExpMap[mKey] = { income: 0, expense: 0 };
                                    localIncExpMap[mKey].expense += amt;

                                    if (m - 1 === currentMonthIdx && y === currentYear) {
                                        localExpense += amt;
                                    }
                                }
                            }
                        });
                    });
                    updateGraphState();
                });

                unsubAccounts = onSnapshot(collection(db, 'sessions', data.session, 'accounts'), (manualSnap) => {
                    manualSnap.docs.forEach(d => {
                        const mData = d.data();
                        const amt = Number(mData.amount || 0);
                        const isInc = String(mData.type || "").toLowerCase() === 'income';
                        
                        let dObj = new Date();
                        if (mData.date?.toDate) dObj = mData.date.toDate();
                        else if (mData.date) dObj = new Date(mData.date);

                        if (isNaN(dObj.getTime()) || dObj > currentDate) return;

                        const mShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][dObj.getMonth()];
                        const yShort = String(dObj.getFullYear()).slice(-2);
                        const mKey = `${mShort}-${yShort}`;

                        if (!localIncExpMap[mKey]) localIncExpMap[mKey] = { income: 0, expense: 0 };
                        if (isInc) localIncExpMap[mKey].income += amt;
                        else localIncExpMap[mKey].expense += amt;

                        if (dObj.getMonth() === currentMonthIdx && dObj.getFullYear() === currentYear) {
                            if (isInc) localTotalIncome += amt;
                            else localExpense += amt; 
                        }
                    });
                    updateGraphState();
                });

                unsubFeePaymentsForGraph = onSnapshot(collectionGroup(db, 'feePayments'), (snap) => {
                    snap.docs.forEach(d => {
                        if (!d.ref.path.includes(data.session)) return;
                        const payData = d.data();
                        const history = payData.history;

                        if (history && typeof history === 'object') {
                            Object.entries(history).forEach(([dateKey, paidAmt]) => {
                                const amt = Number(paidAmt || 0);
                                if (amt <= 0) return;

                                let parsedDate = null;
                                if (dateKey.includes("-")) {
                                    const parts = dateKey.split("-");
                                    if (parts.length === 3) {
                                        if (parts[0].length <= 2 && parts[2].length === 4) {
                                            parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                                        } else {
                                            parsedDate = new Date(dateKey);
                                        }
                                    }
                                } else {
                                    parsedDate = new Date(dateKey);
                                }

                                if (!parsedDate || isNaN(parsedDate.getTime()) || parsedDate > currentDate) return;

                                const mShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][parsedDate.getMonth()];
                                const yShort = String(parsedDate.getFullYear()).slice(-2);
                                const mKey = `${mShort}-${yShort}`;

                                if (!localIncExpMap[mKey]) localIncExpMap[mKey] = { income: 0, expense: 0 };
                                localIncExpMap[mKey].income += amt;

                                if (parsedDate.getMonth() === currentMonthIdx && parsedDate.getFullYear() === currentYear) {
                                    localTotalIncome += amt;
                                }
                            });
                        }
                    });
                    updateGraphState();
                });

            } catch (err) {
                console.error("Error setting up financial data listeners:", err);
            }
        };

        setupIncExpRealtime();

        // --- Real-time Attendance ---
        const tzOffset = (new Date()).getTimezoneOffset() * 60000; 
        const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, -1);
        const todayStr = localISOTime.split('T')[0];

        const attendanceQuery = query(
            collection(db, "sessions", data.session, "attendance"),
            where("date", "==", todayStr)
        );

        const unsubAttendance = onSnapshot(attendanceQuery, (snap) => {
            let combinedRecords = {};
            snap.docs.forEach(docSnap => {
                const docData = docSnap.data();
                if (docData.records && typeof docData.records === 'object') {
                    combinedRecords = { ...combinedRecords, ...docData.records };
                }
            });

            const activeStudentIds = new Set(allStudents.map(s => s.id || s.docId));
            let presentCount = 0;
            Object.entries(combinedRecords).forEach(([studentId, status]) => {
                if (status && String(status).toLowerCase() === 'present') {
                    if (activeStudentIds.size === 0 || activeStudentIds.has(studentId)) {
                        presentCount++;
                    }
                }
            });

            setTodayAttendanceData(combinedRecords);
            setStats(prev => ({
                ...prev,
                todayAttendancePresent: presentCount,
                todayAttendanceTotal: allStudents.length > 0 ? allStudents.length : prev.totalStudents
            }));
        });

        return () => {
            unsubFees();
            unsubAttendance();
            unsubSalary();
            unsubAccounts();
            unsubFeePaymentsForGraph();
            unsubLeaves();
        };
    }, [data.session]);

    // Handle leave status updates (Approve/Decline)
    const handleLeaveAction = async (leaveId, newStatus) => {
        try {
            await updateDoc(doc(db, "sessions", data.session, "leaveApplications", leaveId), {
                status: newStatus
            });
        } catch (error) {
            console.error("Error updating leave application status:", error);
        }
    };

    if (data.loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans gap-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-semibold text-slate-500 text-sm tracking-wide">Initializing School ERP Portal...</p>
        </div>
    );

    const maxFeeAmt = monthlyFeeTrend.length > 0 ? Math.max(...monthlyFeeTrend.map(m => m.amount), 1000) : 1000;
    const maxIncExpAmt = incomeVsExpenseTrend.length > 0 ? Math.max(...incomeVsExpenseTrend.map(m => Math.max(m.income, m.expense)), 1000) : 1000;

    // Helper to check if a leave application's action window is closed (based on toDate & 10:00 AM)
    const checkIfWindowClosed = (toDateStr) => {
        if (!toDateStr) return false;
        const now = new Date();
        const endDate = new Date(toDateStr);
        endDate.setHours(10, 0, 0, 0); // 10:00 AM on the toDate

        return now.getTime() > endDate.getTime();
    };

    const pendingLeaves = leaveApplications.filter(l => l.status === 'Pending' && !checkIfWindowClosed(l.toDate));
    const attendancePercentage = stats.totalStudents > 0 
        ? Math.min(Math.round((stats.todayAttendancePresent / stats.totalStudents) * 100), 100) 
        : 0;

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-6 lg:p-8 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
            <div className="max-w-[1440px] mx-auto space-y-6">
                
                {/* Top Navigation & Session Bar */}
                <header className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span> Live Instance
                            </span>
                            <span className="text-xs text-slate-400 font-medium">Administrator Command Center</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Institutional Dashboard</h1>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium">Comprehensive academic, collection, and administrative telemetry</p>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200/70 self-start md:self-auto">
                        <div className="px-3">
                            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Session</span>
                            <span className="text-xs font-bold text-slate-700">Academic Year</span>
                        </div>
                        <div className="relative">
                            <select 
                                value={data.session} 
                                onChange={(e) => updateDoc(doc(db, "config", "settings"), { activeSession: e.target.value })} 
                                className="bg-white text-slate-900 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-9 appearance-none transition-all"
                            >
                                {data.sessions?.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>
                </header>

                {/* KPI Metrics Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <StatCard 
                        icon={HiOutlineAcademicCap} 
                        label="Enrolled Students" 
                        value={stats.totalStudents} 
                        iconStyles="bg-indigo-50 text-indigo-600 border border-indigo-100" 
                        badgeText="Active standard enrollment"
                    />
                    <StatCard 
                        icon={HiOutlineCurrencyRupee} 
                        label="Current Month Fee" 
                        value={`₹ ${stats.monthlyFeeColl.toLocaleString('en-IN')}`} 
                        iconStyles="bg-emerald-50 text-emerald-600 border border-emerald-100" 
                        badgeText="Collected this month"
                    />
                    <StatCard 
                        icon={HiOutlineCurrencyRupee} 
                        label="Session Fee Realized" 
                        value={`₹ ${stats.totalSessionColl.toLocaleString('en-IN')}`} 
                        iconStyles="bg-blue-50 text-blue-600 border border-blue-100" 
                        badgeText="Cumulative collections"
                    />
                    <StatCard 
                        icon={HiOutlineExclamationCircle} 
                        label="Outstanding Dues" 
                        value={`₹ ${stats.pendingFeesTotal.toLocaleString('en-IN')}`} 
                        iconStyles="bg-rose-50 text-rose-600 border border-rose-100" 
                        badgeText="Net receivables overdue"
                    />
                </div>

                {/* Actionable Hero Attendance Strip */}
                <div 
                    onClick={() => setIsAttendanceModalOpen(true)}
                    className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-slate-900/10 cursor-pointer overflow-hidden group border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300"
                >
                    <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-amber-400 group-hover:scale-105 group-hover:bg-amber-400 group-hover:text-slate-900 transition-all duration-300">
                                <HiOutlineClipboardCheck size={32} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg sm:text-xl font-bold tracking-tight">Real-Time Daily Attendance</h3>
                                    <span className="hidden sm:inline-flex text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        Live Rollcall
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-300 font-normal mt-0.5">
                                    Click here to open student roll, filter standard, and view absentee registry
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full lg:w-auto justify-end">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{stats.todayAttendancePresent}</span>
                                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">/ {stats.totalStudents} Present</span>
                            </div>

                            <div className="flex flex-col gap-1.5 w-full sm:w-44">
                                <div className="flex justify-between text-[11px] font-bold text-slate-300">
                                    <span>Rate</span>
                                    <span>{attendancePercentage}%</span>
                                </div>
                                <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden p-[1px] border border-white/10">
                                    <div 
                                        className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-700 ease-out shadow-sm" 
                                        style={{ width: `${attendancePercentage}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all">
                                <HiOutlineChevronRight size={18} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Leave Requests Stream */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)]">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                                <HiOutlineCalendar size={20} />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Student Leave Requests</h2>
                                <p className="text-xs text-slate-400">Applications submitted for administrative clearance</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {pendingLeaves.length > 0 && (
                                <button 
                                    onClick={() => setIsLeavePopupOpen(true)}
                                    className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/80 hover:bg-amber-200 border border-amber-200/80 px-3.5 py-1.5 rounded-xl transition-all"
                                >
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                                    Review Pending ({pendingLeaves.length})
                                </button>
                            )}
                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                                {leaveApplications.length} Total
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                        {leaveApplications.length > 0 ? (
                            leaveApplications.map((leave) => {
                                const isWindowClosed = checkIfWindowClosed(leave.toDate);

                                return (
                                    <div key={leave.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-slate-300 flex flex-col gap-3 transition-colors">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 text-slate-800 flex items-center justify-center font-bold text-xs shadow-xs">
                                                    {leave.studentName?.charAt(0) || "S"}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{leave.studentName}</h4>
                                                    <p className="text-[11px] font-medium text-slate-500">Class {leave.grade} • <span className="font-semibold text-slate-700">{leave.subject}</span></p>
                                                </div>
                                            </div>

                                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                                leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                leave.status === 'Declined' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                'bg-amber-50 text-amber-800 border-amber-200'
                                            }`}>
                                                {leave.status || 'Pending'}
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/60 leading-relaxed font-normal">
                                            "{leave.message}"
                                        </p>

                                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 flex-wrap gap-2">
                                            <span className="text-[11px] font-semibold text-slate-400">
                                                Duration: {leave.fromDate} to {leave.toDate}
                                            </span>

                                            {isWindowClosed ? (
    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
        Action window lapsed ({">"}10:00 AM on leave end date)
    </span>
) : (
                                                leave.status === 'Pending' && (
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => handleLeaveAction(leave.id, 'Approved')}
                                                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm"
                                                        >
                                                            <HiCheck size={14} /> Approve
                                                        </button>
                                                        <button 
                                                            onClick={() => handleLeaveAction(leave.id, 'Declined')}
                                                            className="flex items-center gap-1 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-all border border-slate-200"
                                                        >
                                                            <HiX size={14} /> Decline
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-36 flex flex-col items-center justify-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <HiOutlineCalendar className="w-8 h-8 text-slate-300 mb-1" />
                                No pending or historical leave records for this session.
                            </div>
                        )}
                    </div>
                </div>

                {/* Financial Analytics & Graphs Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Fee Collections Trend */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Fee Collection Velocity</h2>
                                <p className="text-xs text-slate-400">Monthly realized revenue pipeline</p>
                            </div>
                            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                                Fiscal Trend
                            </span>
                        </div>

                        {monthlyFeeTrend.length > 0 ? (
                            <div className="h-64 flex items-end justify-between gap-2 pt-8 px-2 overflow-x-auto relative">
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                                    <div className="border-b border-dashed border-slate-300 w-full"></div>
                                    <div className="border-b border-dashed border-slate-300 w-full"></div>
                                    <div className="border-b border-slate-300 w-full"></div>
                                </div>
                                {monthlyFeeTrend.map((item, idx) => {
                                    const heightPct = Math.max(Math.round((item.amount / maxFeeAmt) * 100), 8);
                                    return (
                                        <div key={idx} className="flex-1 min-w-[34px] flex flex-col items-center gap-2 h-full justify-end group relative z-10">
                                            <div className="text-[10px] font-bold text-white bg-slate-900 px-2 py-1 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 pointer-events-none whitespace-nowrap z-20">
                                                ₹{item.amount.toLocaleString('en-IN')}
                                            </div>
                                            <div 
                                                style={{ height: `${heightPct}%` }} 
                                                className="w-full max-w-[36px] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-xl transition-all duration-500 group-hover:from-indigo-500 group-hover:to-indigo-300 group-hover:shadow-md"
                                            ></div>
                                            <span className="text-[11px] font-semibold text-slate-500 mt-1">{item.month}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <HiOutlineChartBar className="w-9 h-9 text-slate-300 mb-2" />
                                No tuition payment logs available for this period.
                            </div>
                        )}
                    </div>

                    {/* Operational Cashflow (Income vs Expense) */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Institutional Cashflow</h2>
                                <p className="text-xs text-slate-400">Net revenue vs salary & operational expenditure</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                    <span className="w-2.5 h-2.5 rounded-md bg-emerald-500"></span> Income
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                    <span className="w-2.5 h-2.5 rounded-md bg-rose-500"></span> Outflow
                                </span>
                            </div>
                        </div>

                        {incomeVsExpenseTrend.length > 0 ? (
                            <div className="h-64 flex items-end justify-between gap-3 pt-8 px-2 overflow-x-auto relative">
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                                    <div className="border-b border-dashed border-slate-300 w-full"></div>
                                    <div className="border-b border-dashed border-slate-300 w-full"></div>
                                    <div className="border-b border-slate-300 w-full"></div>
                                </div>
                                {incomeVsExpenseTrend.map((item, idx) => {
                                    const incHeight = Math.max(Math.round((item.income / maxIncExpAmt) * 100), 6);
                                    const expHeight = Math.max(Math.round((item.expense / maxIncExpAmt) * 100), 6);
                                    return (
                                        <div key={idx} className="flex-1 min-w-[38px] flex flex-col items-center gap-2 h-full justify-end group relative z-10">
                                            <div className="flex items-end justify-center gap-1 w-full h-full">
                                                <div 
                                                    style={{ height: `${incHeight}%` }} 
                                                    className="w-1/2 max-w-[16px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-500 group-hover:brightness-110"
                                                    title={`Income: ₹${item.income}`}
                                                ></div>
                                                <div 
                                                    style={{ height: `${expHeight}%` }} 
                                                    className="w-1/2 max-w-[16px] bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-md transition-all duration-500 group-hover:brightness-110"
                                                    title={`Expense: ₹${item.expense}`}
                                                ></div>
                                            </div>
                                            <span className="text-[11px] font-semibold text-slate-500 mt-1">{item.month}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <HiOutlineTrendingDown className="w-9 h-9 text-slate-300 mb-2" />
                                No accounts expenditure logs indexed yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Row: Class Distribution & Birthdays */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Class Strength Matrix */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] lg:col-span-2">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Class Enrollment Strength</h2>
                                <p className="text-xs text-slate-400">Roster distribution by grade capacity</p>
                            </div>
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                {classDistribution.length} Sections
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[300px] overflow-y-auto pr-1">
                            {classDistribution.length > 0 ? (
                                classDistribution.map((item, i) => (
                                    <div key={i} className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/70 hover:border-indigo-300 transition-colors">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-xs text-slate-800">Class {item.grade}</span>
                                            <span className="text-xs font-bold text-slate-900">
                                                {item.count} <span className="text-slate-400 font-semibold text-[11px]">({item.percentage}%)</span>
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                                                style={{ width: `${item.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 text-center py-10 text-slate-400 text-xs font-medium">
                                    No student rosters registered in this session.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upcoming Student Birthdays */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100">
                                        <HiOutlineCake size={18} />
                                    </div>
                                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Upcoming Birthdays</h2>
                                </div>
                            </div>
                            
                            <div className="space-y-2.5">
                                {bdays.length > 0 ? bdays.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 hover:bg-indigo-50/40 border border-slate-200/70 hover:border-indigo-200 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-indigo-700 flex items-center justify-center font-bold text-xs shadow-xs">
                                                {s.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-xs truncate max-w-[130px]">{s.name}</p>
                                                <p className="text-[11px] font-medium text-slate-400">Class {s.grade}</p>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-xs">
                                            {new Date(s.nextBirthday).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-slate-400 text-xs font-medium">
                                        No upcoming student birthdays recorded.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Modals */}
            <AttendanceListModal 
                isOpen={isAttendanceModalOpen}
                onClose={() => setIsAttendanceModalOpen(false)}
                attendanceRecords={todayAttendanceData}
                students={allStudents}
                classes={availableClasses}
            />

            <LeaveActionPopupModal 
                isOpen={isLeavePopupOpen}
                onClose={() => setIsLeavePopupOpen(false)}
                pendingLeaves={pendingLeaves}
                onAction={(id, status) => {
                    handleLeaveAction(id, status);
                    if (pendingLeaves.length <= 1) setIsLeavePopupOpen(false);
                }}
            />
        </div>
    );
}