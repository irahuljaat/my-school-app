"use client"
import React from 'react';
import { Scale, FileText, AlertCircle, Copyright, X } from 'lucide-react';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="bg-[#fcfcfc] min-h-screen pb-20 selection:bg-blue-100">
      {/* HEADER */}
      <section className="bg-slate-950 pt-32 pb-20 px-8 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.5em] mb-4 block">Institutional Standards</span>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter mb-6">Terms of <br/><span className="italic font-light text-slate-500">Service.</span></h1>
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
              <Scale className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold tracking-tight">Academic Usage</h2>
            </div>
            <p className="text-slate-500 leading-relaxed text-sm">
              By accessing this portal, you agree to use the 2026-27 academic materials, prospectus, and interactive 360° views solely for personal, non-commercial educational purposes. Any unauthorized scraping of student or staff data is strictly prohibited.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <Copyright className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold tracking-tight">Intellectual Property</h2>
            </div>
            <p className="text-slate-500 leading-relaxed text-sm">
              All digital assets, school logos, and proprietary software interfaces (including Result Certificates) are the intellectual property of MVG Public Welfare Society. Reproduction of the digital prospectus or campus imagery without written consent is prohibited.
            </p>
          </section>

          <section className="p-8 bg-blue-50/50 rounded-[2rem] border border-blue-100">
            <div className="flex items-center gap-4 mb-4">
              <AlertCircle className="text-blue-600" size={20} />
              <h3 className="font-bold text-blue-900">Limitation of Liability</h3>
            </div>
            <p className="text-slate-700 text-xs leading-relaxed font-medium">
              While we strive for 100% accuracy in our digital records and syllabus organization, the school administration is not liable for technical errors during online fee payments or automated certificate generation.
            </p>
          </section>

          <footer className="pt-10 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Last Updated: May 2026</p>
          </footer>
        </div>
      </main>
    </div>
  );
}