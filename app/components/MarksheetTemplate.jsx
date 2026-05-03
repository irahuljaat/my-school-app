import React from 'react';
import SchoolLogo from '../images/logo.png';

const MarksheetTemplate = ({ student, examResults, activeSession }) => {
    
    const allSubjects = Array.from(new Set(
        examResults.flatMap(exam => exam.subjects.map(s => s.name))
    ));

    const consolidatedData = allSubjects.map(subjectName => {
        const row = { subjectName };
        examResults.forEach(exam => {
            const studentMarks = exam.marks[student.id]; 
            row[exam.examName] = studentMarks ? (studentMarks[subjectName] || '-') : '-';
        });
        return row;
    });

    const getSubjectTotalObtained = (row) => {
        return examResults.reduce((sum, exam) => {
            const mark = parseInt(row[exam.examName]);
            return sum + (isNaN(mark) ? 0 : mark);
        }, 0);
    };

    return (
        /* Outer Centering Wrapper: Centers the scaled page on screen/print */
        <div className="flex justify-center items-start min-h-screen bg-slate-100 print:bg-white print:p-0">
            
            {/* Main Marksheet Container with Scaling and Darker Aesthetics */}
            <div className="relative bg-white p-[10mm] flex flex-col h-full border-[2px] border-indigo-950 overflow-hidden shadow-2xl print:shadow-none" 
                 style={{ 
                    width: '210mm', 
                    height: '297mm', 
                    boxSizing: 'border-box',
                    /* Key Change: Scaling and Alignment */
                    transform: 'scale(0.92)',
                    transformOrigin: 'center top'
                }}>
                
                {/* Outer Decorative Frame */}
                <div className="absolute inset-1.5 border border-orange-400 pointer-events-none"></div>

                {/* Logo Watermark: Subtle on paper */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                    <img src={SchoolLogo.src || SchoolLogo} alt="Watermark" className="w-[400px] h-[400px] object-contain" />
                </div>

                {/* Header Section: Single line layout */}
                <div className="relative z-10 flex items-center mb-4 border-b-[2px] border-indigo-950 pb-3">
                    <img src={SchoolLogo.src || SchoolLogo} alt="Logo" className="w-16 h-16 object-contain" />
                    <div className="text-center flex-grow px-4">
                        <h1 className="text-[28pt] font-black text-indigo-950 uppercase tracking-tighter leading-none whitespace-nowrap">
                            MVG PUBLIC SR. SEC. SCHOOL
                        </h1>
                        <p className="text-[9px] font-bold text-slate-800 uppercase mt-1 tracking-widest">
                            Sheopur, Pratap Nagar, Sanganer, Jaipur | Ph: 0141-3152600, 9829018332
                        </p>
                    </div>
                </div>

                {/* Document Title & Session */}
                <div className="text-center mb-4 relative z-10">
                    <div className="inline-block px-8 py-0.5 border-y border-orange-400">
                        <h2 className="text-lg font-black uppercase tracking-[0.15em] text-indigo-950">
                            Academic Achievement Record
                        </h2>
                    </div>
                    <p className="text-[10px] font-bold text-indigo-800 mt-1 uppercase tracking-wider">
                        SESSION: {activeSession || "2026 - 2027"}
                    </p>
                </div>

                {/* Student Info - Compact Grid */}
                <div className="relative z-10 grid grid-cols-[110px_1fr] gap-4 mb-4 p-3 border border-indigo-200 bg-slate-50/50 rounded-lg shadow-inner">
                    <div className="w-[100px] h-[120px] border border-indigo-100 bg-white shadow-sm flex items-center justify-center overflow-hidden rounded">
                        {student.imageUrl ? (
                            <img src={student.imageUrl} className="w-full h-full object-cover" alt="Student" />
                        ) : (
                            <span className="text-[8px] font-bold text-slate-300 uppercase text-center p-2">Affix Photo</span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 self-center">
                        {[
                            { label: "Student Name", value: student.name, bold: true, color: "text-indigo-950" },
                            { label: "SR. NO.", value: student.srNo || '—', color: "text-orange-700" },
                            { label: "Father's Name", value: student.fatherName },
                            { label: "Mother's Name", value: student.motherName || '—' },
                            { label: "Class & Section", value: `Grade ${student.grade}`, color: "text-indigo-800" },
                            { label: "Roll Number", value: student.rollNumber || '—' },
                            { label: "Date of Birth", value: student.dob || '—' },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between border-b border-slate-300 pb-0.5">
                                <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-tight">{item.label}</span>
                                <span className={`text-[9px] uppercase ${item.bold ? 'font-black' : 'font-bold'} ${item.color || 'text-slate-800'}`}>
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Table Section - Major Change: Darker Internal Borders */}
                <div className="relative z-10 mb-4 border-2 border-indigo-950 rounded-sm overflow-hidden bg-white shadow-sm">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-indigo-950 text-white text-[9px] font-black uppercase tracking-wider">
                                <th className="p-2 text-left border-r border-indigo-900/50">Subject Name</th>
                                {examResults.map((exam, i) => (
                                    <th key={i} className="p-2 text-center border-r border-indigo-900/50" colSpan="2">
                                        {exam.examName}
                                    </th>
                                ))}
                                <th className="p-2 text-center bg-orange-500">Result Total</th>
                            </tr>
                            <tr className="bg-slate-100 text-[7px] font-black uppercase text-indigo-950 border-b-2 border-indigo-950">
                                <th className="p-0.5 border-r border-indigo-300"></th>
                                {examResults.map((exam, i) => (
                                    <React.Fragment key={i}>
                                        <th className="p-0.5 border-r border-indigo-200">Max</th>
                                        <th className="p-0.5 border-r border-indigo-300">Obt.</th>
                                    </React.Fragment>
                                ))}
                                <th className="p-0.5 text-orange-700">Marks</th>
                            </tr>
                        </thead>
                        <tbody className="text-[10px] font-bold">
                            {consolidatedData.map((row, i) => (
                                /* Change: All internal borders changed from slate-200/300 to indigo-950 */
                                <tr key={i} className="border-b border-indigo-950 last:border-0 hover:bg-orange-50/50">
                                    <td className="p-2 px-4 text-left uppercase border-r border-indigo-950 font-black text-indigo-950">{row.subjectName}</td>
                                    {examResults.map((exam, exI) => (
                                        <React.Fragment key={exI}>
                                            <td className="p-2 text-center border-r border-indigo-200 text-slate-500 font-medium">100</td>
                                            <td className="p-2 text-center border-r border-indigo-950 font-black italic text-slate-950">{row[exam.examName]}</td>
                                        </React.Fragment>
                                    ))}
                                    <td className="p-2 text-center font-black bg-orange-50/70 italic text-orange-700">{getSubjectTotalObtained(row)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Summary Statistics */}
                <div className="relative z-10 grid grid-cols-4 gap-3 mb-4">
                    {[
                        { label: "Grand Total", val: `${student.totalObtained} / ${student.totalMax}`, border: "border-indigo-300" },
                        { label: "Percentage", val: `${student.percentage}%`, border: "border-indigo-300" },
                        { label: "Attendance", val: " ", border: "border-orange-300" },
                        { label: "Class Rank", val: `#${student.classRank}`, border: "border-indigo-300" }
                    ].map((stat, i) => (
                        <div key={i} className={`p-2.5 border-2 ${stat.border} bg-white text-center rounded shadow-sm`}>
                            <span className="text-[8px] font-black uppercase text-slate-500 block mb-0.5 tracking-widest">{stat.label}</span>
                            <div className="text-lg font-black italic text-indigo-950">{stat.val}</div>
                        </div>
                    ))}
                </div>

                {/* Remarks Section */}
                <div className="relative z-10 mb-6 flex-grow">
                    <p className="text-[9px] font-black uppercase text-indigo-950 mb-1.5 underline decoration-orange-400 underline-offset-2 tracking-wide flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>Class Teacher's Remarks:
                    </p>
                    <div className="p-4 border-2 border-dashed border-indigo-200 h-[70px] rounded bg-slate-50/30 italic text-[10px] text-slate-700 shadow-inner">
                    </div>
                </div>

                {/* Signature Footer */}
                <div className="relative z-10 mt-auto grid grid-cols-3 gap-10 text-center pb-2">
                    <div className="pt-1.5 border-t-2 border-indigo-950 group">
                        <p className="text-[8px] font-black uppercase text-indigo-950 tracking-wider">Class Teacher Signature</p>
                    </div>
                    <div className="pt-1.5 border-t-2 border-orange-400">
                        <p className="text-[8px] font-black uppercase text-orange-700 tracking-wider">Parent / Guardian</p>
                    </div>
                    <div className="pt-1.5 border-t-2 border-indigo-950 relative">
                        <p className="text-[8px] font-black uppercase text-indigo-950 tracking-wider">Principal / Director</p>
                    </div>
                </div>

                {/* Footer Text */}
                <div className="relative z-10 text-center text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-2 border-t border-slate-100 pt-1">
                    
                </div>
            </div>
        </div>
    );
};

export default MarksheetTemplate;