'use client';

import React, { useState, useEffect } from 'react';
import { 
    HiOutlineX, 
    HiOutlinePhotograph, 
    HiOutlineAcademicCap, 
    HiOutlineCheck,
    HiOutlineDatabase,
    HiOutlineLightningBolt // Added for Dummy indicator
} from 'react-icons/hi';
import { db } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

const STREAMS_DATA = {
    "Science (Medical)": ["Physics", "Chemistry", "Biology"],
    "Science (Non-Medical)": ["Physics", "Chemistry", "Mathematics"],
    "Commerce": ["Accountancy", "Business Studies", "Economics"], 
    "Arts": ["History", "Pol. Science", "Geography"]     
};

const RELIGIONS = ["Hindu", "Muslim", "Sikh", "Christian", "Other"];
const CLASSES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default function EditStudentForm({ studentData, onClose, onStudentUpdated, activeSession }) {
    const [formData, setFormData] = useState({
        ...studentData,
        isDummy: studentData.isDummy || false, // Initialize with existing value or false
        optSubject1: studentData.optionalSubjects?.[0] || '',
        optSubject2: studentData.optionalSubjects?.[1] || '',
        optSubject3: studentData.optionalSubjects?.[2] || '',
    });
    const [loading, setLoading] = useState(false);
    const [submissionMessage, setSubmissionMessage] = useState(null);

    const isHighSchool = formData.grade === '11' || formData.grade === '12';

    useEffect(() => {
        if (isHighSchool && STREAMS_DATA[formData.stream]) {
            const subjects = STREAMS_DATA[formData.stream];
            if (subjects[0] !== "") { 
                setFormData(prev => ({
                    ...prev,
                    optSubject1: subjects[0],
                    optSubject2: subjects[1],
                    optSubject3: subjects[2]
                }));
            }
        }
    }, [formData.stream, formData.grade, isHighSchool]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.src = reader.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 250;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * (MAX_WIDTH / img.width);
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    setFormData(prev => ({ ...prev, imageUrl: canvas.toDataURL('image/jpeg', 0.5) }));
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        // Handle checkbox/radio if necessary, but standard text/select here
        setFormData({ ...formData, [name]: value });
    };

    const handleDummyChange = (val) => {
        setFormData(prev => ({ ...prev, isDummy: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!activeSession) {
            setSubmissionMessage({ type: 'error', text: 'Active session not identified.' });
            return;
        }

        setLoading(true);

        try {
            const studentRef = doc(db, 'sessions', activeSession, 'students', formData.id);
            
            const updatedData = {
                srNo: parseInt(formData.srNo),
                rollNumber: String(formData.rollNumber),
                name: formData.name,
                grade: String(formData.grade),
                dob: formData.dob,
                religion: formData.religion,
                fatherName: formData.fatherName,
                motherName: formData.motherName,
                contact: formData.contact,
                address: formData.address,
                imageUrl: formData.imageUrl,
                isDummy: formData.isDummy, // SAVING DUMMY STATUS
                updatedAt: new Date().toISOString(),
            };

            if (isHighSchool) {
                updatedData.stream = formData.stream;
                updatedData.compulsorySubjects = ['Hindi', 'English'];
                updatedData.optionalSubjects = [formData.optSubject1, formData.optSubject2, formData.optSubject3];
            } else {
                updatedData.stream = null;
                updatedData.optionalSubjects = null;
                updatedData.compulsorySubjects = null;
            }

            await updateDoc(studentRef, updatedData);
            setSubmissionMessage({ type: 'success', text: 'Student Record Updated!' });
            
            if (onStudentUpdated) onStudentUpdated();
            setTimeout(() => onClose(), 1500);
        } catch (error) {
            setSubmissionMessage({ type: 'error', text: `Update Failed: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-slate-900 p-6 flex justify-between items-center text-white flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-black tracking-tight uppercase italic">Edit Student Profile</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">SR: {formData.srNo} • Class {formData.grade}</p>
                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-indigo-300 font-bold uppercase tracking-tighter flex items-center gap-1">
                                <HiOutlineDatabase className="w-3 h-3"/> {activeSession}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <HiOutlineX className="w-6 h-6" />
                    </button>
                </div>

                <div className="overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {submissionMessage && (
                            <div className={`p-4 rounded-2xl font-bold text-center border ${submissionMessage.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                {submissionMessage.text}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {/* Photo & Dummy Status Section */}
                            <div className="md:col-span-1 flex flex-col items-center space-y-6">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                                    {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <HiOutlinePhotograph className="w-10 h-10 text-slate-300" />}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>

                                {/* DUMMY RADIO GROUP */}
                                <div className="w-full bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block text-center">Student Type</label>
                                    <div className="flex flex-col gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => handleDummyChange(false)}
                                            className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase transition-all ${!formData.isDummy ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400'}`}
                                        >
                                            Regular
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => handleDummyChange(true)}
                                            className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${formData.isDummy ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-white text-slate-400'}`}
                                        >
                                            <HiOutlineLightningBolt className={formData.isDummy ? 'animate-pulse' : ''} />
                                            Dummy Student
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Main Info */}
                            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Full Name</label>
                                    <input name="name" required className="w-full p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none font-bold focus:ring-2 focus:ring-indigo-500" onChange={handleChange} value={formData.name} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">SR Number</label>
                                    <input name="srNo" type="number" readOnly className="w-full p-3 bg-slate-100 rounded-2xl ring-1 ring-slate-200 outline-none font-bold text-slate-500" value={formData.srNo} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Roll Number</label>
                                    <input name="rollNumber" required className="w-full p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none font-bold" onChange={handleChange} value={formData.rollNumber} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Class</label>
                                    <select name="grade" required className="w-full p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold outline-none" onChange={handleChange} value={formData.grade}>
                                        {CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Religion</label>
                                    <select name="religion" required className="w-full p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold outline-none" onChange={handleChange} value={formData.religion}>
                                        {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">DOB</label>
                                    <input type="date" name="dob" className="w-full p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold outline-none" onChange={handleChange} value={formData.dob} />
                                </div>
                            </div>
                        </div>

                        {/* Stream Selection */}
                        {isHighSchool && (
                            <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 space-y-4">
                                <div className="flex items-center space-x-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                                    <HiOutlineAcademicCap className="w-5 h-5" />
                                    <span>Stream & Subjects</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <select name="stream" value={formData.stream} onChange={handleChange} className="p-2 bg-white rounded-xl ring-1 ring-indigo-200 font-bold text-xs outline-none">
                                        <option value="">Select Stream</option>
                                        {Object.keys(STREAMS_DATA).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <input name="optSubject1" value={formData.optSubject1} placeholder="Subject 1" className="p-2 bg-white rounded-xl font-bold text-xs ring-1 ring-indigo-100 outline-none" onChange={handleChange} />
                                    <input name="optSubject2" value={formData.optSubject2} placeholder="Subject 2" className="p-2 bg-white rounded-xl font-bold text-xs ring-1 ring-indigo-100 outline-none" onChange={handleChange} />
                                    <input name="optSubject3" value={formData.optSubject3} placeholder="Subject 3" className="p-2 bg-white rounded-xl font-bold text-xs ring-1 ring-indigo-100 outline-none" onChange={handleChange} />
                                </div>
                            </div>
                        )}

                        {/* Parent & Contact Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="fatherName" value={formData.fatherName} placeholder="Father's Name" className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold text-sm" onChange={handleChange} />
                            <input name="motherName" value={formData.motherName} placeholder="Mother's Name" className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold text-sm" onChange={handleChange} />
                            <input name="contact" value={formData.contact} placeholder="Contact Number" className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold text-sm" onChange={handleChange} />
                            <textarea name="address" value={formData.address} placeholder="Address" rows="1" className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold text-sm" onChange={handleChange} />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button type="button" onClick={onClose} className="flex-1 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all uppercase text-[10px] tracking-widest">Cancel</button>
                            <button type="submit" disabled={loading} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest">
                                {loading ? "Updating..." : <><HiOutlineCheck className="w-5 h-5" /> Save Record</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}