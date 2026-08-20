'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collectionGroup, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { HiOutlineBadgeCheck, HiOutlineLockClosed, HiOutlineShieldCheck } from 'react-icons/hi';
import { useColors } from '../components/ColorComponent';

export default function ResultReleasePortal({ activeSession }) {
    const colors = useColors();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeSession) return;

        // Using collectionGroup to find 'examMarks' subcollections across all classes
        const q = query(collectionGroup(db, 'examMarks'));
        
        const unsub = onSnapshot(q, (snapshot) => {
            const examData = snapshot.docs
                .filter(d => d.ref.path.includes(`sessions/${activeSession}`))
                .map(d => ({
                    id: d.id,
                    path: d.ref.path,
                    ...d.data()
                }));
            
            setExams(examData);
            setLoading(false);
        });

        return () => unsub();
    }, [activeSession]);

    const toggleRelease = async (examPath, currentStatus) => {
        try {
            const examRef = doc(db, examPath);
            await updateDoc(examRef, {
                isReleased: !currentStatus
            });
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
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
                                <HiOutlineShieldCheck className="w-6 h-6" />
                            </div>
                            Result Release Portal
                        </h1>
                        <p className="text-slate-400 font-medium mt-1 text-xs">Manage public visibility and portal releases for examination marks</p>
                    </div>
                    <div className="inline-flex items-center px-4 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: colors.primary }}></span>
                        Active Session: {activeSession || 'Loading...'}
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-20 text-center">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Exam Cards...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {exams.length === 0 && (
                            <div className="col-span-full py-20 text-center bg-white rounded-[28px] border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    No published marks found for this session.
                                </p>
                            </div>
                        )}
                        {exams.map((exam) => (
                            <div key={exam.id} className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                                            Class {exam.id.split('_')[1] || 'N/A'}
                                        </span>
                                        <h3 className="text-base font-black text-slate-800 mt-3 truncate max-w-[200px] uppercase tracking-tight">
                                            {exam.examName || exam.id.split('_')[0]}
                                        </h3>
                                    </div>
                                    <div className={`p-3 rounded-2xl ${exam.isReleased ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                        {exam.isReleased ? <HiOutlineBadgeCheck className="w-6 h-6" /> : <HiOutlineLockClosed className="w-6 h-6" />}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-6">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {exam.isReleased ? 'Publicly Visible' : 'Hidden from Portal'}
                                    </span>
                                    
                                    {/* Toggle Switch */}
                                    <button 
                                        onClick={() => toggleRelease(exam.path, exam.isReleased)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                                            exam.isReleased ? 'bg-indigo-600' : 'bg-slate-300'
                                        }`}
                                        style={exam.isReleased ? { backgroundColor: colors.primary } : {}}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                                                exam.isReleased ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}