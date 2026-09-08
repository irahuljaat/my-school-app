'use client';

import React from 'react';

const DEFAULT_SCHOOL_LOGO = "https://res.cloudinary.com/db6ssceun/image/upload/v1771071585/SCHOOL_SENIOR_SECONDARY_LOGO_t88t8l.png";
const DEFAULT_FRONT_GRAPHIC = "https://res.cloudinary.com/db6ssceun/image/upload/v1772107780/12_tz2xx7.png";

// Fixed school configuration constant
const SCHOOL_DETAILS = {
    name: 'MVG Public Sr. Sec. School',
    address: 'Jaipur, Rajasthan',
    contact: '+91-0141-3152600, 8875646366, 9829018332',
    logoUrl: DEFAULT_SCHOOL_LOGO,
    marksheetsFront: DEFAULT_FRONT_GRAPHIC
};

export default function MarksheetTemplateKids({ 
    student = {}, 
    examResults = [], 
    activeSession = '2026-2027', 
    resultDate 
}) {
    const schoolDetails = SCHOOL_DETAILS;

    const extractClassFromId = (id) => {
        if (!id) return '—';
        const parts = String(id).split('_');
        return parts.length > 1 ? parts[1] : '—';
    };

    const studentClass = student.grade || extractClassFromId(student.id);
    const isHigherSecondary = ['11', '12'].includes(String(studentClass));

    const gradingSubjectList = ['G.K', 'GK', 'GENERAL KNOWLEDGE', 'COMPUTER', 'DRAWING', 'ART', 'CRAFT', 'YOGA', 'PHYSICAL EDUCATION'];

    const allSubjects = Array.from(new Set(
        examResults.flatMap(exam => (exam.subjects || []).map(s => s.name))
    ));

    const consolidatedData = allSubjects.map(subjectName => {
        const row = { subjectName };
        examResults.forEach(exam => {
            const studentMarks = exam.marks?.[student.id] || {};
            let markValue = studentMarks[subjectName];
            
            if (markValue === undefined) {
                const caseInsensitiveKey = Object.keys(studentMarks).find(
                    key => key.trim().toLowerCase() === subjectName.trim().toLowerCase()
                );
                markValue = caseInsensitiveKey ? studentMarks[caseInsensitiveKey] : '-';
            }
            row[exam.examName] = markValue;
        });
        return row;
    });

    const academicSubjects = isHigherSecondary 
        ? consolidatedData
        : consolidatedData.filter(row => !gradingSubjectList.includes(row.subjectName.trim().toUpperCase()));

    const gradedSubjects = isHigherSecondary 
        ? []
        : consolidatedData.filter(row => gradingSubjectList.includes(row.subjectName.trim().toUpperCase()));

    const academicCalculations = () => {
        let totalObtained = 0;
        let totalMax = 0;

        academicSubjects.forEach(row => {
            examResults.forEach(exam => {
                const subjectConfig = (exam.subjects || []).find(s => s.name === row.subjectName);
                const maxForThisPaper = subjectConfig ? parseFloat(subjectConfig.maxMarks || 100) : 100;
                const mark = parseFloat(row[exam.examName]);

                totalMax += maxForThisPaper;
                if (!isNaN(mark)) totalObtained += mark;
            });
        });

        const percentage = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
        return { totalObtained, totalMax, percentage };
    };

    const stats = academicCalculations();

    const calculateGrade = (pct) => {
        if (pct >= 91) return 'A1';
        if (pct >= 81) return 'A2';
        if (pct >= 71) return 'B1';
        if (pct >= 61) return 'B2';
        if (pct >= 51) return 'C1';
        if (pct >= 41) return 'C2';
        if (pct >= 33) return 'D';
        return 'E';
    };

    const calculateDivision = (pct) => {
        if (pct >= 60) return '1st Division';
        if (pct >= 45) return '2nd Division';
        if (pct >= 33) return '3rd Division';
        return 'Needs Improvement';
    };

    return (
        <div className="flex flex-col items-center gap-10 bg-slate-100 print:bg-white print:gap-0 print:p-0 select-none text-slate-800">
            
            {/* ========================================================= */}
            {/* PAGE 1: EXPANDED STUDENT PROFILE & SCHOOL PROMOTION SHOWCASE */}
            {/* ========================================================= */}
            <div 
                className="relative bg-white p-[14mm] flex flex-col justify-between border-2 border-amber-300 shadow-2xl print:shadow-none font-sans page-break-after-always overflow-hidden" 
                style={{ width: '210mm', height: '297mm', boxSizing: 'border-box' }}
            >
                {/* Decorative Accent Badges */}
                <div className="absolute -top-10 -left-10 w-28 h-28 bg-rose-500 rounded-full opacity-90 pointer-events-none" />
                <div className="absolute -top-12 -right-10 w-32 h-32 bg-blue-500 rounded-full opacity-90 pointer-events-none" />

                <div className="flex flex-col justify-between h-full">
                    
                    {/* Header: School Identity */}
                    <div>
                        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
                            <div className="flex items-center gap-4">
                                <img 
                                    src={schoolDetails.logoUrl} 
                                    alt="Logo" 
                                    className="w-16 h-16 object-contain" 
                                    onError={(e) => { e.target.src = DEFAULT_SCHOOL_LOGO; }}
                                />
                                <div>
                                    <h1 className="text-[21pt] font-black text-slate-900 tracking-tight leading-none uppercase">
                                        {schoolDetails.name}
                                    </h1>
                                    <p className="text-[9.5px] font-semibold text-slate-500 uppercase mt-1 tracking-wider">
                                        {schoolDetails.address} • Ph: {schoolDetails.contact}
                                    </p>
                                    <span className="inline-block mt-1 text-[8px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                        Official Cumulative Student Profile
                                    </span>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="inline-block px-4 py-1.5 bg-amber-500 text-white text-[9.5px] font-black uppercase tracking-widest rounded-full shadow-sm">
                                    Session {activeSession}
                                </span>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="text-center my-3">
                            <h2 className="text-[17pt] font-black text-slate-900 tracking-wider uppercase inline-block border-b-4 border-amber-400 pb-0.5">
                                STUDENT PROFILE & ENROLLMENT
                            </h2>
                        </div>
                    </div>

                    {/* EXPANDED STUDENT DETAILS SECTION (COVERS ~55% OF THE PAGE) */}
                    <div className="grid grid-cols-[160px_1fr] gap-7 items-center bg-slate-50/50 p-6 rounded-3xl border border-slate-200 my-1">
                        {/* Student Photo */}
                        <div className="w-[160px] h-[210px] bg-white border-2 border-slate-300 rounded-2xl overflow-hidden flex flex-col items-center justify-center shadow-xs">
                            {student.imageUrl || student.avatar ? (
                                <img src={student.imageUrl || student.avatar} className="w-full h-full object-cover" alt="Student" />
                            ) : (
                                <div className="text-center p-3">
                                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xl mb-1.5">
                                        👤
                                    </div>
                                    <span className="text-[8.5px] text-slate-400 font-black uppercase tracking-wider block">Student Photo</span>
                                </div>
                            )}
                        </div>

                        {/* Structured Detail Lines */}
                        <div className="space-y-3.5 text-[9.5pt]">
                            {[
                                { label: "Student Full Name", value: student.name || student.studentName || '—', bold: true, color: "text-slate-950 text-[12pt]" },
                                { label: "Class & Section", value: `${studentClass} - ${student.section || 'A'}`, bold: true, color: "text-amber-700 font-black text-[11pt]" },
                                { label: "Roll Number", value: student.rollNumber || student.rollNo || '—', bold: true },
                                { label: "Scholar / SR Number", value: student.srNo || '—', bold: true },
                                { label: "Date of Birth", value: student.dob || '—' },
                                { label: "Father's Name", value: student.fatherName || '—' },
                                { label: "Mother's Name", value: student.motherName || '—' },
                                { label: "Contact Phone", value: student.phone || student.contact || schoolDetails.contact.split(',')[0] },
                                { label: "Residential Address", value: student.address || schoolDetails.address }
                            ].map((item, i) => (
                                <div key={i} className="flex items-baseline justify-between border-b border-slate-200/90 pb-1">
                                    <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider w-48">
                                        {item.label}:
                                    </span>
                                    <span className={`text-right ${item.color || 'text-slate-800'} ${item.bold ? 'font-black' : 'font-bold'} uppercase flex-1`}>
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SCHOOL PROMOTION & CAMPUS SHOWCASE SECTION */}
                    <div className="rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 p-4 shadow-xs my-2">
                        <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-amber-200/80">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
                                🏫 Campus Infrastructure & Learning Environment
                            </span>
                            <span className="text-[8px] font-bold text-amber-700 uppercase bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300">
                                Official Campus Showcase
                            </span>
                        </div>

                        <div className="grid grid-cols-[230px_1fr] gap-5 items-center">
                            {/* Campus Graphic Showcase */}
                            <div className="w-[230px] h-[175px] rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-900 flex items-center justify-center">
                                <img 
                                    src={schoolDetails.marksheetsFront || DEFAULT_FRONT_GRAPHIC} 
                                    alt="Campus Building" 
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                />
                            </div>

                            {/* Promotional Highlights & Facilities Matrix */}
                            <div className="space-y-3 text-[8.5pt]">
                                <div className="p-3 rounded-2xl bg-white border border-amber-200/80 space-y-1">
                                    <p className="text-[9px] font-black uppercase text-amber-800 tracking-wide">
                                        Excellence in Holistic Education
                                    </p>
                                    <p className="text-[8px] font-medium text-slate-600 leading-relaxed">
                                        Providing modern foundational learning spaces, personalized mentorship, digital multimedia education, and sports training designed for student growth.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[8px] font-bold">
                                    <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center gap-1.5 text-slate-700 shadow-2xs">
                                        <span className="text-amber-500 font-black">✔</span> Smart Classrooms
                                    </div>
                                    <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center gap-1.5 text-slate-700 shadow-2xs">
                                        <span className="text-amber-500 font-black">✔</span> Activity Centers
                                    </div>
                                    <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center gap-1.5 text-slate-700 shadow-2xs">
                                        <span className="text-amber-500 font-black">✔</span> Safe Monitored Campus
                                    </div>
                                    <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center gap-1.5 text-slate-700 shadow-2xs">
                                        <span className="text-amber-500 font-black">✔</span> Creative Arts & Sports
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Page 1 Footer */}
                    <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center text-[8px] text-slate-400 font-semibold tracking-wider uppercase">
                        <span>{schoolDetails.name}</span>
                    </div>

                </div>
            </div>

            {/* ========================================================= */}
            {/* PAGE 2: MARKSHEET EVALUATION & CLASS REPORT              */}
            {/* ========================================================= */}
            <div 
                className="relative bg-white p-[12mm] flex flex-col justify-between border-2 border-amber-300 shadow-2xl print:shadow-none font-sans page-break-after-always overflow-hidden" 
                style={{ width: '210mm', height: '297mm', boxSizing: 'border-box' }}
            >
                {/* Decorative Top Shapes */}
                <div className="absolute -top-10 -left-10 w-28 h-28 bg-rose-500 rounded-full opacity-90 pointer-events-none" />
                <div className="absolute -top-12 -right-10 w-32 h-32 bg-blue-500 rounded-full opacity-90 pointer-events-none" />

                <div className="space-y-4">
                    {/* Header Banner */}
                    <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                        <div className="flex items-center gap-2">
                            <svg viewBox="0 0 100 100" className="w-10 h-10 -rotate-12 text-slate-800">
                                <polygon points="10,45 85,15 50,85 45,55" fill="white" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
                                <polygon points="45,55 85,15 50,85" className="fill-blue-500" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
                            </svg>
                            <span className="text-[14pt] font-black text-rose-500 font-mono -rotate-6 select-none">1+2=</span>
                        </div>

                        <div className="text-center">
                            <h2 className="text-[24pt] font-black text-slate-900 tracking-wider uppercase leading-none font-sans">
                                CLASS REPORT
                            </h2>
                            <p className="text-[8.5px] font-black text-amber-600 uppercase tracking-widest mt-0.5">
                                Continuous Comprehensive Evaluation
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-slate-800">
                            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-900 font-black text-xs flex items-center justify-center border-2 border-slate-800">
                                ABC
                            </div>
                            <svg viewBox="0 0 100 100" className="w-10 h-10">
                                <circle cx="28" cy="24" r="10" className="fill-rose-500" stroke="currentColor" strokeWidth="3"/>
                                <circle cx="72" cy="24" r="10" className="fill-rose-500" stroke="currentColor" strokeWidth="3"/>
                                <circle cx="50" cy="52" r="28" className="fill-emerald-400" stroke="currentColor" strokeWidth="3"/>
                                <circle cx="50" cy="52" r="20" fill="white"/>
                                <line x1="50" y1="52" x2="50" y2="40" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                                <line x1="50" y1="52" x2="60" y2="52" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                            </svg>
                        </div>
                    </div>

                    {/* Metadata Sub-Header */}
                    <div className="flex items-center justify-between px-4 py-2 bg-amber-50/70 rounded-xl border border-amber-200 text-[8.5pt]">
                        <p><span className="text-slate-400 font-bold uppercase text-[7.5pt]">Student Name:</span> <span className="font-black text-slate-900 uppercase">{student.name || student.studentName || '—'}</span></p>
                        <p><span className="text-slate-400 font-bold uppercase text-[7.5pt]">Class:</span> <span className="font-black text-slate-900">{studentClass} - {student.section || 'A'}</span></p>
                        <p><span className="text-slate-400 font-bold uppercase text-[7.5pt]">Roll No:</span> <span className="font-black text-amber-700">{student.rollNumber || student.rollNo || '—'}</span></p>
                        <p><span className="text-slate-400 font-bold uppercase text-[7.5pt]">Session:</span> <span className="font-black text-slate-900">{activeSession}</span></p>
                    </div>

                    {/* Marks Table */}
                    <div className="rounded-xl border-2 border-amber-500 overflow-hidden bg-white shadow-xs">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-amber-500 text-white text-[8.5px] font-black uppercase tracking-wider">
                                    <th className="py-2.5 px-3 text-left border-r border-amber-400" rowSpan="2">WE'RE LEARNING (SUBJECTS)</th>
                                    {examResults.map((exam, i) => (
                                        <th key={i} className="py-2.5 px-2 text-center border-r border-amber-400" colSpan="2">{exam.examName}</th>
                                    ))}
                                    <th className="py-2.5 px-3 text-center bg-orange-500 text-white" rowSpan="2">TOTAL</th>
                                </tr>
                                <tr className="bg-amber-50 text-[7.5px] font-extrabold uppercase text-amber-700 border-b border-amber-500">
                                    {examResults.map((_, i) => (
                                        <React.Fragment key={i}>
                                            <th className="p-1 border-r border-amber-200">Max</th>
                                            <th className="p-1 border-r border-amber-500">Obt</th>
                                        </React.Fragment>
                                    ))}
                                </tr>
                            </thead>
                            
                            <tbody>
                                {academicSubjects.map((row, i) => (
                                    <tr key={i} className="border-b border-amber-100 last:border-none text-[9.5px] hover:bg-amber-50/40">
                                        <td className="py-2.5 px-3 text-left border-r border-amber-100 font-bold text-slate-800">{row.subjectName}</td>
                                        {examResults.map((exam, exI) => {
                                            const subjectConfig = (exam.subjects || []).find(s => s.name === row.subjectName);
                                            const maxMarksValue = subjectConfig ? (subjectConfig.maxMarks || 100) : 100;
                                            return (
                                                <React.Fragment key={exI}>
                                                    <td className="py-2 text-center border-r border-amber-100 text-slate-400 font-semibold">{maxMarksValue}</td>
                                                    <td className="py-2 text-center border-r border-amber-100 font-black text-slate-800">{row[exam.examName]}</td>
                                                </React.Fragment>
                                            );
                                        })}
                                        <td className="py-2 text-center font-black bg-orange-50 text-orange-600">
                                            {examResults.reduce((sum, exam) => {
                                                const mark = parseFloat(row[exam.examName]);
                                                return sum + (isNaN(mark) ? 0 : mark);
                                            }, 0)}
                                        </td>
                                    </tr>
                                ))}

                                {!isHigherSecondary && gradedSubjects.length > 0 && (
                                    <tr className="bg-amber-50">
                                        <td colSpan={examResults.length * 2 + 2} className="py-2 px-3 text-[7.5px] font-black text-amber-700 uppercase tracking-widest text-center border-y border-amber-500">
                                            Co-Scholastic Activities (Grades)
                                        </td>
                                    </tr>
                                )}

                                {gradedSubjects.map((row, i) => (
                                    <tr key={i} className="border-b border-amber-100 last:border-0 bg-amber-50/20 text-[9px]">
                                        <td className="py-2 px-3 text-left border-r border-amber-100 font-bold text-slate-700">
                                            {row.subjectName}
                                        </td>
                                        {examResults.map((exam, exI) => (
                                            <td key={exI} colSpan="2" className="p-2 text-center border-r border-amber-100 font-black text-teal-700">
                                                {row[exam.examName]}
                                            </td>
                                        ))}
                                        <td className="py-2 text-center font-black text-slate-400 bg-amber-50 text-[8px]">GRADE</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* KPI Boxes */}
                    <div className="grid grid-cols-5 gap-3">
                        <div className="py-3.5 px-2 rounded-2xl border-2 border-amber-200 bg-amber-50/40 text-center flex flex-col justify-center shadow-xs">
                            <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider block mb-1">Grand Total</span>
                            <div className="text-sm font-black text-slate-900">{stats.totalObtained} / {stats.totalMax}</div>
                        </div>

                        <div className="py-3.5 px-2 rounded-2xl border-2 border-amber-500 bg-orange-50 text-center flex flex-col justify-center shadow-xs">
                            <span className="text-[7.5px] font-black uppercase text-orange-600 tracking-wider block mb-1">Percentage</span>
                            <div className="text-base font-black text-orange-600">{stats.percentage}%</div>
                        </div>

                        <div className="py-3.5 px-2 rounded-2xl border-2 border-amber-200 bg-amber-50/40 text-center flex flex-col justify-center shadow-xs">
                            <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider block mb-1">Division</span>
                            <div className="text-xs font-black text-slate-800">{calculateDivision(stats.percentage)}</div>
                        </div>

                        <div className="py-3.5 px-2 rounded-2xl border-2 border-amber-200 bg-amber-50/40 text-center flex flex-col justify-center shadow-xs">
                            <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider block mb-1">Grade</span>
                            <div className="text-sm font-black text-slate-800">{calculateGrade(stats.percentage)}</div>
                        </div>

                        <div className="py-3.5 px-2 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50/60 text-center flex flex-col justify-center shadow-xs">
                            <span className="text-[7.5px] font-black uppercase text-amber-800 tracking-wider block mb-1">Attendance</span>
                            <div className="text-[10px] font-mono font-bold text-slate-700 tracking-widest">
                                 / 
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hand-Written Remarks Box & Classroom Art */}
                <div className="space-y-4 my-2">
                    <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/20 p-3.5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[8.5px] font-black uppercase text-orange-600 tracking-wider flex items-center gap-1.5">
                                📝 Class Educator's Comprehensive Remarks :
                            </span>
                            <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">Teacher Verification</span>
                        </div>
                        <div className="h-24 rounded-xl border border-amber-200/80 bg-white p-3 flex flex-col justify-around">
                            <div className="border-b border-dashed border-slate-200 w-full" />
                            <div className="border-b border-dashed border-slate-200 w-full" />
                            <div className="border-b border-dashed border-slate-200 w-full" />
                            <div className="border-b border-dashed border-slate-200 w-full" />
                        </div>
                    </div>

                    <div className="rounded-2xl border-2 border-amber-200 bg-[#FFFDF9] p-4 text-slate-800 flex items-center justify-between">
                        {/* Paint Set */}
                        <div className="flex items-center gap-3">
                            <svg viewBox="0 0 50 100" className="w-8 h-16 -rotate-12">
                                <path d="M25,5 Q40,5 38,40 L34,45 L16,45 L12,40 Q10,5 25,5 Z" className="fill-amber-500" stroke="#2B2D42" strokeWidth="3"/>
                                <rect x="15" y="45" width="20" height="8" fill="#CBD5E1" stroke="#2B2D42" strokeWidth="3"/>
                                <path d="M18,53 L18,95 L32,95 L32,53 Z" className="fill-cyan-400" stroke="#2B2D42" strokeWidth="3"/>
                            </svg>
                            <svg viewBox="0 0 40 80" className="w-6 h-12 rotate-12">
                                <path d="M10,25 L30,25 L30,70 L10,70 Z" className="fill-blue-500" stroke="#2B2D42" strokeWidth="3"/>
                                <path d="M10,25 L20,5 L30,25 Z" className="fill-rose-500" stroke="#2B2D42" strokeWidth="3"/>
                            </svg>
                        </div>

                        {/* Toy Blocks */}
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white font-black text-sm flex items-center justify-center border-2 border-slate-800 shadow-xs">A</div>
                            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-900 font-black text-sm flex items-center justify-center border-2 border-slate-800 shadow-xs">B</div>
                            <div className="w-9 h-9 rounded-xl bg-blue-500 text-white font-black text-sm flex items-center justify-center border-2 border-slate-800 shadow-xs">C</div>
                        </div>

                        {/* Math Art */}
                        <div className="text-[28pt] font-black text-rose-500 tracking-wider -rotate-6 font-mono select-none drop-shadow-xs">
                            1+2=3
                        </div>

                        {/* Star Badges */}
                        <div className="flex gap-2">
                            <svg viewBox="0 0 24 24" className="w-7 h-7 text-slate-800 fill-amber-300 stroke-current" strokeWidth="2">
                                <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/>
                            </svg>
                            <svg viewBox="0 0 24 24" className="w-7 h-7 text-slate-800 fill-rose-500 stroke-current" strokeWidth="2">
                                <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/>
                            </svg>
                        </div>

                        {/* Planet */}
                        <svg viewBox="0 0 120 80" className="w-20 h-14 drop-shadow-xs">
                            <ellipse cx="60" cy="40" rx="55" ry="18" fill="none" className="stroke-amber-400" strokeWidth="6" transform="rotate(-15 60 40)"/>
                            <circle cx="60" cy="40" r="28" className="fill-teal-400" stroke="#2B2D42" strokeWidth="4"/>
                            <circle cx="52" cy="38" r="2.5" fill="#2B2D42"/>
                            <circle cx="68" cy="38" r="2.5" fill="#2B2D42"/>
                            <ellipse cx="46" cy="42" rx="2" ry="1.5" className="fill-pink-400"/>
                            <ellipse cx="74" cy="42" rx="2" ry="1.5" className="fill-pink-400"/>
                            <path d="M57,44 Q60,49 63,44" fill="none" stroke="#2B2D42" strokeWidth="2.5" strokeLinecap="round"/>
                            <path d="M8,52 Q60,68 112,28" fill="none" className="stroke-amber-400" strokeWidth="6" strokeLinecap="round"/>
                        </svg>
                    </div>
                </div>

                {/* Bottom Signatures & Issue Date */}
                <div className="pt-2 border-t-2 border-dashed border-amber-300">
                    <div className="grid grid-cols-3 gap-8 text-center pt-2">
                        <div>
                            <p className="text-[8.5px] font-black text-slate-700 uppercase tracking-wider">Class Teacher</p>
                            <p className="text-[7px] text-slate-400 font-semibold mt-0.5">Signature</p>
                        </div>
                        <div>
                            <p className="text-[8.5px] font-black text-slate-700 uppercase tracking-wider">Parent / Guardian</p>
                            <p className="text-[7px] text-slate-400 font-semibold mt-0.5">Signature</p>
                        </div>
                        <div>
                            <p className="text-[8.5px] font-black text-slate-700 uppercase tracking-wider">Principal Signature</p>
                            <p className="text-[7px] text-slate-400 font-semibold mt-0.5">Official Stamp</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-1.5 border-t border-slate-100 text-[7px] text-slate-400 font-medium">
                        <span>Date of Result: {resultDate ? new Date(resultDate).toLocaleDateString('en-GB') : '_________________'}</span>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    .page-break-after-always {
                        page-break-after: always !important;
                        break-after: page !important;
                    }
                }
            `}</style>
        </div>
    );
}