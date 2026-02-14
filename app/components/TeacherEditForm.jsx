// components/TeacherEditForm.jsx
'use client';

import React, { useState } from 'react';
import { HiUpload, HiSave, HiX, HiUserAdd, HiPencilAlt } from 'react-icons/hi';
// 🛑 IMPORTANT: Ensure the path to your firebase config is correct
import { doc, updateDoc, getFirestore } from 'firebase/firestore'; 
import { db } from '../firebase/config'; 


// --- ACTUAL INTEGRATION LOGIC ---

// Cloudinary logic should be reusable from AddTeacherForm, but we'll include it here for completeness
const uploadImageToCloudinary = async (file) => {
    // ... (Use the same logic as in AddTeacherForm.jsx, reading from process.env)
    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    // ... (API URL construction and fetch logic) ...
    const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: formData });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Cloudinary upload failed: ${data.error?.message || response.statusText}`);
    }
    return data.secure_url;
};


// 🛑 STEP 5: Implement the Firebase Update Function (REAL FIRESTORE LOGIC)
const updateTeacherInFirebase = async (teacherId, dataToUpdate) => {
    try {
        // Create a document reference
        const teacherDocRef = doc(db, 'teachers', teacherId);
        
        // Use updateDoc to apply the changes
        await updateDoc(teacherDocRef, dataToUpdate);
        return true;
    } catch (error) {
        console.error("Firestore Update Error:", error);
        throw new Error(`Failed to update teacher data: ${error.message}`);
    }
};
// ------------------------------------


function TeacherEditForm({ teacherData, onSuccess }) {
    // Initialize form state with the data passed from the parent component
    const [formData, setFormData] = useState(teacherData);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [imageFile, setImageFile] = useState(null); // Holds a *new* file for upload

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

        try {
            let uploadedImageUrl = formData.imageUrl; // Keep existing URL by default

            // 1. Image Upload to Cloudinary (ONLY if a new file is selected)
            if (imageFile) {
                setMessage({ type: 'info', text: 'Uploading new image...' });
                uploadedImageUrl = await uploadImageToCloudinary(imageFile); 
            }

            // 2. Prepare Data to Update (Firestore only accepts fields that exist)
            const dataToUpdate = {
                ...formData,
                imageUrl: uploadedImageUrl,
                updatedAt: Date.now(),
            };
            
            // 3. Save Changes to Firebase
            setMessage({ type: 'info', text: 'Updating teacher data...' });
            // The teacherData.id is the Firestore Document ID
            await updateTeacherInFirebase(teacherData.id, dataToUpdate);

            // Success
            setMessage({ type: 'success', text: 'Teacher updated successfully!' });
            setImageFile(null); // Clear new file input
            
            // Redirect after success
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 1500);

        } catch (error) {
            console.error("Error updating teacher:", error);
            setMessage({ type: 'error', text: `Failed to update teacher: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    // Determine the preview image source: new file, existing URL, or placeholder
    const previewImageUrl = imageFile 
        ? URL.createObjectURL(imageFile) 
        : formData.imageUrl 
        ? formData.imageUrl 
        : ''; 
    
    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border-t-4 border-yellow-500">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                <HiPencilAlt className="w-6 h-6 mr-2 text-yellow-600" /> Edit Teacher Details
            </h2>
            <p className="text-sm text-gray-500 mb-4">Editing: **{formData.name}** (ID No.: {formData.srNo})</p>

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
                            {imageFile ? imageFile.name : 'Change Profile Photo'}
                        </label>
                        <input 
                            id="image-upload" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageChange} 
                        />
                        {/* Option to clear image URL if one exists and no new file selected */}
                        {formData.imageUrl && !imageFile && (
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({...prev, imageUrl: ''}))}
                                className="ml-3 text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                                <HiX className="w-5 h-5 inline mr-1" /> Remove Current Photo
                            </button>
                        )}
                    </div>
                </div>

                {/* Grid Layout for Main Details */}
                {/* Note: SR No. should ideally be read-only if it's a unique identifier */}
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
                            readOnly // Often SR No. is read-only
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-2 border bg-gray-50"
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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-2 border"
                        />
                    </div>
                    {/* Status (NEW FIELD FOR EDIT) */}
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status <span className="text-red-500">*</span></label>
                        <select
                            name="status"
                            id="status"
                            value={formData.status || 'Active'}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-2 border"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="On Leave">On Leave</option>
                        </select>
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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-2 border"
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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-2 border"
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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-2 border"
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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-2 border"
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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-2 border"
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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-2 border"
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-2 border"
                    ></textarea>
                </div>

                {/* Submit and Cancel Buttons */}
                <div className="flex justify-end space-x-4 pt-4 border-t">
                    <button
                        type="button"
                        onClick={onSuccess} // Use onSuccess to return to the list view without saving
                        className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                            isLoading ? 'bg-yellow-400 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500'
                        } transition`}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Updating...
                            </>
                        ) : (
                            <><HiSave className="w-5 h-5 mr-2" /> Save Changes</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default TeacherEditForm;