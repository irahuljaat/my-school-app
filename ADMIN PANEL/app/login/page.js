'use client';

import React, { useState } from 'react';
import { auth } from '../firebase/config';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Force a clean state by signing out any old Firebase session first
      await signOut(auth);

      // 2. Perform fresh Firebase Authentication
      await signInWithEmailAndPassword(auth, email, password);

      // 3. SET SESSION COOKIE (No 'max-age' means it expires when browser closes)
      // This is the key to preventing "Automatic" long-term logins
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
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <h1 className="text-2xl font-black text-white mb-8 text-center uppercase tracking-tighter">
          Admin <span className="text-amber-500">Verification</span>
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <input 
            type="email" 
            placeholder="Admin Email"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-amber-500"
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="off" // Prevents browser from auto-filling
          />
          <input 
            type="password" 
            placeholder="Password"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-amber-500"
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="off"
          />
          <button 
            disabled={loading}
            className="w-full bg-amber-500 text-black font-black py-4 rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/10"
          >
            {loading ? "VERIFYING..." : "LOGIN TO SYSTEM"}
          </button>
        </form>
      </div>
    </div>
  );
}