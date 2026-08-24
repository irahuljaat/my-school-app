'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../firebase/config';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { useColors } from '../components/ColorComponent';
import { 
  HiOutlineArrowLeft, HiOutlineClipboardCheck, HiOutlineCalendar, 
  HiOutlineAcademicCap, HiOutlineSearch 
} from 'react-icons/hi';

export default function StudentMarksPage() {
  const colors = useColors();
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [activeSession, setActiveSession] = useState('2026-27');
  const [marksList, setMarksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // School Amber/Yellow Theme Accent matching Dashboard, Homework & Notices
  const primaryThemeColor = '#EAB308';

  useEffect(() => {
    const sessionData = localStorage.getItem('studentSession');
    if (!sessionData) {
      router.replace('/studentlogin');
      return;
    }
    const parsedStudent = JSON.parse(sessionData);
    setStudent(parsedStudent);

    const fetchMarks = async () => {
      try {
        // Fetch active session from settings
        const settingsSnap = await getDoc(doc(db, 'config', 'settings'));
        let session = '2026-27';
        if (settingsSnap.exists() && settingsSnap.data().activeSession) {
          session = settingsSnap.data().activeSession;
          setActiveSession(session);
        }

        const studentClass = parsedStudent.class || parsedStudent.grade;
        const studentId = parsedStudent.id; // e.g. S0000_1_1784437944636

        // Fetch all documents from sessions/{activeSession}/classtests
        const classTestsRef = collection(db, 'sessions', session, 'classtests');
        const querySnapshot = await getDocs(classTestsRef);

        const parsedMarks = [];

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const docClass = data.class; // e.g. "1" or "UKG"
          const testDate = data.date;   // e.g. "2026-08-20"
          const docId = docSnap.id;     // e.g. test_1_ENGLISH_2026-08-20_...
          const marksObj = data.marks || {};

          // Filter by student's class (or check if student ID exists in marks object)
          const isMatchingClass = docClass === studentClass || docId.toLowerCase().includes(studentClass?.toLowerCase() || '');
          
          if (isMatchingClass && marksObj[studentId]) {
            const studentResult = marksObj[studentId];
            
            // Extract subject name from doc ID or title
            let subjectName = "General Test";
            const upperId = docId.toUpperCase();
            if (upperId.includes("ENGLISH")) subjectName = "English";
            else if (upperId.includes("HINDI")) subjectName = "Hindi";
            else if (upperId.includes("MATH")) subjectName = "Mathematics";
            else if (upperId.includes("SCIENCE")) subjectName = "Science";

            parsedMarks.push({
              testId: docId,
              subject: subjectName,
              date: testDate || "Recent",
              obtainedMarks: studentResult.obtainedMarks ?? 0,
              maxMarks: studentResult.maxMarks ?? 100,
              studentName: studentResult.studentName || parsedStudent.name
            });
          }
        });

        // Sort by date descending
        parsedMarks.sort((a, b) => new Date(b.date) - new Date(a.date));
        setMarksList(parsedMarks);

      } catch (err) {
        console.error('Error fetching class test marks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarks();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-white font-bold tracking-widest uppercase">
        Loading Assessment Scores...
      </div>
    );
  }

  // Filter marks based on search input
  const filteredMarks = marksList.filter((item) => 
    item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.date.includes(searchTerm) ||
    item.obtainedMarks.toString().includes(searchTerm)
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden bg-slate-950 text-slate-100 transition-colors duration-500">
      
      {/* Background Glow Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[140px] opacity-10 pointer-events-none -mr-20 -mt-20" style={{ backgroundColor: primaryThemeColor }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[140px] opacity-10 pointer-events-none -ml-20 -mb-20" style={{ backgroundColor: primaryThemeColor }} />

      <div className="max-w-[1100px] mx-auto relative z-10 space-y-6">
        
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
                Class Test Marks
              </h1>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="px-4 py-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs font-black text-slate-200 uppercase text-center">
              Student: {student?.name || 'Portal User'}
            </div>

            <div className="relative flex items-center">
              <HiOutlineSearch className="absolute left-4 text-slate-400 text-lg" />
              <input 
                type="text"
                placeholder="Search subject or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-56 pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs font-bold text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-yellow-500 transition shadow-inner"
              />
            </div>
          </div>
        </header>

        {/* MARKS LIST GRID */}
        <div className="space-y-6">
          {filteredMarks.length === 0 ? (
            <div className="bg-slate-900/90 backdrop-blur-md rounded-[32px] p-12 text-center border border-slate-800 space-y-3 shadow-xl">
              <div className="w-16 h-16 bg-yellow-500/10 text-yellow-400 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-inner border border-yellow-500/20">
                <HiOutlineClipboardCheck />
              </div>
              <h3 className="text-lg font-black text-white uppercase">No Test Marks Found</h3>
              <p className="text-xs text-slate-400 font-medium">Your teachers haven't published any class test scores for your class yet.</p>
            </div>
          ) : (
            filteredMarks.map((item, index) => {
              const percentage = ((item.obtainedMarks / item.maxMarks) * 100).toFixed(1);
              let gradeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
              if (percentage < 40) gradeColor = "text-rose-400 bg-rose-500/10 border-rose-500/30";
              else if (percentage < 75) gradeColor = "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";

              return (
                <div 
                  key={index}
                  className="bg-slate-900/90 backdrop-blur-md rounded-[32px] p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden group"
                >
                  {/* Accent Top Border */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: primaryThemeColor }}
                  />

                  <div className="flex items-center gap-4">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-950 text-2xl font-bold shadow-md shrink-0"
                      style={{ backgroundColor: primaryThemeColor }}
                    >
                      <HiOutlineAcademicCap />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Subject Assessment</span>
                      <h2 className="text-xl font-black text-white uppercase">{item.subject}</h2>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-medium">
                        <HiOutlineCalendar className="text-yellow-400" /> Date: <strong className="text-slate-200">{item.date}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Score Obtained</span>
                      <div className="text-2xl font-black text-white">
                        {item.obtainedMarks} <span className="text-xs font-bold text-slate-400">/ {item.maxMarks}</span>
                      </div>
                    </div>

                    <div className={`px-4 py-3 rounded-2xl border text-center font-black text-sm uppercase ${gradeColor}`}>
                      {percentage}%
                    </div>
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