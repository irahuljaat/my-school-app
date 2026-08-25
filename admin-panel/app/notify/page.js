"use client";

import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/config';
import {
    collection, getDocs, doc, getDoc, setDoc, where, query, updateDoc, deleteField
} from 'firebase/firestore';
import {
    HiOutlinePaperAirplane, HiSearch, HiOutlineDesktopComputer,
    HiOutlineBell, HiX, HiOutlineCloudUpload, HiUser, HiIdentification,
    HiCheckCircle, HiExclamationCircle, HiOutlineRefresh, HiOutlineLightningBolt,
    HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineChat, HiOutlineInformationCircle,
    HiOutlineClock
} from 'react-icons/hi';
import { useColors } from '../components/ColorComponent';

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 5000);
        return () => clearTimeout(t);
    }, [onClose]);

    const styles = {
        success: { bar: 'bg-emerald-500', icon: <HiCheckCircle className="text-xl shrink-0" /> },
        error:   { bar: 'bg-red-500',     icon: <HiExclamationCircle className="text-xl shrink-0" /> },
        info:    { bar: 'bg-indigo-500',  icon: <HiOutlineInformationCircle className="text-xl shrink-0" /> },
    };
    const s = styles[type] || styles.info;

    return (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl text-white shadow-2xl text-sm font-semibold max-w-sm animate-slideup ${s.bar}`}>
            {s.icon}
            <span className="flex-1">{message}</span>
            <button onClick={onClose} className="opacity-70 hover:opacity-100 transition ml-2"><HiX /></button>
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, colorClass }) {
    return (
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm px-6 py-5 flex flex-col gap-1 transition-all hover:shadow-md">
            <p className={`text-2xl font-black ${colorClass}`}>{value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            {sub && <p className="text-[9px] text-slate-300 font-medium">{sub}</p>}
        </div>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    if (status === 'sent')
        return <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wide">Sent</span>;
    if (status === 'scheduled')
        return <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full uppercase tracking-wide">Scheduled</span>;
    if (status === 'sent_no_tokens')
        return <span className="text-[8px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full uppercase tracking-wide">No Devices</span>;
    if (status === 'failed')
        return <span className="text-[8px] font-black text-red-500 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full uppercase tracking-wide">Failed</span>;
    return <span className="text-[8px] font-black text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full uppercase tracking-wide">{status}</span>;
}

// ─── Audience Pill ────────────────────────────────────────────────────────────
const AUDIENCE = [
    { id: 'all',      label: 'Whole School', Icon: HiOutlineLightningBolt },
    { id: 'teachers', label: 'Teachers',     Icon: HiOutlineUserGroup },
    { id: 'class',    label: 'By Class',     Icon: HiOutlineAcademicCap },
    { id: 'single',   label: 'One Student',  Icon: HiUser },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NotifyPage() {
    const colors = useColors();
    const [target, setTarget]               = useState('all');
    const [activeSession, setActiveSession] = useState('');
    const [sending, setSending]             = useState(false);
    const [uploading, setUploading]         = useState(false);
    const [history, setHistory]             = useState([]);
    const [toast, setToast]                 = useState(null);

    // Scheduling States
    const [isScheduled, setIsScheduled]     = useState(false);
    const [scheduleDate, setScheduleDate]   = useState('');
    const [scheduleTime, setScheduleTime]   = useState('');

    const [teachers, setTeachers]                   = useState([]);
    const [grades, setGrades]                       = useState([]);
    const [students, setStudents]                   = useState([]);
    const [searchQuery, setSearchQuery]             = useState('');
    const [filteredStudents, setFilteredStudents]   = useState([]);
    const [selectedStudent, setSelectedStudent]     = useState(null);
    const [dropdownOpen, setDropdownOpen]           = useState(false);
    const searchRef = useRef(null);

    const [payload, setPayload] = useState({
        title: '', body: '', imageUrl: '',
        targetId: 'all', targetName: 'Whole School',
    });

    const [stats, setStats] = useState({ students: 0, teachers: 0, sent: 0, devices: 0 });

    const toast$ = (message, type = 'info') => setToast({ message, type });

    // ── Load data ──────────────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const cfgDoc = await getDoc(doc(db, "config", "settings"));
                if (!cfgDoc.exists()) return;

                const session = cfgDoc.data().activeSession;
                setActiveSession(session);

                const [stuSnap, gradesSnap, teachersSnap, noticesSnap] = await Promise.all([
                    getDocs(collection(db, "sessions", session, "students")),
                    getDocs(collection(db, "grades")),
                    getDocs(collection(db, "teachers")),
                    getDocs(collection(db, "sessions", session, "notices")),
                ]);

                const stuList = stuSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                const tchList = teachersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                setStudents(stuList);
                setGrades(gradesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                setTeachers(tchList);

                // Count active FCM devices
                const activeDevices = stuList.filter(s => s.fcmToken?.trim()).length;

                // Count sent notices
                let sentCount = 0;
                const allNotices = [];
                noticesSnap.docs.forEach(d => {
                    const data = d.data();
                    Object.keys(data).forEach(dateKey => {
                        const grp = data[dateKey];
                        if (typeof grp !== 'object') return;
                        Object.keys(grp).forEach(tsKey => {
                            const n = grp[tsKey];
                            if (n?.fcmStatus === 'sent') sentCount++;
                            allNotices.push({ id: tsKey, dateKey, ...n });
                        });
                    });
                });

                allNotices.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                setHistory(allNotices.slice(0, 10));
                setStats({ students: stuList.length, teachers: tchList.length, sent: sentCount, devices: activeDevices });

            } catch (err) {
                console.error(err);
                toast$("Failed to load data — check Firestore", "error");
            }
        })();
    }, []);

    // ── Student search filter ──────────────────────────────────────────────────
    useEffect(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q || target !== 'single') { setFilteredStudents([]); setDropdownOpen(false); return; }
        const hits = students.filter(s =>
            s.name?.toLowerCase().includes(q) ||
            s.srNo?.toString().includes(q) ||
            s.grade?.toLowerCase().includes(q)
        ).slice(0, 6);
        setFilteredStudents(hits);
        setDropdownOpen(hits.length > 0);
    }, [searchQuery, students, target]);

    // Close dropdown on outside click
    useEffect(() => {
        const fn = e => { if (searchRef.current && !searchRef.current.contains(e.target)) setDropdownOpen(false); };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, []);

    // ── Image upload ───────────────────────────────────────────────────────────
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('upload_preset', 'student_preset');
            const res = await fetch('https://api.cloudinary.com/v1_1/db6ssceun/image/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (data.secure_url) { setPayload(p => ({ ...p, imageUrl: data.secure_url })); toast$("Image uploaded", "success"); }
            else throw new Error("No URL returned");
        } catch { toast$("Image upload failed", "error"); }
        finally { setUploading(false); }
    };

    // ── Resolve tokens for chosen audience ────────────────────────────────────
    const resolveTokens = async () => {
        let tokens = [];

        if (target === 'all') {
            const snap = await getDocs(collection(db, "sessions", activeSession, "students"));
            tokens = snap.docs.map(d => d.data().fcmToken).filter(Boolean);

        } else if (target === 'class') {
            if (!payload.targetId) return [];
            const q = query(
                collection(db, "sessions", activeSession, "students"),
                where("grade", "==", payload.targetId)
            );
            const snap = await getDocs(q);
            tokens = snap.docs.map(d => d.data().fcmToken).filter(Boolean);

        } else if (target === 'single') {
            if (selectedStudent?.fcmToken) tokens = [selectedStudent.fcmToken];

        } else if (target === 'teachers') {
            if (payload.targetId === 'all') {
                tokens = teachers.map(t => t.fcmToken).filter(Boolean);
            } else {
                const tch = teachers.find(t => t.id === payload.targetId);
                if (tch?.fcmToken) tokens = [tch.fcmToken];
            }
        }

        return [...new Set(tokens.filter(t => t.trim() !== ''))];
    };

    // ── Clean up stale tokens returned by FCM ─────────────────────────────────
    const cleanStaleTokens = async (staleTokens) => {
        if (!staleTokens?.length) return;
        const snap = await getDocs(collection(db, "sessions", activeSession, "students"));
        const staleSet = new Set(staleTokens);
        await Promise.all(
            snap.docs
                .filter(d => staleSet.has(d.data().fcmToken))
                .map(d => updateDoc(d.ref, { fcmToken: deleteField() }))
        );
    };

    // ── Dispatch ───────────────────────────────────────────────────────────────
    const handleDispatch = async (e) => {
        e.preventDefault();

        if (!activeSession)                          return toast$("Session not loaded yet", "error");
        if (target === 'single' && !selectedStudent) return toast$("Select a student first", "error");
        if (target === 'class' && !payload.targetId) return toast$("Select a class first", "error");
        if (isScheduled && (!scheduleDate || !scheduleTime)) return toast$("Please select both schedule date and time", "error");

        setSending(true);
        try {
            let result = { success: 0, failure: 0, staleTokens: [] };
            let fcmStatus = 'sent';

            if (isScheduled) {
                fcmStatus = 'scheduled';
            } else {
                const tokens = await resolveTokens();

                if (tokens.length === 0) {
                    toast$("No active devices found for this audience", "error");
                    setSending(false);
                    return;
                }

                const apiRes = await fetch('/api/send-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tokens,
                        title:       payload.title,
                        body:        payload.body,
                        imageUrl:    payload.imageUrl || '',
                        targetGroup: target,
                        targetId:    payload.targetId,
                        targetName:  payload.targetName,
                    }),
                });

                result = await apiRes.json();
                if (!apiRes.ok) throw new Error(result.error || "API request failed");
                fcmStatus = result.failure === tokens.length ? 'failed' : 'sent';
            }

            // Updated customId for whole school as requested: document ID "WholeSchool"
            const customId =
                target === 'all'      ? 'WholeSchool' :
                target === 'teachers' ? `T_${payload.targetId}` :
                payload.targetId      || 'General';

            const now          = new Date();
            const dateField    = `${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}`;
            const timestampKey = String(now.getTime());
            const timeString   = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const noticeData = {
                title:        payload.title,
                body:         payload.body,
                imageUrl:     payload.imageUrl || "",
                targetGroup:  target,
                targetId:     payload.targetId,
                targetName:   payload.targetName,
                fcmStatus:    fcmStatus,
                successCount: isScheduled ? 0 : result.success,
                failureCount: isScheduled ? 0 : result.failure,
                createdAt:    timeString,
                timestamp:    Number(timestampKey),
            };

            if (isScheduled) {
                noticeData.scheduledFor = `${scheduleDate} ${scheduleTime}`;
            }

            await setDoc(
                doc(db, "sessions", activeSession, "notices", customId),
                {
                    [dateField]: {
                        [timestampKey]: noticeData
                    }
                },
                { merge: true }
            );

            if (!isScheduled && result.staleTokens?.length) {
                cleanStaleTokens(result.staleTokens).catch(console.warn);
            }

            if (isScheduled) {
                toast$(`Notice successfully scheduled for ${scheduleDate} at ${scheduleTime}`, "success");
            } else if (result.failure === 0) {
                toast$(`✓ Sent to ${result.success} device${result.success !== 1 ? 's' : ''}`, "success");
            } else {
                toast$(`Sent: ${result.success} ✓  Failed: ${result.failure} ✗`, result.success > 0 ? "info" : "error");
            }

            setStats(s => ({ ...s, sent: isScheduled ? s.sent : s.sent + 1 }));
            setHistory(prev => [{
                id: timestampKey,
                title:        payload.title,
                body:         payload.body,
                targetName:   payload.targetName,
                fcmStatus:    fcmStatus,
                successCount: isScheduled ? 0 : result.success,
                failureCount: isScheduled ? 0 : result.failure,
                createdAt:    timeString,
                timestamp:    Number(timestampKey),
            }, ...prev].slice(0, 10));

            setPayload({ title: '', body: '', imageUrl: '', targetId: 'all', targetName: 'Whole School' });
            setSelectedStudent(null);
            setSearchQuery('');
            setTarget('all');
            setIsScheduled(false);
            setScheduleDate('');
            setScheduleTime('');

        } catch (err) {
            console.error(err);
            toast$(err.message || "Dispatch failed", "error");
        } finally {
            setSending(false);
        }
    };

    // ── Target change ──────────────────────────────────────────────────────────
    const changeTarget = (t) => {
        setTarget(t);
        setSelectedStudent(null);
        setSearchQuery('');
        setDropdownOpen(false);
        setPayload(p => ({
            ...p,
            targetId:   t === 'all' ? 'all' : t === 'teachers' ? 'all' : '',
            targetName: t === 'all' ? 'Whole School' : t === 'teachers' ? 'All Teachers' : '',
        }));
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <>
            <style>{`
                @keyframes slideup { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
                .animate-slideup  { animation: slideup 0.28s ease both; }
                @keyframes fadein  { from { opacity:0; transform:translateY(6px);  } to { opacity:1; transform:translateY(0); } }
                .animate-fadein   { animation: fadein  0.22s ease both; }
                .scrollbar-hide::-webkit-scrollbar { display:none; }
                .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
            `}</style>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="max-w-[1440px] mx-auto p-6 lg:p-8 font-sans relative overflow-hidden" style={{ backgroundColor: colors.background }}>
                {/* Soft Background Decorative Blur Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-10 pointer-events-none -mr-20 -mt-20" style={{ backgroundColor: colors.primary }}></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-10 pointer-events-none -ml-20 -mb-20" style={{ backgroundColor: colors.primary }}></div>

                <div className="relative z-10 space-y-8 animate-in fade-in duration-700">

                    {/* ── Header ─────────────────────────────────────────────────── */}
                    <div className="bg-white rounded-[28px] shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl text-white shadow-md" style={{ backgroundColor: colors.primary }}>
                                <HiOutlineBell className="text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Broadcast Console</h1>
                                <p className="text-slate-400 font-medium mt-1 text-xs">
                                    {activeSession ? `Session: ${activeSession}` : 'Loading…'}
                                </p>
                            </div>
                        </div>
                        <div className="inline-flex items-center px-4 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full mr-2 animate-pulse inline-block" style={{ backgroundColor: colors.primary }} />
                            {stats.devices} devices online
                        </div>
                    </div>

                    {/* ── Stats ──────────────────────────────────────────────── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatCard label="Students"       value={stats.students} colorClass="text-indigo-600" />
                        <StatCard label="Teachers"       value={stats.teachers} colorClass="text-violet-600" />
                        <StatCard label="Active Devices" value={stats.devices}  sub="with FCM token" colorClass="text-emerald-600" />
                        <StatCard label="Notices Sent"   value={stats.sent}     colorClass="text-sky-600" />
                    </div>

                    {/* ── Main Grid ──────────────────────────────────────────── */}
                    <div className="grid lg:grid-cols-12 gap-6">

                        {/* ── Compose ──────────────────────────────────────── */}
                        <form
                            onSubmit={handleDispatch}
                            className="lg:col-span-7 bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden flex flex-col"
                        >
                            <div className="px-8 pt-8 pb-6 border-b border-slate-100">
                                <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">Compose Notice</h2>
                                <p className="text-xs text-slate-400 font-medium mt-1">Choose audience → write message → dispatch or schedule</p>
                            </div>

                            <div className="px-8 py-6 space-y-6 flex-1">

                                {/* Audience Pills */}
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Audience</p>
                                    <div className="flex flex-wrap gap-2">
                                        {AUDIENCE.map(({ id, label, Icon }) => (
                                            <button
                                                key={id} type="button"
                                                onClick={() => changeTarget(id)}
                                                className={`flex items-center gap-2 px-5 py-3 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${
                                                    target === id
                                                        ? 'text-white shadow-md'
                                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                                style={target === id ? { backgroundColor: colors.primary, borderColor: colors.primary } : {}}
                                            >
                                                <Icon className="text-sm" />{label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Audience input area */}
                                <div className="min-h-[72px]">

                                    {/* Whole School info */}
                                    {target === 'all' && (
                                        <div className="flex items-center gap-3 px-5 py-4 bg-indigo-50 border border-indigo-100 rounded-[24px] animate-fadein">
                                            <HiOutlineLightningBolt className="text-indigo-500 text-lg shrink-0" />
                                            <div>
                                                <p className="text-xs font-black text-indigo-700">All {stats.students} students (Saved to WholeSchool)</p>
                                                <p className="text-[10px] text-indigo-400 font-medium">{stats.devices} active devices will receive this</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Teacher select */}
                                    {target === 'teachers' && (
                                        <select
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition animate-fadein"
                                            value={payload.targetId}
                                            onChange={e => setPayload(p => ({
                                                ...p,
                                                targetId:   e.target.value,
                                                targetName: e.target.options[e.target.selectedIndex].text,
                                            }))}
                                        >
                                            <option value="all">All Teachers ({teachers.length})</option>
                                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    )}

                                    {/* Class select */}
                                    {target === 'class' && (
                                        <select
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition animate-fadein"
                                            value={payload.targetId}
                                            onChange={e => setPayload(p => ({
                                                ...p,
                                                targetId:   e.target.value,
                                                targetName: `Class ${e.target.value}`,
                                            }))}
                                        >
                                            <option value="">Select a class…</option>
                                            {grades.map(g => <option key={g.id} value={g.id}>{g.id}</option>)}
                                        </select>
                                    )}

                                    {/* Single student — search */}
                                    {target === 'single' && !selectedStudent && (
                                        <div ref={searchRef} className="relative animate-fadein">
                                            <HiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base" />
                                            <input
                                                type="text"
                                                placeholder="Search by name, SR No, or class…"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                onFocus={() => filteredStudents.length > 0 && setDropdownOpen(true)}
                                                className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                                            />
                                            {dropdownOpen && (
                                                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-[24px] shadow-xl overflow-hidden">
                                                    {filteredStudents.map(s => (
                                                        <button
                                                            key={s.id} type="button"
                                                            onClick={() => {
                                                                setSelectedStudent(s);
                                                                setPayload(p => ({ ...p, targetId: s.id, targetName: s.name }));
                                                                setSearchQuery('');
                                                                setDropdownOpen(false);
                                                            }}
                                                            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition text-left group"
                                                        >
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">{s.name}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">SR: {s.srNo}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {!s.fcmToken && (
                                                                    <span className="text-[8px] font-black text-red-400 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full uppercase">No token</span>
                                                                )}
                                                                <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full uppercase">
                                                                    {s.grade}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Single student — selected */}
                                    {target === 'single' && selectedStudent && (
                                        <div className="flex items-center justify-between rounded-[24px] px-6 py-4 text-white shadow-md animate-fadein" style={{ backgroundColor: colors.primary }}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                                    <HiUser className="text-lg" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-xs leading-tight">{selectedStudent.name}</p>
                                                    <div className="flex gap-2 mt-1.5 flex-wrap">
                                                        <span className="text-[8px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                                                            <HiIdentification />{selectedStudent.srNo}
                                                        </span>
                                                        <span className="text-[8px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full uppercase">
                                                            {selectedStudent.grade}
                                                        </span>
                                                        {selectedStudent.fcmToken
                                                            ? <span className="text-[8px] font-bold bg-emerald-400/30 text-emerald-100 px-2.5 py-0.5 rounded-full uppercase">● Active</span>
                                                            : <span className="text-[8px] font-bold bg-red-400/30 text-red-100 px-2.5 py-0.5 rounded-full uppercase">● No Token</span>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedStudent(null)}
                                                className="p-2 rounded-full bg-white/10 hover:bg-white/25 transition shrink-0"
                                            >
                                                <HiX className="text-xs" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Message fields */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Headline</label>
                                        <input
                                            required
                                            placeholder="e.g. School closed tomorrow"
                                            value={payload.title}
                                            onChange={e => setPayload(p => ({ ...p, title: e.target.value }))}
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-full font-black text-slate-800 text-xs placeholder:font-normal placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Message</label>
                                        <textarea
                                            required rows="4"
                                            placeholder="Write a clear, concise message parents will understand…"
                                            value={payload.body}
                                            onChange={e => setPayload(p => ({ ...p, body: e.target.value }))}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[24px] font-medium text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition resize-none"
                                        />
                                        <p className="text-right text-[9px] text-slate-400 font-bold mt-1">{payload.body.length} chars</p>
                                    </div>
                                </div>

                                {/* Schedule Message Option */}
                                <div className="p-5 bg-slate-50 border border-slate-200 rounded-[24px] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <HiOutlineClock className="text-slate-500 text-base" />
                                            <span className="text-[10px] font-black uppercase text-slate-700 tracking-widest">Schedule for Later</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isScheduled}
                                                onChange={e => setIsScheduled(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>

                                    {isScheduled && (
                                        <div className="grid grid-cols-2 gap-3 pt-2 animate-fadein">
                                            <div>
                                                <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Date</label>
                                                <input
                                                    type="date"
                                                    value={scheduleDate}
                                                    onChange={e => setScheduleDate(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400"
                                                    required={isScheduled}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Time</label>
                                                <input
                                                    type="time"
                                                    value={scheduleTime}
                                                    onChange={e => setScheduleTime(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400"
                                                    required={isScheduled}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Image upload */}
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Image (optional)</label>
                                    {!payload.imageUrl ? (
                                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-[24px] bg-slate-50 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition group">
                                            {uploading
                                                ? <div className="flex items-center gap-2 text-indigo-600"><HiOutlineRefresh className="animate-spin text-sm" /><span className="text-[10px] font-black uppercase">Uploading…</span></div>
                                                : <><HiOutlineCloudUpload className="text-xl text-slate-400 group-hover:text-slate-600 mb-1 transition" /><p className="text-[10px] font-black text-slate-400 group-hover:text-slate-600 uppercase tracking-widest">Click to attach image</p></>
                                            }
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                        </label>
                                    ) : (
                                        <div className="relative h-36 rounded-[24px] overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                                            <img src={payload.imageUrl} className="max-h-full object-contain" alt="Preview" />
                                            <button type="button" onClick={() => setPayload(p => ({ ...p, imageUrl: '' }))}
                                                className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow transition">
                                                <HiX className="text-xs" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Send / Schedule button */}
                                <button
                                    type="submit"
                                    disabled={sending || uploading}
                                    className="w-full flex items-center justify-center gap-2.5 text-white py-4 rounded-full font-black uppercase tracking-widest text-xs transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ backgroundColor: colors.primary }}
                                >
                                    {sending
                                        ? <><HiOutlineRefresh className="animate-spin text-sm" />Processing…</>
                                        : isScheduled
                                            ? <><HiOutlineClock className="text-sm" />Schedule Notice</>
                                            : <><HiOutlinePaperAirplane className="-rotate-45 text-sm" />Dispatch Now</>
                                    }
                                </button>
                            </div>
                        </form>

                        {/* ── Right Column ───────────────────────────────────── */}
                        <div className="lg:col-span-5 flex flex-col gap-6">

                            {/* Phone Preview */}
                            <div className="bg-slate-900 rounded-[28px] p-6 border border-slate-800 shadow-sm">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <HiOutlineDesktopComputer className="text-sm" />Live Preview
                                </p>
                                <div className="bg-white/5 border border-white/10 p-5 rounded-[20px] space-y-2.5 backdrop-blur">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
                                            <HiOutlineBell className="text-white text-xs" />
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">School App · now</span>
                                    </div>
                                    {payload.imageUrl && (
                                        <img src={payload.imageUrl} className="w-full h-24 object-cover rounded-xl border border-white/10 mb-2" alt="" />
                                    )}
                                    <p className="font-bold text-white text-xs leading-snug">
                                        {payload.title || <span className="text-slate-500 font-normal italic text-[11px]">Headline text…</span>}
                                    </p>
                                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                                        {payload.body || <span className="italic">Message body…</span>}
                                    </p>
                                    <div className="pt-2.5 border-t border-white/10 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[9px] font-black text-indigo-400 uppercase">→</span>
                                            <span className="text-[9px] font-bold text-slate-400">{payload.targetName || 'No audience selected'}</span>
                                        </div>
                                        {isScheduled && scheduleDate && scheduleTime && (
                                            <span className="text-[8px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                                                🕒 {scheduleDate} {scheduleTime}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Dispatch Log */}
                            <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden flex-1">
                                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Dispatch Log</h3>
                                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase">{history.length} entries</span>
                                </div>
                                <div className="divide-y divide-slate-50 max-h-[440px] overflow-y-auto scrollbar-hide">
                                    {history.length === 0 ? (
                                        <div className="py-14 text-center">
                                            <HiOutlineChat className="text-3xl text-slate-200 mx-auto mb-2" />
                                            <p className="text-xs text-slate-400 font-medium">No notices sent yet</p>
                                        </div>
                                    ) : history.map(h => (
                                        <div key={h.id} className="px-6 py-4 hover:bg-slate-50/80 transition">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-black text-slate-800 truncate">{h.title}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5 truncate font-medium">{h.body}</p>
                                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                        <span className="text-[9px] font-bold text-slate-500">→ {h.targetName}</span>
                                                        {h.scheduledFor && (
                                                            <span className="text-[9px] font-bold text-indigo-600">🕒 {h.scheduledFor}</span>
                                                        )}
                                                        {h.successCount != null && h.successCount > 0 && (
                                                            <span className="text-[9px] font-bold text-emerald-600">✓ {h.successCount}</span>
                                                        )}
                                                        {h.failureCount > 0 && (
                                                            <span className="text-[9px] font-bold text-red-500">✗ {h.failureCount}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                    <StatusBadge status={h.fcmStatus} />
                                                    <span className="text-[9px] text-slate-400 font-semibold">{h.createdAt}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}