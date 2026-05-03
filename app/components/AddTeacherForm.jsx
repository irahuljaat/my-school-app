'use client';

import React, { useState, useEffect } from 'react';
import { HiUpload, HiSave, HiX, HiUserAdd, HiUserCircle, HiIdentification, HiPhone, HiMail, HiAcademicCap, HiBookOpen, HiCurrencyRupee, HiCalendar } from 'react-icons/hi';
import { collection, addDoc } from 'firebase/firestore'; 
import { db } from '../firebase/config'; 
import Image from 'next/image';

// --- CORE LOGIC (UNCHANGED) ---

const uploadImageToCloudinary = async (file) => {
    if (!file) return null;
    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error("Cloudinary configuration missing.");
    }
    
    const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: formData });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Cloudinary upload failed: ${errorData.error?.message || response.statusText}`);
    }
    const data = await response.json();
    return data.secure_url;
};

const addTeacherToFirebase = async (teacherData) => {
    const teachersCollection = collection(db, 'teachers');
    const docRef = await addDoc(teachersCollection, teacherData);
    return { id: docRef.id };
};

const INITIAL_TEACHER_STATE = {
    name: '',
    phone: '',
    email: '',
    address: '',
    qualification: '',
    subjectsTaught: '',
    salary: '',
    joiningDate: new Date().toISOString().split('T')[0],
    imageUrl: '', 
    srNo: '', 
};

// --- UI COMPONENT ---

function AddTeacherForm({ onSuccess }) {
    const [formData, setFormData] = useState(INITIAL_TEACHER_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Sync preview URL when file changes
    useEffect(() => {
        if (!imageFile) {
            setPreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(imageFile);
        setPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [imageFile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setMessage(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        if (!formData.name || !formData.phone || !formData.salary || !formData.srNo) {
            setMessage({ type: 'error', text: 'Required fields: Name, Phone, Salary, and ID No.' });
            setIsLoading(false);
            return;
        }

        try {
            let uploadedImageUrl = ''; 
            if (imageFile) {
                setMessage({ type: 'info', text: 'Uploading profile photo...' });
                uploadedImageUrl = await uploadImageToCloudinary(imageFile); 
            }

            const finalData = {
                ...formData,
                imageUrl: uploadedImageUrl,
                status: 'Active',
                createdAt: Date.now(),
                salary: Number(formData.salary)
            };

            setMessage({ type: 'info', text: 'Registering teacher in database...' });
            await addTeacherToFirebase(finalData);

            setMessage({ type: 'success', text: 'Teacher successfully registered!' });
            setFormData(INITIAL_TEACHER_STATE);
            setImageFile(null);
            
            setTimeout(() => { if (onSuccess) onSuccess(); }, 1500);

        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-8 bg-white rounded-3xl shadow-2xl border border-slate-100">
            {/* Header */}
            <div className="flex justify-between items-start mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-[#303972] flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <HiUserAdd size={24} />
                        </div>
                        Add New Educator
                    </h2>
                    <p className="text-sm font-medium text-slate-400 mt-2">Enter the professional details to register a new staff member.</p>
                </div>
            </div>

            {/* Status Notifications */}
            {message && (
                <div className={`mb-8 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest border animate-pulse ${
                    message.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* Photo Upload Section */}
                <div className="flex flex-col md:flex-row items-center gap-8 pb-10 border-b border-slate-50">
                    <div className="relative w-32 h-32 rounded-3xl overflow-hidden bg-slate-50 border-4 border-white shadow-xl flex items-center justify-center">
                        {previewUrl ? (
                            <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                        ) : (
                            <HiUserCircle size={80} className="text-slate-200" />
                        )}
                    </div>
                    <div className="text-center md:text-left">
                        <label className="block text-sm font-bold text-[#303972] mb-3 uppercase tracking-tighter">Staff Profile Image</label>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            <label className="cursor-pointer bg-[#303972] text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-[#3f4b94] transition-all flex items-center gap-2 shadow-lg shadow-blue-100">
                                <HiUpload /> Choose Image
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                            {imageFile && (
                                <button 
                                    type="button" 
                                    onClick={() => setImageFile(null)}
                                    className="px-6 py-2.5 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                                >
                                    <HiX /> Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Form Inputs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
                    
                    {/* SR NO / ID */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <HiIdentification className="text-green-500" /> Teacher ID / SR No *
                        </label>
                        <input
                            name="srNo"
                            placeholder="e.g. T-2024-001"
                            value={formData.srNo}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-green-200 focus:bg-white transition-all outline-none"
                            required
                        />
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                             Full Name *
                        </label>
                        <input
                            name="name"
                            placeholder="Enter full name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-green-200 focus:bg-white transition-all outline-none"
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <HiPhone className="text-green-500" /> Mobile Number *
                        </label>
                        <input
                            name="phone"
                            placeholder="+91 00000 00000"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-green-200 focus:bg-white transition-all outline-none"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <HiMail className="text-green-500" /> Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            placeholder="teacher@mvg.com"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-green-200 focus:bg-white transition-all outline-none"
                        />
                    </div>

                    {/* Qualification */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <HiAcademicCap className="text-green-500" /> Qualification
                        </label>
                        <input
                            name="qualification"
                            placeholder="e.g. M.A., B.Ed."
                            value={formData.qualification}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-green-200 focus:bg-white transition-all outline-none"
                        />
                    </div>

                    {/* Subjects */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <HiBookOpen className="text-green-500" /> Subjects
                        </label>
                        <input
                            name="subjectsTaught"
                            placeholder="e.g. Mathematics, Hindi"
                            value={formData.subjectsTaught}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-green-200 focus:bg-white transition-all outline-none"
                        />
                    </div>

                    {/* Salary */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <HiCurrencyRupee className="text-green-500" /> Monthly Salary *
                        </label>
                        <input
                            type="number"
                            name="salary"
                            placeholder="INR"
                            value={formData.salary}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-green-200 focus:bg-white transition-all outline-none"
                            required
                        />
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <HiCalendar className="text-green-500" /> Joining Date
                        </label>
                        <input
                            type="date"
                            name="joiningDate"
                            value={formData.joiningDate}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-green-200 focus:bg-white transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Residential Address</label>
                    <textarea
                        name="address"
                        rows="3"
                        placeholder="Enter full home address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-green-200 focus:bg-white transition-all outline-none resize-none"
                    ></textarea>
                </div>

                {/* Submit Section */}
                <div className="flex justify-end items-center gap-6 pt-10 border-t border-slate-50">
                    <button
                        type="button"
                        onClick={() => setFormData(INITIAL_TEACHER_STATE)}
                        className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-all"
                    >
                        Reset Form
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-12 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-sm font-bold shadow-xl shadow-emerald-100 flex items-center gap-3 transition-all disabled:opacity-50"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2 animate-pulse italic">Saving Records...</span>
                        ) : (
                            <><HiSave size={20} /> Register Teacher</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddTeacherForm;