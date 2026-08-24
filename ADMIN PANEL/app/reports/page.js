'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  User, 
  Calendar, 
  DollarSign, 
  Award, 
  Bell, 
  Printer, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { db } from '../firebase/config';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs 
} from 'firebase/firestore';

export default function StudentReportPage() {
  const [activeSession, setActiveSession] = useState('2026-27');
  const [loading, setLoading] = useState(true);

  // Data states
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Individual student data across collections
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [studentFee, setStudentFee] = useState(null);
  const [studentNotices, setStudentNotices] = useState([]);
  const [studentExamMarks, setStudentExamMarks] = useState([]);
  const [studentClassTests, setStudentClassTests] = useState([]);
  const [studentBehavior, setStudentBehavior] = useState([]);

  // ── Fetch Active Session and Students List ──
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const settingsRef = doc(db, 'config', 'settings');
        const settingsSnap = await getDoc(settingsRef);
        
        let currentActiveSession = '2026-27';
        if (settingsSnap.exists() && settingsSnap.data().activeSession) {
          currentActiveSession = settingsSnap.data().activeSession;
        }
        setActiveSession(currentActiveSession);

        const feeRef = collection(db, 'sessions', currentActiveSession, 'feePayments');
        const feeSnap = await getDocs(feeRef);
        
        const students = feeSnap.docs.map(d => ({
          studentId: d.id,
          ...d.data()
        }));

        setStudentsList(students);
        if (students.length > 0) {
          setSelectedStudentId(students[0].studentId);
        }
      } catch (err) {
        console.error('Error initializing student reports:', err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // ── Fetch Specific Student Records when selectedStudentId changes ──
  useEffect(() => {
    if (!selectedStudentId) return;

    async function fetchStudentDetails() {
      try {
        setLoading(true);
        const sessionPath = `sessions/${activeSession}`;

        // 1. Fetch Fee Payment Record
        const feeDocRef = doc(db, sessionPath, 'feePayments', selectedStudentId);
        const feeDocSnap = await getDoc(feeDocRef);
        setStudentFee(feeDocSnap.exists() ? feeDocSnap.data() : null);

        const studentSrNoMatch = selectedStudentId.split('_')[0].replace('S', '');

        // 2. Fetch Attendance
        const attendanceRef = collection(db, sessionPath, 'attendance');
        const attendanceSnap = await getDocs(attendanceRef);
        const attRecords = [];
        attendanceSnap.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (data.records) {
            Object.keys(data.records).forEach(key => {
              if (key.startsWith(selectedStudentId) || key.includes(studentSrNoMatch)) {
                attRecords.push({
                  date: data.date,
                  status: data.records[key]
                });
              }
            });
          }
        });
        setStudentAttendance(attRecords);

        // 3. Fetch Notices
        const noticeDocRef = doc(db, sessionPath, 'notices', selectedStudentId);
        const noticeDocSnap = await getDoc(noticeDocRef);
        if (noticeDocSnap.exists()) {
          const noticeData = noticeDocSnap.data();
          const formattedNotices = [];
          Object.keys(noticeData).forEach(dateKey => {
            const dateObj = noticeData[dateKey];
            if (typeof dateObj === 'object' && dateObj !== null) {
              Object.keys(dateObj).forEach(noticeId => {
                formattedNotices.push({
                  date: dateKey,
                  id: noticeId,
                  ...dateObj[noticeId]
                });
              });
            }
          });
          setStudentNotices(formattedNotices);
        } else {
          setStudentNotices([]);
        }

        // 4. Fetch Exam Marks
        const examMarksRef = collection(db, sessionPath, 'examMarks');
        const examMarksSnap = await getDocs(examMarksRef);
        const examRecords = [];
        examMarksSnap.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (data.marks) {
            Object.keys(data.marks).forEach(key => {
              if (key.startsWith(selectedStudentId) || key.includes(studentSrNoMatch)) {
                examRecords.push({
                  examName: docSnap.id,
                  marks: data.marks[key]
                });
              }
            });
          }
        });
        setStudentExamMarks(examRecords);

        // 5. Fetch Class Tests
        const classTestsRef = collection(db, sessionPath, 'classtests');
        const classTestsSnap = await getDocs(classTestsRef);
        const testRecords = [];
        classTestsSnap.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (data.marks) {
            Object.keys(data.marks).forEach(key => {
              if (key.startsWith(selectedStudentId) || key.includes(studentSrNoMatch)) {
                testRecords.push({
                  testTitle: docSnap.id,
                  date: data.date,
                  ...data.marks[key]
                });
              }
            });
          }
        });
        setStudentClassTests(testRecords);

        // 6. Fetch Behavioral Incident Records (Collection: behavior)
        try {
          const behaviorRef = collection(db, sessionPath, 'behavior');
          const behaviorSnap = await getDocs(behaviorRef);
          const behaviorIncidents = [];
          behaviorSnap.docs.forEach(docSnap => {
            const data = docSnap.data();
            if (data.records) {
              Object.keys(data.records).forEach(key => {
                if (key.startsWith(selectedStudentId) || key.includes(studentSrNoMatch)) {
                  const incidentData = data.records[key];
                  behaviorIncidents.push({
                    date: data.date || docSnap.id,
                    severity: incidentData.severity || 'Moderate', // e.g., 'Minor', 'Moderate', 'Severe'
                    incidentType: incidentData.type || incidentData.incidentType || 'General Conduct',
                    description: incidentData.description || incidentData.remarks || incidentData.body || 'Logged behavioral incident.'
                  });
                }
              });
            }
          });
          setStudentBehavior(behaviorIncidents);
        } catch {
          setStudentBehavior([]);
        }

      } catch (err) {
        console.error('Error fetching individual student records:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStudentDetails();
  }, [selectedStudentId, activeSession]);

  const selectedStudentObj = studentsList.find(s => s.studentId === selectedStudentId);

  const filteredStudents = studentsList.filter(s => 
    String(s.studentName || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
    String(s.studentId || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
    String(s.grade || '').toLowerCase().includes(studentSearch.toLowerCase())
  );

  // ── Analytics & Growth Calculations ──
  const totalFee = studentFee?.totalFee || 0;
  const paidAmount = studentFee?.paidAmount || 0;
  const computedDueFees = totalFee - paidAmount; // totalFees - paidAmount

  const totalAttendanceCount = studentAttendance.length;
  const presentCount = studentAttendance.filter(a => a.status === 'present').length;
  const attendancePercentage = totalAttendanceCount > 0 ? Math.round((presentCount / totalAttendanceCount) * 100) : 0;

  let totalScoreSum = 0;
  let totalScoreCount = 0;
  studentClassTests.forEach(test => {
    if (test.maxMarks && test.maxMarks > 0 && test.obtainedMarks !== undefined) {
      totalScoreSum += (Number(test.obtainedMarks) / Number(test.maxMarks)) * 100;
      totalScoreCount++;
    }
  });
  const averageTestPercentage = totalScoreCount > 0 ? Math.round(totalScoreSum / totalScoreCount) : 0;

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">

      {/* Header */}
      <header className="flex flex-col bg-white border-b border-slate-200 shadow-xs shrink-0 print:hidden">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Student Incident-Based Comprehensive Report</h1>
              <p className="text-xs text-slate-500">Active Session: <span className="font-semibold text-indigo-600">{activeSession}</span></p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrintReport}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Student Selector Sidebar */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs sticky top-6 print:hidden">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <User className="w-4 h-4 text-indigo-600" />
                <span>Select Student ({studentsList.length})</span>
              </h2>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search student name, ID..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div className="max-h-[600px] overflow-y-auto space-y-1.5 pr-1">
              {filteredStudents.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">No students found.</p>
              ) : (
                filteredStudents.map((s) => (
                  <div
                    key={s.studentId}
                    onClick={() => setSelectedStudentId(s.studentId)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedStudentId === s.studentId 
                        ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 shadow-2xs' 
                        : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-xs">{s.studentName || 'Unnamed Student'}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">ID: {s.studentId}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-semibold">
                      Grade: {s.grade || 'N/A'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Comprehensive Report & Incident-Driven Growth Insights */}
          <div className="lg:col-span-8 flex flex-col space-y-6">
            {!selectedStudentObj ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-xs">
                Please select a student from the sidebar to view their incident report and analytical growth details.
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 lg:p-8 space-y-8">
                
                {/* Report Header Profile Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700 font-bold text-xl border border-indigo-200 shadow-2xs">
                      {(selectedStudentObj.studentName || 'S').charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{selectedStudentObj.studentName || 'Student Name'}</h2>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">ID: {selectedStudentObj.studentId}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200">
                      Grade / Class: {selectedStudentObj.grade || 'N/A'}
                    </span>
                    <span className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100">
                      Session: {activeSession}
                    </span>
                  </div>
                </div>

                {/* Section 1: Fee Payments Overview (Due Fees = Total Fees - Paid Amount) */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Fee Payment Summary</span>
                  </h3>
                  {studentFee ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-500 block">Total Fee</span>
                        <span className="font-bold text-slate-900 text-sm">₹{totalFee}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Paid Amount</span>
                        <span className="font-bold text-emerald-600 text-sm">₹{paidAmount}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Due Fees (Total - Paid)</span>
                        <span className={`font-bold text-sm ${computedDueFees > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          ₹{computedDueFees}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Last Payment Date</span>
                        <span className="font-bold font-mono text-slate-800">{studentFee.lastPaymentDate || 'None'}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl">No fee records found for this student.</p>
                  )}
                </div>

                {/* Section 2: Behavioral Incidents Log */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Behavioral Incidents Log ({studentBehavior.length})</span>
                  </h3>
                  {studentBehavior.length === 0 ? (
                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-start space-x-3 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-emerald-900">Zero Incident Reports</p>
                        <p className="text-emerald-700 mt-0.5">No negative behavioral incidents or disciplinary infractions recorded in the database for this student.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {studentBehavior.map((incident, idx) => (
                        <div key={idx} className="p-4 bg-rose-50/30 rounded-2xl border border-rose-100 text-xs space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-rose-900 flex items-center space-x-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>{incident.incidentType}</span>
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-semibold rounded-md text-[10px]">
                                {incident.severity}
                              </span>
                              <span className="font-mono text-[11px] text-slate-500">{incident.date}</span>
                            </div>
                          </div>
                          <p className="text-slate-700 pl-5">{incident.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 3: Analytical Detail & Incident-Driven Growth Focus Points */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <span>Analytical Insights & Growth Focus Points</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 text-xs">
                    <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
                      <span className="text-slate-500 block font-medium">Attendance Rate</span>
                      <span className="text-lg font-bold text-indigo-900 mt-1 block">{attendancePercentage}%</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{presentCount} of {totalAttendanceCount} days</span>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
                      <span className="text-slate-500 block font-medium">Class Test Average</span>
                      <span className="text-lg font-bold text-indigo-900 mt-1 block">{averageTestPercentage}%</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Evaluated tests: {totalScoreCount}</span>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
                      <span className="text-slate-500 block font-medium">Recorded Incidents</span>
                      <span className={`text-lg font-bold mt-1 block ${studentBehavior.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {studentBehavior.length} {studentBehavior.length === 1 ? 'Incident' : 'Incidents'}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Behavioral log</span>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
                      <span className="text-slate-500 block font-medium">Fee Due Balance</span>
                      <span className={`text-lg font-bold mt-1 block ${computedDueFees > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ₹{computedDueFees}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Total - Paid</span>
                    </div>
                  </div>

                  {/* Incident-Based Actionable Recommendations */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>Targeted Focus Points for Student Growth & Counseling:</span>
                    </h4>
                    <ul className="space-y-2 text-slate-700 pl-4 list-disc">
                      {studentBehavior.length > 0 ? (
                        <li className="font-medium text-rose-700">
                          <strong>Behavioral Intervention:</strong> With {studentBehavior.length} documented incident(s), school counselors should hold a one-on-one session to address conduct issues and involve parents for guided mentoring.
                        </li>
                      ) : (
                        <li className="font-medium text-emerald-700">
                          <strong>Exemplary Conduct:</strong> Zero behavioral incidents logged. Maintain positive motivation and acknowledge good discipline during school assemblies.
                        </li>
                      )}
                      {attendancePercentage < 75 && (
                        <li className="font-medium text-amber-700">
                          <strong>Attendance Correction:</strong> Attendance stands at {attendancePercentage}%. Follow up with parents to ensure consistency.
                        </li>
                      )}
                      {averageTestPercentage < 60 && totalScoreCount > 0 && (
                        <li className="font-medium text-amber-700">
                          <strong>Academic Support:</strong> Average test scores are below 60%. Provide targeted remedial assistance.
                        </li>
                      )}
                      {computedDueFees > 0 && (
                        <li className="font-medium text-indigo-700">
                          <strong>Fee Clearance:</strong> Outstanding balance of ₹{computedDueFees}. Send automated payment reminders.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Section 4: Attendance Records */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Attendance Records ({studentAttendance.length})</span>
                  </h3>
                  {studentAttendance.length === 0 ? (
                    <p className="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl">No attendance records logged.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500">
                          <tr>
                            <th className="py-2.5 px-4 font-bold">Date</th>
                            <th className="py-2.5 px-4 font-bold text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentAttendance.map((att, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2.5 px-4 font-mono font-medium text-slate-800">{att.date}</td>
                              <td className="py-2.5 px-4 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  att.status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {att.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section 5: Exam Marks & Assessments */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span>Exam Marks & Assessments</span>
                  </h3>
                  {studentExamMarks.length === 0 ? (
                    <p className="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl">No formal exam marks available.</p>
                  ) : (
                    <div className="space-y-3">
                      {studentExamMarks.map((exam, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <h4 className="font-bold text-xs text-indigo-600 uppercase tracking-wide mb-2">Exam: {exam.examName}</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            {Object.entries(exam.marks || {}).map(([subject, score], sIdx) => (
                              <div key={sIdx} className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center">
                                <span className="font-medium text-slate-600">{subject}</span>
                                <span className="font-bold font-mono text-slate-900">{score !== '' ? score : '-'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 6: Class Tests */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Class Tests Results ({studentClassTests.length})</span>
                  </h3>
                  {studentClassTests.length === 0 ? (
                    <p className="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl">No class test records found.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500">
                          <tr>
                            <th className="py-2.5 px-4 font-bold">Test Title / Subject</th>
                            <th className="py-2.5 px-4 font-bold">Obtained Marks</th>
                            <th className="py-2.5 px-4 font-bold text-right">Max Marks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentClassTests.map((test, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2.5 px-4 font-bold text-slate-800">{test.testTitle}</td>
                              <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">{test.obtainedMarks}</td>
                              <td className="py-2.5 px-4 font-mono text-right text-slate-600">{test.maxMarks}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section 7: Student Notices */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-rose-600" />
                    <span>Targeted Student Notices ({studentNotices.length})</span>
                  </h3>
                  {studentNotices.length === 0 ? (
                    <p className="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl">No personal notices for this student.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {studentNotices.map((n, idx) => (
                        <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900">{n.title}</span>
                            <span className="font-mono text-[11px] text-slate-400">{n.date} ({n.createdAt})</span>
                          </div>
                          <p className="text-slate-600">{n.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>
      </main>

    </div>
  );
}