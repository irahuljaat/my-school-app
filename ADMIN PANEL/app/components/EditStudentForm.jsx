'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
    HiOutlinePhotograph, 
    HiOutlineX,
    HiOutlineLightningBolt,
    HiOutlineCheckCircle,
    HiOutlineIdentification,
    HiOutlineCalendar,
    HiOutlineUser,
    HiOutlinePhone,
    HiOutlineLocationMarker,
    HiOutlineAcademicCap
} from 'react-icons/hi';
import { db } from '../firebase/config';
import { doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { useColors } from './ColorComponent';

const STREAMS_DATA = {
    "Science (Medical)": ["Physics", "Chemistry", "Biology"],
    "Science (Non-Medical)": ["Physics", "Chemistry", "Mathematics"],
    "Commerce": ["Accountancy", "Business Studies", "Economics"], 
    "Arts": ["History", "Geography", "Pol. Science"]    
};

const RELIGIONS = ["Hindu", "Muslim", "Sikh", "Christian", "Other"];
const CLASSES = ["LKG", "UKG", "PREP", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const SECTIONS = ["A", "B", "C", "D"];
const GENDERS = ["Male", "Female", "Other"];
const CASTE_CATEGORIES = ["General", "OBC", "SC", "ST", "SBC", "Other"];

export default function EditStudentForm({ studentData, onClose, onStudentUpdated, activeSession }) {
    const colors = useColors();

    const [formData, setFormData] = useState({
        ...studentData,
        rollNumber: studentData.rollNumber || '',
        section: studentData.section || '',
        admissionDate: studentData.admissionDate || new Date().toISOString().split('T')[0],
        gender: studentData.gender || '',
        caste: studentData.caste || '',
        aadhaarNumber: studentData.aadhaarNumber || '',
        isDummy: studentData.isDummy || false,
        isRte: studentData.isRte || false,
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
            setFormData(prev => ({
                ...prev,
                optSubject1: subjects[0] || '',
                optSubject2: subjects[1] || '',
                optSubject3: subjects[2] || ''
            }));
        }
    }, [formData.stream, isHighSchool]);

    // Passport-size photo ratio (3:4 vertical aspect ratio) cropping handler
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.src = reader.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const targetWidth = 300;
                    const targetHeight = 400; // 3:4 Passport Aspect Ratio
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    const ctx = canvas.getContext('2d');

                    const imgAspect = img.width / img.height;
                    const targetAspect = targetWidth / targetHeight;

                    let sWidth = img.width;
                    let sHeight = img.height;
                    let sX = 0;
                    let sY = 0;

                    if (imgAspect > targetAspect) {
                        sWidth = img.height * targetAspect;
                        sX = (img.width - sWidth) / 2;
                    } else {
                        sHeight = img.width / targetAspect;
                        sY = (img.height - sHeight) / 2;
                    }

                    ctx.drawImage(img, sX, sY, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
                    setFormData(prev => ({ ...prev, imageUrl: canvas.toDataURL('image/jpeg', 0.8) }));
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const toggleStatus = useCallback((field, val) => {
        setFormData(prev => ({ ...prev, [field]: val }));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!activeSession) return;
        setLoading(true);

        try {
            const oldId = studentData.id;
            const newSrNo = parseInt(formData.srNo, 10);
            const oldSrNo = parseInt(studentData.srNo, 10);

            const updatedData = {
                ...formData,
                srNo: newSrNo,
                rollNumber: String(formData.rollNumber).trim(),
                section: String(formData.section || '').toUpperCase(),
                grade: String(formData.grade),
                updatedAt: new Date().toISOString(),
            };

            if (isHighSchool) {
                updatedData.compulsorySubjects = ['Hindi', 'English'];
                updatedData.optionalSubjects = [formData.optSubject1, formData.optSubject2, formData.optSubject3];
            }

            if (newSrNo !== oldSrNo || formData.grade !== studentData.grade) {
                const timestamp = oldId.split('_')[3] || Date.now();
                const newId = `S${newSrNo}_${formData.grade}_${formData.section || 'NA'}_${timestamp}`;
                updatedData.id = newId;

                const newDocRef = doc(db, 'sessions', activeSession, 'students', newId);
                await setDoc(newDocRef, updatedData);

                const oldDocRef = doc(db, 'sessions', activeSession, 'students', oldId);
                await deleteDoc(oldDocRef);
            } else {
                const studentRef = doc(db, 'sessions', activeSession, 'students', oldId);
                await updateDoc(studentRef, updatedData);
            }

            setSubmissionMessage({ type: 'success', text: 'Student Record Updated Successfully!' });
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
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md transition-opacity" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh] border border-slate-100">
                
                {/* Header */}
                <div 
                    className="p-5 px-6 flex justify-between items-center text-white flex-shrink-0 shadow-sm transition-colors duration-300"
                    style={{ backgroundColor: colors.primary }}
                >
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-wider">Edit Student Record</h2>
                        <p className="text-[10px] text-white/80 font-medium tracking-wide">Update student demographic & academic information</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-white/10 hover:bg-white/25 rounded-2xl transition-colors text-white">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Container */}
                <div className="overflow-y-auto p-6 md:p-8 space-y-8" style={{ backgroundColor: colors.background }}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Top Section: Passport Photo & Basic Metadata */}
                        <div 
                            className="p-6 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6 items-center"
                            style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                        >
                            <div className="flex flex-col items-center space-y-3">
                                {/* Passport size photo ratio box (3:4 vertical aspect ratio) */}
                                <div className="w-24 h-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden relative group transition-all shadow-inner">
                                    {formData.imageUrl ? (
                                        <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Student Passport Photo" />
                                    ) : (
                                        <div className="flex flex-col items-center text-slate-400 transition-colors p-2 text-center">
                                            <HiOutlinePhotograph className="w-6 h-6 mb-1" />
                                            <span className="text-[9px] font-bold uppercase tracking-wider leading-tight">Passport Photo</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>

                            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Full Name</label>
                                    <div className="relative">
                                        <HiOutlineUser className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                                        <input name="name" placeholder="Enter student's full name" required className="w-full pl-10 pr-4 py-3 bg-slate-50/80 rounded-2xl text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white transition-all" onChange={handleChange} value={formData.name} />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Admission Date</label>
                                    <div className="relative">
                                        <HiOutlineCalendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                                        <input name="admissionDate" type="date" required className="w-full pl-10 pr-4 py-3 bg-slate-50/80 rounded-2xl text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white transition-all" onChange={handleChange} value={formData.admissionDate} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">SR No.</label>
                                        <input name="srNo" type="number" placeholder="SR No." required className="w-full px-4 py-3 bg-slate-50/80 rounded-2xl text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white transition-all" onChange={handleChange} value={formData.srNo} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Roll No.</label>
                                        <input name="rollNumber" type="text" placeholder="Roll No." className="w-full px-4 py-3 bg-slate-50/80 rounded-2xl text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white transition-all" onChange={handleChange} value={formData.rollNumber} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Toggles Bar */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div 
                                className="p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
                                style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                            >
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Entry Classification</span>
                                    <span className="text-xs font-bold" style={{ color: colors.text }}>{formData.isDummy ? 'Dummy Student Registration' : 'Regular School Student'}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                                    <button type="button" onClick={() => toggleStatus('isDummy', false)} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${!formData.isDummy ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Regular</button>
                                    <button type="button" onClick={() => toggleStatus('isDummy', true)} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${formData.isDummy ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20' : 'text-slate-400 hover:text-slate-600'}`}>
                                        <HiOutlineLightningBolt className="w-3.5 h-3.5" /> Dummy
                                    </button>
                                </div>
                            </div>

                            <div 
                                className="p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
                                style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                            >
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">RTE Status</span>
                                    <span className="text-xs font-bold" style={{ color: colors.text }}>{formData.isRte ? 'Under Right to Education' : 'Standard Enrollment'}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                                    <button type="button" onClick={() => toggleStatus('isRte', false)} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${!formData.isRte ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>No</button>
                                    <button type="button" onClick={() => toggleStatus('isRte', true)} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${formData.isRte ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-600'}`}>
                                        <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Yes
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Academic & Personal Card */}
                        <div 
                            className="p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4"
                            style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                        >
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <HiOutlineAcademicCap className="w-4 h-4" style={{ color: colors.primary }} /> Academic & Demographic Profile
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Class / Grade</label>
                                    <select name="grade" required className="w-full px-4 py-3 bg-slate-50/80 rounded-2xl text-xs font-bold uppercase text-slate-700 border border-slate-200 cursor-pointer outline-none focus:bg-white transition-all" onChange={handleChange} value={formData.grade}>
                                        <option value="">Select Class</option>
                                        {CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Section</label>
                                    <select name="section" className="w-full px-4 py-3 bg-slate-50/80 rounded-2xl text-xs font-bold uppercase text-slate-700 border border-slate-200 cursor-pointer outline-none focus:bg-white transition-all" onChange={handleChange} value={formData.section}>
                                        <option value="">Select Section (Opt)</option>
                                        {SECTIONS.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Gender</label>
                                    <select name="gender" required className="w-full px-4 py-3 bg-slate-50/80 rounded-2xl text-xs font-bold uppercase text-slate-700 border border-slate-200 cursor-pointer outline-none focus:bg-white transition-all" onChange={handleChange} value={formData.gender}>
                                        <option value="">Select Gender</option>
                                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Caste Category</label>
                                    <select name="caste" required className="w-full px-4 py-3 bg-slate-50/80 rounded-2xl text-xs font-bold uppercase text-slate-700 border border-slate-200 cursor-pointer outline-none focus:bg-white transition-all" onChange={handleChange} value={formData.caste}>
                                        <option value="">Select Category</option>
                                        {CASTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Date of Birth</label>
                                    <input type="date" name="dob" className="w-full px-4 py-3 bg-slate-50/80 rounded-2xl text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white transition-all" onChange={handleChange} value={formData.dob} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Aadhaar Number</label>
                                    <div className="relative">
                                        <HiOutlineIdentification className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                                        <input name="aadhaarNumber" placeholder="12 Digit Aadhaar Number" maxLength="12" className="w-full pl-10 pr-4 py-3 bg-slate-50/80 rounded-2xl text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white transition-all" onChange={handleChange} value={formData.aadhaarNumber} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Religion</label>
                                    <select name="religion" required className="w-full px-4 py-3 bg-slate-50/80 rounded-2xl text-xs font-bold uppercase text-slate-700 border border-slate-200 cursor-pointer outline-none focus:bg-white transition-all" onChange={handleChange} value={formData.religion}>
                                        <option value="">Select Religion</option>
                                        {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* High School Stream Options */}
                        {isHighSchool && (
                            <div className="p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4" style={{ backgroundColor: `${colors.primary}10` }}>
                                <div className="flex items-center space-x-2 font-black text-[10px] uppercase tracking-widest" style={{ color: colors.primary }}>
                                    <HiOutlineAcademicCap className="w-4 h-4" />
                                    <span>Senior Secondary Stream & Optional Subjects</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <select name="stream" value={formData.stream} onChange={handleChange} className="px-4 py-3 bg-white rounded-2xl ring-1 ring-purple-200 font-bold text-xs uppercase text-slate-700 outline-none">
                                        <option value="">Select Stream</option>
                                        {Object.keys(STREAMS_DATA).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <input name="optSubject1" value={formData.optSubject1} placeholder="Subject 1" className="px-4 py-3 bg-white rounded-2xl font-bold text-xs text-slate-700 ring-1 ring-purple-100 outline-none" onChange={handleChange} />
                                    <input name="optSubject2" value={formData.optSubject2} placeholder="Subject 2" className="px-4 py-3 bg-white rounded-2xl font-bold text-xs text-slate-700 ring-1 ring-purple-100 outline-none" onChange={handleChange} />
                                    <input name="optSubject3" value={formData.optSubject3} placeholder="Subject 3" className="px-4 py-3 bg-white rounded-2xl font-bold text-xs text-slate-700 ring-1 ring-purple-100 outline-none" onChange={handleChange} />
                                </div>
                            </div>
                        )}

                        {/* Family & Contact Card */}
                        <div 
                            className="p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4"
                            style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                        >
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <HiOutlinePhone className="w-4 h-4" style={{ color: colors.primary }} /> Family Details & Contact Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Father's Name</label>
                                    <input name="fatherName" value={formData.fatherName} placeholder="Enter father's name" className="w-full px-4 py-3 bg-slate-50/80 rounded-2xl text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white transition-all" onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Mother's Name</label>
                                    <input name="motherName" value={formData.motherName} placeholder="Enter mother's name" className="w-full px-4 py-3 bg-slate-50/80 rounded-2xl text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white transition-all" onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Contact Number</label>
                                    <div className="relative">
                                        <HiOutlinePhone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                                        <input name="contact" value={formData.contact} placeholder="Primary phone number" className="w-full pl-10 pr-4 py-3 bg-slate-50/80 rounded-2xl text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white transition-all" onChange={handleChange} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Residential Address</label>
                                    <div className="relative">
                                        <HiOutlineLocationMarker className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                                        <textarea name="address" value={formData.address} placeholder="Enter full address" rows="1" className="w-full pl-10 pr-4 py-3 bg-slate-50/80 rounded-2xl text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white transition-all resize-none" onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading || !activeSession} 
                            style={{ 
                                backgroundColor: formData.isDummy ? '#f43f5e' : formData.isRte ? '#10b981' : colors.primary,
                                color: formData.isDummy || formData.isRte ? '#ffffff' : colors.text === '#0f172a' ? '#ffffff' : colors.text
                            }}
                            className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.99] disabled:opacity-50 shadow-lg"
                        >
                            {loading ? "Updating Record..." : "Save Changes"}
                        </button>
                    </form>
                    
                    {submissionMessage && (
                        <div className={`text-center font-bold text-[10px] uppercase tracking-[0.2em] p-3 rounded-2xl shadow-sm ${submissionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                            {submissionMessage.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}