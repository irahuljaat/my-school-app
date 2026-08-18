'use client';

import React, { useState, useEffect } from 'react';
import { 
    HiOutlineUsers, 
    HiOutlineUserAdd, 
    HiOutlineCalendar, 
    HiOutlineCurrencyRupee,
    HiOutlineArrowLeft,
    HiOutlineSearch,
    HiOutlineHome
} from 'react-icons/hi';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

// --- Import Components ---
import AddTeacherForm from '../components/AddTeacherForm';
import TeacherList from '../components/TeacherList';
import TeacherViewPrint from '../components/TeacherViewPrint'; 
import TeacherEditForm from '../components/TeacherEditForm';   
import TeacherAttendance from '../components/TeacherAttendance'; 
import SalaryManagement from '../components/SalaryManagement'; 

const VIEWS = {
    LIST: 'LIST',
    ADD: 'ADD',
    ATTENDANCE: 'ATTENDANCE',
    SALARY: 'SALARY',
    VIEW_PRINT: 'VIEW_PRINT', 
    EDIT: 'EDIT',              
};

export default function TeacherManagePage() {
    const [currentView, setCurrentView] = useState(VIEWS.LIST);
    const [selectedTeacher, setSelectedTeacher] = useState(null); 
    const [activeSession, setActiveSession] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'config', 'settings'), (doc) => {
            if (doc.exists()) {
                setActiveSession(doc.data().activeSession);
            }
        });
        return () => unsub();
    }, []);

    const renderContent = () => {
        switch (currentView) {
            case VIEWS.ADD:
                return <AddTeacherForm onSuccess={() => setCurrentView(VIEWS.LIST)} />; 
            case VIEWS.EDIT:
                if (!selectedTeacher) return <ErrorMessage message="Teacher data missing." />;
                return <TeacherEditForm teacherData={selectedTeacher} onSuccess={() => {
                    setSelectedTeacher(null); 
                    setCurrentView(VIEWS.LIST); 
                }} onCancel={() => setCurrentView(VIEWS.LIST)} />;
            case VIEWS.VIEW_PRINT:
                if (!selectedTeacher) return <ErrorMessage message="Teacher data missing." />;
                return <TeacherViewPrint teacherData={selectedTeacher} onClose={() => {
                    setSelectedTeacher(null);
                    setCurrentView(VIEWS.LIST); 
                }} />;
            case VIEWS.ATTENDANCE:
                return <TeacherAttendance activeSession={activeSession} />;
            case VIEWS.SALARY:
                return <SalaryManagement activeSession={activeSession} />;
            case VIEWS.LIST:
            default:
                return (
                    <TeacherList 
                        setCurrentView={setCurrentView} 
                        setSelectedTeacher={setSelectedTeacher} 
                    />
                );
        }
    };

    const navItems = [
        { id: VIEWS.LIST, label: 'All Teachers', icon: HiOutlineUsers },
        { id: VIEWS.ADD, label: 'Registration', icon: HiOutlineUserAdd },
        { id: VIEWS.ATTENDANCE, label: 'Attendance', icon: HiOutlineCalendar },
        { id: VIEWS.SALARY, label: 'Payroll', icon: HiOutlineCurrencyRupee },
    ];

    const isInternalView = currentView === VIEWS.VIEW_PRINT || currentView === VIEWS.EDIT;

    return (
        <div className="min-h-screen bg-[#F2F5FF] relative overflow-hidden p-4 lg:p-10 font-sans selection:bg-indigo-100">
            {/* Apple Background Accents */}
            <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-400/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed bottom-[-5%] left-[-5%] w-[600px] h-[600px] bg-purple-400/20 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-[1440px] mx-auto relative z-10">
                
                {/* Modern Apple-style Header */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                            <HiOutlineHome className="mb-0.5" /> <span>Home</span> <span className="opacity-30">/</span> <span className="text-indigo-500">Staff Portal</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-800 tracking-tighter italic uppercase">
                            Teacher <span className="text-indigo-600">Hub</span>
                        </h1>
                        {activeSession && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/50 backdrop-blur-md rounded-full border border-white/80 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{activeSession} Session Active</span>
                            </div>
                        )}
                    </div>

                    {/* Navigation Bar - Floating Glass Pill */}
                    {!isInternalView && (
                        <nav className="flex bg-white/40 backdrop-blur-3xl p-1.5 rounded-[2rem] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setCurrentView(item.id);
                                        setSelectedTeacher(null); 
                                    }}
                                    className={`flex items-center px-6 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                                        currentView === item.id 
                                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' 
                                        : 'text-slate-500 hover:text-indigo-600 hover:bg-white/60'
                                    }`}
                                >
                                    <item.icon className={`w-4 h-4 mr-2 ${currentView === item.id ? 'animate-pulse' : ''}`} />
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    )}

                    {isInternalView && (
                        <button 
                            onClick={() => setCurrentView(VIEWS.LIST)}
                            className="flex items-center px-8 py-3.5 bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-700 hover:bg-white transition-all shadow-lg active:scale-95"
                        >
                            <HiOutlineArrowLeft className="w-4 h-4 mr-2" />
                            Return to Hub
                        </button>
                    )}
                </div>

                {/* Main Content Glass Container */}
                <div className="bg-white/40 backdrop-blur-[40px] rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-white/70 overflow-hidden relative p-8 lg:p-12">
                    
                    {/* Inner Header Glow */}
                    <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-indigo-50/30 to-transparent pointer-events-none" />

                    {currentView === VIEWS.LIST && (
                        <div className="relative z-10 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200 rotate-3">
                                    <HiOutlineUsers size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 uppercase italic leading-none">Staff Roster</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Personnel Management System</p>
                                </div>
                            </div>
                            
                            {/* Search Glass Input */}
                            <div className="relative group w-full max-w-md">
                                <HiOutlineSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Search Directory..."
                                    className="w-full bg-white/50 backdrop-blur-md border border-white/80 rounded-[1.5rem] py-4 pl-14 pr-6 text-sm font-bold text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none shadow-sm"
                                />
                            </div>
                        </div>
                    )}
                    
                    <div className="relative z-10">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
}

const ErrorMessage = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-[600px] text-center">
        <div className="w-24 h-24 bg-white/60 backdrop-blur-2xl text-rose-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl border border-white animate-bounce">
            <HiOutlineUsers className="w-10 h-10" />
        </div>
        <p className="text-slate-800 text-2xl font-black uppercase italic tracking-tight mb-2">{message}</p>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">An error occurred while fetching the directory</p>
        <button 
            onClick={() => window.location.reload()} 
            className="bg-slate-800 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl active:scale-95"
        >
            Hard Reset Page
        </button>
    </div>
);