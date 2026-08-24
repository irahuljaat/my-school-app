'use client';

import React, { useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { HiOutlineLockClosed, HiOutlineMail, HiOutlineAcademicCap, HiOutlineArrowRight, HiOutlineExclamationCircle, HiOutlineCheckCircle, HiOutlineSparkles } from 'react-icons/hi';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const activeSession = '2026-27';
  const schoolName = 'MVG Public School';
  const primaryColor = '#EAB308'; // Vibrant School Yellow/Amber

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier || !password) {
      setError('Please fill in both fields to continue.');
      return;
    }

    setLoading(true);
    try {
      const studentsRef = collection(db, 'sessions', activeSession, 'students');
      const querySnapshot = await getDocs(studentsRef);

      if (querySnapshot.empty) {
        setError(`No accounts found in session ${activeSession}.`);
        setLoading(false);
        return;
      }

      let authenticatedUser = null;
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const loginDetails = data.loginDetails || {};
        
        const matchesId = docSnap.id === identifier.trim() || loginDetails.id === identifier.trim();
        const matchesPassword = String(loginDetails.password || '').trim() === String(password).trim();
        const isActive = loginDetails.isActive === true;

        if (matchesId && matchesPassword && isActive) {
          authenticatedUser = { id: docSnap.id, ...data };
        }
      });

      if (authenticatedUser) {
        // 1. Save session data for the dashboard UI
        localStorage.setItem('studentSession', JSON.stringify(authenticatedUser));
        
        // 2. Set the cookie so the middleware permits access to protected routes
        document.cookie = "user_session=true; path=/; max-age=86400"; // expires in 1 day

        setLoading(false);
        setSuccess(true);
      } else {
        setError('Incorrect password, invalid ID, or account deactivated.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login Error:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-950 relative overflow-hidden font-sans">
      
      {/* Background Animated Gradient Orbs */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[160px] opacity-20 animate-pulse pointer-events-none" style={{ backgroundColor: primaryColor }} />
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full blur-[160px] opacity-15 animate-pulse pointer-events-none" style={{ backgroundColor: primaryColor }} />

      {/* Background Floating Decorative Shapes (School Illustrations representation) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-1/4 left-10 text-6{-px} animate-bounce duration-1000">📚</div>
        <div className="absolute bottom-1/4 right-12 text-6l animate-pulse">🎓</div>
        <div className="absolute top-10 right-1/3 text-4xl animate-spin duration-3000">✏️</div>
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* School Branding Header */}
        <div className="text-center mb-8 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-3xl flex items-center justify-center text-slate-950 text-3xl shadow-xl shadow-yellow-500/10 transform hover:scale-105 transition-transform duration-300" style={{ backgroundColor: primaryColor }}>
            <HiOutlineAcademicCap />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[11px] font-bold uppercase tracking-wider mb-2">
              <HiOutlineSparkles /> English Medium Sr. Sec. School
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{schoolName}</h1>
            <p className="text-xs text-slate-400 font-medium mt-1">Student Portal • Academic Session {activeSession}</p>
          </div>
        </div>

        {/* Form Box */}
        <div className="bg-slate-900/80 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-slate-800 p-8 space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-950/50 border border-red-800 text-red-300">
              <HiOutlineExclamationCircle className="text-lg shrink-0 mt-0.5" />
              <p className="text-xs font-semibold leading-relaxed">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center py-6 space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner border border-yellow-500/30">
                <HiOutlineCheckCircle />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-black text-white">Login Successful!</h2>
                <p className="text-xs text-slate-400">Your session is active. Click below to enter your dashboard.</p>
              </div>
              <button
                onClick={() => { window.location.href = '/dashboard'; }}
                className="w-full py-4 rounded-2xl text-slate-950 text-sm font-black tracking-wide shadow-lg shadow-yellow-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Go to Dashboard Now →
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Student ID / Username</label>
                <div className="relative">
                  <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="Enter Student ID"
                    value={identifier}
                    onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                    className="w-full pl-11 pr-4 py-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm font-medium text-white placeholder:text-slate-600 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Password</label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg pointer-events-none" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className="w-full pl-11 pr-4 py-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm font-medium text-white placeholder:text-slate-600 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2.5 py-4 rounded-2xl text-slate-950 text-sm font-black tracking-wide shadow-xl shadow-yellow-500/10 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70 cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In to Portal
                    <HiOutlineArrowRight className="text-lg" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-[11px] text-slate-500 font-medium">
            Need technical assistance? Contact the school administration office.
          </p>
        </div>

      </div>
    </div>
  );
}