'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { 
    HiOutlineUser, 
    HiOutlineCalendar, 
    HiOutlineTrash, 
    HiOutlineX, 
    HiOutlineDocumentText 
} from 'react-icons/hi';
import { useColors } from '../components/ColorComponent';

export default function AdmissionsPage({ onTransferToForm }) {
    const colors = useColors();
    const [hasMounted, setHasMounted] = useState(false);
    const [admissions, setAdmissions] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);

    // 1. Mount check for Next.js hydration safety
    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        const q = query(collection(db, 'admissions'), orderBy('appliedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAdmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return dateStr.split('-').reverse().join('-');
    };

    if (!hasMounted) return null;

    return (
        <div className="min-h-screen p-6 lg:p-8 font-sans transition-colors duration-300 relative overflow-hidden pb-36" style={{ backgroundColor: colors.background }}>
            {/* Background Decorative Graphic Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none opacity-10 blur-3xl -mr-20 -mt-20" style={{ backgroundColor: colors.primary }}></div>
            <div className="absolute bottom-10 left-0 w-72 h-72 rounded-full pointer-events-none opacity-5 blur-2xl -ml-20" style={{ backgroundColor: colors.primary }}></div>

            <div className="max-w-[1440px] mx-auto space-y-8 relative z-10">
                
                {/* Header Card */}
                <div 
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-[28px] shadow-sm border border-slate-100 transition-colors duration-300 relative overflow-hidden"
                    style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3.5 rounded-full shadow-inner" style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
                            <HiOutlineDocumentText size={24} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 text-slate-500">
                                Management Module
                            </span>
                            <h1 className="text-2xl font-black tracking-tight mt-1" style={{ color: colors.text }}>Admission Applications</h1>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">Review and manage incoming student applications.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Applications:</span>
                        <div className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border border-slate-200 bg-slate-50 text-slate-700 flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.primary }}></div>
                            {admissions.length} Registered
                        </div>
                    </div>
                </div>

                {/* Main Content Container */}
                <div 
                    className="rounded-[28px] border border-slate-100 shadow-sm p-6 md:p-8 space-y-6 transition-colors duration-300 relative overflow-hidden"
                    style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Application Manifest</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{admissions.length} Entries</span>
                    </div>

                    {/* Admissions List Container */}
                    <div className="space-y-4">
                        {admissions.length === 0 ? (
                            <div className="p-16 text-center text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 rounded-[24px] border border-slate-100">
                                No admission applications found.
                            </div>
                        ) : (
                            admissions.map((form) => (
                                <div key={form.id} className="bg-slate-50/40 p-6 rounded-[24px] border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h3 className="font-black text-sm uppercase" style={{ color: colors.text }}>
                                            {form.firstName} {form.lastName}
                                        </h3>
                                        <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-2">
                                            <span className="bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-700 shadow-xs">Grade: {form.grade}</span>
                                            <span>•</span>
                                            <span>{form.phone || 'No Phone'}</span>
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedStudent(form)}
                                        style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                                        className="px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition-all active:scale-[0.99]"
                                    >
                                        View Full Details
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* --- MODAL FOR APPLICATION DETAILS --- */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-3xl rounded-[28px] shadow-2xl border border-slate-100 overflow-hidden relative">
                        {/* Modal Header */}
                        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Applicant Summary</span>
                                <h2 className="text-lg font-black text-slate-800 tracking-tight mt-0.5">Full Application Profile</h2>
                            </div>
                            <button 
                                onClick={() => setSelectedStudent(null)}
                                className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors border border-slate-200 bg-white shadow-xs"
                            >
                                <HiOutlineX size={18} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 md:p-8 max-h-[65vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem label="Full Name" value={`${selectedStudent.firstName} ${selectedStudent.lastName}`} />
                            <DetailItem label="Date of Birth" value={formatDate(selectedStudent.dob)} />
                            <DetailItem label="Gender" value={selectedStudent.gender} />
                            <DetailItem label="Grade Seeking" value={selectedStudent.grade} />
                            <DetailItem label="Father's Name" value={selectedStudent.fatherName} />
                            <DetailItem label="Mother's Name" value={selectedStudent.motherName} />
                            <DetailItem label="Phone Number" value={selectedStudent.phone} />
                            <DetailItem label="Email Address" value={selectedStudent.email} />
                            <DetailItem label="Previous School" value={selectedStudent.prevSchool} />
                            <DetailItem label="Session" value={selectedStudent.session} />
                            <DetailItem label="Transport" value={selectedStudent.transport} />
                            <DetailItem label="Hobbies" value={selectedStudent.hobbies} className="md:col-span-2" />
                            <DetailItem label="Full Address" value={selectedStudent.address} className="md:col-span-2" />
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center">
                            <button 
                                onClick={() => {
                                    if (window.confirm("Are you sure you want to reject and delete this application?")) {
                                        deleteDoc(doc(db, 'admissions', selectedStudent.id));
                                        setSelectedStudent(null);
                                    }
                                }}
                                className="inline-flex items-center gap-2 text-rose-500 hover:bg-rose-50 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-colors border border-slate-200 hover:border-rose-200 bg-white shadow-xs active:scale-95"
                            >
                                <HiOutlineTrash size={16} />
                                <span>Reject Application</span>
                            </button>
                            <button 
                                onClick={() => setSelectedStudent(null)}
                                className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-full text-xs font-black uppercase tracking-wider hover:bg-slate-300 transition-colors shadow-xs"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailItem({ label, value, className = "" }) {
    return (
        <div className={`bg-slate-50/60 p-4 rounded-[20px] border border-slate-100 ${className}`}>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{label}</span>
            <span className="text-xs font-extrabold text-slate-700">{value || "N/A"}</span>
        </div>
    );
}