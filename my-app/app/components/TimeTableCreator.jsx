'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, doc, getDoc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { 
    HiOutlineClock, 
    HiOutlineSave, 
    HiOutlineTrash, 
    HiOutlinePlus, 
    HiOutlineCalendar, 
    HiOutlineAcademicCap, 
    HiOutlineExclamationCircle,
    HiOutlineDatabase 
} from 'react-icons/hi';

const MOCK_CLASSES = ['LKG','UKG','PREP' ,'1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const getTimeTableDocId = (examId, classes) => {
    if (!examId || classes.length === 0) return null;
    const sortedClasses = [...classes].sort((a, b) => parseInt(a) - parseInt(b));
    return `${examId}_TT_${sortedClasses.join('_')}`;
};

function TimeTableCreator({ activeSession }) { 
    const [examsList, setExamsList] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [assignedSubjects, setAssignedSubjects] = useState([]); 
    const [schedule, setSchedule] = useState([]); 
    const [newScheduleItem, setNewScheduleItem] = useState({ 
        subject: '', 
        date: '', 
        startTime: '09:00', 
        endTime: '12:00' 
    });
    
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);

    // 1. Load Exams based on Active Session
    useEffect(() => {
        const loadExams = async () => {
            if (!activeSession) return; // Keep dependency size stable
            
            setLoading(true);
            try {
                // Path points to session-specific exam definitions
                const snap = await getDocs(collection(db, 'sessions', activeSession, 'exams'));
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setExamsList(list);
                
                if (list.length > 0) {
                    setSelectedExamId(list[0].id);
                    setSelectedClasses(['10']); 
                }
            } catch (err) {
                console.error("Exam Load Error:", err);
            } finally {
                setLoading(false);
            }
        };
        loadExams();
    }, [activeSession]);

    // 2. Fetch Subjects and Existing Timetable
    const fetchData = async (examId, classes) => {
        if (!examId || classes.length === 0 || !activeSession) return;
        
        setLoading(true);
        setMessage(null);
        setSchedule([]); 

        try {
            let subjectsMap = new Map();
            for (const cls of classes) {
                const assignmentDocRef = doc(db, 'sessions', activeSession, 'examAssignments', `${examId}_${cls}`);
                const assignmentSnap = await getDoc(assignmentDocRef);
                if (assignmentSnap.exists()) {
                    assignmentSnap.data().subjects?.forEach(sub => subjectsMap.set(sub.name, sub)); 
                }
            }
            const combined = Array.from(subjectsMap.values());
            setAssignedSubjects(combined);
            
            if (combined.length === 0) {
                 setMessage({ type: 'error', text: 'No subjects assigned to these classes in this session.' });
                 setLoading(false);
                 return;
            }

            let fetchedSchedule = [];
            const exactId = getTimeTableDocId(examId, classes);
            const exactSnap = await getDoc(doc(db, 'sessions', activeSession, 'timetables', exactId));

            if (exactSnap.exists()) {
                fetchedSchedule = exactSnap.data().schedule || [];
            } else {
                const q = query(collection(db, 'sessions', activeSession, 'timetables'), where('examId', '==', examId));
                const querySnap = await getDocs(q);
                const match = querySnap.docs.find(docSnap => {
                    const savedGrades = docSnap.data().grades || [];
                    return classes.every(cls => savedGrades.includes(cls));
                });
                if (match) fetchedSchedule = match.data().schedule || [];
            }

            setSchedule(fetchedSchedule);
            const scheduledNames = fetchedSchedule.map(s => s.subject);
            const nextSub = combined.find(s => !scheduledNames.includes(s.name))?.name || '';
            setNewScheduleItem(prev => ({ ...prev, subject: nextSub }));

        } catch (error) {
            console.error("Fetch Error:", error);
            setMessage({ type: 'error', text: 'Error loading session data.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedExamId && selectedClasses.length > 0 && activeSession) {
            fetchData(selectedExamId, selectedClasses);
        }
    }, [selectedExamId, selectedClasses, activeSession]);

    // Actions
    const handleAddScheduleItem = (e) => {
        e.preventDefault();
        if (!newScheduleItem.subject || !newScheduleItem.date) return;
        if (schedule.some(item => item.date === newScheduleItem.date)) {
            setMessage({ type: 'error', text: 'Date clash detected.' });
            return;
        }
        const updated = [...schedule, newScheduleItem];
        setSchedule(updated);
        const scheduledNames = updated.map(s => s.subject);
        const nextSub = assignedSubjects.find(s => !scheduledNames.includes(s.name))?.name || '';
        setNewScheduleItem({ ...newScheduleItem, subject: nextSub });
    };

    const handleRemoveScheduleItem = (subject) => {
        setSchedule(schedule.filter(item => item.subject !== subject));
    };

    const handleSaveTimetable = async () => {
        if (!activeSession) return;
        setIsSaving(true);
        try {
            const docId = getTimeTableDocId(selectedExamId, selectedClasses);
            await setDoc(doc(db, 'sessions', activeSession, 'timetables', docId), {
                examId: selectedExamId,
                grades: selectedClasses,
                schedule: schedule,
                updatedAt: new Date().toISOString(),
            });
            setMessage({ type: 'success', text: `Timetable saved for session ${activeSession}!` });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save.' });
        } finally {
            setIsSaving(false);
        }
    };

    const sortedSchedule = [...schedule].sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-4">
            {/* Header Section */}
            <header className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center space-x-4">
                    <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
                        <HiOutlineCalendar className="text-4xl" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Exam Timetable</h1>
                        <p className="text-amber-100 font-medium opacity-90 italic">Session: {activeSession || 'Loading...'}</p>
                    </div>
                </div>
                <button 
                    onClick={handleSaveTimetable} 
                    disabled={isSaving || schedule.length === 0}
                    className="bg-white text-amber-600 px-8 py-4 rounded-2xl font-bold hover:bg-amber-50 transition-all shadow-lg flex items-center disabled:opacity-50"
                >
                    <HiOutlineSave className="mr-2 text-xl" />
                    {isSaving ? 'Processing...' : 'Publish Timetable'}
                </button>
            </header>

            {message && (
                <div className={`p-4 rounded-2xl flex items-center animate-fade-in border ${
                    message.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'
                }`}>
                    <HiOutlineExclamationCircle className="text-xl mr-3" />
                    <span className="font-bold">{message.text}</span>
                </div>
            )}

            {/* Selection Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <label className="text-xs font-black text-gray-400 uppercase mb-3 block tracking-widest">Active Examination</label>
                    <select 
                        value={selectedExamId} 
                        onChange={(e) => setSelectedExamId(e.target.value)} 
                        className="w-full p-4 bg-gray-50 rounded-2xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-amber-500 outline-none font-bold text-gray-700"
                    >
                        {examsList.length === 0 ? <option>No Exams Defined</option> : 
                         examsList.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 md:col-span-2">
                    <label className="text-xs font-black text-gray-400 uppercase mb-3 block tracking-widest">Target Classes (Hold Ctrl to select multiple)</label>
                    <select 
                        multiple 
                        value={selectedClasses} 
                        onChange={(e) => setSelectedClasses(Array.from(e.target.selectedOptions, o => o.value))}
                        className="w-full p-4 bg-gray-50 rounded-2xl border-none ring-1 ring-gray-200 h-20 outline-none font-bold text-gray-700 overflow-y-auto"
                    >
                        {MOCK_CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                    </select>
                </div>
            </div>

            {/* Entry Form */}
            <div className="bg-indigo-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <HiOutlineClock className="text-9xl text-white" />
                </div>
                <h3 className="text-white font-bold mb-6 flex items-center text-lg">
                    <HiOutlinePlus className="mr-2" /> Add New Schedule Entry
                </h3>
                <form onSubmit={handleAddScheduleItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
                    <div className="lg:col-span-2">
                        <select 
                            value={newScheduleItem.subject} 
                            onChange={(e) => setNewScheduleItem({...newScheduleItem, subject: e.target.value})} 
                            className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:bg-white focus:text-indigo-900 outline-none transition-all font-medium"
                        >
                            <option value="" className="text-gray-900">Select Subject</option>
                            {assignedSubjects.filter(as => !schedule.some(s => s.subject === as.name)).map(s => (
                                <option key={s.name} value={s.name} className="text-gray-900">{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <input 
                        type="date" 
                        value={newScheduleItem.date} 
                        onChange={(e) => setNewScheduleItem({...newScheduleItem, date: e.target.value})} 
                        className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-white focus:bg-white focus:text-indigo-900 outline-none transition-all" 
                    />
                    <div className="flex space-x-2">
                        <input 
                            type="time" 
                            value={newScheduleItem.startTime} 
                            onChange={(e) => setNewScheduleItem({...newScheduleItem, startTime: e.target.value})} 
                            className="w-1/2 p-4 rounded-2xl bg-white/10 border border-white/20 text-white focus:bg-white focus:text-indigo-900 outline-none transition-all text-sm" 
                        />
                        <input 
                            type="time" 
                            value={newScheduleItem.endTime} 
                            onChange={(e) => setNewScheduleItem({...newScheduleItem, endTime: e.target.value})} 
                            className="w-1/2 p-4 rounded-2xl bg-white/10 border border-white/20 text-white focus:bg-white focus:text-indigo-900 outline-none transition-all text-sm" 
                        />
                    </div>
                    <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-white font-black rounded-2xl transition-all shadow-lg py-4 uppercase tracking-widest text-sm">
                        Add to List
                    </button>
                </form>
            </div>

            {/* Timetable Display */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-4">
                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Current Schedule</h2>
                    <span className="bg-gray-100 text-gray-500 px-4 py-1 rounded-full text-xs font-bold uppercase">{schedule.length} Subjects Listed</span>
                </div>

                {loading ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest">Fetching Timetable...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedSchedule.map((item) => (
                            <div key={item.subject} className="group bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:border-amber-200 transition-all relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 group-hover:bg-amber-100 transition-colors"></div>
                                
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl">
                                        <HiOutlineAcademicCap className="text-2xl" />
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveScheduleItem(item.subject)} 
                                        className="text-gray-300 hover:text-red-500 transition-colors p-2"
                                    >
                                        <HiOutlineTrash className="text-xl" />
                                    </button>
                                </div>

                                <h4 className="text-xl font-black text-gray-800 mb-1 uppercase tracking-tight">{item.subject}</h4>
                                <div className="flex items-center text-gray-500 font-bold text-sm mb-4">
                                    <HiOutlineCalendar className="mr-2 text-amber-500" />
                                    {new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Duration</span>
                                        <span className="text-indigo-600 font-black tracking-tighter">{item.startTime} — {item.endTime}</span>
                                    </div>
                                    <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                                        <HiOutlineClock className="text-amber-500" />
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {sortedSchedule.length === 0 && (
                            <div className="col-span-full py-20 bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100 text-center">
                                <p className="text-gray-400 font-bold uppercase tracking-widest">No schedule entries found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TimeTableCreator;