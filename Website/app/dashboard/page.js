'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useColors } from '../components/ColorComponent';
import { 
  HiOutlineCalendar, HiOutlineBookOpen, HiOutlineBell, 
  HiOutlineClipboardCheck, HiOutlineDocumentText, HiOutlinePhotograph, 
  HiOutlinePaperAirplane, HiOutlineChatAlt2, HiOutlineLogout, 
  HiOutlineUserCircle, HiOutlineCheckCircle, HiOutlineClock,
  HiOutlineMenuAlt2, HiOutlineX, HiOutlineHome, HiOutlineSparkles,
  HiOutlineAcademicCap, HiOutlineChartBar, HiOutlineSpeakerphone
} from 'react-icons/hi';

export default function StudentDashboard() {
  const colors = useColors();
  const router = useRouter();

  const [student, setStudent] = useState({ name: 'Student', id: 'MVG-STUDENT' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // School Amber/Yellow Theme Accent
  const primaryThemeColor = '#EAB308';

  useEffect(() => {
    try {
      const sessionData = localStorage.getItem('studentSession');
      if (sessionData) {
        const parsedData = JSON.parse(sessionData);
        setStudent({
          name: parsedData.name || parsedData.studentName || parsedData.loginDetails?.name || 'Student',
          id: parsedData.id || parsedData.loginDetails?.id || 'MVG-STUDENT',
          ...parsedData
        });
      }
    } catch (e) {
      console.error('Session load error:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('studentSession');
    document.cookie = "user_session=; path=/; max-age=0"; // Clear middleware session cookie
    window.location.href = '/login';
  };

  const dashboardFeatures = [
    { title: 'Attendance', desc: 'Monthly records', icon: <HiOutlineCalendar />, route: '/stattendance', bg: 'bg-amber-500/10', text: 'text-amber-400' },
    { title: 'Daily Diary', desc: 'Homework & updates', icon: <HiOutlineBookOpen />, route: '/hmwrk', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
    { title: 'School Notices', desc: 'Circulars & alerts', icon: <HiOutlineSpeakerphone />, route: '/notices', bg: 'bg-orange-500/10', text: 'text-orange-400' },
    { title: 'Class Test Marks', desc: 'Assessment scores', icon: <HiOutlineChartBar />, route: '/marks', bg: 'bg-amber-500/10', text: 'text-amber-400' },
    { title: 'Syllabus', desc: 'Curriculum plans', icon: <HiOutlineDocumentText />, route: '/syllabus', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
    { title: 'Exam Results', desc: 'Term reports', icon: <HiOutlineAcademicCap />, route: '/results', bg: 'bg-orange-500/10', text: 'text-orange-400' },
    { title: 'School Gallery', desc: 'Campus memories', icon: <HiOutlinePhotograph />, route: '/stgallery', bg: 'bg-amber-500/10', text: 'text-amber-400' },
    { title: 'Apply Leave', desc: 'Absence approval', icon: <HiOutlinePaperAirplane />, route: '/leave', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
    { title: 'Teacher Query', desc: 'Connect & feedback', icon: <HiOutlineChatAlt2 />, route: '/feedback', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  ];

  if (!isLoaded) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-white font-bold tracking-widest uppercase">
        Loading Student Portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-sans relative overflow-hidden bg-slate-950 text-slate-100 transition-colors duration-500">
      
      {/* Background Glow Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[140px] opacity-10 pointer-events-none -mr-20 -mt-20" style={{ backgroundColor: primaryThemeColor }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[140px] opacity-10 pointer-events-none -ml-20 -mb-20" style={{ backgroundColor: primaryThemeColor }} />

      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden" />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900/90 backdrop-blur-2xl border-r border-slate-800 p-5 flex flex-col justify-between transition-transform duration-300 shadow-2xl lg:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-950 text-xl font-black shadow-lg" style={{ backgroundColor: primaryThemeColor }}>
                <HiOutlineAcademicCap />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500 block">MVG Public</span>
                <h2 className="text-sm font-black text-white uppercase">Student Portal</h2>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1">
              <HiOutlineX className="text-xl" />
            </button>
          </div>

          <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
            <button
              onClick={() => { router.push('/dashboard'); setIsSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shadow-xs"
            >
              <HiOutlineHome className="text-lg" />
              Dashboard Home
            </button>

            {dashboardFeatures.map((item, idx) => (
              <button
                key={idx}
                onClick={() => { router.push(item.route); setIsSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-400 hover:bg-slate-800/60 hover:text-white transition text-left"
              >
                <span className={`text-base p-1.5 rounded-xl ${item.bg} ${item.text}`}>{item.icon}</span>
                <span className="truncate">{item.title}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full group px-4 py-3 bg-slate-800/40 hover:bg-rose-950/40 hover:text-rose-400 text-slate-300 rounded-2xl font-black uppercase text-xs tracking-wider flex items-center gap-3 transition cursor-pointer border border-slate-800"
          >
            <HiOutlineLogout className="text-lg group-hover:-translate-x-0.5 transition-transform" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="lg:hidden sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-5 py-3.5 flex items-center justify-between">
          <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center text-xl cursor-pointer">
            <HiOutlineMenuAlt2 />
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-yellow-400">MVG Student App</span>
          <div className="w-10" />
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto space-y-6 relative z-10">
          
          {/* Profile Card (App Header Style) */}
          <div className="rounded-[28px] border border-slate-800 shadow-xl p-5 sm:p-6 bg-slate-900/90 backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] opacity-10 pointer-events-none" style={{ backgroundColor: primaryThemeColor }} />
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-slate-950 text-2xl font-black shadow-lg shrink-0" style={{ backgroundColor: primaryThemeColor }}>
                <HiOutlineUserCircle className="text-3xl" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] font-black uppercase tracking-widest mb-1 border border-yellow-500/20">
                  <HiOutlineSparkles /> Verified Student
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                  {student.name}
                </h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-lg uppercase tracking-widest border border-slate-700">
                    ID: {student.id}
                  </span>
                  <span className="px-2.5 py-0.5 text-slate-950 text-[10px] font-black rounded-lg uppercase tracking-widest" style={{ backgroundColor: primaryThemeColor }}>
                    Session 2026-27
                  </span>
                </div>
              </div>
            </div>

            <button onClick={handleLogout} className="hidden sm:flex group px-4 py-2.5 bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-300 rounded-xl font-black uppercase text-[11px] tracking-widest items-center gap-2 transition cursor-pointer border border-slate-700">
              <HiOutlineLogout className="text-base group-hover:-translate-x-0.5 transition-transform" />
              Sign Out
            </button>
          </div>

          {/* Quick Metrics Bar (Mobile app widget style) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg shrink-0 border border-emerald-500/20">
                <HiOutlineCheckCircle />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Attendance</span>
                <h3 className="text-base font-black text-white">96.5% <span className="text-[10px] text-emerald-400 font-semibold">Regular</span></h3>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center text-lg shrink-0 border border-yellow-500/20">
                <HiOutlineClipboardCheck />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Test Grade</span>
                <h3 className="text-base font-black text-white">A+ <span className="text-[10px] text-yellow-400 font-semibold">Excellence</span></h3>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center text-lg shrink-0 border border-orange-500/20">
                <HiOutlineClock />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Assignments</span>
                <h3 className="text-base font-black text-white">2 Items <span className="text-[10px] text-orange-400 font-semibold">Due Soon</span></h3>
              </div>
            </div>
          </div>

          {/* App Grid Features (Smaller, App-like Cards with Vector Icons) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">Quick Access Utilities</h2>
              <span className="text-[11px] text-slate-500 font-bold">Tap to open</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {dashboardFeatures.map((item, index) => (
                <div 
                  key={index}
                  onClick={() => router.push(item.route)}
                  className="group p-4 sm:p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-yellow-500/40 shadow-xs transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: primaryThemeColor }} />

                  <div className="flex justify-between items-start">
                    <div className={`w-11 h-11 rounded-xl ${item.bg} ${item.text} flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform`}>
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-yellow-400 transition-colors">
                      Open
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-yellow-400 transition-colors uppercase tracking-tight truncate">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium leading-tight truncate">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}