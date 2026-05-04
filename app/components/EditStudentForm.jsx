'use client';

import React, { useState, useEffect } from 'react';
import { 
    HiOutlineX, 
    HiOutlinePhotograph, 
    HiOutlineCheck,
    HiOutlineLightningBolt,
    HiOutlineCheckCircle,
    HiOutlineHashtag,
    HiOutlineIdentification // Added for Roll Number icon
} from 'react-icons/hi';
import { db } from '../firebase/config';
import { doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';

const STREAMS_DATA = {
    "Science (Medical)": ["Physics", "Chemistry", "Biology"],
    "Science (Non-Medical)": ["Physics", "Chemistry", "Mathematics"],
    "Commerce": ["Accountancy", "Business Studies", "Economics"], 
    "Arts": ["History", "Pol. Science", "Geography"]     
};

const RELIGIONS = ["Hindu", "Muslim", "Sikh", "Christian", "Other"];
const CLASSES = ["LKG" , "UKG" , "PREP" , "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const GENDERS = ["Male", "Female", "Other"];
const CASTE_CATEGORIES = ["General", "OBC", "SC", "ST", "SBC", "Other"];

export default function EditStudentForm({ studentData, onClose, onStudentUpdated, activeSession }) {
    const [formData, setFormData] = useState({
        ...studentData,
        rollNumber: studentData.rollNumber || '', // Added Roll Number
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
                optSubject1: subjects[0],
                optSubject2: subjects[1],
                optSubject3: subjects[2]
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
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const toggleStatus = (field, val) => {
        setFormData(prev => ({ ...prev, [field]: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!activeSession) return;
        setLoading(true);

        try {
            const oldId = studentData.id;
            const newSrNo = parseInt(formData.srNo);
            const oldSrNo = parseInt(studentData.srNo);

            const updatedData = {
                ...formData,
                srNo: newSrNo,
                rollNumber: String(formData.rollNumber).trim(), // Ensuring Roll Number is saved
                grade: String(formData.grade),
                updatedAt: new Date().toISOString(),
            };

            // If SR Number or Grade has changed, regenerate ID
            if (newSrNo !== oldSrNo || formData.grade !== studentData.grade) {
                const timestamp = oldId.split('_')[2] || Date.now();
                const newId = `S${newSrNo}_${formData.grade}_${timestamp}`;
                updatedData.id = newId;

                const newDocRef = doc(db, 'sessions', activeSession, 'students', newId);
                await setDoc(newDocRef, updatedData);

                const oldDocRef = doc(db, 'sessions', activeSession, 'students', oldId);
                await deleteDoc(oldDocRef);
            } else {
                const studentRef = doc(db, 'sessions', activeSession, 'students', oldId);
                await updateDoc(studentRef, updatedData);
            }

            setSubmissionMessage({ type: 'success', text: 'Student Record & ID Updated!' });
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
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1">
                            Modify student details and credentials
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                        <HiOutlineX className="w-6 h-6" />
                    </button>
                </div>

                <div className="overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {/* Photo & Status Toggles */}
                            <div className="md:col-span-1 flex flex-col items-center space-y-4">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative">
                                    {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Student" /> : <HiOutlinePhotograph className="w-10 h-10 text-slate-300" />}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>

                                <div className="w-full space-y-2">
                                    <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                        <label className="text-[8px] font-black text-slate-400 uppercase text-center block mb-1">Entry Type</label>
                                        <div className="grid grid-cols-2 gap-1">
                                            <button type="button" onClick={() => toggleStatus('isDummy', false)} className={`py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${!formData.isDummy ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Regular</button>
                                            <button type="button" onClick={() => toggleStatus('isDummy', true)} className={`py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1 ${formData.isDummy ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400'}`}><HiOutlineLightningBolt className="w-3 h-3" /> Dummy</button>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                        <label className="text-[8px] font-black text-slate-400 uppercase text-center block mb-1">RTE Admission</label>
                                        <div className="grid grid-cols-2 gap-1">
                                            <button type="button" onClick={() => toggleStatus('isRte', false)} className={`py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${!formData.isRte ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-400'}`}>No</button>
                                            <button type="button" onClick={() => toggleStatus('isRte', true)} className={`py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1 ${formData.isRte ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400'}`}><HiOutlineCheckCircle className="w-3 h-3" /> RTE</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Inputs */}
                            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1">
                                        <HiOutlineHashtag className="w-3 h-3"/> SR Number
                                    </label>
                                    <input 
                                        name="srNo" 
                                        type="number"
                                        required 
                                        className="w-full p-3 bg-indigo-50/50 rounded-2xl ring-1 ring-indigo-100 font-black text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                                        onChange={handleChange} 
                                        value={formData.srNo} 
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1">
                                        <HiOutlineIdentification className="w-3 h-3"/> Roll Number
                                    </label>
                                    <input 
                                        name="rollNumber" 
                                        type="text"
                                        className="w-full p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                                        onChange={handleChange} 
                                        value={formData.rollNumber} 
                                    />
                                </div>

                                <div className="md:col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Admission Date</label>
                                    <input type="date" name="admissionDate" required className="w-full p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold outline-none" onChange={handleChange} value={formData.admissionDate} />
                                </div>

                                <div className="md:col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Full Name</label>
                                    <input name="name" required className="w-full p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold outline-none" onChange={handleChange} value={formData.name} />
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Class</label>
                                    <select name="grade" required className="w-full p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold outline-none" onChange={handleChange} value={formData.grade}>
                                        {CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Gender</label>
                                    <select name="gender" required className="w-full p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold outline-none" onChange={handleChange} value={formData.gender}>
                                        <option value="">Select Gender</option>
                                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Caste</label>
                                    <select name="caste" required className="w-full p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold outline-none" onChange={handleChange} value={formData.caste}>
                                        <option value="">Select Caste</option>
                                        {CASTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Religion</label>
                                    <select name="religion" required className="w-full p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold outline-none" onChange={handleChange} value={formData.religion}>
                                        {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">DOB</label>
                                    <input type="date" name="dob" className="w-full p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold outline-none" onChange={handleChange} value={formData.dob} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Aadhaar Number</label>
                                    <input name="aadhaarNumber" className="w-full p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold outline-none" onChange={handleChange} value={formData.aadhaarNumber} maxLength={12} />
                                </div>
                            </div>
                        </div>

                        {isHighSchool && (
                            <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 space-y-4">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="fatherName" value={formData.fatherName} placeholder="Father's Name" className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold text-sm" onChange={handleChange} />
                            <input name="motherName" value={formData.motherName} placeholder="Mother's Name" className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold text-sm" onChange={handleChange} />
                            <input name="contact" value={formData.contact} placeholder="Contact Number" className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold text-sm" onChange={handleChange} />
                            <textarea name="address" value={formData.address} placeholder="Address" rows="1" className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold text-sm" onChange={handleChange} />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button type="button" onClick={onClose} className="flex-1 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 uppercase text-[10px]">Cancel</button>
                            <button type="submit" disabled={loading} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center gap-2 uppercase text-[10px]">
                                {loading ? "Updating..." : <><HiOutlineCheck className="w-5 h-5" /> Save Record</>}
                            </button>
                        </div>
                    </form>
                    {submissionMessage && (
                        <div className={`text-center font-bold text-xs uppercase tracking-widest p-4 ${submissionMessage.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>{submissionMessage.text}</div>
                    )}
                </div>
            </div>
        </div>
    );
}