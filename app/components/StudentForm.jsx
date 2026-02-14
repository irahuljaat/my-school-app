// components/AddStudentForm.jsx (Handles manual and bulk student entry)

'use client';
import React, { useState } from 'react';
import { db } from '../firebase/config';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { LuUpload, LuDownload, LuSave, LuCircleX, LuImage } from 'react-icons/lu';

// Mock list of classes and dropdown data
const MOCK_CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const MOCK_CATEGORIES = ['General', 'OBC', 'SC', 'ST'];
const MOCK_GENDERS = ['Male', 'Female', 'Other'];

// Initial state for the student form
const initialStudentState = {
    name: '',
    fatherName: '',
    motherName: '',
    dob: '',
    grade: MOCK_CLASSES[0] || '', // Using 'grade' field for class name
    rollNo: '',
    srNo: '',
    admissionDate: '',
    gender: MOCK_GENDERS[0] || '',
    category: MOCK_CATEGORIES[0] || '',
    address: '',
    imageUrl: '',
};


function AddStudentForm({ onClose, onStudentAdded }) {
    const [studentData, setStudentData] = useState(initialStudentState);
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // --- Form Handlers ---

    const handleChange = (e) => {
        const { name, value } = e.target;
        setStudentData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        setImageFile(e.target.files[0]);
    };
    
    // --- Image Upload (Placeholder) ---
    // NOTE: This function needs to be replaced with real Cloudinary/Firebase Storage logic later.
    const uploadImageToServer = async () => {
        if (!imageFile) return null;
        setUploading(true);
        
        // Simulating 3 second upload delay and successful link creation
        await new Promise(resolve => setTimeout(resolve, 3000)); 
        
        const mockImageUrl = `https://mockserver.com/images/${Date.now()}_${imageFile.name}`;
        
        setUploading(false);
        return mockImageUrl;
    };


    // --- Form Submission (Saving to Firestore) ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        let finalImageUrl = studentData.imageUrl;
        
        try {
            // 1. Upload Image (if new file selected)
            if (imageFile) {
                finalImageUrl = await uploadImageToServer();
            }

            // 2. Prepare Data for Firestore
            // Generating a student ID based on SR No. or a timestamp for initial unique identification
            const studentId = studentData.srNo || `STU${Date.now()}`.slice(0, 10); 
            const newStudentRef = doc(collection(db, 'students'));
            
            const dataToSave = {
                ...studentData,
                imageUrl: finalImageUrl,
                studentId: studentId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            
            // 3. Save to Firestore
            await setDoc(newStudentRef, dataToSave);

            alert(`Student ${studentData.name} added successfully with ID: ${studentId}!`);
            setStudentData(initialStudentState);
            setImageFile(null);
            onStudentAdded(); // Call to refresh the list in the parent component

        } catch (error) {
            console.error("Error saving student:", error);
            alert(`Failed to save student: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };


    // --- Bulk Upload Handlers ---

    const handleDownloadTemplate = () => {
        // Simple data structure matching Firestore fields
        const templateHeaders = [
            'name', 'fatherName', 'motherName', 'dob(YYYY-MM-DD)', 'grade', 'rollNo', 'srNo', 
            'admissionDate(YYYY-MM-DD)', 'gender(Male/Female/Other)', 'category(General/OBC/SC/ST)', 
            'address', 'imageUrl(Optional Link)'
        ];
        
        const csvContent = "data:text/csv;charset=utf-8," + templateHeaders.join(',') + "\n";
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "student_bulk_upload_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleBulkUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // NOTE: REAL IMPLEMENTATION REQUIRES XLSX/CSV PARSING LIBRARY (e.g., PapaParse or SheetJS)
        alert(`Starting bulk upload simulation for file: ${file.name}. 
        A parsing library is required here to convert the file into JSON objects and then use a batch write to Firestore.`);
    };
    
    // --- Render ---

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 overflow-y-auto">
            <div className="flex justify-center items-start min-h-screen pt-10">
                <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-4xl mx-4 my-8">
                    
                    <div className="flex justify-between items-center border-b pb-4 mb-6">
                        <h3 className="text-2xl font-bold text-indigo-700">Add New Student</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-900">
                            <LuCircleX className="w-7 h-7" />
                        </button>
                    </div>

                    {/* --- Bulk Upload Section --- */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 mb-6">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">Bulk Upload Options</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Download Template */}
                            <button
                                onClick={handleDownloadTemplate}
                                className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-400 text-gray-800 font-medium rounded-lg hover:bg-gray-200 transition"
                            >
                                <LuDownload className="w-5 h-5" />
                                <span>Download Excel Template (.csv)</span>
                            </button>

                            {/* Upload Excel */}
                            <label className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition cursor-pointer">
                                <LuUpload className="w-5 h-5" />
                                <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleBulkUpload} className="hidden" />
                                <span>Upload Excel/CSV</span>
                            </label>
                        </div>
                    </div>

                    {/* --- Manual Entry Form --- */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <h4 className="font-semibold text-gray-800 border-b pb-2 mb-4">Student Details (Manual Entry)</h4>

                        {/* Row 1: Name, Father, Mother */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputField label="Name" name="name" value={studentData.name} onChange={handleChange} required />
                            <InputField label="Father's Name" name="fatherName" value={studentData.fatherName} onChange={handleChange} required />
                            <InputField label="Mother's Name" name="motherName" value={studentData.motherName} onChange={handleChange} required />
                        </div>

                        {/* Row 2: DOB, Class, Roll No., S.R. No. */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <InputField label="Date of Birth" name="dob" type="date" value={studentData.dob} onChange={handleChange} required />
                            
                            <SelectField label="Class" name="grade" value={studentData.grade} onChange={handleChange} options={MOCK_CLASSES} required />
                            
                            <InputField label="Roll No." name="rollNo" value={studentData.rollNo} onChange={handleChange} />
                            <InputField label="S.R. No." name="srNo" value={studentData.srNo} onChange={handleChange} required />
                        </div>

                        {/* Row 3: Admission Date, Gender, Category */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <InputField label="Admission Date" name="admissionDate" type="date" value={studentData.admissionDate} onChange={handleChange} required />
                            
                            <SelectField label="Gender" name="gender" value={studentData.gender} onChange={handleChange} options={MOCK_GENDERS} required />
                            
                            <SelectField label="Category" name="category" value={studentData.category} onChange={handleChange} options={MOCK_CATEGORIES} required />

                            {/* Image Upload Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 flex items-center">
                                    <LuImage className="w-4 h-4 mr-1" /> Student Image
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                                {imageFile && <p className="text-xs mt-1 text-gray-500">Selected: {imageFile.name}</p>}
                                {uploading && <p className="text-xs mt-1 text-yellow-600">Uploading...</p>}
                            </div>
                        </div>

                        {/* Row 4: Address */}
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                            <textarea
                                id="address"
                                name="address"
                                value={studentData.address}
                                onChange={handleChange}
                                rows="3"
                                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            ></textarea>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 border-t">
                            <button
                                type="submit"
                                disabled={isSaving || uploading}
                                className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition disabled:bg-indigo-400 flex items-center justify-center"
                            >
                                <LuSave className="w-5 h-5 mr-2" />
                                {isSaving ? 'Saving to Database...' : 'Save Student Record'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AddStudentForm;


// --- Reusable Form Field Components ---

const InputField = ({ label, name, type = 'text', value, onChange, required = false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500">*</span>}</label>
        <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            required={required}
        />
    </div>
);

const SelectField = ({ label, name, value, onChange, options, required = false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500">*</span>}</label>
        <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            required={required}
        >
            {options.map(option => (
                <option key={option} value={option}>{option}</option>
            ))}
        </select>
    </div>
);