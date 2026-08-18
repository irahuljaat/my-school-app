"use client";

import React, { useState, useEffect, memo } from "react";
import {
    HiOutlineAcademicCap,
    HiOutlineCurrencyRupee,
    HiOutlineExclamationCircle,
    HiOutlineCake,
    HiOutlineChartPie,
    HiOutlineChartBar,
    HiOutlineClipboardCheck,
    HiOutlineTrendingUp,
    HiOutlineTrendingDown,
} from "react-icons/hi";

import { db } from "../firebase/config";
import {
    collection,
    onSnapshot,
    doc,
    collectionGroup,
    getDocs,
    updateDoc
} from "firebase/firestore";

// Memoized Stat Card
const StatCard = memo(({ icon: Icon, label, value, bgClass, iconColorClass, subText }) => (
    <div className={`${bgClass} p-6 rounded-[24px] flex items-center justify-between transition-transform hover:scale-[1.02] shadow-sm border border-slate-100/50`}>
        <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">{label}</p>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-1">{value}</h2>
            {subText && <p className="text-[11px] font-bold text-slate-400">{subText}</p>}
        </div>
        <div className={`${iconColorClass} p-3.5 rounded-2xl bg-white/80 shadow-sm`}>
            <Icon size={32} strokeWidth={1.8} />
        </div>
    </div>
));
StatCard.displayName = "StatCard";

// Academic Months Sequence: April to March (Ordered correctly)
const ACADEMIC_MONTHS = [
    { name: "Apr", monthIndex: 3 },
    { name: "May", monthIndex: 4 },
    { name: "Jun", monthIndex: 5 },
    { name: "Jul", monthIndex: 6 },
    { name: "Aug", monthIndex: 7 },
    { name: "Sep", monthIndex: 8 },
    { name: "Oct", monthIndex: 9 },
    { name: "Nov", monthIndex: 10 },
    { name: "Dec", monthIndex: 11 },
    { name: "Jan", monthIndex: 0 },
    { name: "Feb", monthIndex: 1 },
    { name: "Mar", monthIndex: 2 },
];

