// components/AdmitCardTemplate.jsx
import React from 'react';
import { HiOutlineUserCircle, HiOutlineAcademicCap } from 'react-icons/hi';

// --- Placeholder for School Logo ---
// Replace this with a real Base64 string for faster PDF embedding.
const SCHOOL_LOGO_BASE64 = "https://res.cloudinary.com/db6ssceun/image/upload/v1765522459/LOGO_2_w2spav.png";

// This component expects student and data objects, and the imageUrl prop.
function AdmitCardTemplate({ student, data, imageUrl }) {
    const { examName, schedule } = data;

    // Mapping properties for safety and display
    const studentData = {
        name: student.name || 'N/A',
        fathersName: student.fatherName || 'N/A', // Assuming fatherName from DB
        dob: student.dob || 'N/A',
        rollNo: student.rollNumber || 'N/A', // Assuming rollNumber from DB
        grade: student.grade || 'N/A',
        image: imageUrl || null, // Using the dedicated imageUrl prop
    };

    // Helper component to render a single timetable column
    const ScheduleColumn = ({ items }) => (
        items.length === 0 ? <div /> : (
            <table className="min-w-full divide-y divide-blue-300 border border-blue-200">
                <thead className="bg-blue-100">
                    <tr>
                        <th className="px-3 py-1 text-left text-xs font-bold text-blue-700 uppercase tracking-wider w-1/4">Date</th>
                        <th className="px-3 py-1 text-left text-xs font-bold text-blue-700 uppercase tracking-wider w-1/4">Time</th>
                        <th className="px-3 py-1 text-left text-xs font-bold text-blue-700 uppercase tracking-wider w-1/2">Subject</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-blue-200 text-xs">
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td className="px-3 py-1 whitespace-nowrap">{item.date}</td>
                            <td className="px-3 py-1 whitespace-nowrap">{item.time}</td>
                            <td className="px-3 py-1 whitespace-nowrap">{item.subjectName}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )
    );

    // --- LOGIC: Split Schedule into Two Columns ---
    const totalSubjects = schedule?.length || 0;
    const midPoint = Math.ceil(totalSubjects / 2); 
    const leftColumnSchedule = schedule ? schedule.slice(0, midPoint) : [];
    const rightColumnSchedule = schedule ? schedule.slice(midPoint) : [];
    // ---------------------------------------------------

    return (
        <div className="admit-card-template p-4 border-2 border-blue-700 shadow-md bg-white w-[7.5in] h-[5.2in] mx-auto overflow-hidden">
            
            {/* School Header & Logo */}
            <header className="text-center border-b-2 border-blue-900 pb-2 mb-3">
                <div className="flex items-center justify-center space-x-4">
                    <div className="w-12 h-12 flex-shrink-0">
                        <img 
                            src={SCHOOL_LOGO_BASE64} 
                            alt="School Logo" 
                            // This attribute is CRITICAL for html2canvas to work with remote images
                            crossOrigin="anonymous" 
                            className="w-full h-full object-contain" 
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-blue-800 leading-tight">MVG PUBLIC SCHOOL</h1>
                        <p className="text-xs text-gray-600 leading-none">Shyopur, Pratap Nagar, Sanganer, Jaipur </p>
                    </div>
                </div>
                <h2 className="text-lg font-bold mt-1 text-red-600 uppercase">ADMIT CARD - {examName}</h2>
            </header>

            {/* Student & Photo Section */}
            <div className="flex justify-between items-start mb-3 p-2 border border-gray-300 rounded-md bg-blue-50">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs flex-grow">
                    <p><strong>Name:</strong> {studentData.name}</p>
                    <p><strong>Father's Name:</strong> {studentData.fathersName}</p>
                    <p><strong>Class:</strong> {studentData.grade}</p>
                    <p><strong>Date of Birth:</strong> {studentData.dob}</p>
                    <p className="col-span-2"><strong>Roll No:</strong> {studentData.rollNo}</p>
                </div>
                
                {/* Student Photo */}
                <div className="w-20 h-20 border border-gray-400 flex items-center justify-center bg-white shadow-sm ml-2 flex-shrink-0">
                    {studentData.image ? (
                        <img 
                            src={studentData.image} 
                            alt="Student" 
                            crossOrigin="anonymous" // CRITICAL for external image URLs
                            className="w-full h-full object-cover" 
                        />
                    ) : (
                        <HiOutlineUserCircle className="w-12 h-12 text-gray-400" />
                    )}
                </div>
            </div>

            {/* Exam Schedule / Time Table */}
            <h3 className="font-semibold text-sm mt-4 mb-1 border-b pb-1 text-blue-700 flex items-center">
                <HiOutlineAcademicCap className="w-4 h-4 mr-1" /> Examination Time Table
            </h3>
            
            {schedule && schedule.length > 0 ? (
                // TWO-COLUMN TIMETABLE LAYOUT
                <div className="grid grid-cols-2 gap-x-4">
                    <div><ScheduleColumn items={leftColumnSchedule} /></div>
                    <div><ScheduleColumn items={rightColumnSchedule} /></div>
                </div>
            ) : (
                <p className="text-center text-red-500 text-xs py-2 border rounded-md">Time table not available.</p>
            )}

            {/* Footer / Signatures */}
            <footer className="flex justify-between mt-3 pt-2 text-xs border-t border-dashed">
                <div className="text-center">
                    <p className="mt-4 border-t border-gray-600 w-24 pt-0.5">Student Signature</p>
                </div>
                <div className="text-center">
                    <p className="mt-4 border-t border-gray-600 w-24 pt-0.5">Principal Signature</p>
                </div>
            </footer>
        </div>
    );
}

export default AdmitCardTemplate;