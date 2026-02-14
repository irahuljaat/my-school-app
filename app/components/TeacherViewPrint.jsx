// components/TeacherViewPrint.jsx
'use client';

import React, { useRef, useEffect } from 'react';
import { HiUserAdd, HiPrinter, HiX } from 'react-icons/hi';

// --- CONFIGURATION ---
const SCHOOL_NAME = "YOUR SCHOOL'S OFFICIAL NAME HERE";
const SCHOOL_ADDRESS = "123 School Lane, City, State - 123456"; 
// ---------------------

function TeacherViewPrint({ teacherData, onClose }) {
    const componentRef = useRef();

    useEffect(() => {
        // Automatically trigger print shortly after component mounts
        const printTimer = setTimeout(() => {
            handlePrint();
        }, 300);

        return () => clearTimeout(printTimer);
    }, []);

    const handlePrint = () => {
        if (!componentRef.current) return;

        // Use the reliable manual print window method
        const content = componentRef.current.innerHTML;
        const printWindow = window.open('', '_blank', 'height=600,width=800,scrollbars=yes');

        if (!printWindow) {
            alert('Popup blocked. Please allow popups for printing.');
            return;
        }

        // 1. Copy ALL styles from the main window's head (crucial for Tailwind)
        const allStyles = document.head.innerHTML;
        
        // 2. Add specific print styles for optimized receipt layout
        const criticalPrintStyles = `
            <style>
                @page { size: A4; margin: 15mm; } 
                .no-print { display: none !important; }
                body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 11pt; }
                .print-container { width: 100%; max-width: 800px; margin: 0 auto; padding: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                .heading { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                .section-title { font-weight: bold; margin-top: 15px; margin-bottom: 5px; border-bottom: 1px dashed #ccc; }
            </style>
        `;

        printWindow.document.write('<!DOCTYPE html><html><head>');
        printWindow.document.write(allStyles);
        printWindow.document.write(criticalPrintStyles);
        printWindow.document.write(`<title>Teacher Profile - ${teacherData.name}</title>`);
        printWindow.document.write('</head><body>');
        printWindow.document.write(content);
        printWindow.document.write('</body></html>');
        printWindow.document.close();

        // 3. Trigger Print
        setTimeout(() => {
            printWindow.focus(); 
            printWindow.print();
            // Optional: Close the main view after printing starts
            // printWindow.onafterprint = onClose; // This only works in some browsers
        }, 500); 
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                
                <div className="flex justify-between items-center mb-4 border-b pb-2 no-print">
                    <h3 className="text-xl font-semibold text-gray-800">Printable Teacher Profile</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 font-semibold p-2 rounded-full hover:bg-gray-100">
                        <HiX className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex justify-end mb-4 no-print">
                    <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">
                        <HiPrinter className="w-5 h-5 mr-2" /> Print/Reprint
                    </button>
                </div>


                {/* --- PRINT CONTENT AREA --- */}
                <div ref={componentRef} className="text-sm print-container">
                    
                    <div className="heading">
                        <h3 className="text-xl font-bold">{SCHOOL_NAME}</h3>
                        <p className="text-gray-600 text-sm">{SCHOOL_ADDRESS}</p>
                        <h4 className="font-bold mt-3 text-lg">TEACHER PROFILE & DETAILS</h4>
                    </div>

                    <div className="flex mb-6">
                        {/* Photo */}
                        <div className="w-1/4 pr-4">
                            <img 
                                src={teacherData.imageUrl || 'https://via.placeholder.com/150?text=Photo'} 
                                alt={teacherData.name} 
                                className="w-32 h-32 object-cover border border-gray-300 mx-auto"
                            />
                        </div>
                        {/* Main Details */}
                        <div className="w-3/4">
                            <h5 className="section-title">Personal Information</h5>
                            <table>
                                <tbody>
                                    <tr><td className="w-1/3 font-semibold">Name:</td><td>{teacherData.name}</td></tr>
                                    <tr><td className="w-1/3 font-semibold">ID No:</td><td>{teacherData.srNo}</td></tr>
                                    <tr><td className="w-1/3 font-semibold">Joining Date:</td><td>{teacherData.joiningDate}</td></tr>
                                    <tr><td className="w-1/3 font-semibold">Status:</td><td>{teacherData.status || 'Active'}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <h5 className="section-title">Contact & Address</h5>
                    <table>
                        <tbody>
                            <tr><td className="w-1/4 font-semibold">Phone:</td><td>{teacherData.phone}</td></tr>
                            <tr><td className="w-1/4 font-semibold">Email:</td><td>{teacherData.email}</td></tr>
                            <tr><td className="w-1/4 font-semibold">Address:</td><td>{teacherData.address}</td></tr>
                        </tbody>
                    </table>

                    <h5 className="section-title">Academic & Salary</h5>
                    <table>
                        <tbody>
                            <tr><td className="w-1/4 font-semibold">Qualification:</td><td>{teacherData.qualification}</td></tr>
                            <tr><td className="w-1/4 font-semibold">Subjects:</td><td>{teacherData.subjectsTaught}</td></tr>
                            <tr><td className="w-1/4 font-semibold">Monthly Salary:</td><td>₹{teacherData.salary}</td></tr>
                        </tbody>
                    </table>
                    
                    <div className="mt-10 flex justify-between pt-6 border-t border-gray-400">
                        <div className="text-center w-1/3">_________________________<p>Signature (Employee)</p></div>
                        <div className="text-center w-1/3">_________________________<p>Authorized Signature</p></div>
                    </div>
                </div>
                {/* --- END PRINT CONTENT AREA --- */}

            </div>
        </div>
    );
}

export default TeacherViewPrint;