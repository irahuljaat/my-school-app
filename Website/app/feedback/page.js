'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../firebase/config';
import { collection, doc, setDoc, getDocs, getDoc, serverTimestamp } from 'firebase/firestore';
import { useColors } from '../components/ColorComponent';
import { 
  HiOutlineArrowLeft, HiOutlineChatAlt2, HiOutlineThumbUp, 
  HiOutlineExclamationCircle, HiOutlinePhotograph, HiOutlineX, HiOutlineCheckCircle 
} from 'react-icons/hi';

export default function StudentFeedbackPage() {
  const colors = useColors();
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [activeSession, setActiveSession] = useState('2026-27');
  const [teachersList, setTeachersList] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [feedbackType, setFeedbackType] = useState('Appreciation');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // School Amber/Yellow Theme Accent matching Dashboard, Gallery, Leave Portal, etc.
  const primaryThemeColor = '#EAB308';

  useEffect(() => {
    const sessionData = localStorage.getItem('studentSession');
    if (!sessionData) {
      router.replace('/studentlogin');
      return;
    }
    const parsedStudent = JSON.parse(sessionData);
    setStudent(parsedStudent);

    fetchInitialData(parsedStudent);
  }, [router]);

  const fetchInitialData = async (currentStudent) => {
    try {
      const settingsSnap = await getDoc(doc(db, 'config', 'settings'));
      let session = '2026-27';
      if (settingsSnap.exists() && settingsSnap.data().activeSession) {
        session = settingsSnap.data().activeSession;
        setActiveSession(session);
      }

      const teachersRef = collection(db, 'teachers');
      const teachersSnap = await getDocs(teachersRef);
      const parsedTeachers = [];
      teachersSnap.forEach((docSnap) => {
        const data = docSnap.data();
        parsedTeachers.push({
          id: docSnap.id,
          name: data.name || data.employeeId || docSnap.id,
          designation: data.designation || 'Teacher'
        });
      });
      setTeachersList(parsedTeachers);

      const feedbackRef = collection(db, 'sessions', session, 'feedbacks');
      const feedbackSnap = await getDocs(feedbackRef);
      const parsedFeedbacks = [];
      feedbackSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.studentId === currentStudent.id) {
          parsedFeedbacks.push({
            id: docSnap.id,
            ...data
          });
        }
      });

      parsedFeedbacks.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setFeedbackList(parsedFeedbacks);
    } catch (err) {
      console.error('Error fetching feedback data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.error('Cloudinary environment variables are missing!');
      alert('Cloudinary configuration is missing in .env.local');
      return '';
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      setUploadingImage(true);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      return data.secure_url || '';
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      return '';
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!selectedTeacher || !message) {
      alert('Please select a teacher and write your message.');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = '';
      if (imageFile) imageUrl = await uploadToCloudinary(imageFile);

      const docId = `feedback_${student.id}_${Date.now()}`;
      const feedbackRef = doc(db, 'sessions', activeSession, 'feedbacks', docId);

      const feedbackData = {
        studentId: student.id,
        studentName: student.name || 'Student',
        studentsSrNo: student.srNo || student.admissionNo || '0000',
        grade: String(student.class || student.grade || '1'),
        type: feedbackType, 
        teacherId: selectedTeacher,
        message: message,
        imageUrl: imageUrl,
        status: 'Submitted',
        createdAt: serverTimestamp()
      };

      await setDoc(feedbackRef, feedbackData);

      setSelectedTeacher('');
      setMessage('');
      setImageFile(null);
      setImagePreview('');

      alert('Feedback submitted successfully!');
      fetchInitialData(student);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-white font-bold tracking-widest uppercase">
        Loading Feedback Portal...
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
                Feedback & Queries
              </h1>
            </div>
          </div>

          <div className="px-4 py-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs font-black text-slate-200 uppercase flex items-center gap-2">
            <HiOutlineChatAlt2 className="text-lg text-yellow-400" />
            {student?.name || 'Student'}
          </div>
        </header>

        {/* FEEDBACK FORM */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-[32px] p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: primaryThemeColor }} />

          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 text-xl shadow-md" style={{ backgroundColor: primaryThemeColor }}>
              <HiOutlineChatAlt2 />
            </div>
            <h2 className="text-lg font-black text-white uppercase">Submit New Feedback</h2>
          </div>

          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Feedback Category</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFeedbackType('Appreciation')}
                  className={`py-3 px-4 rounded-2xl border font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                    feedbackType === 'Appreciation' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                >
                  <HiOutlineThumbUp className="text-lg" /> Appreciation
                </button>

                <button
                  type="button"
                  onClick={() => setFeedbackType('Complaint')}
                  className={`py-3 px-4 rounded-2xl border font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                    feedbackType === 'Complaint' 
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                      : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                >
                  <HiOutlineExclamationCircle className="text-lg" /> Complaint / Query
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Select Teacher</label>
              <select
                required
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2"
                style={{ borderColor: primaryThemeColor }}
              >
                <option value="">-- Choose Teacher --</option>
                {teachersList.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900">{t.name} ({t.designation})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Message Details</label>
              <textarea 
                rows="4"
                required
                placeholder="Write your appreciation or query here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2 resize-none"
                style={{ borderColor: primaryThemeColor }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Attach Image (Optional)</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer transition">
                  <HiOutlinePhotograph className="text-lg text-yellow-400" />
                  {imageFile ? 'Change Image' : 'Upload Image'}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {imagePreview && (
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-800 shadow-sm">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => { setImageFile(null); setImagePreview(''); }}
                      className="absolute top-1 right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs font-black cursor-pointer"
                    >
                      <HiOutlineX />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button 
              type="submit"
              disabled={submitting || uploadingImage}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg hover:opacity-90 transition cursor-pointer"
              style={{ backgroundColor: primaryThemeColor }}
            >
              {submitting || uploadingImage ? (uploadingImage ? 'Uploading...' : 'Submitting...') : 'Send Feedback'}
            </button>
          </form>
        </div>

        {/* FEEDBACK HISTORY */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">Submitted Feedback History</h3>

          {feedbackList.length === 0 ? (
            <div className="bg-slate-900/90 backdrop-blur-md rounded-[32px] p-10 text-center border border-slate-800 shadow-xl">
              <p className="text-xs text-slate-400 font-bold uppercase">No feedback or queries submitted yet.</p>
            </div>
          ) : (
            feedbackList.map((item) => {
              const isAppreciation = item.type === 'Appreciation';
              const badgeClasses = isAppreciation 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30';

              return (
                <div 
                  key={item.id}
                  className="bg-slate-900/90 backdrop-blur-md rounded-[32px] p-6 border border-slate-800 shadow-xl space-y-4 relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isAppreciation ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {isAppreciation ? <HiOutlineThumbUp /> : <HiOutlineExclamationCircle />}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Teacher ID: {item.teacherId}</span>
                        <h4 className="text-base font-black text-white uppercase">{item.type}</h4>
                      </div>
                    </div>

                    <div className={`px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-wider ${badgeClasses}`}>
                      {item.status || 'Submitted'}
                    </div>
                  </div>

                  <p className="text-sm font-medium text-slate-300 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    {item.message}
                  </p>

                  {item.imageUrl && (
                    <div className="rounded-2xl overflow-hidden w-24 h-24 border border-slate-800">
                      <img src={item.imageUrl} alt="Attachment" className="w-full h-full object-cover" />
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