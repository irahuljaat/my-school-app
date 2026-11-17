// components/AdmitCardTemplate.jsx
import React from 'react';
import { HiOutlineUserCircle, HiOutlineAcademicCap } from 'react-icons/hi';

const SCHOOL_LOGO_BASE64 = "https://res.cloudinary.com/db6ssceun/image/upload/v1771071585/SCHOOL_SENIOR_SECONDARY_LOGO_t88t8l.png";

function AdmitCardTemplate({ student, data }) {
    const { examName, schedule } = data;

    // Helper function to format YYYY-MM-DD to DD-MM-YYYY
    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === 'N/A') return 'N/A';
        return dateStr.split('-').reverse().join('-');
    };

    const studentData = {
        name: student.name || 'N/A',
        fathersName: student.fatherName || 'N/A', 
        dob: formatDate(student.dob),
        rollNo: student.rollNumber || 'N/A', 
        grade: student.grade || 'N/A',
        image: student.imageUrl || null, 
    };

    const ScheduleColumn = ({ items }) => (
        items.length === 0 ? <div /> : (
            <table className="min-w-full divide-y divide-blue-200 border border-blue-200 rounded-lg overflow-hidden">
                <thead className="bg-blue-50">
                    <tr>
                        <th className="px-2.5 py-1 text-left text-[9px] font-black text-blue-900 uppercase tracking-wider w-[28%]">Date</th>
                        <th className="px-2.5 py-1 text-left text-[9px] font-black text-blue-900 uppercase tracking-wider w-[32%]">Time</th>
                        <th className="px-2.5 py-1 text-left text-[9px] font-black text-blue-900 uppercase tracking-wider w-[40%]">Subject</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-blue-100 text-[9.5px]">
                    {items.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                            <td className="px-2.5 py-1 whitespace-nowrap font-medium text-slate-700">{formatDate(item.date)}</td>
                            <td className="px-2.5 py-1 whitespace-nowrap font-medium text-slate-600">{item.time}</td>
                            <td className="px-2.5 py-1 whitespace-nowrap uppercase font-bold text-slate-900">{item.subjectName}</td>
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
        <div className="admit-card-template p-4 border border-slate-300 shadow-sm bg-white w-[7.5in] h-[5in] mx-auto overflow-hidden relative flex flex-col justify-between">
            <div>
                {/* Header Section */}
                <header className="border-b-2 border-blue-900 pb-2 mb-2.5">
                    <div className="flex items-center justify-between">
                        <div className="w-11 h-11 flex-shrink-0">
                            <img 
                                src={SCHOOL_LOGO_BASE64} 
                                alt="School Logo" 
                                crossOrigin="anonymous" 
                                className="w-full h-full object-contain" 
                            />
                        </div>
                        <div className="text-center flex-grow px-2">
                            <h1 className="text-xl font-black text-blue-900 tracking-tight leading-none">MVG PUBLIC SR. SEC. SCHOOL</h1>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">Shyopur, Pratap Nagar, Sanganer, Jaipur</p>
                            <p className="text-[8.5px] font-semibold text-slate-400 tracking-wider">Mob: 0141-3152600, 9829018332</p>
                        </div>
                        <div className="w-11 flex-shrink-0"></div> {/* Spacer for symmetry */}
                    </div>
                    <div className="mt-1.5 text-center bg-blue-900 text-white py-0.5 rounded shadow-sm">
                        <h2 className="text-xs font-black tracking-widest uppercase">ADMIT CARD — {examName}</h2>
                    </div>
                </header>

                {/* Student Info & Passport Photo Box */}
                <div className="flex justify-between items-center mb-3 p-2.5 border border-slate-200 rounded-xl bg-slate-50/70 shadow-2xs">
                    <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-xs flex-grow font-medium text-slate-700">
                        <div>
                            <span className="text-blue-900 font-extrabold uppercase text-[8px] tracking-wider block">Student Name</span>
                            <span className="font-bold text-slate-900 text-xs">{studentData.name}</span>
                        </div>
                        <div>
                            <span className="text-blue-900 font-extrabold uppercase text-[8px] tracking-wider block">Father's Name</span>
                            <span className="font-semibold text-slate-800 text-xs">{studentData.fathersName}</span>
                        </div>
                        <div>
                            <span className="text-blue-900 font-extrabold uppercase text-[8px] tracking-wider block">Roll Number</span>
                            <span className="font-black text-rose-600 text-xs">{studentData.rollNo}</span>
                        </div>
                        <div>
                            <span className="text-blue-900 font-extrabold uppercase text-[8px] tracking-wider block">Class / Grade</span>
                            <span className="font-semibold text-slate-800 text-xs">{studentData.grade}</span>
                        </div>
                        <div>
                            <span className="text-blue-900 font-extrabold uppercase text-[8px] tracking-wider block">Date of Birth</span>
                            <span className="font-semibold text-slate-800 text-xs">{studentData.dob}</span>
                        </div>
                    </div>
                    
                    {/* Official Passport Photo Box (~3.5cm x 4.5cm proportioned) */}
                    <div className="w-[2.6cm] h-[3.2cm] border-2 border-slate-300 p-0.5 rounded bg-white shadow-xs ml-3 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {studentData.image ? (
                            <img 
                                src={studentData.image} 
                                alt="Student" 
                                crossOrigin="anonymous" 
                                className="w-full h-full object-cover rounded-xs" 
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                                <HiOutlineUserCircle className="w-10 h-10 text-slate-300" />
                                <span className="text-[7px] font-bold uppercase tracking-tighter text-slate-400 mt-0.5">Passport Photo</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Examination Schedule Header */}
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <h3 className="font-black text-[9.5px] uppercase tracking-wider text-blue-900 flex items-center">
                        <HiOutlineAcademicCap className="w-3.5 h-3.5 mr-1 text-rose-600" /> Examination Time Table
                    </h3>
                </div>
                
                {schedule && schedule.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-3">
                        <div>
                            <ScheduleColumn items={leftColumnSchedule} />
                        </div>
                        <div>
                            <ScheduleColumn items={rightColumnSchedule} />
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-3 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                        <p className="text-rose-500 font-bold text-[9px] uppercase italic">Time table schedule pending update</p>
                    </div>
                )}
            </div>

            {/* Footer Signatures */}
            <footer className="flex justify-between items-end px-2 pt-2 mt-auto border-t border-slate-100">
                <div className="text-center">
                    <div className="h-6"></div>
                    <p className="border-t border-slate-400 w-28 pt-0.5 font-bold text-[8.5px] uppercase text-slate-600 tracking-wider">Student Signature</p>
                </div>
                <div className="text-center">
                    <div className="h-6"></div>
                    <p className="border-t border-slate-400 w-28 pt-0.5 font-bold text-[8.5px] uppercase text-slate-600 tracking-wider">Principal Signature</p>
                </div>
            </footer>
        </div>
    );
}

export default AdmitCardTemplate;