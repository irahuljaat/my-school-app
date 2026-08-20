'use client';

import React, { useState, useEffect, memo, useCallback } from 'react';
import BulkAdmissionManager from './BulkAdmissionManager'; 
import { 
    HiOutlineUserAdd, 
    HiOutlineCollection, 
    HiOutlinePhotograph, 
    HiOutlineAcademicCap, 
    HiOutlineX,
    HiOutlineLightningBolt,
    HiOutlineCheckCircle,
    HiOutlineIdentification,
    HiOutlineCalendar,
    HiOutlineUser,
    HiOutlinePhone,
    HiOutlineLocationMarker
} from 'react-icons/hi';
import { db } from '../firebase/config';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
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

const SingleStudentFormContent = memo(({ onClose, onStudentAdded, activeSession }) => {
    const colors = useColors();

    const [formData, setFormData] = useState({ 
        srNo: '',  
        rollNumber: '', 
        admissionDate: new Date().toISOString().split('T')[0],
        name: '', 
        grade: '', 
        section: '', 
        dob: '', 
        gender: '',
        caste: '', 
        aadhaarNumber: '',
        fatherName: '', 
        motherName: '', 
        contact: '', 
        address: '',
        religion: '',
        stream: '',
        optSubject1: '',
        optSubject2: '',
        optSubject3: '',
        imageUrl: null, 
        isDummy: false,
        isRte: false,
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
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    setFormData(prev => ({ ...prev, imageUrl: canvas.toDataURL('image/jpeg', 0.7) }));
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
            const timestamp = Date.now();
            const generatedId = `S${formData.srNo}_${formData.grade}_${formData.section || 'NA'}_${timestamp}`;

            const studentData = {
                id: generatedId,
                srNo: parseInt(formData.srNo, 10),
                rollNumber: formData.rollNumber.trim(), 
                admissionDate: formData.admissionDate,
                name: formData.name.trim(),
                grade: String(formData.grade), 
                section: String(formData.section || '').toUpperCase(), 
                dob: formData.dob,
                gender: formData.gender,
                caste: formData.caste,
                aadhaarNumber: formData.aadhaarNumber.trim(),
                religion: formData.religion,
                fatherName: formData.fatherName.trim(),
                motherName: formData.motherName.trim(),
                contact: formData.contact.trim(),
                address: formData.address.trim(),
                imageUrl: formData.imageUrl,
                isDummy: formData.isDummy,
                isRte: formData.isRte,
                session: activeSession, 
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            if (isHighSchool) {
                studentData.stream = formData.stream;
                studentData.compulsorySubjects = ['Hindi', 'English'];
                studentData.optionalSubjects = [formData.optSubject1, formData.optSubject2, formData.optSubject3];
            }

            await setDoc(doc(db, 'sessions', activeSession, 'students', generatedId), studentData);
            setSubmissionMessage({ type: 'success', text: `Admission successful!` });
            if (onStudentAdded) onStudentAdded();
            setTimeout(() => onClose(), 1500);
        } catch (error) {
            setSubmissionMessage({ type: 'error', text: `Error: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-8 relative overflow-hidden" style={{ backgroundColor: colors.background }}>
            {/* Background Decorative Graphic Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none opacity-10 blur-3xl -mr-20 -mt-20" style={{ backgroundColor: colors.primary }}></div>
            <div className="absolute bottom-10 left-0 w-72 h-72 rounded-full pointer-events-none opacity-5 blur-2xl -ml-20" style={{ backgroundColor: colors.primary }}></div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                
                {/* Top Section: Photo & Basic Metadata */}
                <div 
                    className="p-6 rounded-[28px] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6 items-center relative overflow-hidden"
                    style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                >
                    <div className="flex flex-col items-center space-y-3">
                        <div 
                            className="w-28 h-28 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group transition-all shadow-inner"
                        >
                            {formData.imageUrl ? (
                                <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Student" />
                            ) : (
                                <div className="flex flex-col items-center text-slate-400 transition-colors">
                                    <HiOutlinePhotograph className="w-8 h-8 mb-1" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider">Photo</span>
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>

                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Full Name</label>
                            <div className="relative">
                                <HiOutlineUser className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                <input name="name" placeholder="Enter student's full name" required className="w-full pl-11 pr-4 py-3 bg-slate-50/80 rounded-full text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white focus:ring-2 transition-all" onChange={handleChange} value={formData.name} />
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Admission Date</label>
                            <div className="relative">
                                <HiOutlineCalendar className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                <input name="admissionDate" type="date" required className="w-full pl-11 pr-4 py-3 bg-slate-50/80 rounded-full text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white transition-all" onChange={handleChange} value={formData.admissionDate} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">SR No.</label>
                                <input name="srNo" type="number" placeholder="SR No." required className="w-full px-4 py-3 bg-slate-50/80 rounded-full text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white transition-all text-center" onChange={handleChange} value={formData.srNo} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Roll No.</label>
                                <input name="rollNumber" type="text" placeholder="Roll No." className="w-full px-4 py-3 bg-slate-50/80 rounded-full text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white transition-all text-center" onChange={handleChange} value={formData.rollNumber} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Toggles Bar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                        className="p-4 rounded-full px-6 border border-slate-100 shadow-sm flex items-center justify-between"
                        style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                    >
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Classification</span>
                            <span className="text-xs font-bold">{formData.isDummy ? 'Dummy Student' : 'Regular Student'}</span>
                        </div>
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-full">
                            <button type="button" onClick={() => toggleStatus('isDummy', false)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${!formData.isDummy ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Regular</button>
                            <button type="button" onClick={() => toggleStatus('isDummy', true)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${formData.isDummy ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20' : 'text-slate-400 hover:text-slate-600'}`}>
                                <HiOutlineLightningBolt className="w-3.5 h-3.5" /> Dummy
                            </button>
                        </div>
                    </div>

                    <div 
                        className="p-4 rounded-full px-6 border border-slate-100 shadow-sm flex items-center justify-between"
                        style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                    >
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">RTE Enrollment</span>
                            <span className="text-xs font-bold">{formData.isRte ? 'Under RTE Scheme' : 'Standard'}</span>
                        </div>
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-full">
                            <button type="button" onClick={() => toggleStatus('isRte', false)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${!formData.isRte ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>No</button>
                            <button type="button" onClick={() => toggleStatus('isRte', true)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${formData.isRte ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-600'}`}>
                                <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Yes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Academic & Personal Card */}
                <div 
                    className="p-6 md:p-8 rounded-[28px] border border-slate-100 shadow-sm space-y-6 relative overflow-hidden"
                    style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                >
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <HiOutlineAcademicCap className="w-4 h-4" style={{ color: colors.primary }} /> Academic & Demographic Profile
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Class / Grade</label>
                            <select name="grade" required className="w-full px-4 py-3 bg-slate-50/80 rounded-full text-xs font-bold uppercase text-slate-700 border border-slate-200 cursor-pointer outline-none focus:bg-white transition-all" onChange={handleChange} value={formData.grade}>
                                <option value="">Select Class</option>
                                {CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Section</label>
                            <select name="section" className="w-full px-4 py-3 bg-slate-50/80 rounded-full text-xs font-bold uppercase text-slate-700 border border-slate-200 cursor-pointer outline-none focus:bg-white transition-all" onChange={handleChange} value={formData.section}>
                                <option value="">Section (Opt)</option>
                                {SECTIONS.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Gender</label>
                            <select name="gender" required className="w-full px-4 py-3 bg-slate-50/80 rounded-full text-xs font-bold uppercase text-slate-700 border border-slate-200 cursor-pointer outline-none focus:bg-white transition-all" onChange={handleChange} value={formData.gender}>
                                <option value="">Select Gender</option>
                                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Caste Category</label>
                            <select name="caste" required className="w-full px-4 py-3 bg-slate-50/80 rounded-full text-xs font-bold uppercase text-slate-700 border border-slate-200 cursor-pointer outline-none focus:bg-white transition-all" onChange={handleChange} value={formData.caste}>
                                <option value="">Select Category</option>
                                {CASTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Date of Birth</label>
                            <input type="date" name="dob" className="w-full px-4 py-3 bg-slate-50/80 rounded-full text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white transition-all" onChange={handleChange} value={formData.dob} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Aadhaar Number</label>
                            <div className="relative">
                                <HiOutlineIdentification className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                <input name="aadhaarNumber" placeholder="12 Digit Aadhaar Number" maxLength="12" className="w-full pl-11 pr-4 py-3 bg-slate-50/80 rounded-full text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white transition-all" onChange={handleChange} value={formData.aadhaarNumber} />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Religion</label>
                            <select name="religion" required className="w-full px-4 py-3 bg-slate-50/80 rounded-full text-xs font-bold uppercase text-slate-700 border border-slate-200 cursor-pointer outline-none focus:bg-white transition-all" onChange={handleChange} value={formData.religion}>
                                <option value="">Select Religion</option>
                                {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* High School Stream Options */}
                {isHighSchool && (
                    <div className="p-6 rounded-[28px] border border-purple-100 shadow-sm space-y-4" style={{ backgroundColor: `${colors.primary}10` }}>
                        <div className="flex items-center space-x-2 font-black text-[10px] uppercase tracking-widest" style={{ color: colors.primary }}>
                            <HiOutlineAcademicCap className="w-4 h-4" />
                            <span>Senior Secondary Stream & Optional Subjects</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <select name="stream" value={formData.stream} onChange={handleChange} className="px-4 py-3 bg-white rounded-full ring-1 ring-purple-200 font-bold text-xs uppercase text-slate-700 outline-none">
                                <option value="">Select Stream</option>
                                {Object.keys(STREAMS_DATA).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <input name="optSubject1" value={formData.optSubject1} placeholder="Subject 1" className="px-4 py-3 bg-white rounded-full font-bold text-xs text-slate-700 ring-1 ring-purple-100 outline-none text-center" onChange={handleChange} />
                            <input name="optSubject2" value={formData.optSubject2} placeholder="Subject 2" className="px-4 py-3 bg-white rounded-full font-bold text-xs text-slate-700 ring-1 ring-purple-100 outline-none text-center" onChange={handleChange} />
                            <input name="optSubject3" value={formData.optSubject3} placeholder="Subject 3" className="px-4 py-3 bg-white rounded-full font-bold text-xs text-slate-700 ring-1 ring-purple-100 outline-none text-center" onChange={handleChange} />
                        </div>
                    </div>
                )}

                {/* Family & Contact Card */}
                <div 
                    className="p-6 md:p-8 rounded-[28px] border border-slate-100 shadow-sm space-y-6"
                    style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                >
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <HiOutlinePhone className="w-4 h-4" style={{ color: colors.primary }} /> Family Details & Contact Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Father's Name</label>
                            <input name="fatherName" value={formData.fatherName} placeholder="Enter father's name" className="w-full px-4 py-3 bg-slate-50/80 rounded-full text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white transition-all" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Mother's Name</label>
                            <input name="motherName" value={formData.motherName} placeholder="Enter mother's name" className="w-full px-4 py-3 bg-slate-50/80 rounded-full text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white transition-all" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Contact Number</label>
                            <div className="relative">
                                <HiOutlinePhone className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                <input name="contact" value={formData.contact} placeholder="Primary phone number" className="w-full pl-11 pr-4 py-3 bg-slate-50/80 rounded-full text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white transition-all" onChange={handleChange} />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Residential Address</label>
                            <div className="relative">
                                <HiOutlineLocationMarker className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                <input name="address" value={formData.address} placeholder="Enter full address" className="w-full pl-11 pr-4 py-3 bg-slate-50/80 rounded-full text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:bg-white transition-all" onChange={handleChange} />
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
                    className="w-full py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all active:scale-[0.99] disabled:opacity-50 shadow-xl hover:shadow-2xl"
                >
                    {loading ? "Processing Admission..." : formData.isDummy ? "Confirm Dummy Admission" : formData.isRte ? "Confirm RTE Admission" : "Confirm Student Admission"}
                </button>
            </form>
            
            {submissionMessage && (
                <div className={`text-center font-bold text-[10px] uppercase tracking-[0.2em] p-3 rounded-full shadow-sm ${submissionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                    {submissionMessage.text}
                </div>
            )}
        </div>
    );
});

SingleStudentFormContent.displayName = 'SingleStudentFormContent';

export default function AddStudentForm({ onClose, onStudentAdded, activeSession }) {
    const [activeTab, setActiveTab] = useState('single');
    const colors = useColors();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md transition-opacity" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh] border border-slate-100">
                <div 
                    className="p-4 px-6 flex justify-between items-center text-white flex-shrink-0 shadow-sm transition-colors duration-300"
                    style={{ backgroundColor: colors.primary }}
                >
                    <div className="flex space-x-2 bg-black/10 p-1 rounded-full border border-white/10">
                        <button 
                            onClick={() => setActiveTab('single')} 
                            style={{ color: activeTab === 'single' ? colors.primary : '#ffffff' }}
                            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeTab === 'single' ? 'bg-white shadow-md' : 'text-white hover:bg-white/15'}`}
                        >
                            <HiOutlineUserAdd className="w-3.5 h-3.5" /> Single Entry
                        </button>
                        <button 
                            onClick={() => setActiveTab('bulk')} 
                            style={{ color: activeTab === 'bulk' ? colors.primary : '#ffffff' }}
                            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeTab === 'bulk' ? 'bg-white shadow-md' : 'text-white hover:bg-white/15'}`}
                        >
                            <HiOutlineCollection className="w-3.5 h-3.5" /> Bulk Upload
                        </button>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-white/10 hover:bg-white/25 rounded-full transition-colors text-white">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto">
                    {activeTab === 'single' ? (
                        <SingleStudentFormContent 
                            activeSession={activeSession} 
                            onClose={onClose} 
                            onStudentAdded={onStudentAdded} 
                        />
                    ) : (
                        <div className="p-8">
                            <BulkAdmissionManager 
                                activeSession={activeSession}
                                onComplete={() => { if(onStudentAdded) onStudentAdded(); onClose(); }} 
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}