// components/ViewStudentProfile.jsx (NEW FILE - For viewing and printing student records)

'use client';
import React, { useRef } from 'react';
import { HiOutlinePrinter, HiOutlineXCircle, HiOutlineUserCircle } from 'react-icons/hi';
import Image from 'next/image';

// Utility function to format date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return dateString;
    }
};

const formatTimestamp = (timestamp) => {
    if (timestamp?.toDate) {
        return formatDate(timestamp.toDate().toISOString().split('T')[0]);
    }
    return 'N/A';
};

function ViewStudentProfile({ studentData, onClose }) {
    const componentRef = useRef();

    const handlePrint = () => {
        // Use the browser's native print function
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 overflow-y-auto">
            <div className="flex justify-center items-start min-h-screen pt-10">
                <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-4xl mx-4 my-8 print:shadow-none print:m-0 print:max-w-full" ref={componentRef}>
                    
                    {/* Header - Hidden on Print */}
                    <div className="flex justify-between items-center border-b pb-4 mb-6 print:hidden">
                        <h3 className="text-2xl font-bold text-blue-700 flex items-center">
                            <HiOutlineUserCircle className="w-7 h-7 mr-2" />
                            Student Profile: {studentData.name}
                        </h3>
                        <div className="flex space-x-3">
                            <button 
                                onClick={handlePrint} 
                                className="flex items-center px-4 py-2 bg-indigo-500 text-white font-medium rounded-lg shadow hover:bg-indigo-600 transition"
                            >
                                <HiOutlinePrinter className="w-5 h-5 mr-2" />
                                Print
                            </button>
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-900">
                                <HiOutlineXCircle className="w-7 h-7" />
                            </button>
                        </div>
                    </div>

                    {/* Printable Content */}
                    <div className="space-y-6 p-4 md:p-8 border border-gray-200 rounded-lg print:border-none print:p-0">
                        
                        {/* Title for Print */}
                        <div className="hidden print:block text-center mb-6">
                            <h1 className="text-3xl font-bold text-gray-800">Student Enrollment Record</h1>
                            <p className="text-lg text-gray-600">Student ID: {studentData.studentId}</p>
                        </div>

                        {/* Top Section: Photo and Primary Info */}
                        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 pb-4 border-b">
                            
                            {/* Photo (Large size for profile) */}
                            <div className="w-32 h-32 flex-shrink-0">
                                {studentData.imageUrl ? (
                                    <Image
                                        src={studentData.imageUrl.replace('/upload/', '/upload/w_128,h_128,c_fill/')} // Larger profile size
                                        alt={`Photo of ${studentData.name}`}
                                        width={128}
                                        height={128}
                                        className="w-32 h-32 object-cover rounded-xl shadow-lg border-4 border-indigo-200"
                                    />
                                ) : (
                                    <div className="w-32 h-32 bg-gray-200 rounded-xl flex items-center justify-center text-sm text-gray-500">No Photo</div>
                                )}
                            </div>

                            {/* Primary Details */}
                            <div className="flex-grow">
                                <DetailItem label="Full Name" value={studentData.name} large />
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <DetailItem label="S.R. No." value={studentData.srNo} />
                                    <DetailItem label="Roll No." value={studentData.rollNo} />
                                    <DetailItem label="Class" value={studentData.grade} />
                                    <DetailItem label="Date of Birth" value={formatDate(studentData.dob)} />
                                </div>
                            </div>
                        </div>

                        {/* Detailed Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Parental Details */}
                            <SectionCard title="Parental Details">
                                <DetailItem label="Father's Name" value={studentData.fatherName} />
                                <DetailItem label="Mother's Name" value={studentData.motherName} />
                                <DetailItem label="Address" value={studentData.address} />
                            </SectionCard>

                            {/* Enrollment & Other Details */}
                            <SectionCard title="Enrollment & Other Details">
                                <DetailItem label="Admission Date" value={formatDate(studentData.admissionDate)} />
                                <DetailItem label="Gender" value={studentData.gender} />
                                <DetailItem label="Category" value={studentData.category} />
                                <DetailItem label="Record Created" value={formatTimestamp(studentData.createdAt)} />
                            </SectionCard>
                        </div>
                    </div>

                    {/* Footer for Print - Optional */}
                    <div className="hidden print:block text-center mt-6 text-sm text-gray-500">
                        <p>This record is generated from the Student Management System. Date Printed: {formatDate(new Date().toISOString().split('T')[0])}</p>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default ViewStudentProfile;

// --- Helper Components for View Profile ---

const DetailItem = ({ label, value, large = false }) => (
    <div className={`py-1 ${large ? 'mb-2' : ''}`}>
        <p className={`text-sm font-medium ${large ? 'text-lg text-indigo-700' : 'text-gray-500'}`}>{label}</p>
        <p className={`text-gray-800 ${large ? 'text-2xl font-bold' : 'text-base font-semibold'}`}>{value || 'N/A'}</p>
    </div>
);

const SectionCard = ({ title, children }) => (
    <div className="border border-gray-200 p-4 rounded-lg shadow-sm">
        <h4 className="text-lg font-bold text-gray-700 border-b pb-2 mb-3">{title}</h4>
        <div className="space-y-2">
            {children}
        </div>
    </div>
);