import React from 'react';
import SchoolLogo from '../images/logo.png';

const MarksheetTemplate = ({ student, examResults, activeSession, resultDate }) => {
    
    const extractClassFromId = (id) => {
        if (!id) return '—';
        const parts = id.split('_');
        return parts.length > 1 ? parts[1] : '—';
    };

    const studentClass = extractClassFromId(student.id);
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
        if (pct >= 60) return '1st';
        if (pct >= 45) return '2nd';
        if (pct >= 33) return '3rd';
        return 'Needs Improvement';
    };

    return (
        <div className="flex justify-center items-start min-h-screen bg-slate-100 print:bg-white print:p-0">
            <div className="relative bg-white p-[10mm] flex flex-col h-full border-[2px] border-indigo-950 overflow-hidden shadow-2xl print:shadow-none" 
                 style={{ width: '210mm', height: '297mm', boxSizing: 'border-box', transform: 'scale(0.92)', transformOrigin: 'center top' }}>
                
                <div className="absolute inset-1.5 border border-orange-400 pointer-events-none"></div>

                {/* Header */}
                <div className="relative z-10 flex items-center mb-4 border-b-[2px] border-indigo-950 pb-3">
                    <img src={SchoolLogo.src || SchoolLogo} alt="Logo" className="w-16 h-16 object-contain" />
                    <div className="text-center flex-grow px-4">
                        <h1 className="text-[28pt] font-black text-indigo-950 uppercase tracking-tighter leading-none">MVG PUBLIC SR. SEC. SCHOOL</h1>
                        <p className="text-[9px] font-bold text-slate-800 uppercase mt-1 tracking-widest">Sheopur, Pratap Nagar, Sanganer, Jaipur | Ph: 0141-3152600 , 9829018832</p>
                    </div>
                </div>

                {/* Student Info */}
                <div className="relative z-10 grid grid-cols-[110px_1fr] gap-4 mb-4 p-3 border border-indigo-200 bg-slate-50/50 rounded-lg">
                    <div className="w-[100px] h-[120px] border border-indigo-100 bg-white flex items-center justify-center overflow-hidden rounded">
                        {student.imageUrl ? <img src={student.imageUrl} className="w-full h-full object-cover" /> : <span className="text-[8px] text-slate-300 uppercase">Affix Photo</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 self-center">
                        {[
                            { label: "Student Name", value: student.name, bold: true, color: "text-indigo-950" },
                            { label: "SR. NO.", value: student.srNo || '—', color: "text-orange-700" },
                            { label: "Father's Name", value: student.fatherName },
                            { label: "Mother's Name", value: student.motherName || '—' },
                            { label: "Class", value: studentClass, color: "text-indigo-800" },
                            { label: "Section", value: student.section || 'A' },
                            { label: "Roll Number", value: student.rollNumber || '—' },
                            { label: "Date of Birth", value: student.dob || '—' },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between border-b border-slate-300 pb-0.5">
                                <span className="text-[7.5px] font-black text-slate-500 uppercase">{item.label}</span>
                                <span className={`text-[9px] uppercase ${item.bold ? 'font-black' : 'font-bold'} ${item.color || 'text-slate-800'}`}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="relative z-10 mb-4 border-2 border-indigo-950 rounded-sm overflow-hidden bg-white">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-indigo-950 text-white text-[9px] font-black uppercase tracking-wider">
                                <th className="p-2 text-left border-r border-indigo-900/50" rowSpan="2">Subject Name</th>
                                {examResults.map((exam, i) => (
                                    <th key={i} className="p-2 text-center border-r border-indigo-900/50" colSpan="2">{exam.examName}</th>
                                ))}
                                <th className="p-2 text-center bg-orange-500" rowSpan="2">Result Total</th>
                            </tr>
                            <tr className="bg-indigo-900/10 text-[7.5px] font-black uppercase text-indigo-950 border-b border-indigo-950">
                                {examResults.map((_, i) => (
                                    <React.Fragment key={i}>
                                        <th className="p-1 border-r border-indigo-200">Max</th>
                                        <th className="p-1 border-r border-indigo-950">Obt.</th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        
                        <tbody>
                            {/* Academic Section - Standard Size */}
                            {academicSubjects.map((row, i) => (
                                <tr key={i} className="border-b border-slate-200 last:border-indigo-950 text-[10px] font-bold">
                                    <td className="p-2 px-4 text-left border-r border-indigo-950 font-black text-indigo-950">{row.subjectName}</td>
                                    {examResults.map((exam, exI) => {
                                        const subjectConfig = (exam.subjects || []).find(s => s.name === row.subjectName);
                                        const maxMarksValue = subjectConfig ? (subjectConfig.maxMarks || 100) : 100;
                                        return (
                                            <React.Fragment key={exI}>
                                                <td className="p-2 text-center border-r border-indigo-200 text-slate-400">{maxMarksValue}</td>
                                                <td className="p-2 text-center border-r border-indigo-950 italic">{row[exam.examName]}</td>
                                            </React.Fragment>
                                        );
                                    })}
                                    <td className="p-2 text-center font-black italic bg-orange-50/70 text-orange-700">
                                        {examResults.reduce((sum, exam) => {
                                            const mark = parseFloat(row[exam.examName]);
                                            return sum + (isNaN(mark) ? 0 : mark);
                                        }, 0)}
                                    </td>
                                </tr>
                            ))}

                            {/* Section Heading */}
                            {!isHigherSecondary && gradedSubjects.length > 0 && (
                                <tr className="bg-indigo-950/5">
                                    <td colSpan={examResults.length * 2 + 2} className="py-1 px-4 text-[7px] font-black text-indigo-900 uppercase tracking-widest text-center border-b border-indigo-950">
                                        Internal Assessment
                                    </td>
                                </tr>
                            )}

                            {/* Graded Section - Reduced Size */}
                            {gradedSubjects.map((row, i) => (
                                <tr key={i} className="border-b border-indigo-950 last:border-0 bg-blue-50/30">
                                    <td className="p-1.5 px-4 text-left border-r border-indigo-950 font-black text-blue-800">
                                        <span className="text-[8.5px] uppercase">{row.subjectName}</span>
                                        <span className="text-[6px] block font-normal text-blue-500 uppercase italic">Grade Based</span>
                                    </td>
                                    {examResults.map((exam, exI) => (
                                        <td key={exI} colSpan="2" className="p-1.5 text-center border-r border-indigo-950 font-black text-blue-900 italic text-[12px]">
                                            {row[exam.examName]}
                                        </td>
                                    ))}
                                    <td className="p-1.5 text-center font-black italic bg-blue-100/40 text-blue-700 text-[8px]">GRADED</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Footer and summary remains same... */}
                <div className="relative z-10 grid grid-cols-5 gap-3 mb-5">
                    {[
                        { label: "Grand Total", val: `${stats.totalObtained} / ${stats.totalMax}`, border: "border-indigo-300" },
                        { label: "Percentage", val: `${stats.percentage}%`, border: "border-indigo-300" },
                        { label: "Division", val: calculateDivision(stats.percentage), border: "border-orange-400" },
                        { label: "Grade", val: calculateGrade(stats.percentage), border: "border-indigo-300" },
                        { label: "Attendance", val: "", border: "border-indigo-300", isManual: true } 
                    ].map((stat, i) => (
                        <div key={i} className={`py-2 px-2 min-h-[75px] flex flex-col ${stat.isManual ? 'justify-start' : 'justify-center'} border-2 ${stat.border} bg-white text-center rounded-lg shadow-sm`}>
                            <span className={`text-[8px] font-black uppercase text-slate-500 block tracking-wider ${stat.isManual ? 'mb-auto' : 'mb-1'}`}>
                                {stat.label}
                            </span>
                            {!stat.isManual && (
                                <div className="text-lg font-black italic text-indigo-950 leading-none">
                                    {stat.val}
                                </div>
                            )}
                            {stat.isManual && (
                                <div className="h-6 border-b border-dotted border-slate-300 mx-2 mb-1"></div> 
                            )}
                        </div>
                    ))}
                </div>

                <div className="relative z-10 mb-6 flex-grow">
                    <p className="text-[9px] font-black uppercase text-indigo-950 mb-1.5 underline decoration-orange-400 underline-offset-2 tracking-wide">Class Teacher's Remarks:</p>
                    <div className="p-4 border-2 border-dashed border-indigo-100 h-[65px] rounded bg-slate-50/30"></div>
                </div>

                <div className="relative z-10 mt-auto grid grid-cols-3 gap-10 text-center pb-2">
                    <div className="pt-2 border-t-2 border-indigo-950"><p className="text-[8.5px] font-black uppercase">Class Teacher Signature</p></div>
                    <div className="pt-2 border-t-2 border-orange-400"><p className="text-[8.5px] font-black uppercase text-orange-700">Parent / Guardian</p></div>
                    <div className="pt-2 border-t-2 border-indigo-950"><p className="text-[8.5px] font-black uppercase">Principal</p></div>
                </div>

                <div className="relative z-10 text-right mt-3 pr-4">
                    <p className="text-[9px] font-black text-indigo-950 uppercase italic">
                        Date of Result: {resultDate ? new Date(resultDate).toLocaleDateString('en-GB') : '_________________'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MarksheetTemplate;