export default function ProfessionalDashboard() {
    const [data, setData] = useState({ session: null, sessions: [], loading: true });
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

    // Listen for config changes
    useEffect(() => {
        return onSnapshot(doc(db, "config", "settings"), (snap) => {
            if (snap.exists()) {
                const d = snap.data();
                setData({ session: d.activeSession, sessions: d.sessions || [], loading: false });
            }
        });
    }, []);

    // Fetch dynamic real data
    useEffect(() => {
        if (!data.session) return;
        
        const currentDate = new Date();
        const currentMonthIdx = currentDate.getMonth(); // 0 - 11
        const currentYear = currentDate.getFullYear();

        // 1. Fetch Students & Fee Structures to compute total expected fees minus RTE and minus total collections
        const fetchStudentsAndStructures = async () => {
            try {
                // Fetch studentFeeStructures
                const feeStructSnap = await getDocs(collection(db, "sessions", data.session, "studentFeeStructures"));
                const classFeeMap = {};
                feeStructSnap.docs.forEach(docSnap => {
                    const gradeKey = docSnap.id; // e.g., "1", "3", etc.
                    const structData = docSnap.data();
                    const totalFee = Number(structData.totalFee || 0);
                    classFeeMap[gradeKey] = totalFee;
                });

                // Fetch students
                const studentsSnap = await getDocs(collection(db, "sessions", data.session, "students"));
                const studentDocs = studentsSnap.docs.map(d => d.data());
                const activeStudents = studentDocs.filter(s => s.grade !== "PASSED OUT");
                const totalActive = activeStudents.length;

                // Calculate total expected fees for non-RTE active students based on class fee structure
                let totalExpectedFees = 0;
                activeStudents.forEach(s => {
                    if (s.isRte === true || s.isRTE === true) return; // Skip RTE students
                    const grade = String(s.grade || "").trim();
                    const gradeFee = classFeeMap[grade] || 0;
                    totalExpectedFees += gradeFee;
                });

                const classCounts = {};
                activeStudents.forEach(s => {
                    const grade = s.grade || "Unassigned";
                    classCounts[grade] = (classCounts[grade] || 0) + 1;
                });
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
                    totalExpectedFees 
                }));
            } catch (err) {
                console.error("Error fetching students and fee structures:", err);
            }
        };

        fetchStudentsAndStructures();

        // 2. Real Fee Collections (Correct parsing for history DD-MM-YYYY formats & computing pending fees)
        const unsubFees = onSnapshot(collectionGroup(db, 'feePayments'), async (snap) => {
            let sessionTotal = 0;
            let currentMonthTotal = 0;
            const monthlyMap = {}; // { "Apr-26": amount, ... }

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
                } else {
                    const amt = Number(payData.amount || 0);
                    if (amt <= 0) return;

                    let dateObj = payData.createdAt?.toDate ? payData.createdAt.toDate() : new Date();
                    if (isNaN(dateObj.getTime()) || dateObj > currentDate) return;

                    sessionTotal += amt;
                    if (dateObj.getMonth() === currentMonthIdx && dateObj.getFullYear() === currentYear) {
                        currentMonthTotal += amt;
                    }
                    const mShort = dateObj.toLocaleString('default', { month: 'short' });
                    const yShort = String(dateObj.getFullYear()).slice(-2);
                    const mKey = `${mShort}-${yShort}`;
                    monthlyMap[mKey] = (monthlyMap[mKey] || 0) + amt;
                }
            });

            // Re-fetch fee structures and students to calculate pending fees accurately
            try {
                const feeStructSnap = await getDocs(collection(db, "sessions", data.session, "studentFeeStructures"));
                const classFeeMap = {};
                feeStructSnap.docs.forEach(docSnap => {
                    classFeeMap[docSnap.id] = Number(docSnap.data().totalFee || 0);
                });

                const studentsSnap = await getDocs(collection(db, "sessions", data.session, "students"));
                const activeStudents = studentsSnap.docs.map(d => d.data()).filter(s => s.grade !== "PASSED OUT");

                let totalExpectedFees = 0;
                activeStudents.forEach(s => {
                    if (s.isRte === true || s.isRTE === true) return;
                    const grade = String(s.grade || "").trim();
                    totalExpectedFees += (classFeeMap[grade] || 0);
                });

                const calculatedPendingFees = Math.max(0, totalExpectedFees - sessionTotal);

                setStats(prev => ({
                    ...prev,
                    totalSessionColl: sessionTotal,
                    monthlyFeeColl: currentMonthTotal,
                    pendingFeesTotal: calculatedPendingFees
                }));
            } catch (err) {
                console.error("Error calculating pending fees:", err);
            }

            // Build strictly ordered Academic Sequence (April -> March)
            const sessionYearMatch = data.session.match(/\d{4}/);
            const baseYear = sessionYearMatch ? parseInt(sessionYearMatch[0], 10) : currentYear;

            const orderedTrend = ACADEMIC_MONTHS.map((mObj, idx) => {
                const year = idx >= 9 ? baseYear + 1 : baseYear;
                const mShort = mObj.name;
                const yShort = String(year).slice(-2);
                const key = `${mShort}-${yShort}`;
                return {
                    month: mShort,
                    amount: monthlyMap[key] || 0
                };
            }).filter(item => {
                return item.amount > 0 || ACADEMIC_MONTHS.findIndex(m => m.name === item.month) <= currentMonthIdx;
            });

            setMonthlyFeeTrend(orderedTrend);
        });

        // 3. Real Income & Expenditure (Ordered April to March)
        const fetchIncExpData = async () => {
            try {
                const salarySnap = await getDocs(collection(db, 'salaryPayments'));
                let totalMIncome = 0;
                let totalMExpense = 0;
                const incExpMap = {};

                salarySnap.docs.forEach(d => {
                    const sData = d.data();
                    if ((sData.status || "").toLowerCase().trim() !== "paid") return;
                    const amt = Number(sData.amount || 0);
                    const my = sData.monthYear; // YYYY-MM
                    if (my) {
                        const [y, m] = my.split('-').map(Number);
                        const dateObj = new Date(y, m - 1, 1);
                        if (dateObj > currentDate) return;

                        const mShort = dateObj.toLocaleString('default', { month: 'short' });
                        const yShort = String(y).slice(-2);
                        const mKey = `${mShort}-${yShort}`;
                        
                        if (!incExpMap[mKey]) incExpMap[mKey] = { income: 0, expense: 0 };
                        incExpMap[mKey].expense += amt;

                        if (m - 1 === currentMonthIdx && y === currentYear) {
                            totalMExpense += amt;
                        }
                    }
                });

                const manualSnap = await getDocs(collection(db, 'sessions', data.session, 'accounts'));
                manualSnap.docs.forEach(d => {
                    const mData = d.data();
                    const amt = Number(mData.amount || 0);
                    const isInc = mData.type?.toLowerCase() === 'income';
                    let dObj = mData.date?.toDate ? mData.date.toDate() : new Date();

                    if (isNaN(dObj.getTime()) || dObj > currentDate) return;

                    const mShort = dObj.toLocaleString('default', { month: 'short' });
                    const yShort = String(dObj.getFullYear()).slice(-2);
                    const mKey = `${mShort}-${yShort}`;

                    if (!incExpMap[mKey]) incExpMap[mKey] = { income: 0, expense: 0 };
                    if (isInc) incExpMap[mKey].income += amt;
                    else incExpMap[mKey].expense += amt;

                    if (dObj.getMonth() === currentMonthIdx && dObj.getFullYear() === currentYear) {
                        if (isInc) totalMIncome += amt;
                        else totalMExpense += amt;
                    }
                });

                const sessionYearMatch = data.session.match(/\d{4}/);
                const baseYear = sessionYearMatch ? parseInt(sessionYearMatch[0], 10) : currentYear;

                const orderedIncExp = ACADEMIC_MONTHS.map((mObj, idx) => {
                    const year = idx >= 9 ? baseYear + 1 : baseYear;
                    const mShort = mObj.name;
                    const yShort = String(year).slice(-2);
                    const key = `${mShort}-${yShort}`;
                    const val = incExpMap[key] || { income: 0, expense: 0 };
                    return {
                        month: mShort,
                        income: val.income,
                        expense: val.expense
                    };
                }).filter(item => {
                    return item.income > 0 || item.expense > 0 || ACADEMIC_MONTHS.findIndex(m => m.name === item.month) <= currentMonthIdx;
                });

                setIncomeVsExpenseTrend(orderedIncExp);
                setStats(prev => ({
                    ...prev,
                    monthlyIncome: totalMIncome,
                    monthlyExpense: totalMExpense
                }));
            } catch (err) {
                console.error("Error fetching financial data:", err);
            }
        };

        fetchIncExpData();

        // 4. Today's Attendance
        const todayStr = currentDate.toISOString().split('T')[0];
        const unsubAttendance = onSnapshot(doc(db, "sessions", data.session, "attendance", todayStr), (snap) => {
            if (snap.exists()) {
                const attData = snap.data();
                const records = attData.records || {};
                const presentCount = Object.values(records).filter(status === 'Present').length;
                const totalRecorded = Object.keys(records).length;
                setStats(prev => ({
                    ...prev,
                    todayAttendancePresent: presentCount > 0 ? presentCount : Object.values(records).length,
                    todayAttendanceTotal: totalRecorded > 0 ? totalRecorded : stats.totalStudents
                }));
            } else {
                setStats(prev => ({ ...prev, todayAttendancePresent: 0, todayAttendanceTotal: stats.totalStudents }));
            }
        });

        return () => {
            unsubFees();
            unsubAttendance();
        };
    }, [data.session]);

    if (data.loading) return (
        <div className="min-h-screen flex items-center justify-center font-bold text-slate-400 bg-[#fafbfe]">
            Loading Dashboard...
        </div>
    );

    const maxFeeAmt = monthlyFeeTrend.length > 0 ? Math.max(...monthlyFeeTrend.map(m => m.amount), 1000) : 1000;
    const maxIncExpAmt = incomeVsExpenseTrend.length > 0 ? Math.max(...incomeVsExpenseTrend.map(m => Math.max(m.income, m.expense)), 1000) : 1000;

    return (
        <div className="min-h-screen bg-[#fafbfe] p-6 lg:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Admin Dashboard</h1>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Real-time Financial & Academic Analytics</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Session:</span>
                        <select 
                            value={data.session} 
                            onChange={(e) => updateDoc(doc(db, "config", "settings"), { activeSession: e.target.value })} 
                            className="bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm transition-all"
                        >
                            {data.sessions?.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        icon={HiOutlineAcademicCap} 
                        label="Active Students" 
                        value={stats.totalStudents} 
                        bgClass="bg-[#f3efff]" 
                        iconColorClass="text-[#9853eb]" 
                        subText="Enrolled this session"
                    />
                    <StatCard 
                        icon={HiOutlineCurrencyRupee} 
                        label="Present Month Fee" 
                        value={`₹${stats.monthlyFeeColl.toLocaleString('en-IN')}`} 
                        bgClass="bg-[#e9fbf2]" 
                        iconColorClass="text-[#36c276]" 
                        subText="Collected current month"
                    />
                    <StatCard 
                        icon={HiOutlineCurrencyRupee} 
                        label="Complete Session Fee" 
                        value={`₹${stats.totalSessionColl.toLocaleString('en-IN')}`} 
                        bgClass="bg-[#e0f2fe]" 
                        iconColorClass="text-[#0284c7]" 
                        subText="Total session collection"
                    />
                    <StatCard 
                        icon={HiOutlineExclamationCircle} 
                        label="Pending Fees Overview" 
                        value={`₹${stats.pendingFeesTotal.toLocaleString('en-IN')}`} 
                        bgClass="bg-[#fff0f0]" 
                        iconColorClass="text-[#ff6b6b]" 
                        subText="Outstanding student dues"
                    />
                </div>

                {/* Today's Attendance Overview */}
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-purple-50 text-[#9853eb] rounded-2xl">
                            <HiOutlineClipboardCheck size={32} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Today's Attendance Overview</h3>
                            <p className="text-xs font-semibold text-slate-400 mt-0.5">Real-time attendance tracking for today</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-right">
                            <span className="text-2xl font-black text-slate-800">{stats.todayAttendancePresent}</span>
                            <span className="text-slate-400 font-bold text-sm"> / {stats.totalStudents} Students Present</span>
                        </div>
                        <div className="w-32 bg-slate-100 h-3 rounded-full overflow-hidden">
                            <div 
                                className="bg-[#9853eb] h-full rounded-full transition-all duration-500" 
                                style={{ width: `${stats.totalStudents > 0 ? Math.min(Math.round((stats.todayAttendancePresent / stats.totalStudents) * 100), 100) : 0}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Graphical Visualizations Row (Charts) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Fee Collection Trend */}
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <HiOutlineChartBar className="text-[#36c276]" size={22} /> 
                                Fee Collection Trend (April - March)
                            </h2>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Live Fees</span>
                        </div>

                        {monthlyFeeTrend.length > 0 ? (
                            <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-100 overflow-x-auto">
                                {monthlyFeeTrend.map((item, idx) => {
                                    const heightPct = Math.max(Math.round((item.amount / maxFeeAmt) * 100), 12);
                                    return (
                                        <div key={idx} className="flex-1 min-w-[36px] flex flex-col items-center gap-2 h-full justify-end group">
                                            <div className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                ₹{item.amount.toLocaleString('en-IN')}
                                            </div>
                                            <div 
                                                style={{ height: `${heightPct}%` }} 
                                                className="w-full max-w-[40px] bg-gradient-to-t from-[#36c276] to-[#6ee7b7] rounded-t-xl transition-all duration-500 group-hover:opacity-90 shadow-md shadow-emerald-500/10"
                                            ></div>
                                            <span className="text-[11px] font-bold text-slate-500 mt-2">{item.month}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <HiOutlineChartBar className="w-10 h-10 text-slate-300 mb-2" />
                                No past/current fee payment records found yet.
                            </div>
                        )}
                    </div>

                    {/* Income & Expenditure Graph */}
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <HiOutlineTrendingUp className="text-[#9853eb]" size={22} /> 
                                Income & Expenditure (April - March)
                            </h2>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Income</span>
                                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Expense</span>
                            </div>
                        </div>

                        {incomeVsExpenseTrend.length > 0 ? (
                            <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-100 overflow-x-auto">
                                {incomeVsExpenseTrend.map((item, idx) => {
                                    const incHeight = Math.max(Math.round((item.income / maxIncExpAmt) * 100), 8);
                                    const expHeight = Math.max(Math.round((item.expense / maxIncExpAmt) * 100), 8);
                                    return (
                                        <div key={idx} className="flex-1 min-w-[36px] flex flex-col items-center gap-2 h-full justify-end group">
                                            <div className="flex items-center gap-1 w-full justify-center h-full items-end">
                                                <div 
                                                    style={{ height: `${incHeight}%` }} 
                                                    className="w-1/2 bg-emerald-500 rounded-t-md transition-all duration-500 shadow-sm"
                                                    title={`Income: ₹${item.income}`}
                                                ></div>
                                                <div 
                                                    style={{ height: `${expHeight}%` }} 
                                                    className="w-1/2 bg-rose-500 rounded-t-md transition-all duration-500 shadow-sm"
                                                    title={`Expense: ₹${item.expense}`}
                                                ></div>
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-500 mt-2">{item.month}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <HiOutlineTrendingDown className="w-10 h-10 text-slate-300 mb-2" />
                                No income/expenditure records found yet.
                            </div>
                        )}
                    </div>

                </div>

                {/* Bottom Row: Class Distribution & Upcoming Birthdays */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Class Strength / Distribution */}
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between lg:col-span-2">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <HiOutlineChartPie className="text-[#0284c7]" size={22} /> 
                                    Class Strength Distribution
                                </h2>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Breakdown</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto pr-1">
                                {classDistribution.length > 0 ? (
                                    classDistribution.map((item, i) => (
                                        <div key={i} className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-100">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="font-bold text-xs text-slate-700">Class {item.grade}</span>
                                                <span className="text-xs font-black text-sky-600">{item.count} Students <span className="text-slate-400 font-normal">({item.percentage}%)</span></span>
                                            </div>
                                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                                <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${item.percentage}%` }}></div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-2 text-center py-12 text-slate-400 text-xs font-semibold">
                                        No student data available.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Birthdays List */}
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <HiOutlineCake className="text-[#ff9800]" size={22} /> 
                                Upcoming Birthdays
                            </h2>
                        </div>
                        
                        <div className="space-y-3">
                            {bdays.length > 0 ? bdays.map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50/60 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-sm shadow-sm">
                                            {s.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-xs">{s.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Class {s.grade}</p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-lg border border-orange-100">
                                        {new Date(s.nextBirthday).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                                    No upcoming birthdays found.
                                </div>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}