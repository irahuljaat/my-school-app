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
    HiOutlineCheckCircle,
    HiOutlinePencilAlt,
    HiOutlineX
} from 'react-icons/hi';
import { useColors } from './ColorComponent';

const MOCK_CLASSES = ['LKG','UKG','PREP' ,'1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const DEFAULT_SLOTS = [
    { id: '1', label: 'Morning Slot', start: '09:00', end: '12:00' },
    { id: '2', label: 'Mid-Day Slot', start: '10:00', end: '13:00' },
    { id: '3', label: 'Afternoon Slot', start: '13:30', end: '16:30' },
];

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
    const colors = useColors();
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

    // Shift Slot States
    const [quickSlots, setQuickSlots] = useState(DEFAULT_SLOTS);
    const [isManagingSlots, setIsManagingSlots] = useState(false);
    const [newSlot, setNewSlot] = useState({ label: '', start: '08:00', end: '11:00' });
    
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
        
        const hasOverlap = schedule.some(item => {
            if (item.date !== newScheduleItem.date) return false;
            return newScheduleItem.startTime < item.endTime && newScheduleItem.endTime > item.startTime;
        });

        if (hasOverlap) {
            setMessage({ type: 'error', text: 'An exam is already scheduled at an overlapping time on this date.' });
            return;
        }

        const updated = [...schedule, newScheduleItem];
        setSchedule(updated);
        const scheduledNames = updated.map(s => s.subject);
        const nextSub = assignedSubjects.find(s => !scheduledNames.includes(s.name))?.name || '';
        setNewScheduleItem({ ...newScheduleItem, subject: nextSub });
    };

    const handleAddSlot = (e) => {
        e.preventDefault();
        if (!newSlot.label) return;
        setQuickSlots(prev => [...prev, { ...newSlot, id: Date.now().toString() }]);
        setNewSlot({ label: '', start: '08:00', end: '11:00' });
    };

    const handleDeleteSlot = (id) => {
        setQuickSlots(prev => prev.filter(slot => slot.id !== id));
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
        <div className="max-w-[1440px] mx-auto p-6 lg:p-8 font-sans relative overflow-hidden" style={{ backgroundColor: colors.background }}>
            {/* Soft Background Decorative Blur Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-10 pointer-events-none -mr-20 -mt-20" style={{ backgroundColor: colors.primary }}></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-10 pointer-events-none -ml-20 -mb-20" style={{ backgroundColor: colors.primary }}></div>

            <div className="relative z-10 space-y-8 animate-in fade-in duration-700">
                {/* Header */}
                <div className="bg-white rounded-[28px] shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <div className="p-3 rounded-2xl text-white shadow-md" style={{ backgroundColor: colors.primary }}>
                                <HiOutlineCalendar className="w-6 h-6" />
                            </div>
                            Date Sheet Manager
                        </h1>
                        <p className="text-slate-400 font-medium mt-1 text-xs">Configure examination schedules for <span className="font-bold" style={{ color: colors.primary }}>{activeSession}</span>[cite: 11]</p>
                    </div>
                    <button 
                        onClick={handleSaveTimetable} 
                        disabled={isSaving || schedule.length === 0}
                        className="w-full lg:w-auto text-white px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ backgroundColor: colors.primary }}
                    >
                        <HiOutlineSave className="text-lg" />
                        {isSaving ? 'Saving...' : 'Publish Date Sheet'}
                    </button>
                </div>

                {message && (
                    <div className={`p-4 rounded-2xl flex items-center border animate-in slide-in-from-top-4 ${
                        message.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                        <HiOutlineExclamationCircle className="text-xl mr-3" />
                        <span className="font-bold text-xs uppercase tracking-widest">{message.text}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Configuration Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white p-6 md:p-8 rounded-[28px] shadow-sm border border-slate-100">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Select Exam Type</label>
                            <select 
                                value={selectedExamId} 
                                onChange={(e) => setSelectedExamId(e.target.value)} 
                                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-full font-bold text-xs text-slate-700 outline-none cursor-pointer transition-all"
                            >
                                {examsList.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>

                        <div className="bg-white p-6 md:p-8 rounded-[28px] shadow-sm border border-slate-100">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Target Classes</label>
                            <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {MOCK_CLASSES.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => toggleClass(c)}
                                        className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                                            selectedClasses.includes(c) 
                                            ? 'text-white shadow-md border-transparent' 
                                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                                        }`}
                                        style={selectedClasses.includes(c) ? { backgroundColor: colors.primary } : {}}
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
                        <div className="bg-slate-900 rounded-[28px] p-6 md:p-8 shadow-xl relative overflow-hidden text-white">
                            <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                                <HiOutlineViewGridAdd className="text-[12rem] text-white" />
                            </div>
                            <h3 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                <HiOutlinePlus className="text-indigo-400" /> Schedule New Subject
                            </h3>

                            {/* Quick Preset Time Slot Selection & Management */}
                            <div className="mb-6 relative z-10 bg-white/5 p-4 rounded-2xl border border-white/10">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Shift Slots:</span>
                                    <button 
                                        type="button"
                                        onClick={() => setIsManagingSlots(!isManagingSlots)}
                                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                                    >
                                        <HiOutlinePencilAlt /> {isManagingSlots ? 'Close Shifts Editor' : 'Edit Shifts'}
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {quickSlots.map((slot) => (
                                        <div key={slot.id} className="relative group">
                                            <button
                                                type="button"
                                                onClick={() => setNewScheduleItem(prev => ({ ...prev, startTime: slot.start, endTime: slot.end }))}
                                                className={`text-xs px-4 py-2 rounded-full border font-bold transition-all flex items-center gap-1 ${
                                                    newScheduleItem.startTime === slot.start && newScheduleItem.endTime === slot.end
                                                        ? 'bg-indigo-500 border-indigo-400 text-white shadow'
                                                        : 'bg-white/10 border-white/10 text-slate-300 hover:bg-white/20'
                                                }`}
                                            >
                                                {slot.label} ({slot.start} - {slot.end})
                                            </button>
                                            {isManagingSlots && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteSlot(slot.id)}
                                                    className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 text-xs shadow hover:bg-rose-600"
                                                >
                                                    <HiOutlineX />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Shift Editor Panel */}
                                {isManagingSlots && (
                                    <form onSubmit={handleAddSlot} className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-4 gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Shift Name" 
                                            value={newSlot.label} 
                                            onChange={(e) => setNewSlot({ ...newSlot, label: e.target.value })} 
                                            className="px-4 py-3 rounded-full bg-white/10 text-white text-xs border border-white/10 outline-none" 
                                        />
                                        <input 
                                            type="time" 
                                            value={newSlot.start} 
                                            onChange={(e) => setNewSlot({ ...newSlot, start: e.target.value })} 
                                            className="px-4 py-3 rounded-full bg-white/10 text-white text-xs border border-white/10 outline-none" 
                                        />
                                        <input 
                                            type="time" 
                                            value={newSlot.end} 
                                            onChange={(e) => setNewSlot({ ...newSlot, end: e.target.value })} 
                                            className="px-4 py-3 rounded-full bg-white/10 text-white text-xs border border-white/10 outline-none" 
                                        />
                                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest rounded-full py-3">
                                            Add Shift Slot
                                        </button>
                                    </form>
                                )}
                            </div>

                            <form onSubmit={handleAddScheduleItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                                <select 
                                    value={newScheduleItem.subject} 
                                    onChange={(e) => setNewScheduleItem({...newScheduleItem, subject: e.target.value})} 
                                    className="w-full px-5 py-3 rounded-full bg-white/10 border border-white/10 text-white focus:bg-white focus:text-slate-900 outline-none transition-all font-bold text-xs cursor-pointer"
                                >
                                    <option value="" className="text-slate-900">Subject</option>
                                    {assignedSubjects.filter(as => !schedule.some(s => s.subject === as.name)).map(s => (
                                        <option key={s.name} value={s.name} className="text-slate-900">{s.name}</option>
                                    ))}
                                </select>
                                <input 
                                    type="date" 
                                    value={newScheduleItem.date} 
                                    onChange={(e) => setNewScheduleItem({...newScheduleItem, date: e.target.value})} 
                                    className="w-full px-5 py-3 rounded-full bg-white/10 border border-white/10 text-white focus:bg-white focus:text-slate-900 outline-none transition-all font-bold text-xs" 
                                />
                                <div className="flex gap-2">
                                    <input type="time" value={newScheduleItem.startTime} onChange={(e) => setNewScheduleItem({...newScheduleItem, startTime: e.target.value})} className="w-1/2 px-3 py-3 rounded-full bg-white/10 border border-white/10 text-white text-xs font-bold text-center" />
                                    <input type="time" value={newScheduleItem.endTime} onChange={(e) => setNewScheduleItem({...newScheduleItem, endTime: e.target.value})} className="w-1/2 px-3 py-3 rounded-full bg-white/10 border border-white/10 text-white text-xs font-bold text-center" />
                                </div>
                                <button type="submit" className="text-white font-black rounded-full transition-all py-3 shadow-lg active:scale-95 text-xs uppercase tracking-widest" style={{ backgroundColor: colors.primary }}>
                                    Add Item
                                </button>
                            </form>
                        </div>

                        {/* Schedule Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[...schedule].sort((a,b) => new Date(a.date) - new Date(b.date)).map((item) => (
                                <div key={item.subject} className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                            <HiOutlineAcademicCap className="w-6 h-6" />
                                        </div>
                                        <button onClick={() => setSchedule(schedule.filter(i => i.subject !== item.subject))} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1">
                                            <HiOutlineTrash className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1">{item.subject}</h4>
                                    <div className="flex items-center text-slate-400 text-xs font-bold mb-4 gap-2">
                                        <HiOutlineCalendar className="text-indigo-500" />
                                        {new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-3 flex justify-between items-center border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</span>
                                        <span className="text-indigo-600 font-black text-xs uppercase">{item.startTime} - {item.endTime}</span>
                                    </div>
                                </div>
                            ))}
                            {schedule.length === 0 && (
                                <div className="col-span-full py-20 text-center bg-white rounded-[28px] border border-slate-100 shadow-sm">
                                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No entries scheduled yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #F8FAFC; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
            `}</style>
        </div>
    );
}

export default TimeTableCreator;