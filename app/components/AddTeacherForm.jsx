// components/AddTeacherForm.jsx
'use client';

import React, { useState } from 'react';
import { HiUpload, HiSave, HiX, HiUserAdd } from 'react-icons/hi';
// 🛑 IMPORTANT: Update this import path to your actual firebase config file!
import { collection, addDoc, getFirestore } from 'firebase/firestore'; 
import { db } from '../firebase/config'; // Assuming firebaseConfig exports 'app'


// --- ACTUAL INTEGRATION LOGIC USING .env.local ---

// STEP 1: Implement the Cloudinary Upload Function (Uses Environment Variables)
const uploadImageToCloudinary = async (file) => {
    if (!file) return null;

    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error("Cloudinary configuration missing. Check NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and UPLOAD_PRESET in .env.local.");
    }
    
    const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        const response = await fetch(CLOUDINARY_UPLOAD_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Cloudinary upload failed: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.secure_url; // The Cloudinary URL
    } catch (error) {
        console.error("Cloudinary Error:", error);
        throw new Error(`Failed to upload image. Details: ${error.message}`);
    }
};

// STEP 2: Implement the Firebase Save Function (REAL FIRESTORE LOGIC)
const addTeacherToFirebase = async (teacherData) => {
    try {
        const teachersCollection = collection(db, 'teachers');
        // Use addDoc to automatically generate a unique ID
        const docRef = await addDoc(teachersCollection, teacherData);
        return { id: docRef.id };
    } catch (error) {
        console.error("Firestore Save Error:", error);
        throw new Error(`Failed to save teacher data to Firebase: ${error.message}`);
    }
};
// ------------------------------------

// Initial state for the teacher form
const INITIAL_TEACHER_STATE = {
    name: '',
    phone: '',
    email: '',
    address: '',
    qualification: '',
    subjectsTaught: '',
    salary: '',
    joiningDate: new Date().toISOString().split('T')[0],
    imageUrl: '', // Will be updated by Cloudinary
    srNo: '', 
};

function AddTeacherForm({ onSuccess }) {
    const [formData, setFormData] = useState(INITIAL_TEACHER_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [imageFile, setImageFile] = useState(null);

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

        // Basic Validation
        if (!formData.name || !formData.phone || !formData.salary || !formData.srNo) {
            setMessage({ type: 'error', text: 'Please fill in required fields (Name, Phone, Salary, ID No.).' });
            setIsLoading(false);
            return;
        }

        try {
            let uploadedImageUrl = ''; 

            // 1. Image Upload to Cloudinary 
            if (imageFile) {
                setMessage({ type: 'info', text: 'Uploading image...' });
                uploadedImageUrl = await uploadImageToCloudinary(imageFile); 
            }

            // 2. Prepare Final Data
            const finalData = {
                ...formData,
                imageUrl: uploadedImageUrl,
                status: 'Active', // Default status
                createdAt: Date.now(),
            };

            // 3. Save to Firebase
            setMessage({ type: 'info', text: 'Saving teacher data...' });
            await addTeacherToFirebase(finalData);

            // Success
            setMessage({ type: 'success', text: 'Teacher added successfully!' });
            setFormData(INITIAL_TEACHER_STATE);
            setImageFile(null);
            
            // Redirect after success
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 1500);

        } catch (error) {
            console.error("Error adding teacher:", error);
            setMessage({ type: 'error', text: `Failed to add teacher: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const previewImageUrl = imageFile ? URL.createObjectURL(imageFile) : formData.imageUrl;
    
    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border-t-4 border-green-500">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Teacher</h2>

            {/* Notification Bar */}
            {message && (
                <div 
                    className={`p-3 mb-4 rounded-md text-sm ${
                        message.type === 'error' ? 'bg-red-100 text-red-700' : 
                        message.type === 'success' ? 'bg-green-100 text-green-700' : 
                        'bg-blue-100 text-blue-700'
                    }`}
                >
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Image Upload and Preview */}
                <div className="flex items-center space-x-6">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 flex items-center justify-center bg-gray-100">
                        {previewImageUrl ? (
                            <img 
                                src={previewImageUrl} 
                                alt="Profile Preview" 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <HiUserAdd className="w-10 h-10 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <label htmlFor="image-upload" className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition">
                            <HiUpload className="w-5 h-5 mr-2" />
                            {imageFile ? imageFile.name : 'Upload Profile Photo'}
                        </label>
                        <input 
                            id="image-upload" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageChange} 
                        />
                        {imageFile && (
                            <button
                                type="button"
                                onClick={() => {setImageFile(null); setFormData(prev => ({...prev, imageUrl: ''}))}}
                                className="ml-3 text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                                <HiX className="w-5 h-5 inline mr-1" /> Remove
                            </button>
                        )}
                    </div>
                </div>

                {/* Grid Layout for Main Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Teacher SR No. */}
                    <div>
                        <label htmlFor="srNo" className="block text-sm font-medium text-gray-700">ID No. <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="srNo"
                            id="srNo"
                            value={formData.srNo}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                        />
                    </div>
                    {/* Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                        />
                    </div>
                     {/* Phone */}
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone <span className="text-red-500">*</span></label>
                        <input
                            type="tel"
                            name="phone"
                            id="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                        />
                    </div>
                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                        />
                    </div>
                    {/* Qualification */}
                    <div>
                        <label htmlFor="qualification" className="block text-sm font-medium text-gray-700">Highest Qualification</label>
                        <input
                            type="text"
                            name="qualification"
                            id="qualification"
                            value={formData.qualification}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                        />
                    </div>
                    {/* Subjects Taught */}
                    <div>
                        <label htmlFor="subjectsTaught" className="block text-sm font-medium text-gray-700">Subjects Taught (e.g., Math, Science)</label>
                        <input
                            type="text"
                            name="subjectsTaught"
                            id="subjectsTaught"
                            value={formData.subjectsTaught}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                        />
                    </div>
                    {/* Salary */}
                    <div>
                        <label htmlFor="salary" className="block text-sm font-medium text-gray-700">Monthly Salary (INR) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            name="salary"
                            id="salary"
                            value={formData.salary}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                        />
                    </div>
                    {/* Joining Date */}
                    <div>
                        <label htmlFor="joiningDate" className="block text-sm font-medium text-gray-700">Joining Date</label>
                        <input
                            type="date"
                            name="joiningDate"
                            id="joiningDate"
                            value={formData.joiningDate}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                        />
                    </div>
                </div>

                {/* Address (Full Width) */}
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Full Address</label>
                    <textarea
                        name="address"
                        id="address"
                        rows="3"
                        value={formData.address}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                    ></textarea>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4 border-t">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                            isLoading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                        } transition`}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            <><HiSave className="w-5 h-5 mr-2" /> Save Teacher</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddTeacherForm;