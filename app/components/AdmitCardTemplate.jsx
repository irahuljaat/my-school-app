// components/AdmitCardTemplate.jsx
import React from 'react';
import { HiOutlineUserCircle, HiOutlineAcademicCap } from 'react-icons/hi';

const SCHOOL_LOGO_BASE64 = "https://res.cloudinary.com/db6ssceun/image/upload/v1771071585/SCHOOL_SENIOR_SECONDARY_LOGO_t88t8l.png";

function AdmitCardTemplate({ student, data }) {
    const { examName, schedule } = data;

    // Helper function to format YYYY-MM-DD to DD-MM-YYYY
    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === 'N/A') return 'N/A';
        // Split by hyphen, reverse, and join
        return dateStr.split('-').reverse().join('-');
    };

    const studentData = {
        name: student.name || 'N/A',
        fathersName: student.fatherName || 'N/A', 
        dob: formatDate(student.dob), // Formatted here
        rollNo: student.rollNumber || 'N/A', 
        grade: student.grade || 'N/A',
        image: student.imageUrl || null, 
    };

    const ScheduleColumn = ({ items }) => (
        items.length === 0 ? <div /> : (
            <table className="min-w-full divide-y divide-blue-300 border border-blue-200">
                <thead className="bg-blue-100">
                    <tr>
                        <th className="px-3 py-1 text-left text-[10px] font-bold text-blue-700 uppercase tracking-wider w-1/4">Date</th>
                        <th className="px-3 py-1 text-left text-[10px] font-bold text-blue-700 uppercase tracking-wider w-1/4">Time</th>
                        <th className="px-3 py-1 text-left text-[10px] font-bold text-blue-700 uppercase tracking-wider w-1/2">Subject</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-blue-200 text-[10px]">
                    {items.map((item, index) => (
                        <tr key={index}>
                            {/* If the timetable date is also YYYY-MM-DD, format it here too */}
                            <td className="px-3 py-0.5 whitespace-nowrap">{formatDate(item.date)}</td>
                            <td className="px-3 py-0.5 whitespace-nowrap">{item.time}</td>
                            <td className="px-3 py-0.5 whitespace-nowrap uppercase font-medium">{item.subjectName}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )
    );

    const totalSubjects = schedule?.length || 0;
    const midPoint = Math.ceil(totalSubjects / 2); 
    const leftColumnSchedule = schedule ? schedule.slice(0, midPoint) : [];
    const rightColumnSchedule = schedule ? schedule.slice(midPoint) : [];

    return (
        <div className="admit-card-template p-4 border-2 border-blue-700 shadow-md bg-white w-[7.5in] h-[5in] mx-auto overflow-hidden relative">
            <header className="text-center border-b-2 border-blue-900 pb-2 mb-3">
                <div className="flex items-center justify-center space-x-4">
                    <div className="w-12 h-12 flex-shrink-0">
                        <img 
                            src={SCHOOL_LOGO_BASE64} 
                            alt="School Logo" 
                            crossOrigin="anonymous" 
                            className="w-full h-full object-contain" 
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-blue-800 leading-tight">MVG PUBLIC SR. SEC. SCHOOL</h1>
                        <p className="text-[10px] font-bold text-gray-600 uppercase">Shyopur, Pratap Nagar, Sanganer, Jaipur </p>
                        <p className="text-[10px] font-bold text-gray-600 uppercase">0141-3152600, 9829018332, 8875646366 </p>
                    </div>
                </div>
                <h2 className="text-lg font-black mt-1 text-rose-600 uppercase  tracking-tighter">ADMIT CARD  {examName}</h2>
            </header>

            <div className="flex justify-between items-start mb-3 p-3 border border-blue-200 rounded-xl bg-blue-50/50">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs flex-grow font-semibold text-slate-700">
                    <p><span className="text-blue-800 font-black uppercase text-[9px] block">Student Name</span> {studentData.name}</p>
                    <p><span className="text-blue-800 font-black uppercase text-[9px] block">Father's Name</span> {studentData.fathersName}</p>
                    <p><span className="text-blue-800 font-black uppercase text-[9px] block">Class / Grade</span> {studentData.grade}</p>
                    <p><span className="text-blue-800 font-black uppercase text-[9px] block">Date of Birth</span> {studentData.dob}</p>
                    <p className="col-span-2"><span className="text-blue-800 font-black uppercase text-[9px] block">Roll Number</span> {studentData.rollNo}</p>
                </div>
                
                <div className="w-24 h-24 border-2 border-blue-800 p-0.5 rounded-lg bg-white shadow-sm ml-4 overflow-hidden flex-shrink-0">
                    {studentData.image ? (
                        <img 
                            src={studentData.image} 
                            alt="Student" 
                            crossOrigin="anonymous" 
                            className="w-full h-full object-cover rounded" 
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            <HiOutlineUserCircle className="w-12 h-12" />
                            <span className="text-[8px] font-bold uppercase">No Photo</span>
                        </div>
                    )}
                </div>
            </div>

            <h3 className="font-black text-[10px] uppercase tracking-widest mb-2 text-blue-800 flex items-center">
                <HiOutlineAcademicCap className="w-4 h-4 mr-1 text-rose-500" /> Examination Time Table
            </h3>
            
            {schedule && schedule.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-4">
                    <div className="border-r border-blue-100 pr-2">
                        <ScheduleColumn items={leftColumnSchedule} />
                    </div>
                    <div>
                        <ScheduleColumn items={rightColumnSchedule} />
                    </div>
                </div>
            ) : (
                <div className="text-center py-4 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-rose-500 font-black text-[10px] uppercase italic">Time table schedule pending update</p>
                </div>
            )}

            <footer className="absolute bottom-4 left-4 right-4 flex justify-between items-end px-4">
                <div className="text-center">
                    <div className="h-10"></div>
                    <p className="border-t-2 border-slate-800 w-32 pt-1 font-black text-[9px] uppercase text-slate-800">Student Signature</p>
                </div>
                <div className="text-center">
                    <div className="h-10"></div>
                    <p className="border-t-2 border-slate-800 w-32 pt-1 font-black text-[9px] uppercase text-slate-800">Principal Signature</p>
                </div>
            </footer>
        </div>
    );
}

export default AdmitCardTemplate;