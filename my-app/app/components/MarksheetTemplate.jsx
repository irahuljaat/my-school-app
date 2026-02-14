import React from 'react';
import SchoolLogo from '../images/logo.jpg';

/**
 * MarksheetTemplate Component
 * Displays the results in a professional, consolidated format with calculated totals below the table.
 */
const MarksheetTemplate = ({ student, examResults }) => {

    if (!student || !examResults || examResults.length === 0) {
        return <p className="text-red-500">Error: Marksheet data missing or incomplete.</p>;
    }
    
    // --- 1. PRE-PROCESS DATA FOR CONSOLIDATED TABLE ---
    
    const allSubjects = Array.from(new Set(
        examResults.flatMap(exam => exam.subjects.map(s => s.name))
    ));

    const examNames = examResults.map(e => e.examName);

    const consolidatedData = allSubjects.map(subjectName => {
        const row = { subjectName };
        
        examResults.forEach(exam => {
            const studentMarks = exam.marks[student.id]; 
            const mark = studentMarks ? (studentMarks[subjectName] || '-') : '-';
            row[exam.examName] = mark;
        });
        
        return row;
    });

    const getSubjectTotalObtained = (row) => {
        return examResults.reduce((sum, exam) => {
            const mark = parseInt(row[exam.examName]);
            return sum + (isNaN(mark) ? 0 : mark);
        }, 0);
    };

    // --- COMPONENT RENDER ---
    return (
        <div className="marksheet-document p-6 bg-white border border-gray-700 font-sans text-xs">
            
            <div className="marksheet-header flex justify-between items-center mb-1">
    
    {/* --- LEFT SIDE: School Logo (ADJUSTED WIDTH) --- */}
    <div className="w-[100px] flex justify-start items-center flex-shrink-0">
        <img 
            src={SchoolLogo.src || SchoolLogo} 
            alt="School Logo" 
            className="w-full max-w-[70px] h-auto object-contain"
            style={{ maxHeight: '70px' , marginLeft:'80px'}} 
        />
    </div>

    {/* --- CENTER: School Name & Address (GAP INCREASED) --- */}
    <div className="text-center flex-grow px-2 flex flex-col items-center justify-center">
        <h1 
            className="text-4xl font-extrabold text-gray-900 leading-none"
            style={{ margin: '0', padding: '0', marginBottom: '4px' }} 
        >
            MVG PUBLIC SCHOOL
        </h1>
        <p 
            className="text-xs text-gray-700 leading-tight"
            style={{ margin: '0', padding: '0' }}
        >
            Shyopur, Pratap Nagar, Sanganer, Jaipur | 9829018332 , 0141-3152600
        </p>
    </div>

    {/* --- RIGHT SIDE: Placeholder (Minimized Width) --- */}
    <div className="w-[50px] flex-shrink-0">
        {/* Minimal space to push the center block slightly left */}
    </div>
</div>

{/* --- 2. SECOND ROW: MARKSHEET TITLE (NO GAP BETWEEN ROW 1 & 2) --- */}
<div className="text-center mb-3"> 
    <h2 
        className="text-lg font-extrabold text-blue-800 leading-none"
        style={{ margin: '0', padding: '0' }} 
    >
          ACADEMIC MARK SHEET
    </h2>
    
</div>

            {/* --- 3. STUDENT DEMOGRAPHICS (Non-Result Based) --- */}
            <div className="flex justify-between items-start mb-6 border border-gray-500 p-3 rounded-md bg-gray-50">
                
                {/* Student Personal Details */}
                <div className="grid grid-cols-2 gap-y-1 gap-x-6 text-sm flex-grow pr-6 border-r border-gray-300">
                    <p><strong>Name:</strong> {student.name}</p>
                    <p><strong>Roll No:</strong> {student.rollNumber}</p>
                    <p><strong>Father's Name:</strong> {student.fatherName}</p>
                    <p><strong>Class:</strong> {student.grade}</p>
                    <p><strong>DOB:</strong> {student.dob || 'N/A'}</p>
                    <p><strong>Academic Year:</strong> {new Date().getFullYear()}</p>
                </div>
                
                {/* Student Photo */}
                <div className="w-20 h-24 border border-gray-400 rounded-md overflow-hidden flex-shrink-0 ml-4">
                    {student.imageUrl ? (
                        <img 
                            src={student.imageUrl} 
                            alt={`${student.name} Photo`} 
                            className="w-full h-full object-cover" 
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                            Photo
                        </div>
                    )}
                </div>
            </div>

            {/* --- 4. CONSOLIDATED MARKS TABLE (FIXED WIDTHS) --- */}
            <div className="marks-section mb-6">
                <table className="min-w-full border border-gray-700 border-collapse">
                    <thead>
                        <tr className="bg-indigo-100 text-indigo-900 font-bold text-center">
                            <th className="border border-gray-700 p-1 text-left w-[20%]" rowSpan="2">Subject</th>
                            {examResults.map((exam, index) => (
                                <th key={`max-header-${index}`} className="border border-gray-700 p-1" colSpan="2">
                                    {exam.examName}
                                </th>
                            ))}
                            <th className="border border-gray-700 p-1 w-[10%]" rowSpan="2">Total Obtained</th>
                        </tr>
                        <tr className="bg-indigo-50 text-indigo-800 font-medium text-center">
                            {examResults.map((exam, index) => (
                                <React.Fragment key={`sub-header-${index}`}>
                                    <th className="border border-gray-700 p-1 font-normal w-[6%]">Max</th>
                                    <th className="border border-gray-700 p-1 font-normal w-[7%]">Obt.</th>
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {consolidatedData.map((row, index) => {
                            const totalObtained = getSubjectTotalObtained(row);
                            return (
                                <tr key={index} className="odd:bg-white even:bg-gray-50 text-center">
                                    <td className="border border-gray-700 p-1 text-left font-medium">{row.subjectName}</td>
                                    
                                    {examResults.map((exam, exIndex) => {
                                        const maxMarksObj = exam.subjects.find(s => s.name === row.subjectName);
                                        const maxMarks = maxMarksObj ? (maxMarksObj.maxMarks || 100) : '-';
                                        const obtainedMark = row[exam.examName];

                                        return (
                                            <React.Fragment key={`marks-${index}-${exIndex}`}>
                                                <td className="border border-gray-700 p-1">{maxMarks}</td>
                                                <td className="border border-gray-700 p-1 font-bold">
                                                    {obtainedMark}
                                                </td>
                                            </React.Fragment>
                                        );
                                    })}
                                    <td className="border border-gray-700 p-1 bg-green-50 font-bold">{totalObtained}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {/* --- 5. RESULTS SUMMARY (Result-Oriented Metrics) --- */}
            <div className="grid grid-cols-4 gap-4 mb-6 pt-4 border-t border-gray-700">
                <div className="col-span-1 bg-blue-50 p-3 border border-blue-200">
                    <p className="text-sm"><strong>Total Max Marks:</strong></p>
                    <p className="text-lg font-bold text-blue-800">{student.totalMax}</p>
                </div>
                <div className="col-span-1 bg-blue-50 p-3 border border-blue-200">
                    <p className="text-sm"><strong>Total Marks Obtained:</strong></p>
                    <p className="text-lg font-bold text-blue-800">{student.totalObtained}</p>
                </div>
                <div className="col-span-1 bg-green-50 p-3 border border-green-200">
                    <p className="text-sm"><strong>Overall Percentage:</strong></p>
                    <p className="text-lg font-bold text-green-800">{student.percentage}%</p>
                </div>
                <div className="col-span-1 bg-red-50 p-3 border border-red-200">
                    <p className="text-sm"><strong>Final Grade:</strong></p>
                    <p className="text-lg font-bold text-red-800">{student.finalGrade}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                {/* Attendance (Updated with fetched data) */}
                <div className="bg-yellow-50 p-3 border border-yellow-200">
                    <p className="text-sm font-semibold">Total Attendance ({new Date().getFullYear()}):</p>
                    <p className="text-lg font-bold text-yellow-800">{student.totalAttendance}</p>
                </div>
                
                {/* Class Rank (Updated with calculated data) */}
                <div className="bg-purple-50 p-3 border border-purple-200">
                    <p className="text-sm font-semibold">Class Rank:</p>
                    <p className="text-lg font-bold text-purple-800">#{student.classRank}</p>
                </div>
            </div>


            {/* --- REMARK --- */}
            <div className="mb-8 pt-2 border-t border-gray-700">
                <p className="text-sm font-semibold mb-1">Class Teacher Remark:</p>
                <div className="border border-gray-500 p-2 min-h-[40px] bg-yellow-50 text-gray-700">
                    {student.classTeacherRemark}
                </div>
            </div>

            {/* --- SIGNATURES (LINE REMOVED) --- */}
            {/* Removed the <div className="mt-8 pt-4 border-t border-gray-700 ... > and the text lines */}
            <div className="mt-8 flex justify-around text-xs text-gray-800 font-medium">
                <div className="text-center">
                    <div className="h-4 mb-4 border-b border-gray-400 w-32 mx-auto"></div>
                    <p>Class Teacher Signature</p>
                </div>
                <div className="text-center">
                    <div className="h-4 mb-4 border-b border-gray-400 w-32 mx-auto"></div>
                    <p>Parent/Guardian Signature</p>
                </div>
                <div className="text-center">
                    <div className="h-4 mb-4 border-b border-gray-400 w-32 mx-auto"></div>
                    <p>Principal Signature</p>
                </div>
            </div>
        </div>
    );
};

export default MarksheetTemplate;