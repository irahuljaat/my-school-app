'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { 
    HiOutlineCake, 
    HiOutlineChatAlt2, 
    HiOutlineUsers, 
    HiOutlineHome,
    HiOutlineArrowLeft
} from 'react-icons/hi';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useColors } from '../components/ColorComponent';

const VIEWS = {
    UPCOMING: 'UPCOMING',
    TEMPLATE: 'TEMPLATE',
};

export default function BirthdayManagerPage() {
    const colors = useColors();

    const [currentView, setCurrentView] = useState(VIEWS.UPCOMING);
    const [activeSession, setActiveSession] = useState(null);
    const [isPending, startTransition] = useTransition();

    // Birthday Manager State
    const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
    const [messageTitle, setMessageTitle] = useState("🎂 Happy Birthday!");
    const [messageTemplate, setMessageTemplate] = useState("Happy Birthday, {name}! 🎉 Wishing you a wonderful year ahead filled with joy and success.");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch active session
    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'config', 'settings'), (docSnap) => {
            if (docSnap.exists()) {
                setActiveSession(docSnap.data().activeSession);
            }
        });
        return () => unsub();
    }, []);

    // Fetch template and birthdays
    useEffect(() => {
        fetchData();
    }, [activeSession]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const session = activeSession || "2026-27";

            // Fetch template title and message if saved
            const templateDoc = await getDoc(doc(db, "config", "birthdaySettings"));
            if (templateDoc.exists()) {
                const data = templateDoc.data();
                if (data.title) setMessageTitle(data.title);
                if (data.message) setMessageTemplate(data.message);
            }

            // Fetch students to check birthdays
            const studentsSnap = await getDocs(collection(db, "sessions", session, "students"));
            const today = new Date();

            let upcoming = [];
            studentsSnap.forEach(docSnap => {
                const data = docSnap.data();
                if (data.dob) {
                    const parts = data.dob.split('-');
                    if (parts.length === 3) {
                        const bMonth = parseInt(parts[1], 10);
                        const bDay = parseInt(parts[2], 10);

                        // Check if birthday is today or within the next 7 days
                        const bDateThisYear = new Date(today.getFullYear(), bMonth - 1, bDay);
                        const diffTime = bDateThisYear - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays >= 0 && diffDays <= 7) {
                            upcoming.push({
                                id: docSnap.id,
                                name: data.name || data.fullName || "Student",
                                grade: data.grade || "N/A",
                                dob: data.dob,
                                daysLeft: diffDays,
                                fcmToken: data.fcmToken
                            });
                        }
                    }
                }
            });

            // Sort by closest birthday
            upcoming.sort((a, b) => a.daysLeft - b.daysLeft);
            setUpcomingBirthdays(upcoming);
        } catch (error) {
            console.error("Error loading birthday data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTemplate = async () => {
        try {
            setSaving(true);
            await setDoc(doc(db, "config", "birthdaySettings"), {
                title: messageTitle,
                message: messageTemplate,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            alert("Birthday notification template updated successfully!");
        } catch (error) {
            console.error("Error saving template:", error);
            alert("Failed to save template.");
        } finally {
            setSaving(false);
        }
    };

    const handleViewChange = (newView) => {
        startTransition(() => {
            setCurrentView(newView);
        });
    };

    const navItems = [
        { id: VIEWS.UPCOMING, label: 'Upcoming Birthdays', icon: HiOutlineCake },
        { id: VIEWS.TEMPLATE, label: 'Template Settings', icon: HiOutlineChatAlt2 },
    ];

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
                            <span>Home</span> <span className="opacity-30">/</span> <span style={{ color: colors.primary }}>Birthday Portal</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase" style={{ color: colors.text }}>
                            Birthday <span style={{ color: colors.primary }}>Manager</span>
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
                </div>

                {/* Main Content Container */}
                <div 
                    className="rounded-[28px] shadow-sm border border-slate-100 overflow-hidden relative p-6 lg:p-10 transition-colors duration-300"
                    style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                >
                    <div className={`relative z-10 transition-opacity duration-150 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        
                        {currentView === VIEWS.UPCOMING && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-black uppercase tracking-tight" style={{ color: colors.text }}>
                                        Upcoming Birthdays (Next 7 Days)
                                    </h2>
                                </div>
                                {loading ? (
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest py-12 text-center">Loading birthdays...</p>
                                ) : upcomingBirthdays.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-slate-50 border border-slate-100 text-slate-400">
                                            <HiOutlineCake className="w-8 h-8" />
                                        </div>
                                        <p className="text-sm font-bold uppercase tracking-wider text-slate-500">No upcoming birthdays found in the next 7 days.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {upcomingBirthdays.map((student) => (
                                            <div key={student.id} className="py-4 flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-extrabold text-sm tracking-wide" style={{ color: colors.text }}>{student.name}</h3>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Grade: {student.grade} • DOB: {student.dob}</p>
                                                </div>
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                                    student.daysLeft === 0 ? 'bg-pink-100 text-pink-700 animate-pulse border border-pink-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                }`}>
                                                    {student.daysLeft === 0 ? "🎂 Today!" : `In ${student.daysLeft} day(s)`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {currentView === VIEWS.TEMPLATE && (
                            <div className="space-y-6 max-w-2xl">
                                <div>
                                    <h2 className="text-lg font-black uppercase tracking-tight mb-1" style={{ color: colors.text }}>
                                        Notification Template Settings
                                    </h2>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                        Customize the push notification title and body sent to students on their birthday. Use <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono font-black">{"{name}"}</code> as a placeholder for the student's name.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">Notification Title</label>
                                    <input
                                        type="text"
                                        className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-medium bg-slate-50/50"
                                        value={messageTitle}
                                        onChange={(e) => setMessageTitle(e.target.value)}
                                        style={{ color: colors.text }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">Notification Message Body</label>
                                    <textarea
                                        rows={4}
                                        className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-medium bg-slate-50/50"
                                        value={messageTemplate}
                                        onChange={(e) => setMessageTemplate(e.target.value)}
                                        style={{ color: colors.text }}
                                    />
                                </div>

                                <button
                                    onClick={handleSaveTemplate}
                                    disabled={saving}
                                    style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                                    className="px-8 py-3.5 rounded-full font-black text-[11px] uppercase tracking-[0.2em] hover:opacity-95 transition-all shadow-md active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save Template"}
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}