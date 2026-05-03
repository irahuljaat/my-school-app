'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { HiOutlineUser, HiOutlineCalendar, HiOutlineTrash, HiOutlineX, HiOutlineUserAdd } from 'react-icons/hi';

export default function AdmissionsPage({ onTransferToForm }) {
    const [admissions, setAdmissions] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);

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

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <h1 className="text-3xl font-black text-slate-900 uppercase italic mb-8">Admission <span className="text-rose-600">Applications</span></h1>

            <div className="grid grid-cols-1 gap-4">
                {admissions.map((form) => (
                    <div key={form.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase">{form.firstName} {form.lastName}</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{form.grade} | {form.phone}</p>
                        </div>
                        <button 
                            onClick={() => setSelectedStudent(form)}
                            className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all"
                        >
                            View Full Details
                        </button>
                    </div>
                ))}
            </div>

            {/* --- MODAL WITH ALL DATA FROM image_1813ff.png --- */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden">
                        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                            <h2 className="text-xl font-black uppercase italic">Full Application Profile</h2>
                            <button onClick={() => setSelectedStudent(null)}><HiOutlineX size={24} /></button>
                        </div>

                        <div className="p-8 max-h-[70vh] overflow-y-auto grid grid-cols-2 gap-6">
                            {/* Data fields from your firestore screenshot */}
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
                            <DetailItem label="Hobbies" value={selectedStudent.hobbies} className="col-span-2" />
                            <DetailItem label="Full Address" value={selectedStudent.address} className="col-span-2" />
                        </div>

                        <div className="p-6 bg-slate-50 border-t flex justify-between">
                            <button 
                                onClick={() => {
                                    deleteDoc(doc(db, 'admissions', selectedStudent.id));
                                    setSelectedStudent(null);
                                }}
                                className="text-rose-600 font-bold text-xs uppercase p-2"
                            >
                                Reject Application
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
        <div className={className}>
            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">{label}</span>
            <span className="text-sm font-bold text-slate-800">{value || "N/A"}</span>
        </div>
    );
}