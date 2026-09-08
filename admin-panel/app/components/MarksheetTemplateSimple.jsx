'use client';

import React from 'react';

const DEFAULT_SCHOOL_LOGO = "https://res.cloudinary.com/db6ssceun/image/upload/v1771071585/SCHOOL_SENIOR_SECONDARY_LOGO_t88t8l.png";

/**
 * MarksheetTemplateSimple - Formal Academic Template
 * Dynamically accepts school details via props or falls back to defaults,
 * optimized single-page layout to prevent overflowing.
 */
function MarksheetTemplateSimple({ 
    student = {}, 
    examResults = [], 
    activeSession = '2026-2027', 
    resultDate,
    schoolInfo = {} // Added prop for dynamic school configuration
}) {
    // Dynamic school details with sensible fallbacks
    const schoolDetails = {
        name: schoolInfo.name || schoolInfo.schoolName || 'MVG Public Sr. Sec. School',
        address: schoolInfo.address || schoolInfo.schoolAddress || 'Jaipur, Rajasthan',
        contact: schoolInfo.contact || schoolInfo.phone || '-91-0141-3152600, 8875646366, 9829018332',
        logoUrl: schoolInfo.logoUrl || schoolInfo.logo || DEFAULT_SCHOOL_LOGO
    };

    const extractClassFromId = (id) => {
        if (!id) return '—';
        const parts = String(id).split('_');
        return parts.length > 1 ? parts[1] : '—';
    };

    const studentClass = student.grade || student.className || extractClassFromId(student.id);
    const isHigherSecondary = ['11', '12'].includes(String(studentClass));

    // Co-scholastic/graded subjects classification
    const gradingSubjectList = ['G.K', 'GK', 'GENERAL KNOWLEDGE', 'COMPUTER', 'DRAWING', 'ART', 'CRAFT', 'YOGA', 'PHYSICAL EDUCATION'];

    // All distinct subjects across exams
    const allSubjects = Array.from(new Set(
        examResults.flatMap(exam => (exam.subjects || []).map(s => s.name || s))
    )).filter(Boolean);

    // Consolidated subject rows with dynamic mark values
    const consolidatedData = allSubjects.map(subjectName => {
        const row = { subjectName };
        examResults.forEach(exam => {
            const studentMarks = exam.marks?.[student.id] || exam.marks?.[student._id] || exam.marks?.[student.rollNumber] || {};
            let markValue = studentMarks[subjectName] ?? studentMarks.subjects?.[subjectName];
            
            if (markValue === undefined) {
                const caseInsensitiveKey = Object.keys(studentMarks).find(
                    key => key.trim().toLowerCase() === subjectName.trim().toLowerCase()
                );
                markValue = caseInsensitiveKey ? (studentMarks[caseInsensitiveKey]?.marks ?? studentMarks[caseInsensitiveKey]) : '-';
            }
            row[exam.examName] = typeof markValue === 'object' ? (markValue.marks ?? '-') : markValue;
        });
        return row;
    });

    const academicSubjects = isHigherSecondary 
        ? consolidatedData 
        : consolidatedData.filter(row => !gradingSubjectList.includes(row.subjectName.trim().toUpperCase()));

    const gradedSubjects = isHigherSecondary 
        ? [] 
        : consolidatedData.filter(row => gradingSubjectList.includes(row.subjectName.trim().toUpperCase()));

    // Academic Calculations
    let totalObtained = 0;
    let totalMax = 0;

    academicSubjects.forEach(row => {
        examResults.forEach(exam => {
            const subjectConfig = (exam.subjects || []).find(s => (s.name || s) === row.subjectName);
            const maxForPaper = subjectConfig && typeof subjectConfig === 'object' ? parseFloat(subjectConfig.maxMarks || 100) : 100;
            const mark = parseFloat(row[exam.examName]);

            totalMax += maxForPaper;
            if (!isNaN(mark)) totalObtained += mark;
        });
    });

    const percentage = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2)) : 0;

    const calculateDivision = (pct) => {
        if (pct >= 60) return '1st Division';
        if (pct >= 45) return '2nd Division';
        if (pct >= 33) return '3rd Division';
        return 'Needs Improvement';
    };

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

    return (
        <div className="relative w-[210mm] h-[297mm] mx-auto bg-white text-slate-800 p-8 flex flex-col justify-between font-sans box-border border border-slate-300 select-none shadow-xl print:shadow-none print:border-none overflow-hidden">
            
            {/* Centered School Logo Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <img 
                    src={schoolDetails.logoUrl} 
                    alt="Watermark" 
                    className="w-[110mm] h-[110mm] object-contain opacity-[0.04] grayscale"
                    onError={(e) => { e.target.src = DEFAULT_SCHOOL_LOGO; }}
                />
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 flex flex-col flex-grow justify-between">
                <div>
                    {/* Formal School Header */}
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-3 gap-4">
                        <div className="flex items-center gap-3">
                            <img 
                                src={schoolDetails.logoUrl} 
                                alt="School Logo" 
                                className="w-14 h-14 object-contain" 
                                onError={(e) => { e.target.src = DEFAULT_SCHOOL_LOGO; }}
                            />
                            <div className="text-left">
                                <h1 className="text-xl font-black uppercase text-slate-900 tracking-tight leading-none">
                                    {schoolDetails.name}
                                </h1>
                                <p className="text-[9.5px] font-semibold uppercase text-slate-600 mt-1">
                                    {schoolDetails.address} • Ph: {schoolDetails.contact}
                                </p>
                                <p className="text-[11px] font-bold tracking-wider uppercase text-blue-950 mt-0.5">
                                    Academic Performance Report & Marksheet
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-300 text-[9.5px] font-black uppercase tracking-wider rounded">
                                Session {activeSession || '2026-2027'}
                            </span>
                        </div>
                    </div>

                    {/* Student Profile Block */}
                    <div className="grid grid-cols-[1fr_110px] gap-4 items-center border border-slate-300 bg-white/90 p-3 mb-3 rounded shadow-2xs">
                        <div className="space-y-1 text-[9pt]">
                            {[
                                { label: "Student Full Name", value: student.name || student.studentName || '—', color: "text-slate-950 font-black" },
                                { label: "Father's Name", value: student.fatherName || '—' },
                                { label: "Mother's Name", value: student.motherName || '—' },
                                { label: "Class & Section", value: `${studentClass} - ${student.section || 'A'}`, color: "text-blue-950 font-black" },
                                { label: "Roll Number", value: student.rollNumber || student.rollNo || student.admissionNo || '—' },
                                { label: "Scholar / SR Number", value: student.srNo || '—' },
                                { label: "Date of Birth", value: student.dob || '—' },
                                { label: "Result Status", value: percentage >= 33 ? 'PASSED' : 'DETAINED', color: percentage >= 33 ? 'text-emerald-700 font-black' : 'text-rose-700 font-black' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-baseline justify-between py-0.5 border-b border-slate-100 last:border-0">
                                    <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-wider w-36">
                                        {item.label}:
                                    </span>
                                    <span className={`flex-1 text-left uppercase text-[8.5pt] ${item.color || 'text-slate-800 font-semibold'}`}>
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Student Photo */}
                        <div className="w-[105px] h-[140px] border border-slate-300 bg-slate-50 rounded overflow-hidden flex flex-col items-center justify-center shadow-inner justify-self-center">
                            {student.imageUrl || student.avatar ? (
                                <img 
                                    src={student.imageUrl || student.avatar} 
                                    alt="Student" 
                                    className="w-full h-full object-cover" 
                                />
                            ) : (
                                <div className="text-center p-2 text-slate-400">
                                    <div className="text-xl mb-1">👤</div>
                                    <span className="text-[7px] font-black uppercase tracking-wider block">No Photo</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Marks Table */}
                    <table className="w-full border-collapse border border-slate-300 text-center text-[9.5px] mb-3 bg-white/95">
                        <thead>
                            <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider">
                                <th className="border border-slate-700 p-1.5 text-left" rowSpan="2">Subject Name</th>
                                {examResults.map((ex, i) => (
                                    <th key={i} className="border border-slate-700 p-1.5" colSpan="2">
                                        {ex.examName}
                                    </th>
                                ))}
                                <th className="border border-slate-700 p-1.5 bg-blue-950" rowSpan="2">Total Marks</th>
                            </tr>
                            <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[8.5px] border-b border-slate-300">
                                {examResults.map((_, i) => (
                                    <React.Fragment key={i}>
                                        <th className="border border-slate-300 p-1 w-10 text-slate-500">Max</th>
                                        <th className="border border-slate-300 p-1 w-10">Obt</th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {academicSubjects.map((row, idx) => {
                                let subTotal = 0;
                                return (
                                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50/60">
                                        <td className="border border-slate-300 p-1.5 text-left font-bold text-slate-800">{row.subjectName}</td>
                                        {examResults.map((ex, exI) => {
                                            const subConfig = (ex.subjects || []).find(s => (s.name || s) === row.subjectName);
                                            const maxVal = subConfig && typeof subConfig === 'object' ? (subConfig.maxMarks || 100) : 100;
                                            const markVal = row[ex.examName];
                                            const num = parseFloat(markVal);
                                            if (!isNaN(num)) subTotal += num;

                                            return (
                                                <React.Fragment key={exI}>
                                                    <td className="border border-slate-300 p-1.5 text-slate-400 font-semibold">{maxVal}</td>
                                                    <td className="border border-slate-300 p-1.5 font-black text-slate-900">{markVal}</td>
                                                </React.Fragment>
                                            );
                                        })}
                                        <td className="border border-slate-300 p-1.5 font-black bg-blue-50/60 text-blue-950">
                                            {subTotal}
                                        </td>
                                    </tr>
                                );
                            })}

                            {!isHigherSecondary && gradedSubjects.length > 0 && (
                                <tr className="bg-slate-100">
                                    <td colSpan={examResults.length * 2 + 2} className="py-1 px-3 text-[7.5px] font-black text-slate-700 uppercase tracking-widest text-center border-y border-slate-300">
                                        Co-Scholastic & Practical Activities (Grades)
                                    </td>
                                </tr>
                            )}

                            {gradedSubjects.map((row, idx) => (
                                <tr key={idx} className="border-b border-slate-200 last:border-0 bg-slate-50/30 text-[9px]">
                                    <td className="border border-slate-300 p-1.5 text-left font-bold text-slate-700">
                                        {row.subjectName}
                                    </td>
                                    {examResults.map((ex, exI) => (
                                        <td key={exI} colSpan="2" className="border border-slate-300 p-1.5 text-center font-black text-teal-800">
                                            {row[ex.examName]}
                                        </td>
                                    ))}
                                    <td className="border border-slate-300 p-1.5 text-center font-bold text-slate-400 text-[7.5px] bg-slate-100">
                                        GRADE
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Performance Summary Boxes */}
                    <div className="grid grid-cols-5 gap-2.5 mb-3">
                        <div className="h-16 p-2 border border-slate-300 bg-white/95 rounded text-center flex flex-col justify-center shadow-2xs">
                            <span className="text-[7px] font-bold uppercase text-slate-500 tracking-wider block mb-0.5">Grand Total</span>
                            <div className="text-xs font-black text-slate-900">{totalObtained} / {totalMax}</div>
                        </div>
                        <div className="h-16 p-2 border border-blue-900 bg-blue-50/95 rounded text-center flex flex-col justify-center shadow-2xs">
                            <span className="text-[7px] font-bold uppercase text-blue-950 tracking-wider block mb-0.5">Percentage</span>
                            <div className="text-sm font-black text-blue-950">{percentage}%</div>
                        </div>
                        <div className="h-16 p-2 border border-slate-300 bg-white/95 rounded text-center flex flex-col justify-center shadow-2xs">
                            <span className="text-[7px] font-bold uppercase text-slate-500 tracking-wider block mb-0.5">Division</span>
                            <div className="text-[10px] font-black text-slate-900">{calculateDivision(percentage)}</div>
                        </div>
                        <div className="h-16 p-2 border border-slate-300 bg-white/95 rounded text-center flex flex-col justify-center shadow-2xs">
                            <span className="text-[7px] font-bold uppercase text-slate-500 tracking-wider block mb-0.5">Overall Grade</span>
                            <div className="text-xs font-black text-slate-900">{calculateGrade(percentage)}</div>
                        </div>
                        <div className="h-16 p-2 border border-dashed border-slate-400 bg-white/95 rounded text-center flex flex-col justify-center shadow-2xs">
                            <span className="text-[7px] font-bold uppercase text-slate-500 tracking-wider block mb-0.5">Attendance</span>
                            <div className="text-[9px] font-mono font-bold text-slate-700"> / </div>
                        </div>
                    </div>

                    {/* Teacher Remarks */}
                    <div className="mb-2">
                        <p className="text-[8px] font-bold uppercase text-slate-600 mb-1 tracking-wider">
                            Class Teacher's Remarks:
                        </p>
                        <div className="border border-slate-300 h-9 rounded bg-white/80 p-2"></div>
                    </div>
                </div>

                {/* Footer Signatures Section */}
                <div>
                    <div className="grid grid-cols-3 gap-6 text-center text-[10px] mt-3">
                        <div className="border-t border-slate-800 pt-1 font-bold uppercase tracking-wider text-slate-800">Class Teacher</div>
                        <div className="border-t border-slate-800 pt-1 font-bold uppercase tracking-wider text-slate-800">Parent / Guardian</div>
                        <div className="border-t border-slate-800 pt-1 font-bold uppercase tracking-wider text-slate-800">Principal Signature</div>
                    </div>
                    <div className="flex justify-between items-center text-[8px] font-semibold mt-3 pt-1.5 border-t border-slate-200 text-slate-500">
                        <span>Result Date: {resultDate ? new Date(resultDate).toLocaleDateString('en-GB') : '—'}</span>
                        <span>Official Academic Performance Record • {schoolDetails.name}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MarksheetTemplateSimple;