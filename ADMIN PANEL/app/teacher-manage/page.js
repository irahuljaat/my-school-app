'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { 
    HiOutlineUsers, 
    HiOutlineUserAdd, 
    HiOutlineCalendar, 
    HiOutlineCurrencyRupee,
    HiOutlineArrowLeft,
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
import { useColors } from '../components/ColorComponent';

const VIEWS = {
    LIST: 'LIST',
    ADD: 'ADD',
    ATTENDANCE: 'ATTENDANCE',
    SALARY: 'SALARY',
    VIEW_PRINT: 'VIEW_PRINT', 
    EDIT: 'EDIT',              
};

export default function TeacherManagePage() {
    const colors = useColors();

    const [currentView, setCurrentView] = useState(VIEWS.LIST);
    const [selectedTeacher, setSelectedTeacher] = useState(null); 
    const [activeSession, setActiveSession] = useState(null);
    const [isPending, startTransition] = useTransition();
    
    // State to track the search input
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'config', 'settings'), (doc) => {
            if (doc.exists()) {
                setActiveSession(doc.data().activeSession);
            }
        });
        return () => unsub();
    }, []);

    const handleViewChange = (newView, teacher = null) => {
        startTransition(() => {
            setSelectedTeacher(teacher);
            setCurrentView(newView);
        });
    };

    const renderContent = () => {
        switch (currentView) {
            case VIEWS.ADD:
                return <AddTeacherForm onSuccess={() => handleViewChange(VIEWS.LIST)} />; 
            case VIEWS.EDIT:
                if (!selectedTeacher) return <ErrorMessage message="Teacher data missing." onReset={() => handleViewChange(VIEWS.LIST)} colors={colors} />;
                return <TeacherEditForm teacherData={selectedTeacher} onSuccess={() => {
                    handleViewChange(VIEWS.LIST); 
                }} onCancel={() => handleViewChange(VIEWS.LIST)} />;
            case VIEWS.VIEW_PRINT:
                if (!selectedTeacher) return <ErrorMessage message="Teacher data missing." onReset={() => handleViewChange(VIEWS.LIST)} colors={colors} />;
                return <TeacherViewPrint teacherData={selectedTeacher} onClose={() => {
                    handleViewChange(VIEWS.LIST); 
                }} />;
            case VIEWS.ATTENDANCE:
                return <TeacherAttendance activeSession={activeSession} />;
            case VIEWS.SALARY:
                return <SalaryManagement activeSession={activeSession} />;
            case VIEWS.LIST:
            default:
                return (
                    <TeacherList 
                        setCurrentView={(v) => handleViewChange(v)} 
                        setSelectedTeacher={(t) => setSelectedTeacher(t)} 
                        searchTerm={searchTerm} 
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
        <div 
            className="min-h-screen relative p-6 lg:p-10 font-sans transition-colors duration-300 overflow-hidden" 
            style={{ backgroundColor: colors.background }}
        >
            {/* Background Decorative Graphic Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none opacity-10 blur-3xl -mr-20 -mt-20" style={{ backgroundColor: colors.primary }}></div>
            <div className="absolute bottom-10 left-0 w-72 h-72 rounded-full pointer-events-none opacity-5 blur-2xl -ml-20" style={{ backgroundColor: colors.primary }}></div>

            <div className="max-w-[1440px] mx-auto relative z-10">
                
                {/* Header Card */}
                <div 
                    className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-6 md:p-8 rounded-[28px] shadow-sm border border-slate-100 transition-colors duration-300 relative overflow-hidden mb-8"
                    style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                >
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <HiOutlineHome className="mb-0.5" style={{ color: colors.primary }} /> 
                            <span>Home</span> <span className="opacity-30">/</span> <span style={{ color: colors.primary }}>Staff Portal</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase" style={{ color: colors.text }}>
                            Teacher <span style={{ color: colors.primary }}>Hub</span>
                        </h1>
                        {activeSession && (
                            <div 
                                className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border shadow-sm"
                                style={{ backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30` }}
                            >
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: colors.text }}>
                                    {activeSession} Session Active
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Navigation Bar - Floating Pill */}
                    {!isInternalView && (
                        <nav className="flex p-1.5 rounded-full border border-slate-200 shadow-sm bg-slate-50/80">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleViewChange(item.id)}
                                    style={
                                        currentView === item.id 
                                            ? { backgroundColor: colors.primary, color: colors.text === '#0f172a' ? '#ffffff' : colors.text }
                                            : { color: colors.text }
                                    }
                                    className={`flex items-center px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-150 ${
                                        currentView !== item.id ? 'hover:bg-slate-200/60 text-slate-600' : 'shadow-md'
                                    }`}
                                >
                                    <item.icon className="w-4 h-4 mr-2" />
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    )}

                    {isInternalView && (
                        <button 
                            onClick={() => handleViewChange(VIEWS.LIST)}
                            style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                            className="flex items-center px-8 py-3.5 border border-slate-200 rounded-full text-[11px] font-black uppercase tracking-widest hover:border-slate-300 transition-all shadow-sm active:scale-95"
                        >
                            <HiOutlineArrowLeft className="w-4 h-4 mr-2" style={{ color: colors.primary }} />
                            Return to Hub
                        </button>
                    )}
                </div>

                {/* Main Content Container */}
                <div 
                    className="rounded-[28px] shadow-sm border border-slate-100 overflow-hidden relative p-6 lg:p-10 transition-colors duration-300"
                    style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                >
                    <div className={`relative z-10 transition-opacity duration-150 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
}

const ErrorMessage = ({ message, onReset, colors }) => (
    <div className="flex flex-col items-center justify-center h-[500px] text-center">
        <div 
            className="w-24 h-24 rounded-[28px] flex items-center justify-center mb-8 shadow-sm border border-slate-200"
            style={{ backgroundColor: colors?.cardBackground || '#ffffff', color: '#f43f5e' }}
        >
            <HiOutlineUsers className="w-10 h-10" />
        </div>
        <p className="text-2xl font-black uppercase tracking-tight mb-2" style={{ color: colors?.text }}>{message}</p>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">An error occurred while fetching the directory</p>
        <button 
            onClick={onReset} 
            style={{ backgroundColor: colors?.primary || '#0d9488', color: '#ffffff' }}
            className="px-10 py-4 rounded-full font-black text-[11px] uppercase tracking-[0.2em] hover:opacity-95 transition-all shadow-md active:scale-95"
        >
            Return to Directory
        </button>
    </div>
);