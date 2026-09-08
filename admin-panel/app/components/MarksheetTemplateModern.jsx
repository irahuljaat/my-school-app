import React from 'react';
import SchoolLogo from '../images/logo.png';

// Fixed school configuration constant
const SCHOOL_DETAILS = {
    name: 'MVG PUBLIC SR. SEC. SCHOOL',
    address: 'Sheopur, Pratap Nagar, Sanganer, Jaipur',
    contact: '0141-3152600, 9829018832'
};

const MarksheetTemplateModern = ({ student, examResults, activeSession, resultDate }) => {
    
    const extractClassFromId = (id) => {
        if (!id) return '—';
        const parts = id.split('_');
        return parts.length > 1 ? parts[1] : '—';
    };

    const studentClass = student.grade || extractClassFromId(student.id);
    const isHigherSecondary = ['11', '12'].includes(studentClass);

    const gradingSubjectList = ['G.K', 'GK', 'GENERAL KNOWLEDGE', 'COMPUTER', 'DRAWING', 'ART', 'CRAFT', 'YOGA', 'PHYSICAL EDUCATION'];

    const allSubjects = Array.from(new Set(
        examResults.flatMap(exam => exam.subjects.map(s => s.name))
    ));

    const consolidatedData = allSubjects.map(subjectName => {
        const row = { subjectName };
        examResults.forEach(exam => {
            const studentMarks = exam.marks[student.id] || {};
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
        <div className="flex justify-center items-start min-h-screen bg-slate-100 print:bg-white print:p-0">
            <div className="relative bg-white p-[10mm] flex flex-col h-full border border-slate-300 overflow-hidden shadow-2xl print:shadow-none font-sans" 
                 style={{ width: '210mm', height: '297mm', boxSizing: 'border-box', transform: 'scale(0.92)', transformOrigin: 'center top' }}>
                
                {/* Modern Top Minimal Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600"></div>

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between mb-4 border-b border-slate-200 pb-4 pt-1">
                    <div className="flex items-center gap-4">
                        <img src={SchoolLogo.src || SchoolLogo} alt="Logo" className="w-16 h-16 object-contain" />
                        <div>
                            <h1 className="text-[22pt] font-black text-slate-800 tracking-tight leading-none">{SCHOOL_DETAILS.name}</h1>
                            <p className="text-[8.5px] font-semibold text-slate-500 uppercase mt-1 tracking-wider">{SCHOOL_DETAILS.address} • Ph: {SCHOOL_DETAILS.contact}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-black uppercase tracking-widest rounded-full">
                            Session {activeSession || '2026-27'}
                        </span>
                    </div>
                </div>

                {/* Increased Height Student Info Card */}
                <div className="relative z-10 grid grid-cols-[115px_1fr] gap-6 mb-5 p-5 bg-slate-50 border border-slate-200 rounded-2xl shadow-xs">
                    <div className="w-[105px] h-[135px] bg-white border border-slate-200 flex items-center justify-center overflow-hidden rounded-xl shadow-inner self-center">
                        {student.imageUrl ? (
                            <img src={student.imageUrl} className="w-full h-full object-cover" alt="Student" />
                        ) : (
                            <div className="text-center p-2 text-slate-400">
                                <span className="text-xl block mb-1">👤</span>
                                <span className="text-[7.5px] font-bold uppercase tracking-wider block">Student Photo</span>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 self-center">
                        {[
                            { label: "Student Name", value: student.name || student.studentName, bold: true, color: "text-slate-900" },
                            { label: "SR. Number", value: student.srNo || '—', color: "text-emerald-700 font-bold" },
                            { label: "Father's Name", value: student.fatherName || '—' },
                            { label: "Mother's Name", value: student.motherName || '—' },
                            { label: "Class & Section", value: `${studentClass} - ${student.section || 'A'}`, color: "text-slate-900 font-bold" },
                            { label: "Roll Number", value: student.rollNumber || student.rollNo || '—' },
                            { label: "Date of Birth", value: student.dob || '—' },
                            { label: "Result Status", value: stats.percentage >= 33 ? 'PASSED' : 'DETAINED', color: stats.percentage >= 33 ? 'text-emerald-700 font-black' : 'text-rose-700 font-black' },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center border-b border-slate-200/80 pb-1.5">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                                <span className={`text-[9.5px] uppercase ${item.bold ? 'font-black' : 'font-semibold'} ${item.color || 'text-slate-700'}`}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Marks Table */}
                <div className="relative z-10 mb-4 border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white text-[8.5px] font-bold uppercase tracking-wider">
                                <th className="p-2.5 text-left border-r border-slate-800" rowSpan="2">Subject Name</th>
                                {examResults.map((exam, i) => (
                                    <th key={i} className="p-2.5 text-center border-r border-slate-800" colSpan="2">{exam.examName}</th>
                                ))}
                                <th className="p-2.5 text-center bg-emerald-600 text-white" rowSpan="2">Total Marks</th>
                            </tr>
                            <tr className="bg-slate-100 text-[7.5px] font-bold uppercase text-slate-600 border-b border-slate-300">
                                {examResults.map((_, i) => (
                                    <React.Fragment key={i}>
                                        <th className="p-1.5 border-r border-slate-200">Max</th>
                                        <th className="p-1.5 border-r border-slate-300">Obt</th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        
                        <tbody>
                            {academicSubjects.map((row, i) => (
                                <tr key={i} className="border-b border-slate-100 last:border-none text-[9.5px] hover:bg-slate-50/50">
                                    <td className="p-2 px-3 text-left border-r border-slate-200 font-bold text-slate-800">{row.subjectName}</td>
                                    {examResults.map((exam, exI) => {
                                        const subjectConfig = (exam.subjects || []).find(s => s.name === row.subjectName);
                                        const maxMarksValue = subjectConfig ? (subjectConfig.maxMarks || 100) : 100;
                                        return (
                                            <React.Fragment key={exI}>
                                                <td className="p-2 text-center border-r border-slate-200 text-slate-400 font-medium">{maxMarksValue}</td>
                                                <td className="p-2 text-center border-r border-slate-200 font-semibold text-slate-800">{row[exam.examName]}</td>
                                            </React.Fragment>
                                        );
                                    })}
                                    <td className="p-2 text-center font-bold bg-emerald-50/50 text-emerald-800">
                                        {examResults.reduce((sum, exam) => {
                                            const mark = parseFloat(row[exam.examName]);
                                            return sum + (isNaN(mark) ? 0 : mark);
                                        }, 0)}
                                    </td>
                                </tr>
                            ))}

                            {!isHigherSecondary && gradedSubjects.length > 0 && (
                                <tr className="bg-slate-100/80">
                                    <td colSpan={examResults.length * 2 + 2} className="py-1 px-3 text-[7.5px] font-bold text-slate-500 uppercase tracking-widest text-center border-y border-slate-200">
                                        Co-Scholastic / Internal Assessment (Grades)
                                    </td>
                                </tr>
                            )}

                            {gradedSubjects.map((row, i) => (
                                <tr key={i} className="border-b border-slate-100 last:border-0 bg-slate-50/30 text-[9.5px]">
                                    <td className="p-2 px-3 text-left border-r border-slate-200 font-bold text-slate-700">
                                        {row.subjectName}
                                    </td>
                                    {examResults.map((exam, exI) => (
                                        <td key={exI} colSpan="2" className="p-2 text-center border-r border-slate-200 font-bold text-teal-700">
                                            {row[exam.examName]}
                                        </td>
                                    ))}
                                    <td className="p-2 text-center font-bold text-slate-400 bg-slate-100/50 text-[8px]">GRADE</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* 5-Column Stats Grid with Increased Height & Attendance */}
                <div className="relative z-10 grid grid-cols-5 gap-3 mb-4">
                    {/* Grand Total */}
                    <div className="h-24 p-3 flex flex-col justify-center border border-slate-200 bg-slate-50/60 text-center rounded-xl shadow-2xs">
                        <span className="text-[7.5px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                            Grand Total
                        </span>
                        <div className="text-base font-black tracking-tight text-slate-800">
                            {stats.totalObtained} / {stats.totalMax}
                        </div>
                    </div>

                    {/* Percentage */}
                    <div className="h-24 p-3 flex flex-col justify-center border-2 border-emerald-400 bg-emerald-50/60 text-center rounded-xl shadow-xs">
                        <span className="text-[7.5px] font-bold uppercase text-emerald-800 tracking-wider mb-1">
                            Percentage
                        </span>
                        <div className="text-lg font-black tracking-tight text-emerald-800">
                            {stats.percentage}%
                        </div>
                    </div>

                    {/* Division */}
                    <div className="h-24 p-3 flex flex-col justify-center border border-slate-200 bg-slate-50/60 text-center rounded-xl shadow-2xs">
                        <span className="text-[7.5px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                            Division
                        </span>
                        <div className="text-sm font-black tracking-tight text-slate-800">
                            {calculateDivision(stats.percentage)}
                        </div>
                    </div>

                    {/* Overall Grade */}
                    <div className="h-24 p-3 flex flex-col justify-center border border-slate-200 bg-slate-50/60 text-center rounded-xl shadow-2xs">
                        <span className="text-[7.5px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                            Overall Grade
                        </span>
                        <div className="text-base font-black tracking-tight text-slate-800">
                            {calculateGrade(stats.percentage)}
                        </div>
                    </div>

                    {/* Attendance Box */}
                    <div className="h-24 p-3 flex flex-col justify-center border-2 border-dashed border-slate-300 bg-slate-50/40 text-center rounded-xl shadow-2xs">
                        <span className="text-[7.5px] font-bold uppercase text-slate-500 tracking-wider mb-1">
                            Attendance
                        </span>
                        <div className="text-[11px] font-mono font-bold text-slate-700 tracking-widest mt-0.5">
                             /
                        </div>
                    </div>
                </div>

                {/* Remarks */}
                <div className="relative z-10 mb-6 flex-grow">
                    <p className="text-[8.5px] font-bold uppercase text-slate-500 mb-1 tracking-wide">Class Teacher's Remarks:</p>
                    <div className="p-3 border border-slate-200 h-[55px] rounded-xl bg-slate-50/40 flex flex-col justify-around">
                        <div className="border-b border-dashed border-slate-200 w-full" />
                        <div className="border-b border-dashed border-slate-200 w-full" />
                    </div>
                </div>

                {/* Signatures */}
                <div className="relative z-10 mt-auto grid grid-cols-3 gap-8 text-center pt-2">
                    <div className="pt-3 border-t border-slate-300"><p className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">Class Teacher</p></div>
                    <div className="pt-3 border-t border-slate-300"><p className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">Parent / Guardian</p></div>
                    <div className="pt-3 border-t border-slate-300"><p className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">Principal</p></div>
                </div>

                {/* Result Issue Date */}
                <div className="relative z-10 flex justify-between items-center mt-3 pt-3 border-t border-slate-100 text-[8.5px] text-slate-500 font-medium">
                    <span>System Generated Document — {SCHOOL_DETAILS.name}</span>
                    <span>Date of Result: {resultDate ? new Date(resultDate).toLocaleDateString('en-GB') : '_________________'}</span>
                </div>
            </div>
        </div>
    );
};

export default MarksheetTemplateModern;