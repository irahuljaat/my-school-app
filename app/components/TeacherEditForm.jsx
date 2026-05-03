'use client';

import React, { useState, useEffect } from 'react';
import { HiUpload, HiSave, HiX, HiPencilAlt, HiUserCircle } from 'react-icons/hi';
import { doc, updateDoc } from 'firebase/firestore'; 
import { db } from '../firebase/config'; 
import Image from 'next/image';

// --- CLOUDINARY UPLOAD HELPER ---
const uploadImageToCloudinary = async (file) => {
    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error("Cloudinary configuration missing in environment variables.");
    }

    const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: formData });
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error?.message || "Cloudinary upload failed");
    }
    return data.secure_url;
};

function TeacherEditForm({ teacherData, onSuccess }) {
    // Initialize form with existing teacher data
    const [formData, setFormData] = useState(teacherData);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(teacherData.imageUrl || '');

    // Memory cleanup for image previews
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            let finalImageUrl = formData.imageUrl;

            // 1. Handle New Image Upload if selected
            if (imageFile) {
                setMessage({ type: 'info', text: 'Uploading new profile photo...' });
                finalImageUrl = await uploadImageToCloudinary(imageFile);
            }

            // 2. Prepare clean data for Firestore
            // We destructure 'id' to ensure we don't save the document ID as a field inside the doc
            const { id, ...cleanData } = formData;
            
            const dataToUpdate = {
                ...cleanData,
                imageUrl: finalImageUrl,
                updatedAt: new Date().toISOString(),
                salary: Number(cleanData.salary || 0) // Ensure numeric storage
            };

            // 3. Update Firestore Collection: 'teachers'
            const teacherDocRef = doc(db, 'teachers', id);
            await updateDoc(teacherDocRef, dataToUpdate);

            setMessage({ type: 'success', text: 'Teacher records updated successfully!' });
            
            // Close modal/form after success
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 1500);

        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-8 bg-white rounded-3xl mt-10 shadow-2xl border border-slate-100">
            {/* Header */}
            <div className="flex justify-between items-start mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-[#303972] flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <HiPencilAlt size={24} />
                        </div>
                        Edit Educator Details
                    </h2>
                    <p className="text-sm font-medium text-slate-400 mt-2">
                        Managing Record: <span className="text-purple-600 font-bold">{formData.srNo || 'N/A'}</span>
                    </p>
                </div>
                <button 
                    onClick={onSuccess} 
                    className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
                >
                    <HiX size={28} />
                </button>
            </div>

            {/* Status Notifications */}
            {message && (
                <div className={`mb-8 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest border ${
                    message.type === 'error' 
                        ? 'bg-rose-50 text-rose-600 border-rose-100' 
                        : 'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* Profile Photo Section */}
                <div className="flex flex-col md:flex-row items-center gap-8 pb-10 border-b border-slate-100">
                    <div className="relative w-32 h-32 rounded-3xl overflow-hidden bg-slate-50 border-4 border-white shadow-xl">
                        {previewUrl ? (
                            <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                <HiUserCircle size={80} />
                            </div>
                        )}
                    </div>
                    <div className="text-center md:text-left">
                        <label className="block text-sm font-bold text-[#303972] mb-3 uppercase tracking-tighter">Profile Photo</label>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            <label className="cursor-pointer bg-[#303972] text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-[#3f4b94] transition-all flex items-center gap-2 shadow-lg shadow-blue-100">
                                <HiUpload /> Choose New Image
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                            {previewUrl && (
                                <button 
                                    type="button" 
                                    onClick={() => { setPreviewUrl(''); setImageFile(null); setFormData(prev => ({...prev, imageUrl: ''})); }}
                                    className="px-6 py-2.5 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all"
                                >
                                    Remove Photo
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
                    {/* Full Name */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Full Name</label>
                        <input
                            name="name"
                            value={formData.name || ''}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-purple-200 focus:bg-white transition-all outline-none"
                            required
                        />
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Status</label>
                        <select
                            name="status"
                            value={formData.status || 'Active'}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-purple-200 focus:bg-white transition-all outline-none"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="On Leave">On Leave</option>
                        </select>
                    </div>

                    {/* Mobile */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mobile Number</label>
                        <input
                            name="phone"
                            value={formData.phone || ''}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-purple-200 focus:bg-white transition-all outline-none"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email || ''}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-purple-200 focus:bg-white transition-all outline-none"
                        />
                    </div>

                    {/* Qualification */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Qualification</label>
                        <input
                            name="qualification"
                            value={formData.qualification || ''}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-purple-200 focus:bg-white transition-all outline-none"
                        />
                    </div>

                    {/* Subjects */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Subjects Taught</label>
                        <input
                            name="subjectsTaught"
                            value={formData.subjectsTaught || ''}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-purple-200 focus:bg-white transition-all outline-none"
                        />
                    </div>

                    {/* Salary */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Monthly Salary (₹)</label>
                        <input
                            type="number"
                            name="salary"
                            value={formData.salary || ''}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-purple-200 focus:bg-white transition-all outline-none"
                            required
                        />
                    </div>

                    {/* Joining Date */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Joining Date</label>
                        <input
                            type="date"
                            name="joiningDate"
                            value={formData.joiningDate || ''}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-purple-200 focus:bg-white transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Full Width Address */}
                <div className="space-y-2 pt-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Residential Address</label>
                    <textarea
                        name="address"
                        rows="3"
                        value={formData.address || ''}
                        onChange={handleChange}
                        className="w-full p-4 bg-[#F8F9FD] border-2 border-transparent rounded-2xl text-sm font-bold text-[#303972] focus:border-purple-200 focus:bg-white transition-all outline-none resize-none"
                    ></textarea>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end items-center gap-6 pt-10 border-t border-slate-50">
                    <button
                        type="button"
                        onClick={onSuccess}
                        className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-all"
                    >
                        Cancel Changes
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-12 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-sm font-bold shadow-xl shadow-purple-100 flex items-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2 italic animate-pulse">
                                Processing...
                            </span>
                        ) : (
                            <>
                                <HiSave size={18} /> Update Profile
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default TeacherEditForm;