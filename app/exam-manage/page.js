'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
    HiOutlineDocumentAdd, 
    HiOutlineClock, 
    HiOutlinePencil, 
    HiOutlineChartBar,
    HiChevronRight,
    HiOutlineDatabase,
    HiOutlineEye // Added for Result Release
} from 'react-icons/hi';

// --- Components ---
import ExamDefinitionAndAssignment from '../components/ExamDefinitionAndAssignment';
import TimeTableCreator from '../components/TimeTableCreator'; 
import MarksEntry from '../components/MarkEntry';               
import DocumentGenerator from '../components/DocumentSelector'; 
import ResultReleasePortal from '../components/ResultReleasePortal.jsx'; // NEW COMPONENT

const VIEWS = {
    ASSIGNMENT: { id: 'ASSIGNMENT', label: 'Define & Assign', icon: HiOutlineDocumentAdd, color: 'purple' },
    TIMETABLE: { id: 'TIMETABLE', label: 'Time Table', icon: HiOutlineClock, color: 'amber' },
    MARKS_ENTRY: { id: 'MARKS_ENTRY', label: 'Marks Entry', icon: HiOutlinePencil, color: 'emerald' },
    GENERATE: { id: 'GENERATE', label: 'Finalize & Print', icon: HiOutlineChartBar, color: 'indigo' },
    RELEASE: { id: 'RELEASE', label: 'Result Control', icon: HiOutlineEye, color: 'rose' }, // NEW VIEW
};

function ExamManagementPage() {
    const [currentView, setCurrentView] = useState(VIEWS.ASSIGNMENT.id);
    const [activeSession, setActiveSession] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'config', 'settings'), (docSnap) => {
            if (docSnap.exists()) {
                setActiveSession(docSnap.data().activeSession);
            }
        });
        return () => unsub();
    }, []);

    const renderContent = () => {
        switch (currentView) {
            case VIEWS.TIMETABLE.id: 
                return <TimeTableCreator isModal={false} activeSession={activeSession} />; 
            case VIEWS.MARKS_ENTRY.id: 
                return <MarksEntry activeSession={activeSession} />;
            case VIEWS.GENERATE.id: 
                return <DocumentGenerator activeSession={activeSession} />;
            case VIEWS.RELEASE.id: 
                return <ResultReleasePortal activeSession={activeSession} />; // RENDER NEW COMPONENT
            default: 
                return <ExamDefinitionAndAssignment activeSession={activeSession} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                            Exam <span className="text-indigo-600">Controller</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <HiOutlineDatabase className="w-3.5 h-3.5 text-indigo-500" />
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                                Academic Session {activeSession || 'Loading...'}
                            </p>
                        </div>
                    </div>

                    <nav className="flex items-center bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
                        {Object.values(VIEWS).map((view, index) => {
                            const Icon = view.icon;
                            const isActive = currentView === view.id;
                            return (
                                <React.Fragment key={view.id}>
                                    <button
                                        onClick={() => setCurrentView(view.id)}
                                        className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-300 whitespace-nowrap ${
                                            isActive 
                                            ? `bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 font-bold` 
                                            : `text-slate-500 hover:text-slate-700 font-medium`
                                        }`}
                                    >
                                        <Icon className={`w-5 h-5 mr-2 ${isActive ? `text-indigo-600` : ''}`} />
                                        <span className="hidden lg:inline text-sm">{view.label}</span>
                                    </button>
                                    {index < Object.values(VIEWS).length - 1 && (
                                        <HiChevronRight className="w-4 h-4 text-slate-300 mx-1 hidden lg:block" />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-8">
                <div className="flex items-center space-x-3 mb-6">
                    <div className={`p-2 rounded-lg bg-indigo-50 text-indigo-600`}>
                        {React.createElement(VIEWS[currentView].icon, { className: "w-6 h-6" })}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{VIEWS[currentView].label}</h2>
                        <p className="text-slate-500 text-sm italic">
                            {currentView === 'ASSIGNMENT' && "Configure exam types and link them to classes."}
                            {currentView === 'TIMETABLE' && "Schedule dates and times for each subject."}
                            {currentView === 'MARKS_ENTRY' && "Securely input student marks and remarks."}
                            {currentView === 'GENERATE' && "Preview and batch print official marksheets."}
                            {currentView === 'RELEASE' && "Control online visibility of student results."}
                        </p>
                    </div>
                </div>

                <main className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 min-h-[600px] overflow-hidden">
                    {!activeSession ? (
                        <div className="flex flex-col items-center justify-center h-[600px] text-slate-400 animate-pulse">
                            <HiOutlineDatabase className="w-12 h-12 mb-4" />
                            <p className="font-bold tracking-widest uppercase text-sm">Initializing Session Context...</p>
                        </div>
                    ) : (
                        <div className="p-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {renderContent()}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default ExamManagementPage;