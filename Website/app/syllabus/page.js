'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useColors } from '../components/ColorComponent';
import { 
  HiOutlineArrowLeft, HiOutlineCheckCircle, 
  HiOutlineClock, HiOutlineBookOpen, HiOutlineAcademicCap 
} from 'react-icons/hi';

export default function StudentSyllabusPage() {
  const colors = useColors();
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [activeSession, setActiveSession] = useState('2026-27');
  const [syllabusSubjects, setSyllabusSubjects] = useState([]);
  const [selectedSubjectDoc, setSelectedSubjectDoc] = useState(null);
  const [chaptersList, setChaptersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // School Amber/Yellow Theme Accent matching Dashboard, Homework, Notices & Marks
  const primaryThemeColor = '#EAB308';

  useEffect(() => {
    const sessionData = localStorage.getItem('studentSession');
    if (!sessionData) {
      router.replace('/studentlogin');
      return;
    }
    const parsedStudent = JSON.parse(sessionData);
    setStudent(parsedStudent);

    const fetchSyllabus = async () => {
      try {
        // 1. Fetch active session configuration
        const settingsSnap = await getDoc(doc(db, 'config', 'settings'));
        let session = '2026-27';
        if (settingsSnap.exists() && settingsSnap.data().activeSession) {
          session = settingsSnap.data().activeSession;
          setActiveSession(session);
        }

        const studentClass = parsedStudent.class || parsedStudent.grade || '1';

        // Standard subjects for this class to check (e.g., 10_English, 10_Mathematics, 10_Science)
        const potentialSubjects = ['English', 'Mathematics', 'Science', 'Hindi', 'Social_Science'];
        const foundSubjects = [];

        for (const subj of potentialSubjects) {
          const docId = `${studentClass}_${subj}`;
          const docRef = doc(db, 'sessions', session, 'syllabus', docId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            foundSubjects.push({
              id: docId,
              subjectName: subj,
              data: docSnap.data()
            });
          }
        }

        setSyllabusSubjects(foundSubjects);
        if (foundSubjects.length > 0) {
          setSelectedSubjectDoc(foundSubjects[0]);
          setChaptersList(foundSubjects[0].data.chapters || []);
        }

      } catch (err) {
        console.error('Error fetching syllabus:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSyllabus();
  }, [router]);

  const handleSelectSubject = (subjObj) => {
    setSelectedSubjectDoc(subjObj);
    setChaptersList(subjObj.data.chapters || []);
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-white font-bold tracking-widest uppercase">
        Loading Syllabus Curriculum...
      </div>
    );
  }

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
                Academic Syllabus
              </h1>
            </div>
          </div>

          <div className="px-4 py-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs font-black text-slate-200 uppercase flex items-center gap-2">
            <HiOutlineAcademicCap className="text-lg text-yellow-400" />
            Student: {student?.name || 'User'}
          </div>
        </header>

        {/* SUBJECT TABS SELECTOR */}
        {syllabusSubjects.length > 0 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {syllabusSubjects.map((subj) => {
              const isSelected = selectedSubjectDoc?.id === subj.id;
              return (
                <button
                  key={subj.id}
                  onClick={() => handleSelectSubject(subj)}
                  className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap cursor-pointer shadow-sm border ${
                    isSelected 
                      ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-md' 
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  {subj.subjectName.replace('_', ' ')}
                </button>
              );
            })}
          </div>
        )}

        {/* CHAPTERS LIST CONTAINER */}
        <div className="space-y-6">
          {chaptersList.length === 0 ? (
            <div className="bg-slate-900/90 backdrop-blur-md rounded-[32px] p-12 text-center border border-slate-800 space-y-3 shadow-xl">
              <div className="w-16 h-16 bg-yellow-500/10 text-yellow-400 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-inner border border-yellow-500/20">
                <HiOutlineBookOpen />
              </div>
              <h3 className="text-lg font-black text-white uppercase">No Syllabus Chapters Found</h3>
              <p className="text-xs text-slate-400 font-medium">No curriculum chapters have been uploaded for this subject yet.</p>
            </div>
          ) : (
            chaptersList.map((chap, index) => {
              const isCompleted = chap.status?.toLowerCase() === 'completed';
              const badgeColor = isCompleted 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';

              return (
                <div 
                  key={index}
                  className="bg-slate-900/90 backdrop-blur-md rounded-[32px] p-6 sm:p-8 border border-slate-800 shadow-xl space-y-5 relative overflow-hidden group"
                >
                  {/* Accent Top Border */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: primaryThemeColor }}
                  />

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-950 text-xl font-black shadow-md shrink-0"
                        style={{ backgroundColor: primaryThemeColor }}
                      >
                        {chap.chapterNo}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Chapter {chap.chapterNo}</span>
                        <h2 className="text-xl font-black text-white uppercase">{chap.title}</h2>
                      </div>
                    </div>

                    <div className={`px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-wider flex items-center gap-2 ${badgeColor}`}>
                      {isCompleted ? <HiOutlineCheckCircle className="text-base" /> : <HiOutlineClock className="text-base" />}
                      {chap.status || 'Pending'}
                    </div>
                  </div>

                  {/* Teacher Notes / Details */}
                  {chap.teacherNotes && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Teacher Notes & Coverage</span>
                      <p className="text-sm font-medium text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 leading-relaxed">
                        {chap.teacherNotes}
                      </p>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}