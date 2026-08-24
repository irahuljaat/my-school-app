"use client"
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, AlertTriangle, Ghost } from 'lucide-react';

export default function NotFound() {
  return (
    // Changed background to a deeper black with a subtle dark red tint
    <div className="min-h-screen bg-[#050000] flex items-center justify-center px-6 overflow-hidden relative">
      
      {/* Alarming Red Glow - Larger and more intense */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/10 blur-[150px] rounded-full pointer-events-none animate-pulse" />

      <div className="max-w-3xl w-full text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Red Alert Badge */}
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full mt-35 bg-red-500/10 border border-red-500/20 backdrop-blur-md mb-8">
            <AlertTriangle size={16} className="text-red-500 animate-bounce" />
            <span className="text-red-500 text-[11px] font-black uppercase tracking-[0.4em]">System Alert: 404 Error</span>
          </div>

          {/* Large Alarming Header */}
          <h1 className="text-[7rem] md:text-[13rem] font-black text-white tracking-tighter leading-[0.8] mb-6">
            PAGE <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900">ABSENT.</span>
          </h1>

          <p className="text-slate-400 text-lg font-medium mb-12 max-w-lg mx-auto leading-relaxed">
            The resource you are trying to access is unavailable. It may have been relocated or the link is broken.
          </p>

          {/* Action Hub */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              href="/" 
              className="group flex items-center gap-3 px-10 py-5 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-red-600 transition-all shadow-[0_0_40px_rgba(220,38,38,0.3)]"
            >
              <Home size={18} />
              Return to Safety
            </Link>
            
            <button 
              onClick={() => window.history.back()}
              className="group flex items-center gap-3 px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-red-600/10 hover:border-red-600/40 transition-all"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-2 transition-transform" />
              Go Back
            </button>
          </div>

          {/* Emergency Support Links */}
          <div className="mt-24 pt-8 border-t border-white/5">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-6">Need Immediate Assistance?</p>
            <div className="flex justify-center mb-20 gap-12">
              <Link href="/contact" className="text-white hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-colors">Help Desk</Link>
              <Link href="/admission" className="text-white hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-colors">Admissions</Link>
              <Link href="/gallery" className="text-white hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-colors">Gallery</Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Subtle Noise Texture to add to the "Glitch/Error" feel */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
    </div>
  );
}