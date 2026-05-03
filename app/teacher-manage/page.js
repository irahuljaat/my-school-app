'use client';

import React, { useState, useEffect } from 'react';
import { 
    HiOutlineUsers, 
    HiOutlineUserAdd, 
    HiOutlineCalendar, 
    HiOutlineCurrencyRupee,
    HiOutlineArrowLeft,
    HiOutlineDatabase,
    HiOutlineSearch
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
        // Added font-sans for clean modern look
        <div className="min-h-screen bg-[#F8F9FD] p-6 lg:p-10 font-sans text-[#303972]">
            <div className="max-w-[1400px] mx-auto">
                
                {/* Top Header Section */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#303972] tracking-tight">
                            {currentView === VIEWS.LIST ? 'All Teachers' : 
                             currentView === VIEWS.ADD ? 'Teacher Registration' : 
                             currentView === VIEWS.ATTENDANCE ? 'Staff Attendance' : 'Payroll Management'}
                        </h1>
                        <div className="flex items-center gap-2 mt-2 text-sm font-semibold text-[#A0A3BD]">
                            <span>Home</span>
                            <span>/</span>
                            <span className="text-[#303972]">Teachers</span>
                            {activeSession && (
                                <span className="ml-4 flex items-center gap-1 bg-purple-50 text-purple-600 px-3 py-0.5 rounded-full text-[10px] border border-purple-100 uppercase tracking-widest">
                                    <HiOutlineDatabase className="w-3 h-3"/> {activeSession}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Navigation Bar matching the Spik style */}
                    {!isInternalView && (
                        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setCurrentView(item.id);
                                        setSelectedTeacher(null); 
                                    }}
                                    className={`flex items-center px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                                        currentView === item.id 
                                        ? 'bg-[#6B46C1] text-white shadow-md' 
                                        : 'text-[#A0A3BD] hover:text-[#6B46C1] hover:bg-[#F8F9FD]'
                                    }`}
                                >
                                    <item.icon className={`w-4 h-4 mr-2 ${currentView === item.id ? 'text-white' : ''}`} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {isInternalView && (
                        <button 
                            onClick={() => setCurrentView(VIEWS.LIST)}
                            className="flex items-center px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#303972] hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <HiOutlineArrowLeft className="w-4 h-4 mr-2" />
                            Back to List
                        </button>
                    )}
                </div>

                {/* Main Content Card */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[700px]">
                    {/* Interior Header for the Table Area (as seen in image) */}
                    {currentView === VIEWS.LIST && (
                        <div className="p-8 pb-0 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-[#303972]">Teachers Information</h2>
                            <div className="relative w-72">
                                <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A3BD]" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search by name or ID..."
                                    className="w-full bg-[#F8F9FD] border-none rounded-xl py-2.5 pl-12 pr-4 text-sm font-semibold text-[#303972] placeholder-[#A0A3BD] focus:ring-2 focus:ring-purple-200"
                                />
                            </div>
                        </div>
                    )}
                    
                    <div className={`${isInternalView ? '' : 'p-8'}`}>
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
}

const ErrorMessage = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-[500px] text-center">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
            <HiOutlineUsers className="w-10 h-10" />
        </div>
        <p className="text-[#303972] text-lg font-bold">{message}</p>
        <button 
            onClick={() => window.location.reload()} 
            className="mt-6 bg-[#6B46C1] text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#553C9A] transition-colors"
        >
            Reload Page
        </button>
    </div>
);