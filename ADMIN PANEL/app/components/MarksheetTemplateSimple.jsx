'use client';

import React from 'react';

/**
 * MarksheetTemplateSimple - A strictly black and white template.
 * Added logo support at the top left.
 */
function MarksheetTemplateSimple({ student, examResults = [], activeSession, resultDate }) {
    
    const allSubjectsMap = new Map();
    examResults.forEach(ex => {
        (ex.subjects || []).forEach(sub => {
            const subName = sub.name || sub;
            if (!allSubjectsMap.has(subName)) {
                allSubjectsMap.set(subName, { name: subName, maxMarks: sub.maxMarks || 100 });
            }
        });
    });
    const subjects = Array.from(allSubjectsMap.values());

    const getMark = (examId, subName, field) => {
        const examObj = examResults.find(e => e.examId === examId);
        if (!examObj || !examObj.marks) return '-';
        
        for (const sKey in examObj.marks) {
            const sMarks = examObj.marks[sKey];
            if (sKey === student.id || sMarks.studentId === student.id) {
                const subMarks = sMarks.subjects?.[subName] || sMarks[subName];
                if (subMarks) {
                    return subMarks[field] !== undefined ? subMarks[field] : (subMarks.marks || '-');
                }
            }
        }
        return '-';
    };

    return (
        <div className="w-[210mm] h-[297mm] mx-auto bg-white text-black p-10 flex flex-col justify-between font-sans box-border border border-black select-none">
            {/* Header Section */}
            <div>
                <div className="flex items-center border-b-2 border-black pb-4 mb-4 gap-4">
                    {/* Logo - Ensure your logo is placed in the 'public' folder as 'logo.png' */}
                    <img 
                        src="/logo.png" 
                        alt="School Logo" 
                        className="w-16 h-16 object-contain grayscale" 
                    />
                    <div className="text-left">
                        <h1 className="text-2xl font-black uppercase">MVG Public Sr. Sec. School</h1>
                        <p className="text-xs font-bold tracking-widest uppercase">Academic Performance Report & Marksheet</p>
                        <p className="text-[10px] font-semibold">Session: {activeSession || '2025-2026'}</p>
                    </div>
                </div>

                {/* Student Bio Details */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 border border-black p-3 text-xs mb-4">
                    <div><span className="font-bold">Student Name:</span> {student.name || '—'}</div>
                    <div><span className="font-bold">Father's Name:</span> {student.fatherName || '—'}</div>
                    <div><span className="font-bold">Mother's Name:</span> {student.motherName || '—'}</div>
                    <div><span className="font-bold">Class / Grade:</span> {student.grade || '—'}</div>
                    <div><span className="font-bold">Roll Number:</span> {student.rollNo || student.admissionNo || '—'}</div>
                    <div><span className="font-bold">Date of Birth:</span> {student.dob || '—'}</div>
                </div>

                {/* Marks Table */}
                <table className="w-full border-collapse border border-black text-center text-[10px]">
                    <thead>
                        <tr className="border-b border-black">
                            <th className="border-r border-black p-2 text-left font-bold uppercase">Subject</th>
                            {examResults.map(ex => (
                                <th key={ex.examId} className="border-r border-black p-2 font-bold uppercase">
                                    {ex.examName}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {subjects.map((sub, idx) => (
                            <tr key={idx} className="border-b border-black">
                                <td className="border-r border-black p-2 text-left font-semibold">{sub.name}</td>
                                {examResults.map(ex => (
                                    <td key={ex.examId} className="border-r border-black p-2">
                                        {getMark(ex.examId, sub.name, 'marks')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer / Signatures */}
            <div className="pt-8">
                <div className="grid grid-cols-3 gap-8 text-center text-xs mt-12 pt-8">
                    <div className="border-t border-black pt-2 font-bold uppercase">Class Teacher</div>
                    <div className="border-t border-black pt-2 font-bold uppercase">Checked By</div>
                    <div className="border-t border-black pt-2 font-bold uppercase">Principal</div>
                </div>
                <div className="flex justify-between items-center text-[9px] font-semibold mt-8 border-t border-black pt-2">
                    <span>Result Date: {resultDate || '—'}</span>
                    <span>System Generated Marksheet</span>
                </div>
            </div>
        </div>
    );
}

export default MarksheetTemplateSimple;