'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../firebase/config';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { useColors } from '../components/ColorComponent';
import { 
  HiOutlineCalendar, HiOutlineArrowLeft, HiOutlineCheckCircle, 
  HiOutlineXCircle, HiOutlineClock, HiOutlineShieldCheck 
} from 'react-icons/hi';

export default function StudentAttendancePage() {
  const colors = useColors();
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [activeSession, setActiveSession] = useState('2026-27');
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { "2026-06-05": "present", ... }
  const [loading, setLoading] = useState(true);
  
  // School Amber/Yellow Theme Accent matching Dashboard
  const primaryThemeColor = '#EAB308';
  
  // Calendar navigation state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-11
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const sessionData = localStorage.getItem('studentSession');
    if (!sessionData) {
      router.replace('/studentlogin');
      return;
    }
    const parsedStudent = JSON.parse(sessionData);
    setStudent(parsedStudent);

    const fetchAttendance = async () => {
      try {
        // Get active session configuration if available
        const settingsSnap = await getDoc(doc(db, 'config', 'settings'));
        let session = '2026-27';
        if (settingsSnap.exists() && settingsSnap.data().activeSession) {
          session = settingsSnap.data().activeSession;
          setActiveSession(session);
        }

        // Fetch attendance documents from sessions/{activeSession}/attendance
        const attendanceRef = collection(db, 'sessions', session, 'attendance');
        const querySnapshot = await getDocs(attendanceRef);

        const recordsMap = {};
        const studentUniqueId = parsedStudent.id || parsedStudent.loginDetails?.id;
        const internalDocId = parsedStudent.id; // e.g. S2005_UKG_1784437878864

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const docDate = data.date; // e.g., "2026-06-05"
          const records = data.records || {};

          // Check if student exists in this date's records
          if (internalDocId && records[internalDocId]) {
            recordsMap[docDate] = records[internalDocId].toLowerCase();
          } else if (studentUniqueId) {
            // Fallback search inside records object keys
            Object.keys(records).forEach((key) => {
              if (key.includes(studentUniqueId) || key === internalDocId) {
                recordsMap[docDate] = records[key].toLowerCase();
              }
            });
          }
        });

        setAttendanceRecords(recordsMap);
      } catch (err) {
        console.error('Error fetching attendance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-white font-bold tracking-widest uppercase">
        Loading Attendance Records...
      </div>
    );
  }

  // Format today's date string matching Firestore format (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysStatus = attendanceRecords[todayStr] || 'Not Marked';

  // Calculate monthly stats
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalRecorded = 0;

  Object.keys(attendanceRecords).forEach((dateKey) => {
    const [year, month] = dateKey.split('-').map(Number);
    if (month - 1 === currentMonth && year === currentYear) {
      totalRecorded++;
      if (attendanceRecords[dateKey] === 'present') totalPresent++;
      if (attendanceRecords[dateKey] === 'absent') totalAbsent++;
    }
  });

  const attendancePercentage = totalRecorded > 0 ? ((totalPresent / totalRecorded) * 100).toFixed(1) : '100';

  // Calendar generation helpers
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden bg-slate-950 text-slate-100 transition-colors duration-500">
      
      {/* Background Glow Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[140px] opacity-10 pointer-events-none -mr-20 -mt-20" style={{ backgroundColor: primaryThemeColor }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[140px] opacity-10 pointer-events-none -ml-20 -mb-20" style={{ backgroundColor: primaryThemeColor }} />

      <div className="max-w-[1200px] mx-auto relative z-10 space-y-6">
        
        {/* HEADER */}
        <header className="rounded-[28px] border border-slate-800 shadow-xl p-5 sm:p-6 bg-slate-900/90 backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] opacity-10 pointer-events-none" style={{ backgroundColor: primaryThemeColor }} />

          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xl transition shadow-sm cursor-pointer border border-slate-700"
            >
              <HiOutlineArrowLeft />
            </button>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500 block">
                Academic Session: {activeSession}
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                Attendance Portal
              </h1>
            </div>
          </div>

          <div className="px-3.5 py-2 bg-slate-800/80 rounded-2xl flex items-center gap-2 border border-slate-700">
            <HiOutlineCalendar className="text-yellow-400 text-base" />
            <span className="text-xs font-bold text-slate-200 uppercase">
              {student?.name || "Student"} <span className="text-slate-400">({student?.class || "Class"})</span>
            </span>
          </div>
        </header>

        {/* TOP STATS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          
          {/* Today's Status Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Today's Status</span>
              <h3 className={`text-base sm:text-lg font-black uppercase mt-1 ${
                todaysStatus === 'present' ? 'text-emerald-400' : todaysStatus === 'absent' ? 'text-rose-400' : 'text-amber-400'
              }`}>
                {todaysStatus}
              </h3>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-inner border ${
              todaysStatus === 'present' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : todaysStatus === 'absent' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {todaysStatus === 'present' ? <HiOutlineCheckCircle /> : todaysStatus === 'absent' ? <HiOutlineXCircle /> : <HiOutlineClock />}
            </div>
          </div>

          {/* Monthly Present Count */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">{monthNames[currentMonth]} Presents</span>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">{totalPresent} <span className="text-xs font-semibold text-slate-400">Days</span></h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center text-xl shadow-inner">
              <HiOutlineShieldCheck />
            </div>
          </div>

          {/* Monthly Percentage */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Monthly Rate</span>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">{attendancePercentage}%</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-xl shadow-inner">
              <HiOutlineCalendar />
            </div>
          </div>

        </div>

        {/* ATTENDANCE CALENDAR CONTAINER */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-[28px] p-5 sm:p-7 shadow-xl border border-slate-800 space-y-6">
          
          {/* Calendar Month Selector Header */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Interactive monthly circular attendance log</p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={prevMonth}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-black text-xs uppercase transition cursor-pointer border border-slate-700"
              >
                Prev
              </button>
              <button 
                onClick={nextMonth}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-black text-xs uppercase transition cursor-pointer border border-slate-700"
              >
                Next
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 flex-wrap pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm" />
              <span className="text-[10px] font-black uppercase text-slate-400">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-sm" />
              <span className="text-[10px] font-black uppercase text-slate-400">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-slate-800 shadow-sm border border-slate-700" />
              <span className="text-[10px] font-black uppercase text-slate-400">No Record / Holiday</span>
            </div>
          </div>

          {/* Days of the Week Header */}
          <div className="grid grid-cols-7 gap-2 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
              <div key={idx} className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Circular Days Grid */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3 py-2">
            {/* Empty slots for starting offset */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square rounded-full bg-transparent border border-transparent" />
            ))}

            {/* Actual Days */}
            {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const formattedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
              const formattedMonth = (currentMonth + 1) < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
              const dateKey = `${currentYear}-${formattedMonth}-${formattedDay}`;
              
              const status = attendanceRecords[dateKey]; // "present", "absent", or undefined

              let circleStyle = "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700";
              let badgeIndicator = null;

              if (status === 'present') {
                circleStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-black shadow-lg shadow-emerald-950/30 ring-2 ring-emerald-500/30";
                badgeIndicator = <span className="absolute -bottom-0.5 text-[8px] bg-emerald-500 text-slate-950 font-black px-1 rounded-full uppercase">P</span>;
              } else if (status === 'absent') {
                circleStyle = "bg-rose-500/20 border-rose-500 text-rose-400 font-black shadow-lg shadow-rose-950/30 ring-2 ring-rose-500/30";
                badgeIndicator = <span className="absolute -bottom-0.5 text-[8px] bg-rose-500 text-white font-black px-1 rounded-full uppercase">A</span>;
              }

              return (
                <div 
                  key={dayNum}
                  className="flex flex-col items-center justify-center relative py-1"
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${circleStyle}`}>
                    {dayNum}
                  </div>
                  {badgeIndicator}
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
}