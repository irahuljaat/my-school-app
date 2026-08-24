'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useColors } from '../components/ColorComponent';
import { 
  HiOutlineArrowLeft, HiOutlineBookOpen, HiOutlineCalendar, 
  HiOutlineUser, HiOutlinePhotograph, HiOutlineSearch, HiOutlineClock,
  HiOutlineDownload 
} from 'react-icons/hi';

export default function StudentHomeworkPage() {
  const colors = useColors();
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [activeSession, setActiveSession] = useState('2026-27');
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // For image modal preview

  // School Amber/Yellow Theme Accent matching Dashboard
  const primaryThemeColor = '#EAB308';

  useEffect(() => {
    const sessionData = localStorage.getItem('studentSession');
    if (!sessionData) {
      router.replace('/studentlogin');
      return;
    }
    const parsedStudent = JSON.parse(sessionData);
    setStudent(parsedStudent);

    const fetchHomework = async () => {
      try {
        // Fetch active session from settings
        const settingsSnap = await getDoc(doc(db, 'config', 'settings'));
        let session = '2026-27';
        if (settingsSnap.exists() && settingsSnap.data().activeSession) {
          session = settingsSnap.data().activeSession;
          setActiveSession(session);
        }

        // Determine student's class (e.g. "UKG")
        const studentClass = parsedStudent.class || parsedStudent.grade || 'UKG';

        // Fetch document from sessions/{activeSession}/homework/{studentClass}
        const homeworkDocRef = doc(db, 'sessions', session, 'homework', studentClass);
        const homeworkSnap = await getDoc(homeworkDocRef);

        if (homeworkSnap.exists()) {
          const rawData = homeworkSnap.data();
          const parsedArray = [];
          
          Object.keys(rawData).forEach((dateKey) => {
            const subjectsObj = rawData[dateKey];
            if (typeof subjectsObj === 'object' && subjectsObj !== null) {
              Object.keys(subjectsObj).forEach((subjectKey) => {
                const item = subjectsObj[subjectKey];
                parsedArray.push({
                  date: dateKey,
                  subjectKey,
                  subject: item.subject || subjectKey,
                  description: item.description || 'No description provided.',
                  teacherName: item.teacherName || 'Faculty',
                  imageUrl: item.imageUrl || null,
                  createdAt: item.createdAt || null
                });
              });
            }
          });

          // Sort by date descending (newest first)
          parsedArray.sort((a, b) => new Date(b.date) - new Date(a.date));
          setHomeworkList(parsedArray);
        }
      } catch (err) {
        console.error('Error fetching homework:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomework();
  }, [router]);

  // Helper function to handle downloading images securely
  const handleDownloadImage = async (url, subjectName, dateStr) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Homework-${subjectName}-${dateStr}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback if CORS blocks blob fetch
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-white font-bold tracking-widest uppercase">
        Loading Daily Diary...
      </div>
    );
  }

  // Filter homework based on search input
  const filteredHomework = homeworkList.filter((item) => 
    item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.date.includes(searchTerm)
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
                Class: {student?.class || 'UKG'} | Session: {activeSession}
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                Daily Diary & Homework
              </h1>
            </div>
          </div>

          <div className="w-full sm:w-auto relative flex items-center">
            <HiOutlineSearch className="absolute left-4 text-slate-400 text-lg" />
            <input 
              type="text"
              placeholder="Search subject or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs font-bold text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-yellow-500 transition shadow-inner"
            />
          </div>
        </header>

        {/* HOMEWORK TIMELINE CONTAINER */}
        <div className="space-y-6">
          {filteredHomework.length === 0 ? (
            <div className="bg-slate-900/90 backdrop-blur-md rounded-[32px] p-12 text-center border border-slate-800 space-y-3 shadow-xl">
              <div className="w-16 h-16 bg-yellow-500/10 text-yellow-400 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-inner border border-yellow-500/20">
                <HiOutlineBookOpen />
              </div>
              <h3 className="text-lg font-black text-white uppercase">No Homework Found</h3>
              <p className="text-xs text-slate-400 font-medium">There are no assignments uploaded for your class at the moment.</p>
            </div>
          ) : (
            filteredHomework.map((item, index) => (
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
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-950 text-xl font-bold shadow-md"
                      style={{ backgroundColor: primaryThemeColor }}
                    >
                      <HiOutlineBookOpen />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Subject</span>
                      <h2 className="text-xl font-black text-white uppercase">{item.subject}</h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 rounded-2xl border border-slate-700">
                    <HiOutlineCalendar className="text-yellow-400" />
                    <span className="text-xs font-black text-slate-200">{item.date}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Assignment Instructions</span>
                  <p className="text-sm font-medium text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Attached Image & Download Option */}
                {item.imageUrl && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reference Attachment</span>
                      <button 
                        onClick={() => handleDownloadImage(item.imageUrl, item.subject, item.date)}
                        className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <HiOutlineDownload className="text-base" /> Download Image
                      </button>
                    </div>
                    
                    <div 
                      onClick={() => setSelectedImage(item.imageUrl)}
                      className="relative rounded-2xl overflow-hidden border border-slate-800 max-h-60 group cursor-pointer bg-slate-950"
                    >
                      <img 
                        src={item.imageUrl} 
                        alt="Homework Attachment" 
                        className="w-full h-48 object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold text-xs uppercase tracking-widest gap-2">
                        <HiOutlinePhotograph className="text-lg text-yellow-400" /> Click to Preview Full Image
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Teacher Details */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400 font-medium">
                  <div className="flex items-center gap-2">
                    <HiOutlineUser className="text-yellow-400 text-base" />
                    <span>Assigned by: <strong className="text-white uppercase">{item.teacherName}</strong></span>
                  </div>
                  {item.createdAt && (
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <HiOutlineClock /> ID: {item.createdAt}
                    </div>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

      </div>

      {/* IMAGE PREVIEW MODAL */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-[32px] p-4 overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 px-2 border-b border-slate-800 mb-3">
              <span className="text-xs font-black uppercase tracking-widest text-slate-300">Attachment Preview</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDownloadImage(selectedImage, 'Attachment', 'File')}
                  className="px-3 py-1.5 bg-yellow-500 text-slate-950 hover:bg-yellow-400 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                >
                  <HiOutlineDownload className="text-base" /> Download
                </button>
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
            <img src={selectedImage} alt="Zoomed Homework" className="w-full max-h-[75vh] object-contain rounded-2xl bg-slate-950" />
          </div>
        </div>
      )}

    </div>
  );
}