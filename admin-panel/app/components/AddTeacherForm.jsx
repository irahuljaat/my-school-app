'use client';

import React, { useState, useEffect } from 'react';
import { HiUpload, HiSave, HiX, HiUserAdd, HiUserCircle, HiIdentification, HiPhone, HiMail, HiAcademicCap, HiBookOpen, HiCurrencyRupee, HiCalendar } from 'react-icons/hi';
import { doc, setDoc } from 'firebase/firestore'; 
import { db } from '../firebase/config'; 
import Image from 'next/image';
import { useColors } from './ColorComponent';

// --- CORE LOGIC ---

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

const INITIAL_TEACHER_STATE = {
    employeeId: '',
    name: '',
    teacherName: '',
    phone: '',
    email: '',
    address: '',
    qualification: '',
    subjectsTaught: '',
    salary: '',
    joiningDate: new Date().toISOString().split('T')[0],
    dob: '',
    gender: 'MALE',
    bloodGroup: '',
    designation: '',
    experience: '',
    imageUrl: '', 
};

// --- UI COMPONENT ---

function AddTeacherForm({ onSuccess }) {
    const colors = useColors();
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

        if (!formData.name || !formData.phone || !formData.salary || !formData.employeeId) {
            setMessage({ type: 'error', text: 'Required fields: Name, Phone, Salary, and Employee ID.' });
            setIsLoading(false);
            return;
        }

        try {
            let uploadedImageUrl = ''; 
            if (imageFile) {
                setMessage({ type: 'info', text: 'Uploading profile photo...' });
                uploadedImageUrl = await uploadImageToCloudinary(imageFile); 
            }

            const formattedName = formData.name.trim().toUpperCase();
            const empId = formData.employeeId.trim();

            const docId = `${formattedName.replace(/\s+/g, '')}${empId}`;
            const firstName = formattedName.split(' ')[0];
            const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
            const password = `${capitalizedFirstName}@${empId}`;

            const finalData = {
                employeeId: empId,
                employId: empId,
                name: formattedName,
                teacherName: formattedName,
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                qualification: formData.qualification,
                subjectsTaught: formData.subjectsTaught,
                salary: Number(formData.salary),
                joiningDate: formData.joiningDate,
                dob: formData.dob,
                gender: formData.gender,
                bloodGroup: formData.bloodGroup,
                designation: formData.designation,
                experience: formData.experience,
                imageUrl: uploadedImageUrl,
                loginentails: {
                    password: password
                },
                lastUpdated: new Date().toUTCString()
            };

            setMessage({ type: 'info', text: 'Registering teacher in database...' });
            
            const teacherDocRef = doc(db, 'teachers', docId);
            await setDoc(teacherDocRef, finalData);

            setMessage({ type: 'success', text: `Teacher successfully registered! ID: ${docId}` });
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
        <div className="max-w-5xl mx-auto p-6 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden transition-colors duration-300"
             style={{ backgroundColor: colors.background }}>
            
            {/* Background Decorative Accent Blobs */}
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-10"
                 style={{ backgroundColor: colors.primary }}></div>
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-10"
                 style={{ backgroundColor: colors.primary }}></div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b border-slate-100 gap-4 relative z-10">
                <div>
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 rounded-full text-white shadow-lg"
                             style={{ backgroundColor: colors.primary, boxShadow: `0 10px 25px -5px ${colors.primary}40` }}>
                            <HiUserAdd size={26} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight" style={{ color: colors.text }}>
                                Add New Educator
                            </h2>
                            <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Staff Management Portal</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Notifications */}
            {message && (
                <div className={`mb-8 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest border transition-all duration-300 shadow-sm ${
                    message.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-200' : 
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                    'bg-blue-50 border-blue-200'
                }`} style={message.type === 'info' ? { color: colors.primary } : {}}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                
                {/* Photo Upload Section */}
                <div className="flex flex-col md:flex-row items-center gap-8 p-6 backdrop-blur-md rounded-[2rem] border border-slate-100 shadow-sm"
                     style={{ backgroundColor: colors.cardBackground }}>
                    <div className="relative w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center group">
                        {previewUrl ? (
                            <Image src={previewUrl} alt="Preview" fill className="object-cover" unoptimized />
                        ) : (
                            <HiUserCircle size={90} className="text-slate-300 group-hover:scale-105 transition-transform" />
                        )}
                    </div>
                    <div className="text-center md:text-left space-y-3">
                        <label className="block text-xs font-black uppercase tracking-widest" style={{ color: colors.text }}>Staff Profile Photograph</label>
                        <p className="text-xs text-slate-400">Upload a crisp professional passport-size image (PNG, JPG).</p>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            <label className="cursor-pointer text-white px-6 py-3 rounded-full text-xs font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-lg"
                                   style={{ backgroundColor: colors.primary, boxShadow: `0 8px 20px -4px ${colors.primary}40` }}>
                                <HiUpload size={16} /> Choose Image
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                            {imageFile && (
                                <button 
                                    type="button" 
                                    onClick={() => setImageFile(null)}
                                    className="px-6 py-3 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-full text-xs font-bold transition-all flex items-center gap-2"
                                >
                                    <HiX size={16} /> Clear Photo
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Form Inputs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                    
                    {/* Employee ID */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <HiIdentification size={16} style={{ color: colors.primary }} /> Employee ID *
                        </label>
                        <input
                            name="employeeId"
                            placeholder="e.g. 001"
                            value={formData.employeeId}
                            onChange={handleChange}
                            className="w-full p-4 border-2 border-slate-100 rounded-full text-sm font-bold focus:ring-4 transition-all outline-none shadow-sm"
                            style={{ backgroundColor: colors.cardBackground, color: colors.text }}
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
                            placeholder="e.g. Rahul Choudhary"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full p-4 border-2 border-slate-100 rounded-full text-sm font-bold focus:ring-4 transition-all outline-none shadow-sm"
                            style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                            required
                        />
                    </div>

                    {/* Designation */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            Designation
                        </label>
                        <input
                            name="designation"
                            placeholder="e.g. Social Science Teacher"
                            value={formData.designation}
                            onChange={handleChange}
                            className="w-full p-4 border-2 border-slate-100 rounded-full text-sm font-bold focus:ring-4 transition-all outline-none shadow-sm"
                            style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <HiPhone size={16} style={{ color: colors.primary }} /> Mobile Number *
                        </label>
                        <input
                            name="phone"
                            placeholder="988710342"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full p-4 border-2 border-slate-100 rounded-full text-sm font-bold focus:ring-4 transition-all outline-none shadow-sm"
                            style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <HiMail size={16} style={{ color: colors.primary }} /> Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            placeholder="teacher@school.com"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full p-4 border-2 border-slate-100 rounded-full text-sm font-bold focus:ring-4 transition-all outline-none shadow-sm"
                            style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                        />
                    </div>

                    {/* Qualification */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <HiAcademicCap size={16} style={{ color: colors.primary }} /> Qualification
                        </label>
                        <input
                            name="qualification"
                            placeholder="e.g. B.A, B.ED"
                            value={formData.qualification}
                            onChange={handleChange}
                            className="w-full p-4 border-2 border-slate-100 rounded-full text-sm font-bold focus:ring-4 transition-all outline-none shadow-sm"
                            style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                        />
                    </div>

                    {/* Subjects */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <HiBookOpen size={16} style={{ color: colors.primary }} /> Subjects Taught
                        </label>
                        <input
                            name="subjectsTaught"
                            placeholder="e.g. Mathematics, Hindi"
                            value={formData.subjectsTaught}
                            onChange={handleChange}
                            className="w-full p-4 border-2 border-slate-100 rounded-full text-sm font-bold focus:ring-4 transition-all outline-none shadow-sm"
                            style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                        />
                    </div>

                    {/* Salary */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <HiCurrencyRupee size={16} style={{ color: colors.primary }} /> Monthly Salary *
                        </label>
                        <input
                            type="number"
                            name="salary"
                            placeholder="INR"
                            value={formData.salary}
                            onChange={handleChange}
                            className="w-full p-4 border-2 border-slate-100 rounded-full text-sm font-bold focus:ring-4 transition-all outline-none shadow-sm"
                            style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                            required
                        />
                    </div>

                    {/* Joining Date */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <HiCalendar size={16} style={{ color: colors.primary }} /> Joining Date
                        </label>
                        <input
                            type="text"
                            name="joiningDate"
                            placeholder="e.g. 01-07-2025"
                            value={formData.joiningDate}
                            onChange={handleChange}
                            className="w-full p-4 border-2 border-slate-100 rounded-full text-sm font-bold focus:ring-4 transition-all outline-none shadow-sm"
                            style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                        />
                    </div>

                    {/* DOB */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            Date of Birth (DOB)
                        </label>
                        <input
                            type="text"
                            name="dob"
                            placeholder="e.g. 11-11-2004"
                            value={formData.dob}
                            onChange={handleChange}
                            className="w-full p-4 border-2 border-slate-100 rounded-full text-sm font-bold focus:ring-4 transition-all outline-none shadow-sm"
                            style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                        />
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            Gender
                        </label>
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full p-4 border-2 border-slate-100 rounded-full text-sm font-bold focus:ring-4 transition-all outline-none shadow-sm cursor-pointer"
                            style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                        >
                            <option value="MALE">MALE</option>
                            <option value="FEMALE">FEMALE</option>
                            <option value="OTHER">OTHER</option>
                        </select>
                    </div>

                    {/* Blood Group */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            Blood Group
                        </label>
                        <input
                            name="bloodGroup"
                            placeholder="e.g. A+"
                            value={formData.bloodGroup}
                            onChange={handleChange}
                            className="w-full p-4 border-2 border-slate-100 rounded-full text-sm font-bold focus:ring-4 transition-all outline-none shadow-sm"
                            style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                        />
                    </div>

                    {/* Experience */}
                    <div className="space-y-2 md:col-span-2 lg:col-span-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            Experience
                        </label>
                        <input
                            name="experience"
                            placeholder="e.g. 1 Year"
                            value={formData.experience}
                            onChange={handleChange}
                            className="w-full p-4 border-2 border-slate-100 rounded-full text-sm font-bold focus:ring-4 transition-all outline-none shadow-sm"
                            style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                        />
                    </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Residential Address</label>
                    <textarea
                        name="address"
                        rows="2"
                        placeholder="Enter full home address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full p-5 border-2 border-slate-100 rounded-[2rem] text-sm font-bold focus:ring-4 transition-all outline-none resize-none shadow-sm"
                        style={{ backgroundColor: colors.cardBackground, color: colors.text }}
                    ></textarea>
                </div>

                {/* Submit Section */}
                <div className="flex justify-between items-center pt-8 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => {
                            setFormData(INITIAL_TEACHER_STATE);
                        }}
                        className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-all uppercase tracking-widest px-4 py-2"
                    >
                        Reset Form
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-10 py-4 hover:brightness-110 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-3 transition-all disabled:opacity-50"
                        style={{ backgroundColor: colors.primary, boxShadow: `0 10px 25px -5px ${colors.primary}40` }}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2 animate-pulse italic">Saving Records...</span>
                        ) : (
                            <><HiSave size={18} /> Register Teacher</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddTeacherForm;