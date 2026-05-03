'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
    HiOutlineViewGridAdd,
    HiOutlineCheckCircle
} from 'react-icons/hi';

const MOCK_CLASSES = ['LKG','UKG','PREP' ,'1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const getTimeTableDocId = (examId, classes) => {
    if (!examId || classes.length === 0) return null;
    const sortedClasses = [...classes].sort((a, b) => {
        const numA = parseInt(a) || 0;
        const numB = parseInt(b) || 0;
        return numA - numB;
    });
    return `${examId}_TT_${sortedClasses.join('_')}`;
};

function TimeTableCreator({ activeSession }) { 
    const [examsList, setExamsList] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedClasses, setSelectedClasses] = useState(['10']);
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

    const loadExams = useCallback(async () => {
        if (!activeSession) return;
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'sessions', activeSession, 'exams'));
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setExamsList(list);
            if (list.length > 0 && !selectedExamId) setSelectedExamId(list[0].id);
        } catch (err) {
            console.error("Exam Load Error:", err);
        } finally {
            setLoading(false);
        }
    }, [activeSession, selectedExamId]);

    const fetchData = useCallback(async (examId, classes) => {
        if (!examId || classes.length === 0 || !activeSession) return;
        setLoading(true);
        setMessage(null);
        try {
            let subjectsMap = new Map();
            for (const cls of classes) {
                const docRef = doc(db, 'sessions', activeSession, 'examAssignments', `${examId}_${cls}`);
                const snap = await getDoc(docRef);
                if (snap.exists()) snap.data().subjects?.forEach(sub => subjectsMap.set(sub.name, sub)); 
            }
            const combined = Array.from(subjectsMap.values());
            setAssignedSubjects(combined);
            
            if (combined.length === 0) {
                 setMessage({ type: 'error', text: 'No subjects assigned to these classes.' });
                 setSchedule([]);
                 return;
            }

            const exactId = getTimeTableDocId(examId, classes);
            const exactSnap = await getDoc(doc(db, 'sessions', activeSession, 'timetables', exactId));
            
            let fetchedSchedule = [];
            if (exactSnap.exists()) {
                fetchedSchedule = exactSnap.data().schedule || [];
            } else {
                const q = query(collection(db, 'sessions', activeSession, 'timetables'), where('examId', '==', examId));
                const querySnap = await getDocs(q);
                const match = querySnap.docs.find(d => classes.every(cls => (d.data().grades || []).includes(cls)));
                if (match) fetchedSchedule = match.data().schedule || [];
            }

            setSchedule(fetchedSchedule);
            const scheduledNames = fetchedSchedule.map(s => s.subject);
            const nextSub = combined.find(s => !scheduledNames.includes(s.name))?.name || '';
            setNewScheduleItem(prev => ({ ...prev, subject: nextSub }));

        } catch (error) {
            setMessage({ type: 'error', text: 'Error loading timetable data.' });
        } finally {
            setLoading(false);
        }
    }, [activeSession]);

    useEffect(() => { loadExams(); }, [loadExams]);
    useEffect(() => { fetchData(selectedExamId, selectedClasses); }, [selectedExamId, selectedClasses, fetchData]);

    const handleAddScheduleItem = (e) => {
        e.preventDefault();
        if (!newScheduleItem.subject || !newScheduleItem.date) return;
        if (schedule.some(item => item.date === newScheduleItem.date)) {
            setMessage({ type: 'error', text: 'A subject is already scheduled for this date.' });
            return;
        }
        const updated = [...schedule, newScheduleItem];
        setSchedule(updated);
        const scheduledNames = updated.map(s => s.subject);
        const nextSub = assignedSubjects.find(s => !scheduledNames.includes(s.name))?.name || '';
        setNewScheduleItem({ ...newScheduleItem, subject: nextSub });
    };

    const handleSaveTimetable = async () => {
        setIsSaving(true);
        try {
            const docId = getTimeTableDocId(selectedExamId, selectedClasses);
            await setDoc(doc(db, 'sessions', activeSession, 'timetables', docId), {
                examId: selectedExamId,
                grades: selectedClasses,
                schedule: schedule,
                updatedAt: new Date().toISOString(),
            });
            setMessage({ type: 'success', text: `Timetable published successfully!` });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to publish.' });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleClass = (cls) => {
        setSelectedClasses(prev => prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-4 lg:p-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100">
                            <HiOutlineCalendar className="w-8 h-8" />
                        </div>
                        Date Sheet Manager
                    </h1>
                    <p className="text-slate-400 font-medium mt-1">Configure examination schedules for <span className="text-indigo-600 font-bold">{activeSession}</span></p>
                </div>
                <button 
                    onClick={handleSaveTimetable} 
                    disabled={isSaving || schedule.length === 0}
                    className="w-full lg:w-auto bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <HiOutlineSave className="text-xl" />
                    {isSaving ? 'Saving...' : 'Publish Date Sheet'}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl flex items-center border animate-in slide-in-from-top-4 ${
                    message.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                }`}>
                    <HiOutlineExclamationCircle className="text-xl mr-3" />
                    <span className="font-bold text-sm uppercase tracking-wide">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Configuration Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Select Exam Type</label>
                        <select 
                            value={selectedExamId} 
                            onChange={(e) => setSelectedExamId(e.target.value)} 
                            className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 outline-none"
                        >
                            {examsList.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Target Classes</label>
                        <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {MOCK_CLASSES.map(c => (
                                <button
                                    key={c}
                                    onClick={() => toggleClass(c)}
                                    className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                                        selectedClasses.includes(c) 
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                                        : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-indigo-200'
                                    }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Entry & Table Area */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Add Entry Card */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute -right-10 -bottom-10 opacity-10">
                            <HiOutlineViewGridAdd className="text-[12rem] text-white" />
                        </div>
                        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                            <HiOutlinePlus className="text-indigo-400" /> Schedule New Subject
                        </h3>
                        <form onSubmit={handleAddScheduleItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                            <select 
                                value={newScheduleItem.subject} 
                                onChange={(e) => setNewScheduleItem({...newScheduleItem, subject: e.target.value})} 
                                className="w-full p-4 rounded-xl bg-white/10 border border-white/10 text-white focus:bg-white focus:text-slate-900 outline-none transition-all font-bold text-sm"
                            >
                                <option value="">Subject</option>
                                {assignedSubjects.filter(as => !schedule.some(s => s.subject === as.name)).map(s => (
                                    <option key={s.name} value={s.name} className="text-slate-900">{s.name}</option>
                                ))}
                            </select>
                            <input 
                                type="date" 
                                value={newScheduleItem.date} 
                                onChange={(e) => setNewScheduleItem({...newScheduleItem, date: e.target.value})} 
                                className="w-full p-4 rounded-xl bg-white/10 border border-white/10 text-white focus:bg-white focus:text-slate-900 outline-none transition-all font-bold text-sm" 
                            />
                            <div className="flex gap-2">
                                <input type="time" value={newScheduleItem.startTime} onChange={(e) => setNewScheduleItem({...newScheduleItem, startTime: e.target.value})} className="w-1/2 p-4 rounded-xl bg-white/10 border border-white/10 text-white text-xs font-bold" />
                                <input type="time" value={newScheduleItem.endTime} onChange={(e) => setNewScheduleItem({...newScheduleItem, endTime: e.target.value})} className="w-1/2 p-4 rounded-xl bg-white/10 border border-white/10 text-white text-xs font-bold" />
                            </div>
                            <button type="submit" className="bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-xl transition-all py-4 shadow-lg active:scale-95">
                                Add Item
                            </button>
                        </form>
                    </div>

                    {/* Schedule Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...schedule].sort((a,b) => new Date(a.date) - new Date(b.date)).map((item) => (
                            <div key={item.subject} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                        <HiOutlineAcademicCap className="w-6 h-6" />
                                    </div>
                                    <button onClick={() => setSchedule(schedule.filter(i => i.subject !== item.subject))} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all">
                                        <HiOutlineTrash className="w-6 h-6" />
                                    </button>
                                </div>
                                <h4 className="text-lg font-black text-slate-800 uppercase mb-1">{item.subject}</h4>
                                <div className="flex items-center text-slate-400 text-xs font-bold mb-4 gap-2">
                                    <HiOutlineCalendar className="text-indigo-500" />
                                    {new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                                <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</span>
                                    <span className="text-indigo-600 font-black text-sm">{item.startTime} - {item.endTime}</span>
                                </div>
                            </div>
                        ))}
                        {schedule.length === 0 && (
                            <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No entries scheduled yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TimeTableCreator;