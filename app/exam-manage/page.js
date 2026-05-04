'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot, collection, getDocs, writeBatch } from 'firebase/firestore';
import { 
    HiOutlineDocumentAdd, 
    HiOutlineClock, 
    HiOutlinePencil, 
    HiOutlineChartBar,
    HiChevronRight,
    HiOutlineDatabase,
    HiOutlineEye,
    HiOutlineIdentification, // Icon for Roll Number
    HiOutlineRefresh
} from 'react-icons/hi';

// --- Components ---
import ExamDefinitionAndAssignment from '../components/ExamDefinitionAndAssignment';
import TimeTableCreator from '../components/TimeTableCreator'; 
import MarksEntry from '../components/MarkEntry';               
import DocumentGenerator from '../components/DocumentSelector'; 
import ResultReleasePortal from '../components/ResultReleasePortal.jsx';

const VIEWS = {
    ASSIGNMENT: { id: 'ASSIGNMENT', label: 'Define & Assign', icon: HiOutlineDocumentAdd, color: 'purple' },
    TIMETABLE: { id: 'TIMETABLE', label: 'Time Table', icon: HiOutlineClock, color: 'amber' },
    MARKS_ENTRY: { id: 'MARKS_ENTRY', label: 'Marks Entry', icon: HiOutlinePencil, color: 'emerald' },
    GENERATE: { id: 'GENERATE', label: 'Finalize & Print', icon: HiOutlineChartBar, color: 'indigo' },
    RELEASE: { id: 'RELEASE', label: 'Result Control', icon: HiOutlineEye, color: 'rose' },
};

// Roll Number Starting Points Mapping
const CLASS_ROLL_START = {
    'LKG': 101, 'UKG': 201, 'PREP': 301,
    '1': 401, '2': 501, '3': 601, '4': 701, '5': 801,
    '6': 901, '7': 1001, '8': 1101, '9': 1201, '10': 1301,
    '11': 1401, '12': 1501
};

function ExamManagementPage() {
    const [currentView, setCurrentView] = useState(VIEWS.ASSIGNMENT.id);
    const [activeSession, setActiveSession] = useState(null);
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'config', 'settings'), (docSnap) => {
            if (docSnap.exists()) {
                setActiveSession(docSnap.data().activeSession);
            }
        });
        return () => unsub();
    }, []);

    // --- Roll Number Assignment Logic ---
    const handleAssignRollNumbers = async () => {
        if (!activeSession) return;
        const confirmAction = window.confirm("This will overwrite existing roll numbers for ALL students in alphabetical order. Continue?");
        if (!confirmAction) return;

        setIsAssigning(true);
        try {
            const studentsRef = collection(db, 'sessions', activeSession, 'students');
            const snapshot = await getDocs(studentsRef);
            
            if (snapshot.empty) {
                alert("No students found in this session.");
                return;
            }

            // 1. Group students by class
            const studentsByClass = {};
            snapshot.docs.forEach(docSnap => {
                const data = docSnap.data();
                const className = data.grade?.toString().toUpperCase() || 'UNKNOWN';
                if (!studentsByClass[className]) studentsByClass[className] = [];
                studentsByClass[className].push({ id: docSnap.id, name: data.name || 'Unnamed' });
            });

            const batch = writeBatch(db);

            // 2. Sort classes and assign roll numbers
            Object.keys(studentsByClass).forEach(className => {
                const startRange = CLASS_ROLL_START[className];
                if (!startRange) return; // Skip classes not defined in mapping

                // Sort alphabetically by name
                const sortedList = studentsByClass[className].sort((a, b) => 
                    a.name.localeCompare(b.name)
                );

                // Assign roll numbers starting from range
                sortedList.forEach((student, index) => {
                    const newRollNumber = startRange + index;
                    const studentDocRef = doc(db, 'sessions', activeSession, 'students', student.id);
                    batch.update(studentDocRef, { rollNumber: newRollNumber });
                });
            });

            await batch.commit();
            alert("Roll numbers assigned successfully based on alphabetical order!");
        } catch (error) {
            console.error("Roll Number Assignment Error:", error);
            alert("Failed to assign roll numbers.");
        } finally {
            setIsAssigning(false);
        }
    };

    const renderContent = () => {
        switch (currentView) {
            case VIEWS.TIMETABLE.id: 
                return <TimeTableCreator isModal={false} activeSession={activeSession} />; 
            case VIEWS.MARKS_ENTRY.id: 
                return <MarksEntry activeSession={activeSession} />;
            case VIEWS.GENERATE.id: 
                return <DocumentGenerator activeSession={activeSession} />;
            case VIEWS.RELEASE.id: 
                return <ResultReleasePortal activeSession={activeSession} />;
            default: 
                return <ExamDefinitionAndAssignment activeSession={activeSession} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center justify-between w-full md:w-auto">
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

                        {/* Assign Roll Number Button (Mobile only visible if needed, otherwise hidden in flex) */}
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4">
                        {/* THE NEW ASSIGN ROLL NUMBER BUTTON */}
                        <button
                            onClick={handleAssignRollNumbers}
                            disabled={isAssigning || !activeSession}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                        >
                            {isAssigning ? (
                                <HiOutlineRefresh className="w-4 h-4 animate-spin" />
                            ) : (
                                <HiOutlineIdentification className="w-4 h-4" />
                            )}
                            {isAssigning ? 'ASSIGNING...' : 'AUTO ROLL NO'}
                        </button>

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