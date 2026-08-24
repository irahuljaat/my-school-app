'use client';

import React, { useState } from 'react';
import { db } from '../firebase/config';
import { writeBatch, doc, collection } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { 
    HiOutlineDownload, 
    HiOutlineExclamationCircle, 
    HiOutlineCheckCircle,
    HiOutlineCloudUpload,
    HiOutlineDatabase 
} from 'react-icons/hi'; 

const parseDate = (dateValue) => {
    if (!dateValue) return '';
    const dateStr = String(dateValue).trim();
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    if (typeof dateValue === 'number') {
        const date = new Date(Date.UTC(0, 0, dateValue - 1));
        if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
    }
    const standardDate = new Date(dateValue);
    if (!isNaN(standardDate.getTime())) return standardDate.toISOString().split('T')[0];
    return '';
};

// 1. UPDATED FIELDS LIST (Added rollNumber)
const ALL_FIELDS = [
    'srNo', 'rollNumber', 'admissionDate', 'name', 'grade', 'gender', 'caste', 'dob', 'aadhaarNumber', 
    'religion', 'fatherName', 'motherName', 'contact', 'address',
    'stream', 'optSubject1', 'optSubject2', 'optSubject3', 
    'isRte', 'isDummy', 'imageUrl'
];

const TEMPLATE_DATA = [{
    srNo: 1001,
    rollNumber: "1", // Added to template
    admissionDate: new Date().toISOString().split('T')[0],
    name: "Student Name",
    grade: "1",
    gender: "Male",
    caste: "General",
    dob: "2018-01-01",
    aadhaarNumber: "",
    religion: "Hindu",
    fatherName: "",
    motherName: "",
    contact: "",
    address: "",
    stream: "", 
    optSubject1: "",
    optSubject2: "",
    optSubject3: "",
    isRte: "No",
    isDummy: "No",
    imageUrl: "Paste Base64 string or public URL here"
}];

function BulkAdmissionManager({ onComplete, activeSession }) {
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState(null);
    const [errors, setErrors] = useState([]);

    const handleDownloadTemplate = () => {
        const worksheet = XLSX.utils.json_to_sheet(TEMPLATE_DATA, { header: ALL_FIELDS });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Admission_Template");
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(data, `Template_${activeSession || 'Session'}.xlsx`);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!activeSession) {
            setMessage({ type: 'error', text: 'No active session detected.' });
            return;
        }

        setUploading(true);
        setMessage(null);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const jsonStudents = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                processBulkUpload(jsonStudents);
            } catch (error) {
                setMessage({ type: 'error', text: `Read Error: ${error.message}` });
                setUploading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const processBulkUpload = async (studentsArray) => {
        if (studentsArray.length === 0) {
            setMessage({ type: 'error', text: 'Excel file is empty!' });
            setUploading(false);
            return;
        }

        const batch = writeBatch(db);
        const sessionStudentsCollection = collection(db, 'sessions', activeSession, 'students');
        const timestamp = Date.now();
        let successCount = 0;

        studentsArray.forEach((row, index) => {
            const grade = String(row.grade || '').trim();
            const srNo = row.srNo;

            if (!srNo || !row.name || !grade) return;

            const isHighSchool = grade === '11' || grade === '12';

            const studentData = {
                id: `S${srNo}_${grade}_${timestamp + index}`,
                srNo: parseInt(srNo),
                rollNumber: String(row.rollNumber || '').trim(), // Added rollNumber processing
                admissionDate: parseDate(row.admissionDate) || new Date().toISOString().split('T')[0],
                name: String(row.name).trim(),
                grade: grade,
                gender: String(row.gender || 'Other'),
                caste: String(row.caste || 'General'),
                dob: parseDate(row.dob),
                aadhaarNumber: String(row.aadhaarNumber || ''),
                religion: String(row.religion || 'Other'),
                fatherName: String(row.fatherName || ''),
                motherName: String(row.motherName || ''),
                contact: String(row.contact || ''),
                address: String(row.address || ''),
                imageUrl: row.imageUrl && row.imageUrl !== "Paste Base64 string or public URL here" ? row.imageUrl : null,
                isDummy: String(row.isDummy).toLowerCase() === 'yes',
                isRte: String(row.isRte).toLowerCase() === 'yes',
                session: activeSession,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            if (isHighSchool) {
                studentData.stream = String(row.stream || '');
                studentData.compulsorySubjects = ['Hindi', 'English'];
                studentData.optionalSubjects = [
                    String(row.optSubject1 || ''),
                    String(row.optSubject2 || ''),
                    String(row.optSubject3 || '')
                ];
            } 

            const docRef = doc(sessionStudentsCollection, studentData.id);
            batch.set(docRef, studentData);
            successCount++;
        });

        try {
            await batch.commit();
            setMessage({ type: 'success', text: `Successfully uploaded ${successCount} students!` });
            if (onComplete) setTimeout(onComplete, 2000);
        } catch (error) {
            setMessage({ type: 'error', text: `Upload failed: ${error.message}` });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-center">
                <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
                    <HiOutlineDatabase className="text-indigo-600 w-5 h-5" />
                    <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">Session: {activeSession}</span>
                </div>
            </div>

            <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-slate-800">Bulk Student Import</h3>
                <p className="text-slate-500 text-sm font-medium">Now supports Roll Numbers, RTE status and Image URLs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center text-center group hover:border-indigo-400 transition-colors">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <HiOutlineDownload className="w-7 h-7 text-indigo-600" />
                    </div>
                    <h4 className="font-bold text-slate-800">Step 1: Download</h4>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Get the latest format</p>
                    <button onClick={handleDownloadTemplate} className="mt-6 px-8 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                        Download Template
                    </button>
                </div>

                <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center text-center group hover:border-emerald-400 transition-colors">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <HiOutlineCloudUpload className="w-7 h-7 text-emerald-600" />
                    </div>
                    <h4 className="font-bold text-slate-800">Step 2: Upload</h4>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Select your filled file</p>
                    <label className={`mt-6 cursor-pointer px-8 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm ${!activeSession ? 'opacity-50' : ''}`}>
                        {uploading ? 'Processing...' : 'Choose Excel File'}
                        <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={uploading || !activeSession} />
                    </label>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-3xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                    {message.type === 'success' ? <HiOutlineCheckCircle className="w-6 h-6" /> : <HiOutlineExclamationCircle className="w-6 h-6" />}
                    <span className="font-black text-xs uppercase tracking-wider">{message.text}</span>
                </div>
            )}
        </div>
    );
}

export default BulkAdmissionManager;