'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useColors } from '../components/ColorComponent';
import { 
  HiOutlineArrowLeft, HiOutlineBell, HiOutlineCalendar, 
  HiOutlineClock, HiOutlineShieldCheck, HiOutlineSearch 
} from 'react-icons/hi';

export default function StudentNoticesPage() {
  const colors = useColors();
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [activeSession, setActiveSession] = useState('2026-27');
  const [noticesList, setNoticesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState('Default');
  const [searchTerm, setSearchTerm] = useState('');

  // School Amber/Yellow Theme Accent matching Dashboard & Homework
  const primaryThemeColor = '#EAB308';

  useEffect(() => {
    const sessionData = localStorage.getItem('studentSession');
    if (!sessionData) {
      router.replace('/studentlogin');
      return;
    }
    const parsedStudent = JSON.parse(sessionData);
    setStudent(parsedStudent);

    const initNoticesAndFCM = async () => {
      try {
        // 1. Fetch active session configuration
        const settingsSnap = await getDoc(doc(db, 'config', 'settings'));
        let session = '2026-27';
        if (settingsSnap.exists() && settingsSnap.data().activeSession) {
          session = settingsSnap.data().activeSession;
          setActiveSession(session);
        }

        const studentId = parsedStudent.id; // e.g. S0000_1_1784437944636

        // 2. Fetch notices from sessions/{activeSession}/notices/{student_id}
        const noticeDocRef = doc(db, 'sessions', session, 'notices', studentId);
        const noticeSnap = await getDoc(noticeDocRef);

        if (noticeSnap.exists()) {
          const rawData = noticeSnap.data();
          // rawData format: { "08-08-2026": { "1786181667339": { body, createdAt, targetName, timestamp, title } }, ... }
          
          const parsedArray = [];
          Object.keys(rawData).forEach((dateKey) => {
            const timeEntries = rawData[dateKey];
            if (typeof timeEntries === 'object' && timeEntries !== null) {
              Object.keys(timeEntries).forEach((timeKey) => {
                const noticeItem = timeEntries[timeKey];
                parsedArray.push({
                  date: dateKey,
                  timestampKey: timeKey,
                  title: noticeItem.title || 'General Notice',
                  body: noticeItem.body || '',
                  createdAt: noticeItem.createdAt || '',
                  targetName: noticeItem.targetName || 'Student'
                });
              });
            }
          });

          // Sort by date / timestamp descending
          parsedArray.sort((a, b) => b.timestampKey - a.timestampKey);
          setNoticesList(parsedArray);
        }

        // 3. Request FCM Permission & Save Token
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          if (Notification.permission === 'granted') {
            setNotificationStatus('Granted');
            await registerFCMToken(studentId, session);
          } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            setNotificationStatus(permission);
            if (permission === 'granted') {
              await registerFCMToken(studentId, session);
            }
          } else {
            setNotificationStatus('Denied');
          }
        }

      } catch (err) {
        console.error('Error loading notices or FCM:', err);
      } finally {
        setLoading(false);
      }
    };

    initNoticesAndFCM();
  }, [router]);

  // Helper to register and save FCM Token to student profile or separate collection
  const registerFCMToken = async (studentId, session) => {
    try {
      const messaging = getMessaging();
      const token = await getToken(messaging, { 
        vapidKey: 'YOUR_PUBLIC_VAPID_KEY_HERE' 
      });

      if (token) {
        const studentRef = doc(db, 'sessions', session, 'students', studentId);
        await updateDoc(studentRef, {
          fcmTokens: arrayUnion(token)
        }).catch(async () => {
          await setDoc(studentRef, { fcmTokens: [token] }, { merge: true });
        });
        console.log('FCM Token saved successfully:', token);
      }
    } catch (err) {
      console.warn('FCM Token retrieval error (ensure Firebase Messaging is configured):', err);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-white font-bold tracking-widest uppercase">
        Loading Notices...
      </div>
    );
  }

  // Filter notices based on search input
  const filteredNotices = noticesList.filter((item) => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                Session: {activeSession} | Push Alerts
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                School Notices & Circulars
              </h1>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs font-black">
              <HiOutlineShieldCheck className={`text-lg ${notificationStatus === 'Granted' ? 'text-emerald-400' : 'text-yellow-400'}`} />
              <span className="text-slate-200 uppercase">Alerts: {notificationStatus}</span>
            </div>

            <div className="relative flex items-center">
              <HiOutlineSearch className="absolute left-4 text-slate-400 text-lg" />
              <input 
                type="text"
                placeholder="Search notices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-56 pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs font-bold text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-yellow-500 transition shadow-inner"
              />
            </div>
          </div>
        </header>

        {/* NOTICES LIST CONTAINER */}
        <div className="space-y-6">
          {filteredNotices.length === 0 ? (
            <div className="bg-slate-900/90 backdrop-blur-md rounded-[32px] p-12 text-center border border-slate-800 space-y-3 shadow-xl">
              <div className="w-16 h-16 bg-yellow-500/10 text-yellow-400 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-inner border border-yellow-500/20">
                <HiOutlineBell />
              </div>
              <h3 className="text-lg font-black text-white uppercase">No Notices Found</h3>
              <p className="text-xs text-slate-400 font-medium">You have no circulars or administrative notices published right now.</p>
            </div>
          ) : (
            filteredNotices.map((item, index) => (
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
                      <HiOutlineBell />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Notice Title</span>
                      <h2 className="text-xl font-black text-white uppercase">{item.title}</h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800/80 rounded-2xl border border-slate-700 text-slate-200 text-xs font-black">
                      <HiOutlineCalendar className="text-yellow-400" />
                      {item.date}
                    </div>
                    {item.createdAt && (
                      <div className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800/80 rounded-2xl border border-slate-700 text-slate-300 text-xs font-black">
                        <HiOutlineClock className="text-yellow-400" />
                        {item.createdAt}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notice Body */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Circular Details</span>
                  <p className="text-sm font-medium text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 leading-relaxed">
                    {item.body}
                  </p>
                </div>

                {/* Footer metadata */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-[11px] font-bold text-slate-400">
                  <span>Target Audience: <strong className="text-white uppercase">{item.targetName}</strong></span>
                  <span className="text-slate-500">ID: {item.timestampKey}</span>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}