'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase/config';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useColors } from './components/ColorComponent';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineGlobe } from 'react-icons/hi';

export default function LoginPage() {
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // School Details State
  const [schoolName, setSchoolName] = useState('MVG Public School');
  const [logoUrl, setLogoUrl] = useState('');

  const router = useRouter();

  useEffect(() => {
    const fetchSchoolDetails = async () => {
      try {
        const docRef = doc(db, 'config', 'schoolDetails');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.schoolName) setSchoolName(data.schoolName);
          if (data.logoUrl) setLogoUrl(data.logoUrl);
        }
      } catch (err) {
        console.error('Error fetching school details:', err);
      }
    };

    fetchSchoolDetails();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Force a clean state by signing out any old Firebase session first
      await signOut(auth);

      // 2. Perform fresh Firebase Authentication
      await signInWithEmailAndPassword(auth, email, password);

      // 3. SET SESSION COOKIE (No 'max-age' means it expires when browser closes)
      document.cookie = "user_session=true; path=/; SameSite=Strict";

      // 4. Send to dashboard
      router.push('/dashboard');
      router.refresh(); 
    } catch (err) {
      alert("Login Failed: Please check your ID and Password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between p-6 sm:p-10 font-sans relative overflow-hidden text-slate-800">
      
      {/* TOP HEADER BRANDING */}
      <div className="absolute top-12 left-12 hidden lg:flex items-center gap-2 text-xs font-bold text-slate-400">
        <HiOutlineGlobe className="text-base" /> Admin Portal
      </div>

      <div className="absolute top-10 right-10 hidden lg:flex items-center gap-4">
        {logoUrl && (
          <img src={logoUrl} alt="School Logo" className="w-8 h-8 rounded-full object-cover shadow-xs" />
        )}
        <span className="text-xs font-bold text-slate-600">{schoolName}</span>
        <div 
          className="px-5 py-2.5 rounded-full text-xs font-black text-slate-900 shadow-sm"
          style={{ backgroundColor: colors.primary || '#FFD166' }}
        >
          Secure Access
        </div>
      </div>

      {/* CENTRAL LOGIN CARD */}
      <div className="flex-1 flex items-center justify-center my-auto py-10 relative z-10">
        <div className="w-full max-w-[460px] bg-white p-8 sm:p-12 rounded-[36px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] border border-slate-100/80 text-center space-y-8">
          
          <div className="space-y-3 flex flex-col items-center">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-14 h-14 rounded-2xl object-cover shadow-md border border-slate-100" />
            ) : (
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-slate-900 shadow-md"
                style={{ backgroundColor: colors.primary || '#FFD166' }}
              >
                {schoolName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
                Admin Login
              </h1>
              <p className="text-xs font-medium text-slate-400 mt-1">
                Hey, Enter your details to sign in to your account
              </p>
            </div>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Admin Email / ID</label>
              <div className="relative flex items-center">
                <HiOutlineMail className="absolute left-4 text-slate-400 text-lg" />
                <input 
                  type="email" 
                  placeholder="Enter Email Address"
                  className="w-full bg-[#FAFAFA] border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-amber-400 focus:bg-white transition"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1 mr-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Passcode</label>
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative flex items-center">
                <HiOutlineLockClosed className="absolute left-4 text-slate-400 text-lg" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-[#FAFAFA] border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold text-slate-800 outline-none focus:border-amber-400 focus:bg-white transition"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="text-right">
              <a href="#" className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition">
                Having trouble in sign in?
              </a>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full mt-2 text-slate-900 font-black py-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg hover:opacity-95 transition-all cursor-pointer"
              style={{ backgroundColor: colors.primary || '#FFD166' }}
            >
              {loading ? "VERIFYING..." : "Sign in"}
            </button>
          </form>

          <div className="pt-2">
            <p className="text-xs font-medium text-slate-400">
              Protected Institutional System | {schoolName}
            </p>
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <footer className="text-center text-xs font-semibold text-slate-400 space-x-4 relative z-10">
        <span>Copyright © {schoolName} 2026</span>
        <span>•</span>
        <a href="#" className="hover:underline">Privacy Policy</a>
      </footer>

    </div>
  );
}