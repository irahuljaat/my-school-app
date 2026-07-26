'use client';

import React, { useState, useEffect } from 'react';
import { HiUpload, HiSave, HiX, HiUserAdd, HiUserCircle, HiIdentification, HiPhone, HiMail, HiAcademicCap, HiBookOpen, HiCurrencyRupee, HiCalendar } from 'react-icons/hi';
import { doc, setDoc } from 'firebase/firestore'; 
import { db } from '../firebase/config'; 
import Image from 'next/image';

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

// Fixed 9 Features as shown in the requirement
const FIXED_FEATURES = [
    "Attendance",
    "Homework",
    "Marks",
    "Timetable",
    "Notices",
    "Gallery",
    "Fee Status",
    "Leave",
    "Messages"
];

// Available classes options
const AVAILABLE_CLASSES = ["LKG", "UKG", "PREP", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

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
    const [formData, setFormData] = useState(INITIAL_TEACHER_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    
    // Feature selection state (Defaulting all 9 fixed options to checked/true)
    const [assignedFeatures, setAssignedFeatures] = useState(
        FIXED_FEATURES.reduce((acc, feature) => ({ ...acc, [feature]: true }), {})
    );

    // Classes selection state
    const [selectedClasses, setSelectedClasses] = useState([]);

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

    const handleFeatureToggle = (feature) => {
        setAssignedFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
    };

    const handleClassToggle = (cls) => {
        setSelectedClasses(prev => 
            prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
        );
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

            // Generate ID and Password as specified:
            // ID :- NAMEEMPLOYEEID (e.g. RAHULCHOUDHARY001)
            const docId = `${formattedName.replace(/\s+/g, '')}${empId}`;

            // Password: NAME'S FIRST WORD@EMPLOYEEID (e.g. Rahul@001)
            const firstName = formattedName.split(' ')[0];
            const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
            const password = `${capitalizedFirstName}@${empId}`;

            // Filter checked features into an array
            const activeFeaturesList = Object.keys(assignedFeatures).filter(f => assignedFeatures[f]);

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
                assignedFeatures: activeFeaturesList,
                classes: selectedClasses,
                loginentails: {
                    password: password
                },
                lastUpdated: new Date().toUTCString()
            };

            setMessage({ type: 'info', text: 'Registering teacher in database...' });
            
            // Save to Firestore using custom document ID matching structure in image
            const teacherDocRef = doc(db, 'teachers', docId);
            await setDoc(teacherDocRef, finalData);

            setMessage({ type: 'success', text: `Teacher successfully registered! ID: ${docId}` });
            setFormData(INITIAL_TEACHER_STATE);
            setImageFile(null);
            setSelectedClasses([]);
            
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
                    <p className="text-sm font-medium text-slate-400 mt-2">Enter professional details, assigned classes, and feature permissions.</p>
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
                    
                    {/* Employee ID */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <HiIdentification className="text-green-500" /> Employee ID *
                        </label>
                        <input
                            name="employeeId"
                            placeholder="e.g. 001"
                            value={formData.employeeId}
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
                            placeholder="e.g. Rahul Choudhary"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-green-200 focus:bg-white transition-all outline-none"
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
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-green-200 focus:bg-white transition-all outline-none"
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <HiPhone className="text-green-500" /> Mobile Number *
                        </label>
                        <input
                            name="phone"
                            placeholder="988710342"
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
                            placeholder="e.g. B.A, B.ED"
                            value={formData.qualification}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-green-200 focus:bg-white transition-all outline-none"
                        />
                    </div>

                    {/* Subjects */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <HiBookOpen className="text-green-500" /> Subjects Taught
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

                    {/* Joining Date */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <HiCalendar className="text-green-500" /> Joining Date
                        </label>
                        <input
                            type="text"
                            name="joiningDate"
                            placeholder="e.g. 01-07-2025"
                            value={formData.joiningDate}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-green-200 focus:bg-white transition-all outline-none"
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
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-green-200 focus:bg-white transition-all outline-none"
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
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-green-200 focus:bg-white transition-all outline-none"
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
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-green-200 focus:bg-white transition-all outline-none"
                        />
                    </div>

                    {/* Experience */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            Experience
                        </label>
                        <input
                            name="experience"
                            placeholder="e.g. 1 Year"
                            value={formData.experience}
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
                        rows="2"
                        placeholder="Enter full home address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-green-200 focus:bg-white transition-all outline-none resize-none"
                    ></textarea>
                </div>

                {/* Assigned Features Checkboxes (Fixed 9 Options) */}
                <div className="space-y-3 pt-4 border-t border-slate-50">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-[#303972]">
                        Assigned Features (Select Options)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {FIXED_FEATURES.map((feature) => (
                            <label key={feature} className="flex items-center gap-3 p-3 bg-[#F8F9FD] rounded-xl cursor-pointer hover:bg-slate-100 transition-all">
                                <input
                                    type="checkbox"
                                    checked={!!assignedFeatures[feature]}
                                    onChange={() => handleFeatureToggle(feature)}
                                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                                />
                                <span className="text-xs font-bold text-[#303972]">{feature}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Classes Selection Checkboxes */}
                <div className="space-y-3 pt-4 border-t border-slate-50">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-[#303972]">
                        Assigned Classes
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {AVAILABLE_CLASSES.map((cls) => (
                            <label key={cls} className={`flex items-center justify-center gap-2 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                                selectedClasses.includes(cls) 
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                                : 'bg-[#F8F9FD] border-transparent text-[#303972]'
                            }`}>
                                <input
                                    type="checkbox"
                                    checked={selectedClasses.includes(cls)}
                                    onChange={() => handleClassToggle(cls)}
                                    className="hidden"
                                />
                                <span className="text-xs font-bold">Class {cls}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Submit Section */}
                <div className="flex justify-end items-center gap-6 pt-10 border-t border-slate-50">
                    <button
                        type="button"
                        onClick={() => {
                            setFormData(INITIAL_TEACHER_STATE);
                            setSelectedClasses([]);
                        }}
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