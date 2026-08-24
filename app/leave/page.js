'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../firebase/config';
import { collection, doc, setDoc, getDocs, getDoc, serverTimestamp } from 'firebase/firestore';
import { useColors } from '../components/ColorComponent';
import { 
  HiOutlineArrowLeft, HiOutlineCalendar, HiOutlineDocumentText, 
  HiOutlineCheckCircle, HiOutlineClock, HiOutlineXCircle, HiOutlinePlusSm 
} from 'react-icons/hi';

export default function StudentLeavePage() {
  const colors = useColors();
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [activeSession, setActiveSession] = useState('2026-27');
  const [leaveList, setLeaveList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [subject, setSubject] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [message, setMessage] = useState('');

  // School Amber/Yellow Theme Accent matching Dashboard, Homework, Notices, Marks, Syllabus, Report Cards & Gallery
  const primaryThemeColor = '#EAB308';

  useEffect(() => {
    const sessionData = localStorage.getItem('studentSession');
    if (!sessionData) {
      router.replace('/studentlogin');
      return;
    }
    const parsedStudent = JSON.parse(sessionData);
    setStudent(parsedStudent);

    fetchLeaveApplications(parsedStudent);
  }, [router]);

  const fetchLeaveApplications = async (currentStudent) => {
    try {
      const settingsSnap = await getDoc(doc(db, 'config', 'settings'));
      let session = '2026-27';
      if (settingsSnap.exists() && settingsSnap.data().activeSession) {
        session = settingsSnap.data().activeSession;
        setActiveSession(session);
      }

      const leaveRef = collection(db, 'sessions', session, 'leaveApplications');
      const querySnapshot = await getDocs(leaveRef);

      const studentId = currentStudent.id;
      const parsedLeaves = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.studentId === studentId) {
          parsedLeaves.push({
            id: docSnap.id,
            ...data
          });
        }
      });

      parsedLeaves.sort((a, b) => {
        const timeA = a.appliedAt?.toMillis ? a.appliedAt.toMillis() : new Date(a.appliedAt || 0).getTime();
        const timeB = b.appliedAt?.toMillis ? b.appliedAt.toMillis() : new Date(b.appliedAt || 0).getTime();
        return timeB - timeA;
      });

      setLeaveList(parsedLeaves);
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!subject || !fromDate || !toDate || !message) {
      alert('Please fill in all leave application fields.');
      return;
    }

    setSubmitting(true);
    try {
      const studentId = student.id;
      const docId = `${student.srNo || '0000'}_${Date.now()}`;
      const leaveRef = doc(db, 'sessions', activeSession, 'leaveApplications', docId);

      const formatDateStr = (dateVal) => {
        if (!dateVal) return '';
        const d = new Date(dateVal);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      };

      const newLeaveData = {
        studentId: studentId,
        studentName: student.name || 'Student',
        studentsSrNo: student.srNo || student.admissionNo || '0000',
        grade: String(student.class || student.grade || '1'),
        subject: subject,
        fromDate: formatDateStr(fromDate),
        toDate: formatDateStr(toDate),
        message: message,
        status: 'Pending',
        appliedAt: serverTimestamp()
      };

      await setDoc(leaveRef, newLeaveData);

      setSubject('');
      setFromDate('');
      setToDate('');
      setMessage('');
      
      alert('Leave application submitted successfully!');
      fetchLeaveApplications(student);

    } catch (err) {
      console.error('Error submitting leave application:', err);
      alert('Failed to submit leave application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-white font-bold tracking-widest uppercase">
        Loading Leave Portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden bg-slate-950 text-slate-100 transition-colors duration-500">
      
      {/* Background Glow Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[140px] opacity-10 pointer-events-none -mr-20 -mt-20" style={{ backgroundColor: primaryThemeColor }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[140px] opacity-10 pointer-events-none -ml-20 -mb-20" style={{ backgroundColor: primaryThemeColor }} />

      <div className="max-w-[1000px] mx-auto relative z-10 space-y-6">
        
        {/* HEADER */}
        <header className="rounded-[28px] border border-slate-800 shadow-xl p-5 sm:p-6 bg-slate-900/90 backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] opacity-10 pointer-events-none" style={{ backgroundColor: primaryThemeColor }} />

          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xl transition shadow-sm cursor-pointer border border-slate-700"
            >
              <HiOutlineArrowLeft />
            </button>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500 block">
                Class: {student?.class || 'Student'} | Session: {activeSession}
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                Leave Applications
              </h1>
            </div>
          </div>

          <div className="px-4 py-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs font-black text-slate-200 uppercase flex items-center gap-2">
            <HiOutlineDocumentText className="text-lg text-yellow-400" />
            {student?.name || 'Student'}
          </div>
        </header>

        {/* APPLY LEAVE FORM */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-[32px] p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: primaryThemeColor }} />

          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 text-xl shadow-md" style={{ backgroundColor: primaryThemeColor }}>
              <HiOutlinePlusSm />
            </div>
            <h2 className="text-lg font-black text-white uppercase">Apply For New Leave</h2>
          </div>

          <form onSubmit={handleApplyLeave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Leave Subject / Reason Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Fever / Family Function"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2"
                  style={{ borderColor: primaryThemeColor }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">From Date</label>
                  <input 
                    type="date" 
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white focus:outline-none focus:ring-2"
                    style={{ borderColor: primaryThemeColor }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">To Date</label>
                  <input 
                    type="date" 
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white focus:outline-none focus:ring-2"
                    style={{ borderColor: primaryThemeColor }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Detailed Application Message</label>
              <textarea 
                rows="3"
                required
                placeholder="Write your leave description here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2 resize-none"
                style={{ borderColor: primaryThemeColor }}
              />
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg hover:opacity-90 transition cursor-pointer"
              style={{ backgroundColor: primaryThemeColor }}
            >
              {submitting ? 'Submitting Leave...' : 'Submit Application'}
            </button>
          </form>
        </div>

        {/* PREVIOUS LEAVE APPLICATIONS HISTORY */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">Leave History & Status</h3>

          {leaveList.length === 0 ? (
            <div className="bg-slate-900/90 backdrop-blur-md rounded-[32px] p-10 text-center border border-slate-800 space-y-2 shadow-xl">
              <p className="text-xs text-slate-400 font-bold uppercase">No leave applications submitted yet.</p>
            </div>
          ) : (
            leaveList.map((leave) => {
              const status = leave.status?.toLowerCase() || 'pending';
              let statusBadge = "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
              let StatusIcon = HiOutlineClock;

              if (status === 'approved') {
                statusBadge = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                StatusIcon = HiOutlineCheckCircle;
              } else if (status === 'rejected') {
                statusBadge = "bg-rose-500/10 text-rose-400 border-rose-500/30";
                StatusIcon = HiOutlineXCircle;
              }

              return (
                <div 
                  key={leave.id}
                  className="bg-slate-900/90 backdrop-blur-md rounded-[32px] p-6 border border-slate-800 shadow-xl space-y-4 relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Subject</span>
                      <h4 className="text-lg font-black text-white uppercase">{leave.subject}</h4>
                    </div>

                    <div className={`px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-wider flex items-center gap-2 ${statusBadge}`}>
                      <StatusIcon className="text-base" /> {leave.status || 'Pending'}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                    <div className="flex items-center gap-2">
                      <HiOutlineCalendar className="text-yellow-400 text-base" />
                      <span>Duration: <strong className="text-slate-200">{leave.fromDate}</strong> to <strong className="text-slate-200">{leave.toDate}</strong></span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Reason</span>
                    <p className="text-sm font-medium text-slate-300">{leave.message}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}