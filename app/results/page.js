'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../firebase/config';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { useColors } from '../components/ColorComponent';
import { 
  HiOutlineArrowLeft, HiOutlineClipboardList, HiOutlineAcademicCap, 
  HiOutlineLockClosed, HiOutlineCheckCircle 
} from 'react-icons/hi';

export default function StudentExamMarksPage() {
  const colors = useColors();
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [activeSession, setActiveSession] = useState('2026-27');
  const [examsList, setExamsList] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [loading, setLoading] = useState(true);

  // School Amber/Yellow Theme Accent matching Dashboard, Homework, Notices, Marks & Syllabus
  const primaryThemeColor = '#EAB308';

  useEffect(() => {
    const sessionData = localStorage.getItem('studentSession');
    if (!sessionData) {
      router.replace('/studentlogin');
      return;
    }
    const parsedStudent = JSON.parse(sessionData);
    setStudent(parsedStudent);

    const fetchExamMarks = async () => {
      try {
        // 1. Fetch active session configuration
        const settingsSnap = await getDoc(doc(db, 'config', 'settings'));
        let session = '2026-27';
        if (settingsSnap.exists() && settingsSnap.data().activeSession) {
          session = settingsSnap.data().activeSession;
          setActiveSession(session);
        }

        const studentClass = parsedStudent.class || parsedStudent.grade || '1';
        const studentId = parsedStudent.id; // e.g. S0000_1_1784437944636

        // 2. Fetch all exam documents from sessions/{activeSession}/examMarks
        const examMarksRef = collection(db, 'sessions', session, 'examMarks');
        const querySnapshot = await getDocs(examMarksRef);

        const parsedExams = [];

        querySnapshot.forEach((docSnap) => {
          const docId = docSnap.id; // e.g. fa-1_1, fa-2_1, sa-1_1
          const data = docSnap.data();
          const isReleased = data.isReleased ?? false;
          const marksObj = data.marks || {};
          const studentMarks = marksObj[studentId];

          // Check if document belongs to student's class (e.g. docId ends with _{class} or contains class)
          const isMatchingClass = docId.endsWith(`_${studentClass}`) || docId.toLowerCase().includes(`_${studentClass.toLowerCase()}`);

          if (isMatchingClass || studentMarks) {
            // Format exam name nicely (e.g. "fa-1_1" -> "FA 1 Exam")
            let formattedName = docId.replace(/_/g, ' ').toUpperCase();
            if (formattedName.startsWith('FA')) formattedName = formattedName.replace('FA', 'Formative Assessment (FA ');
            if (formattedName.startsWith('SA')) formattedName = formattedName.replace('SA', 'Summative Assessment (SA ');
            if (!formattedName.endsWith(')') && (formattedName.includes('FA') || formattedName.includes('SA'))) {
              formattedName += ')';
            }

            parsedExams.push({
              examId: docId,
              examName: formattedName,
              isReleased: isReleased,
              subjects: studentMarks || {}
            });
          }
        });

        setExamsList(parsedExams);
        if (parsedExams.length > 0) {
          setSelectedExam(parsedExams[0]);
        }

      } catch (err) {
        console.error('Error fetching exam marks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExamMarks();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-white font-bold tracking-widest uppercase">
        Loading Report Cards...
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
                Term Exam Report Cards
              </h1>
            </div>
          </div>

          <div className="px-4 py-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs font-black text-slate-200 uppercase flex items-center gap-2">
            <HiOutlineAcademicCap className="text-lg text-yellow-400" />
            {student?.name || 'Student Portal'}
          </div>
        </header>

        {/* EXAM TABS SELECTOR */}
        {examsList.length > 0 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {examsList.map((exam) => {
              const isSelected = selectedExam?.examId === exam.examId;
              return (
                <button
                  key={exam.examId}
                  onClick={() => setSelectedExam(exam)}
                  className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap cursor-pointer shadow-sm border flex items-center gap-2 ${
                    isSelected 
                      ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-md' 
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  <HiOutlineClipboardList />
                  {exam.examName}
                </button>
              );
            })}
          </div>
        )}

        {/* EXAM MARK SHEET VIEW */}
        <div className="space-y-6">
          {examsList.length === 0 ? (
            <div className="bg-slate-900/90 backdrop-blur-md rounded-[32px] p-12 text-center border border-slate-800 space-y-3 shadow-xl">
              <div className="w-16 h-16 bg-yellow-500/10 text-yellow-400 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-inner border border-yellow-500/20">
                <HiOutlineClipboardList />
              </div>
              <h3 className="text-lg font-black text-white uppercase">No Term Exams Found</h3>
              <p className="text-xs text-slate-400 font-medium">No assessment result sheets have been initialized for your class yet.</p>
            </div>
          ) : selectedExam && !selectedExam.isReleased ? (
            <div className="bg-slate-900/90 backdrop-blur-md rounded-[32px] p-12 text-center border border-slate-800 space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: primaryThemeColor }} />
              <div className="w-16 h-16 bg-yellow-500/10 text-yellow-400 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-inner border border-yellow-500/20">
                <HiOutlineLockClosed />
              </div>
              <h3 className="text-lg font-black text-white uppercase">Result Not Released Yet</h3>
              <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
                The report card for <strong className="text-slate-200">{selectedExam.examName}</strong> is currently being processed by your teachers and will be published soon.
              </p>
            </div>
          ) : selectedExam && selectedExam.isReleased ? (
            <div className="bg-slate-900/90 backdrop-blur-md rounded-[32px] p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
              {/* Accent Top Border */}
              <div 
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: primaryThemeColor }}
              />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Official Scorecard</span>
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase">{selectedExam.examName}</h2>
                </div>
                <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <HiOutlineCheckCircle className="text-base" /> Released
                </div>
              </div>

              {/* Subject Marks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.keys(selectedExam.subjects).length === 0 ? (
                  <div className="col-span-2 py-8 text-center text-xs font-bold text-slate-400 uppercase">
                    No marks uploaded for this examination.
                  </div>
                ) : (
                  Object.entries(selectedExam.subjects).map(([subjectName, score], idx) => (
                    <div 
                      key={idx}
                      className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 flex items-center justify-between shadow-inner"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 text-sm font-black shadow-md"
                          style={{ backgroundColor: primaryThemeColor }}
                        >
                          {subjectName.charAt(0)}
                        </div>
                        <span className="text-sm font-black text-white uppercase">{subjectName}</span>
                      </div>
                      <div className="text-lg font-black text-white bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 shadow-sm">
                        {score || 'N/A'}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}