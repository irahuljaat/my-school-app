"use client"
import React from 'react';
import { ShieldCheck, Lock, EyeOff, Database, X } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="bg-[#fcfcfc] min-h-screen pb-20 selection:bg-indigo-100">
      {/* HEADER */}
      <section className="bg-slate-950 pt-32 pb-20 px-8 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <span className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.5em] mb-4 block">Data Protection</span>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter mb-6">Privacy <br/><span className="italic font-light text-slate-500">Manifesto.</span></h1>
          <p className="text-slate-400 text-sm max-w-lg leading-relaxed">How MVG Public School Jaipur protects your digital identity and student records during the 2026-27 session.</p>
        </div>
        <Link href="/" className="absolute top-10 right-10 p-4 bg-white/5 rounded-full text-white hover:bg-white/10 border border-white/10 transition-all">
          <X size={20} />
        </Link>
      </section>

      {/* CONTENT */}
      <main className="max-w-4xl mx-auto px-8 -mt-10 relative z-20">
        <div className="bg-white border border-slate-100 rounded-[3rem] p-10 md:p-16 shadow-2xl shadow-slate-200/50 space-y-12">
          
          <section>
            <div className="flex items-center gap-4 mb-6">
              <Database className="text-indigo-600" size={24} />
              <h2 className="text-2xl font-bold tracking-tight">Information Collection</h2>
            </div>
            <p className="text-slate-500 leading-relaxed text-sm">
              We collect personal information during the admission process, including student names, guardian details, and contact information. This data is strictly used for academic administration, result management, and institutional communication.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <Lock className="text-indigo-600" size={24} />
              <h2 className="text-2xl font-bold tracking-tight">Data Security</h2>
            </div>
            <p className="text-slate-500 leading-relaxed text-sm">
              Student performance certificates and sensitive records are stored using secure Firebase protocols. We implement administrative controls to ensure that only authorized school personnel can access management systems.
            </p>
          </section>

          <section className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <ShieldCheck className="text-indigo-600" size={20} />
              <h3 className="font-bold">Third-Party Disclosure</h3>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              MVG Public School does not sell, trade, or transfer student data to outside parties. Data is only shared with the RBSE board as required for official registration and examination purposes.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}