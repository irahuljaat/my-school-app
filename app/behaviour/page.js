'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Printer, 
  Download, 
  Award, 
  User, 
  Calendar, 
  FileText,
  X,
  Check
} from 'lucide-react';
import { db } from '../firebase/config';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  setDoc 
} from 'firebase/firestore';

export default function BehaviorManagementPage() {
  const [activeSession, setActiveSession] = useState('2026-27');
  const [loading, setLoading] = useState(true);

  // Data states
  const [studentsList, setStudentsList] = useState([]);
  const [behaviorRecordsMap, setBehaviorRecordsMap] = useState({}); // date -> records object
  
  // UI states
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('logIncident'); // 'logIncident', 'studentReport', 'rankings'

  // Modal / Form state for adding incident
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [incidentType, setIncidentType] = useState('Disruption in Class');
  const [severity, setSeverity] = useState('Moderate'); // Minor, Moderate, Severe
  const [incidentDescription, setIncidentDescription] = useState('');
  const [targetStudentId, setTargetStudentId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

 // ── 1. Fetch Active Session, Students, and Behavior Data ──
  async function loadData() {
    try {
      setLoading(true);
      const settingsRef = doc(db, 'config', 'settings');
      const settingsSnap = await getDoc(settingsRef);
      
      let currentActiveSession = '2026-27';
      if (settingsSnap.exists() && settingsSnap.data().activeSession) {
        currentActiveSession = settingsSnap.data().activeSession;
      }
      setActiveSession(currentActiveSession);

      const sessionPath = `sessions/${currentActiveSession}`;

      // Fetch all students from the main 'students' collection or session students collection
      let students = [];
      const studentsRef = collection(db, sessionPath, 'students');
      const studentsSnap = await getDocs(studentsRef);
      
      if (!studentsSnap.empty) {
        students = studentsSnap.docs.map(d => ({
          studentId: d.id,
          ...d.data()
        }));
      } else {
        // Fallback to feePayments if the students collection is empty in this session path
        const feeRef = collection(db, sessionPath, 'feePayments');
        const feeSnap = await getDocs(feeRef);
        students = feeSnap.docs.map(d => ({
          studentId: d.id,
          ...d.data()
        }));
      }

      setStudentsList(students);
      if (students.length > 0 && !selectedStudentId) {
        setSelectedStudentId(students[0].studentId);
        setTargetStudentId(students[0].studentId);
      }

      // Fetch Behavior Collection
      const behaviorRef = collection(db, sessionPath, 'behavior');
      const behaviorSnap = await getDocs(behaviorRef);
      const bMap = {};
      behaviorSnap.docs.forEach(docSnap => {
        bMap[docSnap.id] = docSnap.data().records || {};
      });
      setBehaviorRecordsMap(bMap);

    } catch (err) {
      console.error('Error loading behavior management data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ── 2. Handle Logging Incident ──
  const handleSaveIncident = async (e) => {
    e.preventDefault();
    if (!targetStudentId || !incidentDescription.trim()) {
      alert('Please select a student and provide an incident description.');
      return;
    }

    try {
      setLoading(true);
      const sessionPath = `sessions/${activeSession}`;
      const docRef = doc(db, sessionPath, 'behavior', incidentDate);

      // Fetch existing records for this date if any
      const existingDoc = behaviorRecordsMap[incidentDate] || {};

      const updatedRecords = {
        ...existingDoc,
        [targetStudentId]: {
          type: incidentType,
          severity: severity,
          description: incidentDescription.trim(),
          loggedAt: new Date().toLocaleTimeString()
        }
      };

      // Save to Firestore
      await setDoc(docRef, { records: updatedRecords }, { merge: true });

      // Refresh local state
      setBehaviorRecordsMap(prev => ({
        ...prev,
        [incidentDate]: updatedRecords
      }));

      setSuccessMessage('Behavioral incident successfully logged!');
      setIncidentDescription('');
      setTimeout(() => setSuccessMessage(''), 4000);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving incident:', err);
      alert('Failed to save incident record.');
    } finally {
      setLoading(false);
    }
  };

  // ── 3. Helper Calculations & Aggregations ──
  // Compute incidents per student across all dates
  const studentIncidentStats = studentsList.map(student => {
    let totalIncidents = 0;
    let severeCount = 0;
    let moderateCount = 0;
    let minorCount = 0;
    const history = [];

    Object.keys(behaviorRecordsMap).forEach(dateKey => {
      const dayRecords = behaviorRecordsMap[dateKey];
      Object.keys(dayRecords).forEach(key => {
        if (key === student.studentId || key.startsWith(student.studentId)) {
          const inc = dayRecords[key];
          totalIncidents++;
          if (inc.severity === 'Severe') severeCount++;
          else if (inc.severity === 'Moderate') moderateCount++;
          else minorCount++;

          history.push({
            date: dateKey,
            ...inc
          });
        }
      });
    });

    // Conduct Score calculation (Start at 100, deduct points per incident severity)
    const conductScore = Math.max(0, 100 - (severeCount * 15 + moderateCount * 8 + minorCount * 3));

    return {
      ...student,
      totalIncidents,
      severeCount,
      moderateCount,
      minorCount,
      conductScore,
      history
    };
  });

  // Sort for Rankings (Cleanest conduct score / fewest incidents first, or vice versa)
  const rankedStudents = [...studentIncidentStats].sort((a, b) => b.conductScore - a.conductScore);

  const selectedStudentObj = studentIncidentStats.find(s => s.studentId === selectedStudentId) || studentIncidentStats[0];

  // Filtered list for student selection
  const filteredStudents = studentsList.filter(s => 
    String(s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(s.studentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(s.grade || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── 4. Export to CSV ──
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Student ID,Student Name,Grade,Total Incidents,Severe,Moderate,Minor,Conduct Score\n";
    
    studentIncidentStats.forEach(s => {
      csvContent += `"${s.studentId}","${s.name || ''}","${s.grade || ''}",${s.totalIncidents},${s.severeCount},${s.moderateCount},${s.minorCount},${s.conductScore}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `student_behavior_report_${activeSession}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">

      {/* Header */}
      <header className="flex flex-col bg-white border-b border-slate-200 shadow-xs shrink-0 print:hidden">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
              <ShieldAlert className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Student Behavioral Management & Incident Tracking</h1>
              <p className="text-xs text-slate-500">Active Session: <span className="font-semibold text-rose-600">{activeSession}</span></p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log New Incident</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-8 space-x-6 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('logIncident')}
            className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'logIncident' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Incident Logs Overview
          </button>
          <button
            onClick={() => setActiveTab('studentReport')}
            className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'studentReport' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Individual Student Behavior Report
          </button>
          <button
            onClick={() => setActiveTab('rankings')}
            className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'rankings' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Conduct Rankings & Scoreboard
          </button>
        </div>
      </header>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-8 py-3 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-fade-in print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 lg:p-8">

        {/* TAB 1: INCIDENT LOGS OVERVIEW */}
        {activeTab === 'logIncident' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total Incidents Logged</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {studentIncidentStats.reduce((acc, s) => acc + s.totalIncidents, 0)}
                  </p>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl text-rose-600 border border-rose-100">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Students with Infractions</p>
                  <p className="text-2xl font-bold text-rose-600 mt-1">
                    {studentIncidentStats.filter(s => s.totalIncidents > 0).length}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Exemplary Conduct Students</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {studentIncidentStats.filter(s => s.totalIncidents === 0).length}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* All Incidents Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Recent Behavioral Incident Logs</span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer print:hidden"
                >
                  + Add Incident
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-6 font-bold">Date</th>
                      <th className="py-3 px-6 font-bold">Student Name</th>
                      <th className="py-3 px-6 font-bold">Grade</th>
                      <th className="py-3 px-6 font-bold">Incident Type</th>
                      <th className="py-3 px-6 font-bold">Severity</th>
                      <th className="py-3 px-6 font-bold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.keys(behaviorRecordsMap).length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-slate-400">No behavioral incidents logged yet.</td>
                      </tr>
                    ) : (
                      Object.entries(behaviorRecordsMap).flatMap(([dateKey, dayRecords]) => 
                        Object.entries(dayRecords).map(([studId, incident], i) => {
                          const student = studentsList.find(s => s.studentId === studId);
                          return (
                            <tr key={`${dateKey}-${studId}-${i}`} className="hover:bg-slate-50">
                              <td className="py-3 px-6 font-mono text-slate-600">{dateKey}</td>
                              <td className="py-3 px-6 font-bold text-slate-900">{student?.name || studId}</td>
                              <td className="py-3 px-6 text-slate-600">{student?.grade || 'N/A'}</td>
                              <td className="py-3 px-6 font-semibold text-slate-800">{incident.type}</td>
                              <td className="py-3 px-6">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                                  incident.severity === 'Severe' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                  incident.severity === 'Moderate' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                  'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}>
                                  {incident.severity}
                                </span>
                              </td>
                              <td className="py-3 px-6 text-slate-600 max-w-xs truncate">{incident.description}</td>
                            </tr>
                          );
                        })
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INDIVIDUAL STUDENT BEHAVIOR REPORT */}
        {activeTab === 'studentReport' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar Student Selector */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs sticky top-6 print:hidden">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <User className="w-4 h-4 text-rose-600" />
                  <span>Select Student ({studentsList.length})</span>
                </h2>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student name, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-500 focus:bg-white"
                />
              </div>

              <div className="max-h-[550px] overflow-y-auto space-y-1.5 pr-1">
                {filteredStudents.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-8">No students found.</p>
                ) : (
                  filteredStudents.map((s) => (
                    <div
                      key={s.studentId}
                      onClick={() => setSelectedStudentId(s.studentId)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedStudentId === s.studentId 
                          ? 'bg-rose-50/80 border-rose-300 text-rose-900 shadow-2xs' 
                          : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-xs">{s.name || 'Unnamed Student'}</p>
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

            {/* Student Behavioral Dossier */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-xs p-6 lg:p-8 space-y-8">
              {!selectedStudentObj ? (
                <p className="text-center text-slate-400 py-12">Please select a student.</p>
              ) : (
                <>
                  {/* Profile Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-700 font-bold text-xl border border-rose-200">
                        {(selectedStudentObj.name || 'S').charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">{selectedStudentObj.name || 'Student Name'}</h2>
                        <p className="text-xs font-mono text-slate-500 mt-0.5">ID: {selectedStudentObj.studentId} | Grade: {selectedStudentObj.grade || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Conduct Score</span>
                        <span className={`text-xl font-bold ${selectedStudentObj.conductScore >= 80 ? 'text-emerald-600' : selectedStudentObj.conductScore >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {selectedStudentObj.conductScore} / 100
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                      <span className="text-slate-500 block">Total Incidents</span>
                      <span className="font-bold text-slate-900 text-lg mt-1 block">{selectedStudentObj.totalIncidents}</span>
                    </div>
                    <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 text-xs">
                      <span className="text-rose-700 block">Severe Infractions</span>
                      <span className="font-bold text-rose-800 text-lg mt-1 block">{selectedStudentObj.severeCount}</span>
                    </div>
                    <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 text-xs">
                      <span className="text-amber-700 block">Moderate Infractions</span>
                      <span className="font-bold text-amber-800 text-lg mt-1 block">{selectedStudentObj.moderateCount}</span>
                    </div>
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs">
                      <span className="text-blue-700 block">Minor Infractions</span>
                      <span className="font-bold text-blue-800 text-lg mt-1 block">{selectedStudentObj.minorCount}</span>
                    </div>
                  </div>

                  {/* Incident History Timeline */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>Detailed Incident History ({selectedStudentObj.history.length})</span>
                    </h3>
                    
                    {selectedStudentObj.history.length === 0 ? (
                      <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center space-x-3 text-xs">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-bold text-emerald-900">Impeccable Record</p>
                          <p className="text-emerald-700 mt-0.5">No negative incidents have been logged for this student during the current session.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {selectedStudentObj.history.map((inc, idx) => (
                          <div key={idx} className="p-4 bg-rose-50/30 rounded-2xl border border-rose-100 text-xs space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-rose-900 flex items-center space-x-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                <span>{inc.type}</span>
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                  inc.severity === 'Severe' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {inc.severity}
                                </span>
                                <span className="font-mono text-[11px] text-slate-500">{inc.date}</span>
                              </div>
                            </div>
                            <p className="text-slate-700 pl-5">{inc.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: CONDUCT RANKINGS & SCOREBOARD */}
        {activeTab === 'rankings' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Student Conduct Scoreboard & Rankings</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Ranked by behavioral conduct score (Out of 100)</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer print:hidden"
              >
                Download Leaderboard CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-6 font-bold">Rank</th>
                    <th className="py-3 px-6 font-bold">Student ID</th>
                    <th className="py-3 px-6 font-bold">Student Name</th>
                    <th className="py-3 px-6 font-bold">Grade</th>
                    <th className="py-3 px-6 font-bold text-center">Total Incidents</th>
                    <th className="py-3 px-6 font-bold text-center">Conduct Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rankedStudents.map((s, index) => (
                    <tr key={s.studentId} className="hover:bg-slate-50">
                      <td className="py-3 px-6 font-bold text-slate-900">
                        {index === 0 ? '🏆 1st' : index === 1 ? '🥈 2nd' : index === 2 ? '🥉 3rd' : `#${index + 1}`}
                      </td>
                      <td className="py-3 px-6 font-mono text-slate-600">{s.studentId}</td>
                      <td className="py-3 px-6 font-bold text-slate-900">{s.name || 'Unnamed'}</td>
                      <td className="py-3 px-6 text-slate-600">{s.grade || 'N/A'}</td>
                      <td className="py-3 px-6 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-bold ${s.totalIncidents > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {s.totalIncidents}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center font-bold font-mono">
                        <span className={`px-3 py-1 rounded-lg text-xs ${
                          s.conductScore >= 90 ? 'bg-emerald-100 text-emerald-800' :
                          s.conductScore >= 70 ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {s.conductScore} / 100
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* MODAL: ADD NEW INCIDENT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-6 animate-scale-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Log Behavioral Incident</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIncident} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Student *</label>
                <select
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-medium"
                  required
                >
                  {studentsList.map(s => (
                    <option key={s.studentId} value={s.studentId}>
                      {s.name || s.studentId} (Grade: {s.grade || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Incident Date *</label>
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Severity Level *</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-rose-500"
                  >
                    <option value="Minor">Minor (-3 pts)</option>
                    <option value="Moderate">Moderate (-8 pts)</option>
                    <option value="Severe">Severe (-15 pts)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Incident Type *</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-rose-500"
                >
                  <option value="Disruption in Class">Disruption in Class</option>
                  <option value="Incomplete Homework">Incomplete Homework</option>
                  <option value="Disrespect to Faculty">Disrespect to Faculty</option>
                  <option value="Late Attendance / Truancy">Late Attendance / Truancy</option>
                  <option value="Uniform Violation">Uniform Violation</option>
                  <option value="Property Damage">Property Damage</option>
                  <option value="General Conduct Infraction">General Conduct Infraction</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Description / Remarks *</label>
                <textarea
                  rows="3"
                  placeholder="Enter specific details of the incident..."
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}