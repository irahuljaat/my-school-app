'use client';

import React, { useState, useEffect } from 'react'; // Added useEffect
import { 
    HiOutlineUsers, 
    HiOutlineUserAdd, 
    HiOutlineCalendar, 
    HiOutlineCurrencyRupee,
    HiOutlineArrowLeft,
    HiOutlineDatabase
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

    // Fetch the active session from settings
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
                // Pass activeSession so attendance is marked for the right year
                return <TeacherAttendance activeSession={activeSession} />;

            case VIEWS.SALARY:
                // Pass activeSession so payroll is calculated for the right year
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
        { id: VIEWS.LIST, label: 'Directory', icon: HiOutlineUsers },
        { id: VIEWS.ADD, label: 'Add Teacher', icon: HiOutlineUserAdd },
        { id: VIEWS.ATTENDANCE, label: 'Attendance', icon: HiOutlineCalendar },
        { id: VIEWS.SALARY, label: 'Payroll', icon: HiOutlineCurrencyRupee },
    ];

    const isInternalView = currentView === VIEWS.VIEW_PRINT || currentView === VIEWS.EDIT;

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans">
            <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            Staff <span className="text-indigo-600">Portal</span>
                        </h1>
                        {activeSession && (
                            <span className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black border border-indigo-100 uppercase tracking-widest mt-2">
                                <HiOutlineDatabase className="w-3 h-3"/> {activeSession}
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 font-medium mt-1">Manage educators, attendance, and payroll records.</p>
                </div>

                {!isInternalView && (
                    <div className="flex bg-white p-1.5 rounded-[2rem] shadow-sm border border-slate-200 overflow-x-auto">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setCurrentView(item.id);
                                    setSelectedTeacher(null); 
                                }}
                                className={`flex items-center px-6 py-2.5 rounded-[1.5rem] text-xs font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${
                                    currentView === item.id 
                                    ? 'bg-slate-900 text-white shadow-lg' 
                                    : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                                }`}
                            >
                                <item.icon className={`w-4 h-4 mr-2 ${currentView === item.id ? 'text-indigo-400' : ''}`} />
                                {item.label}
                            </button>
                        ))}
                    </div>
                )}

                {isInternalView && (
                    <button 
                        onClick={() => setCurrentView(VIEWS.LIST)}
                        className="flex items-center px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <HiOutlineArrowLeft className="w-4 h-4 mr-2" />
                        Back to List
                    </button>
                )}
            </div>
            
            <div className="max-w-7xl mx-auto">
                <div className={`bg-white min-h-[600px] rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden ${isInternalView ? '' : 'p-8'}`}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

const ErrorMessage = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <HiOutlineUsers className="w-8 h-8" />
        </div>
        <p className="text-slate-800 font-bold">{message}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-indigo-600 font-black text-xs uppercase underline">Reload Page</button>
    </div>
);