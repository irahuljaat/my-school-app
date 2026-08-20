"use client";

import React, { useState, useEffect, memo } from "react";
import {
    HiOutlineAcademicCap,
    HiOutlineCurrencyRupee,
    HiOutlineExclamationCircle,
    HiOutlineClipboardCheck,
    HiOutlineChartBar,
    HiOutlineTrendingDown,
    HiX
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Today's Attendance</h2>
                        <p className="text-sm font-medium text-gray-500 mt-0.5">View and filter student attendance</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <HiX size={24} />
                    </button>
                </div>

                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex p-1 bg-gray-100 rounded-xl w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab("present")}
                            className={`flex-1 sm:flex-none px-6 py-2 text-sm font-bold rounded-lg transition-all ${
                                activeTab === "present" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            Present
                        </button>
                        <button
                            onClick={() => setActiveTab("absent")}
                            className={`flex-1 sm:flex-none px-6 py-2 text-sm font-bold rounded-lg transition-all ${
                                activeTab === "absent" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            Absent
                        </button>
                    </div>

                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full sm:w-auto bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none shadow-sm"
                    >
                        <option value="All">All Classes</option>
                        {classes.map(cls => (
                            <option key={cls} value={cls}>Class {cls}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {filteredStudents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredStudents.map((student, idx) => (
                                <div key={idx} className="flex items-center gap-3.5 p-3 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm shadow-sm">
                                        {student.name?.charAt(0) || "-"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 text-sm truncate">{student.name}</p>
                                        <p className="text-xs font-medium text-gray-500 truncate">
                                            Class {student.grade} • ID: {student.id || student.docId || 'N/A'}
                                        </p>
                                    </div>
                                    <div className={`w-2.5 h-2.5 rounded-full ${activeTab === 'present' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-gray-400 text-sm font-medium">
                            No students found for this selection.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Dashboard Component ---
const StatCard = memo(({ icon: Icon, label, value, bgClass, iconColorClass, subText }) => (
    <div className={`bg-white p-6 rounded-[24px] flex flex-col justify-center transition-transform hover:-translate-y-1 duration-300 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.04)] border border-gray-100`}>
        <div className="flex items-center gap-4">
            <div className={`p-4 rounded-full flex-shrink-0 flex items-center justify-center ${iconColorClass}`}>
                <Icon size={24} strokeWidth={2} />
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{label}</p>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h2>
            </div>
        </div>
        {subText && (
            <div className="mt-4 flex items-center gap-1.5 ml-16">
                <span className="text-xs font-semibold text-gray-400">{subText}</span>
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
                setStats(prev => ({ ...prev, totalStudents: totalActive, totalExpectedFees }));
            } catch (err) {
                console.error("Error fetching students:", err);
            }
        };

        fetchStudentsAndStructures();

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
       
                        // 1. Listen to salaryPayments collection for Expenses
                                       unsubSalary = onSnapshot(collection(db, 'salaryPayments'), (salarySnap) => {
                                           salarySnap.docs.forEach(docSnap => {
                                               const docData = docSnap.data();
                                               const entries = Object.values(docData).filter(val => val && typeof val === 'object' && val.monthYear);
                                               
                                               if (docData.monthYear) {
                                                   entries.push(docData);
                                               }
                       
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
       
                       // 2. Listen to manual accounts
                       unsubAccounts = onSnapshot(collection(db, 'sessions', data.session, 'accounts'), (manualSnap) => {
                           manualSnap.docs.forEach(d => {
                               const mData = d.data();
                               const amt = Number(mData.amount || 0);
                               const isInc = String(mData.type || "").toLowerCase() === 'income';
                               
                               let dObj = new Date();
                               if (mData.date?.toDate) {
                                   dObj = mData.date.toDate();
                               } else if (mData.date) {
                                   dObj = new Date(mData.date);
                               }
       
                               if (isNaN(dObj.getTime()) || dObj > currentDate) return;
       
                               const mShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][dObj.getMonth()];
                               const yShort = String(dObj.getFullYear()).slice(-2);
                               const mKey = `${mShort}-${yShort}`;
       
                               if (!localIncExpMap[mKey]) localIncExpMap[mKey] = { income: 0, expense: 0 };
                               
                               if (isInc) {
                                   localIncExpMap[mKey].income += amt;
                               } else {
                                   localIncExpMap[mKey].expense += amt;
                               }
       
                               if (dObj.getMonth() === currentMonthIdx && dObj.getFullYear() === currentYear) {
                                   if (isInc) localTotalIncome += amt;
                                   else localExpense += amt; 
                               }
                           });
                           updateGraphState();
                       });
       
                       // 3. Include student fee payments into Income graph
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

            let presentCount = 0;
            const recordsArray = Object.values(combinedRecords);
            
            recordsArray.forEach(status => {
                if (status && String(status).toLowerCase() === 'present') {
                    presentCount++;
                }
            });

            setTodayAttendanceData(combinedRecords);
            setStats(prev => ({
                ...prev,
                todayAttendancePresent: presentCount,
                todayAttendanceTotal: recordsArray.length
            }));
        });

        return () => {
            unsubFees();
            unsubAttendance();
            unsubSalary();
            unsubAccounts();
            unsubFeePaymentsForGraph();
        };
    }, [data.session]);

    if (data.loading) return (
        <div className="min-h-screen flex items-center justify-center font-bold text-gray-400 bg-[#F4F6F8]">
            Loading Dashboard...
        </div>
    );

    const maxFeeAmt = monthlyFeeTrend.length > 0 ? Math.max(...monthlyFeeTrend.map(m => m.amount), 1000) : 1000;
    const maxIncExpAmt = incomeVsExpenseTrend.length > 0 ? Math.max(...incomeVsExpenseTrend.map(m => Math.max(m.income, m.expense)), 1000) : 1000;

    return (
        <div className="min-h-screen bg-[#F4F6F8] p-6 lg:p-8 font-sans relative">
            <div className="max-w-[1400px] mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pt-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard </h1>
                        <p className="text-sm font-medium text-gray-500 mt-2">Here's what's happening in your school today.</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-600">Current Session:</span>
                        <select 
                            value={data.session} 
                            onChange={(e) => updateDoc(doc(db, "config", "settings"), { activeSession: e.target.value })} 
                            className="bg-yellow-400 text-black px-5 py-2.5 rounded-full font-bold text-sm cursor-pointer outline-none focus:ring-4 focus:ring-yellow-400/20 shadow-sm transition-all border-none appearance-none pr-8 relative"
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.8rem top 50%', backgroundSize: '0.65rem auto' }}
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
                        bgClass="bg-white" 
                        iconColorClass="bg-yellow-50 text-yellow-600" 
                        subText="Enrolled this session"
                    />
                    <StatCard 
                        icon={HiOutlineCurrencyRupee} 
                        label="Present Month Fee" 
                        value={`₹ ${stats.monthlyFeeColl.toLocaleString('en-IN')}`} 
                        bgClass="bg-white" 
                        iconColorClass="bg-gray-100 text-gray-800" 
                        subText="Collected current month"
                    />
                    <StatCard 
                        icon={HiOutlineCurrencyRupee} 
                        label="Complete Session Fee" 
                        value={`₹ ${stats.totalSessionColl.toLocaleString('en-IN')}`} 
                        bgClass="bg-white" 
                        iconColorClass="bg-yellow-50 text-yellow-600" 
                        subText="Total session collection"
                    />
                    <StatCard 
                        icon={HiOutlineExclamationCircle} 
                        label="Pending Fees Overview" 
                        value={`₹ ${stats.pendingFeesTotal.toLocaleString('en-IN')}`} 
                        bgClass="bg-white" 
                        iconColorClass="bg-red-50 text-red-500" 
                        subText="Outstanding student dues"
                    />
                </div>

                {/* Today's Attendance Overview */}
                <div 
                    onClick={() => setIsAttendanceModalOpen(true)}
                    className="bg-white p-6 rounded-[24px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer hover:border-yellow-400/50 hover:shadow-lg transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-gray-900 text-white rounded-full group-hover:bg-yellow-400 group-hover:text-gray-900 transition-colors">
                            <HiOutlineClipboardCheck size={28} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">Today's Attendance Overview</h3>
                            <p className="text-sm font-medium text-gray-500 mt-0.5">Click to view detailed real-time attendance tracking</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-right">
                            <span className="text-3xl font-bold text-gray-900">{stats.todayAttendancePresent}</span>
                            <span className="text-gray-500 font-medium text-sm ml-2">/ {stats.todayAttendanceTotal || stats.totalStudents} Present</span>
                        </div>
                        <div className="w-32 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div 
                                className="bg-yellow-400 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${(stats.todayAttendanceTotal || stats.totalStudents) > 0 ? Math.min(Math.round((stats.todayAttendancePresent / (stats.todayAttendanceTotal || stats.totalStudents)) * 100), 100) : 0}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Graphical Visualizations Row (Charts) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Fee Collection Trend */}
                    <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                Fee Collection Trend
                            </h2>
                            <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">Live Fees</span>
                        </div>

                        {monthlyFeeTrend.length > 0 ? (
                            <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2 overflow-x-auto relative">
                                <div className="absolute inset-0 border-b border-gray-100 pointer-events-none"></div>
                                {monthlyFeeTrend.map((item, idx) => {
                                    const heightPct = Math.max(Math.round((item.amount / maxFeeAmt) * 100), 12);
                                    return (
                                        <div key={idx} className="flex-1 min-w-[36px] flex flex-col items-center gap-2 h-full justify-end group relative z-10">
                                            <div className="text-[10px] font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded shadow-sm border border-gray-100 absolute -top-8">
                                                ₹{item.amount.toLocaleString('en-IN')}
                                            </div>
                                            <div 
                                                style={{ height: `${heightPct}%` }} 
                                                className="w-full max-w-[40px] bg-yellow-400 rounded-t-xl transition-all duration-500 group-hover:bg-yellow-300"
                                            ></div>
                                            <span className="text-xs font-medium text-gray-500 mt-2">{item.month}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-sm font-medium bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                <HiOutlineChartBar className="w-10 h-10 text-gray-300 mb-2" />
                                No past/current fee payment records found yet.
                            </div>
                        )}
                    </div>

                    {/* Income & Expenditure Graph */}
                    <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                Income & Expenditure
                            </h2>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span> Income</span>
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-gray-900"></span> Expense</span>
                            </div>
                        </div>

                        {incomeVsExpenseTrend.length > 0 ? (
                            <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2 overflow-x-auto relative">
                                <div className="absolute inset-0 border-b border-gray-100 pointer-events-none"></div>
                                {incomeVsExpenseTrend.map((item, idx) => {
                                    const incHeight = Math.max(Math.round((item.income / maxIncExpAmt) * 100), 8);
                                    const expHeight = Math.max(Math.round((item.expense / maxIncExpAmt) * 100), 8);
                                    return (
                                        <div key={idx} className="flex-1 min-w-[40px] flex flex-col items-center gap-2 h-full justify-end group relative z-10">
                                            <div className="flex items-center gap-1 w-full justify-center h-full items-end">
                                                <div 
                                                    style={{ height: `${incHeight}%` }} 
                                                    className="w-1/2 bg-yellow-400 rounded-t-md transition-all duration-500"
                                                    title={`Income: ₹${item.income}`}
                                                ></div>
                                                <div 
                                                    style={{ height: `${expHeight}%` }} 
                                                    className="w-1/2 bg-gray-900 rounded-t-md transition-all duration-500"
                                                    title={`Expense: ₹${item.expense}`}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-medium text-gray-500 mt-2">{item.month}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-sm font-medium bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                <HiOutlineTrendingDown className="w-10 h-10 text-gray-300 mb-2" />
                                No income/expenditure records found yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Row: Class Distribution & Upcoming Birthdays */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between lg:col-span-2">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    Class Strength Distribution
                                </h2>
                                <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">Breakdown</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2">
                                {classDistribution.length > 0 ? (
                                    classDistribution.map((item, i) => (
                                        <div key={i} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-yellow-400/50 transition-colors">
                                            <div className="flex justify-between items-center mb-2.5">
                                                <span className="font-bold text-sm text-gray-800">Class {item.grade}</span>
                                                <span className="text-sm font-bold text-gray-900">{item.count} <span className="text-gray-400 font-medium">({item.percentage}%)</span></span>
                                            </div>
                                            <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                                                <div className="bg-yellow-400 h-full rounded-full transition-all duration-500" style={{ width: `${item.percentage}%` }}></div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-2 text-center py-12 text-gray-400 text-sm font-medium">
                                        No student data available.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.04)] border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                Upcoming Birthdays
                            </h2>
                        </div>
                        
                        <div className="space-y-3">
                            {bdays.length > 0 ? bdays.map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-yellow-50/50 rounded-2xl transition-colors border border-gray-100">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-11 h-11 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold text-lg">
                                            {s.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{s.name}</p>
                                            <p className="text-xs font-medium text-gray-500 mt-0.5">Class {s.grade}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-gray-900 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                                        {new Date(s.nextBirthday).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-400 text-sm font-medium">
                                    No upcoming birthdays found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <AttendanceListModal 
                isOpen={isAttendanceModalOpen}
                onClose={() => setIsAttendanceModalOpen(false)}
                attendanceRecords={todayAttendanceData}
                students={allStudents}
                classes={availableClasses}
            />
        </div>
    );
}