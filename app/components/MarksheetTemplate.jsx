import React from 'react';
import SchoolLogo from '../images/logo.png';

const MarksheetTemplate = ({ student, examResults, activeSession }) => {
    
    // 1. Grade Logic
    const calculateGrade = (perc) => {
        if (perc >= 90) return 'A+';
        if (perc >= 75) return 'A';
        if (perc >= 60) return 'B';
        if (perc >= 45) return 'C';
        return 'D';
    };

    const studentGrade = calculateGrade(student.percentage);

    // 2. Remarks Pool
    const remarkPool = {
        'A+': ["Exceptional performance! Demonstrates outstanding mastery of all subjects.", "A brilliant student with consistent excellence in every academic area.", "Outstanding achievement. Keep up this phenomenal standard of work.", "Exemplary dedication and intelligence. A true role model for the class.", "Remarkable results. Your hard work and focus are truly inspiring."],
        'A': ["Very good performance. Shows strong understanding and steady progress.", "A hardworking student who consistently delivers high-quality work.", "Impressive results. Keep maintaining this level of focus and curiosity.", "Strong academic presence. Well-deserved success in this term.", "Great job! Your commitment to learning is clearly visible in your grades."],
        'B': ["Good effort. With a bit more focus on details, you can reach the top tier.", "Steady performance. Shows good potential for even higher achievements.", "A positive result. Focus on consistent revision to improve further.", "Good understanding of concepts. Keep striving for excellence.", "Well done. Maintain this momentum and focus on your core strengths."],
        'C': ["Satisfactory results. Regular practice will help improve your scores.", "Fair performance. Focus more on regular attendance and classroom participation.", "Shows potential. Needs more dedication to master complex topics.", "Needs more consistent effort in self-study to gain better clarity.", "Progressing. Aim for more precision and clarity in your assignments."],
        'D': ["Needs improvement. More dedication and remedial help are suggested.", "Extra effort is required in core subjects to achieve better results.", "Must focus on foundational concepts and complete all class assignments.", "Requires consistent hard work and regular supervision to progress.", "A fresh start with a structured study plan will help in the next term."]
    };

    const getRandomizedRemark = (grade, studentId) => {
        const pool = remarkPool[grade];
        const index = (parseInt(studentId.replace(/\D/g, '')) || 0) % pool.length;
        return pool[index];
    };

    const finalRemark = getRandomizedRemark(studentGrade, student.id);

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
        <div className="bg-white p-[12mm] flex flex-col h-full border-[1px] border-slate-300">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-4 border-b-2 border-slate-900 pb-4">
                <img src={SchoolLogo.src || SchoolLogo} alt="Logo" className="w-18 h-18 object-contain" />
                <div className="text-center flex-grow">
                    <h1 className="text-4xl font-black text-slate-900 ml-10 uppercase tracking-tighter whitespace-nowrap">
                        MVG PUBLIC SR. SEC. SCHOOL
                    </h1>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em]">
                        Sheopur, Pratap Nagar, Sanganer, Jaipur 
                    </p>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em]">
                        0141-3152600, 9829018332, 8875646366
                    </p>
                </div>
                <div className="w-24"></div>
            </div>

            <div className="text-center mb-6"> 
                <h2 className="text-lg font-black uppercase tracking-widest border-b border-slate-200 inline-block px-4 pb-1">
                    Academic Mark Sheet
                </h2>
                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">
                    SESSION: {activeSession || "2026 - 2027"}
                </p>
            </div>

            {/* Student Info Section */}
            <div className="flex gap-6 mb-6 px-4 py-4 border rounded-2xl border-slate-200 bg-slate-50/30">
                <div className="w-28 h-32 border border-slate-300 rounded-xl bg-white flex-shrink-0 overflow-hidden flex items-center justify-center shadow-sm">
                    {student.imageUrl ? (
                        /* shrink fit fix applied here */
                        <img src={student.imageUrl} className="w-full h-full object-contain p-1" alt="Student" />
                    ) : (
                        <span className="text-[8px] font-bold text-slate-300 uppercase text-center p-2">Affix Photo</span>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-3 flex-grow self-center">
                    {[
                        { label: "Student Name", value: student.name, bold: true },
                        { label: "Roll Number", value: student.rollNumber || '—' },
                        { label: "Father's Name", value: student.fatherName },
                        { label: "Class & Section", value: `Grade ${student.grade}` },
                        { label: "Date of Birth", value: student.dob || '—' },
                        { label: "Attendance", value: student.attendance || '—' }
                    ].map((item, i) => (
                        <div key={i} className="flex justify-between border-b border-slate-200 pb-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{item.label}:</span>
                            <span className={`text-[10px] uppercase ${item.bold ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                                {item.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Academic Table */}
            <div className="mb-6 overflow-hidden border border-slate-300 rounded-xl">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-700">
                            <th className="p-3 text-left border-r border-slate-300">Subject Name</th>
                            {examResults.map((exam, i) => (
                                <th key={i} className="p-3 text-center border-r border-slate-300" colSpan="2">
                                    {exam.examName}
                                </th>
                            ))}
                            <th className="p-3 text-center bg-slate-100">Grand Total</th>
                        </tr>
                        <tr className="bg-white text-[9px] font-bold uppercase text-slate-400 border-b border-slate-300">
                            <th className="p-1 border-r border-slate-300"></th>
                            {examResults.map((exam, i) => (
                                <React.Fragment key={i}>
                                    <th className="p-1 border-r border-slate-200">Max</th>
                                    <th className="p-1 border-r border-slate-300">Obt.</th>
                                </React.Fragment>
                            ))}
                            <th className="p-1">Sum</th>
                        </tr>
                    </thead>
                    <tbody className="text-[11px] font-bold text-slate-800">
                        {consolidatedData.map((row, i) => (
                            <tr key={i} className="border-b border-slate-200 last:border-0 hover:bg-slate-50/50">
                                <td className="p-2.5 px-4 text-left uppercase border-r border-slate-300">{row.subjectName}</td>
                                {examResults.map((exam, exI) => (
                                    <React.Fragment key={exI}>
                                        <td className="p-2.5 text-center border-r border-slate-200 text-slate-400">100</td>
                                        <td className="p-2.5 text-center border-r border-slate-300 font-black italic">{row[exam.examName]}</td>
                                    </React.Fragment>
                                ))}
                                <td className="p-2.5 text-center font-black bg-slate-50 italic text-indigo-600">{getSubjectTotalObtained(row)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Summary Statistics */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Grand Total", val: `${student.totalObtained} / ${student.totalMax}`, color: "text-blue-700", bg: "bg-blue-50" },
                    { label: "Percentage", val: `${student.percentage}%`, color: "text-emerald-700", bg: "bg-emerald-50" },
                    { label: "Final Grade", val: studentGrade, color: "text-rose-700", bg: "bg-rose-50" },
                    { label: "Class Rank", val: `#${student.classRank}`, color: "text-purple-700", bg: "bg-purple-50" }
                ].map((stat, i) => (
                    <div key={i} className={`p-3 rounded-2xl border border-slate-100 ${stat.bg} text-center`}>
                        <span className="text-[8px] font-black uppercase text-slate-400 block mb-1 tracking-widest">{stat.label}</span>
                        <div className={`text-xl font-black italic ${stat.color}`}>{stat.val}</div>
                    </div>
                ))}
            </div>

            {/* Remarks Section */}
            <div className="mb-12">
                <p className="text-[9px] font-black uppercase text-slate-400 mb-2 px-1 tracking-widest">Class Teacher's Remarks:</p>
                <div className="p-4 rounded-xl border border-dashed border-slate-300 italic text-slate-600 text-[11px] min-h-[60px] bg-slate-50/20">
                    {finalRemark}
                </div>
            </div>

            {/* Signature Footer */}
            <div className="mt-auto grid grid-cols-3 gap-8 px-4 text-center">
                <div className="border-t-2 border-slate-900 pt-2">
                    <p className="text-[10px] font-black uppercase text-slate-800">Class Teacher</p>
                </div>
                <div className="border-t-2 border-slate-900 pt-2">
                    <p className="text-[10px] font-black uppercase text-slate-800">Parent/Guardian</p>
                </div>
                <div className="border-t-2 border-slate-900 pt-2 relative">
                    <p className="text-[10px] font-black uppercase text-slate-800">Principal</p>
                </div>
            </div>
        </div>
    );
};

export default MarksheetTemplate;