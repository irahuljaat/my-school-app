'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collectionGroup, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { HiOutlineBadgeCheck, HiOutlineLockClosed } from 'react-icons/hi';

export default function ResultReleasePortal({ activeSession }) {
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

    if (loading) return <div className="p-20 text-center font-bold text-slate-400">Loading Exam Cards...</div>;

    return (
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-400 font-medium">
                    No published marks found for this session.
                </div>
            )}
            {exams.map((exam) => (
                <div key={exam.id} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                Class {exam.id.split('_')[1] || 'N/A'}
                            </span>
                            <h3 className="text-lg font-black text-slate-800 mt-2 truncate max-w-[150px]">
                                {exam.examName || exam.id.split('_')[0]}
                            </h3>
                        </div>
                        <div className={`p-3 rounded-2xl ${exam.isReleased ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {exam.isReleased ? <HiOutlineBadgeCheck className="w-6 h-6" /> : <HiOutlineLockClosed className="w-6 h-6" />}
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                            {exam.isReleased ? 'Publicly Visible' : 'Hidden from Portal'}
                        </span>
                        
                        {/* Toggle Switch */}
                        <button 
                            onClick={() => toggleRelease(exam.path, exam.isReleased)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                exam.isReleased ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    exam.isReleased ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}