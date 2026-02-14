'use client';

import React, { useState, useEffect } from 'react';
import BulkAdmissionManager from './BulkAdmissionManager'; 
import { 
    HiOutlineUserAdd, 
    HiOutlineCollection, 
    HiOutlinePhotograph, 
    HiOutlineAcademicCap, 
    HiOutlineX,
    HiOutlineDatabase,
    HiOutlineLightningBolt 
} from 'react-icons/hi';
import { db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';

const STREAMS_DATA = {
    "Science (Medical)": ["Physics", "Chemistry", "Biology"],
    "Science (Non-Medical)": ["Physics", "Chemistry", "Mathematics"],
    "Commerce": ["", "", ""], 
    "Arts": ["", "", ""]     
};

const RELIGIONS = ["Hindu", "Muslim", "Sikh", "Christian", "Other"];
const CLASSES = ["LKG" , "UKG" , "PREP" , "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const GENDERS = ["Male", "Female", "Other"];
// ADD THIS LINE:
const CASTE_CATEGORIES = ["General", "OBC", "SC", "ST", "SBC", "Other"];

function SingleStudentFormContent({ onClose, onStudentAdded, activeSession }) {
    const [formData, setFormData] = useState({ 
        srNo: '',  
        admissionDate: new Date().toISOString().split('T')[0], // Default to today
        name: '', 
        grade: '', 
        dob: '', 
        gender: '',
        Category: '',
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
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    setFormData(prev => ({ ...prev, imageUrl: canvas.toDataURL('image/jpeg', 0.5) }));
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleDummy = (val) => {
        setFormData(prev => ({ ...prev, isDummy: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!activeSession) return;
        setLoading(true);

        try {
            const timestamp = Date.now();
            const generatedId = `S${formData.srNo}_${formData.grade}_${timestamp}`;

            const studentData = {
                id: generatedId,
                srNo: parseInt(formData.srNo),
                admissionDate: formData.admissionDate, // New
                name: formData.name,
                grade: String(formData.grade), 
                dob: formData.dob,
                gender: formData.gender, // New
                Category: formData.Category, // New
                aadhaarNumber: formData.aadhaarNumber, // New
                religion: formData.religion,
                fatherName: formData.fatherName,
                motherName: formData.motherName,
                contact: formData.contact,
                address: formData.address,
                imageUrl: formData.imageUrl,
                isDummy: formData.isDummy,
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
        <div className="p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-1 flex flex-col items-center space-y-4">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                            {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Student" /> : <HiOutlinePhotograph className="w-10 h-10 text-slate-300" />}
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <div className="w-full bg-slate-50 p-2 rounded-2xl border border-slate-100 flex flex-col gap-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase text-center mb-1">Entry Type</label>
                            <div className="grid grid-cols-2 gap-1">
                                <button type="button" onClick={() => toggleDummy(false)} className={`py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${!formData.isDummy ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Regular</button>
                                <button type="button" onClick={() => toggleDummy(true)} className={`py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1 ${formData.isDummy ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400'}`}><HiOutlineLightningBolt className="w-3 h-3" /> Dummy</button>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input name="name" placeholder="Full Name" required className="md:col-span-2 p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none font-bold focus:ring-2 focus:ring-indigo-500" onChange={handleChange} value={formData.name} />
                        <div className="flex flex-col gap-1">
                             <label className="text-[10px] font-bold text-slate-400 ml-2">Admission Date</label>
                             <input name="admissionDate" type="date" required className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none font-bold" onChange={handleChange} value={formData.admissionDate} />
                        </div>
                        <div className="flex flex-col gap-1">
                             <label className="text-[10px] font-bold text-slate-400 ml-2">SR No.</label>
                             <input name="srNo" type="number" placeholder="SR No." required className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none font-bold" onChange={handleChange} value={formData.srNo} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select name="grade" required className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold outline-none" onChange={handleChange} value={formData.grade}>
                        <option value="">Class</option>
                        {CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                    </select>

                    <select name="gender" required className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold outline-none" onChange={handleChange} value={formData.gender}>
                        <option value="">Gender</option>
                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>

                    <select name="caste" required className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold outline-none" onChange={handleChange} value={formData.caste}>
        <option value="">Select Caste</option>
        {CASTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
                    
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 ml-2">DOB</label>
                        <input type="date" name="dob" className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold outline-none" onChange={handleChange} value={formData.dob} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="aadhaarNumber" placeholder="Aadhaar Number (12 Digits)" maxLength="12" className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold text-sm" onChange={handleChange} value={formData.aadhaarNumber} />
                    <select name="religion" required className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold outline-none" onChange={handleChange} value={formData.religion}>
                        <option value="">Religion</option>
                        {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                {/* High School Section Stays Same */}
                {isHighSchool && (
                    <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 space-y-4">
                        <div className="flex items-center space-x-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest"><HiOutlineAcademicCap className="w-5 h-5" /><span>Stream & Subjects</span></div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <select name="stream" value={formData.stream} onChange={handleChange} className="p-2 bg-white rounded-xl ring-1 ring-indigo-200 font-bold text-xs">
                                <option value="">Stream</option>
                                {Object.keys(STREAMS_DATA).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <input name="optSubject1" value={formData.optSubject1} placeholder="Subject 1" className="p-2 bg-white rounded-xl font-bold text-xs ring-1 ring-indigo-100 outline-none" onChange={handleChange} />
                            <input name="optSubject2" value={formData.optSubject2} placeholder="Subject 2" className="p-2 bg-white rounded-xl font-bold text-xs ring-1 ring-indigo-100 outline-none" onChange={handleChange} />
                            <input name="optSubject3" value={formData.optSubject3} placeholder="Subject 3" className="p-2 bg-white rounded-xl font-bold text-xs ring-1 ring-indigo-100 outline-none" onChange={handleChange} />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="fatherName" value={formData.fatherName} placeholder="Father's Name" className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold text-sm" onChange={handleChange} />
                    <input name="motherName" value={formData.motherName} placeholder="Mother's Name" className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold text-sm" onChange={handleChange} />
                    <input name="contact" value={formData.contact} placeholder="Contact Number" className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold text-sm" onChange={handleChange} />
                    <textarea name="address" value={formData.address} placeholder="Address" rows="1" className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold text-sm" onChange={handleChange} />
                </div>

                <button type="submit" disabled={loading || !activeSession} className={`w-full py-4 text-white rounded-2xl font-black transition-all active:scale-95 disabled:opacity-50 shadow-xl ${formData.isDummy ? 'bg-rose-600 shadow-rose-100' : 'bg-slate-900 shadow-slate-200 hover:bg-indigo-600'}`}>
                    {loading ? "Processing Admission..." : formData.isDummy ? "Confirm Dummy Admission" : "Confirm Student Admission"}
                </button>
            </form>
        </div>
    );
}

export default function AddStudentForm({ onClose, onStudentAdded, activeSession }) {
    const [activeTab, setActiveTab] = useState('single');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
                <div className="bg-indigo-600 p-4 flex justify-between items-center text-white flex-shrink-0">
                    <div className="flex space-x-2 bg-white/10 p-1 rounded-2xl">
                        <button onClick={() => setActiveTab('single')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'single' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white hover:bg-white/10'}`}>
                            <HiOutlineUserAdd className="inline mr-2 w-4 h-4" /> Single Entry
                        </button>
                        <button onClick={() => setActiveTab('bulk')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'bulk' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white hover:bg-white/10'}`}>
                            <HiOutlineCollection className="inline mr-2 w-4 h-4" /> Bulk Upload
                        </button>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <HiOutlineX className="w-6 h-6" />
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