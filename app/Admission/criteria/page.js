"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../../images/logo.jpg';
import { 
  Menu, X, ChevronDown, Phone, Mail, Award, 
  CheckCircle2, Scale, Calendar, Users, 
  BookOpen, Star, ShieldAlert, ArrowRight
} from 'lucide-react';

export default function AdmissionCriteriaPage() {
  const [activeSession, setActiveSession] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const configSnap = await getDoc(doc(db, "config", "settings"));
        if (configSnap.exists()) setActiveSession(configSnap.data().activeSession);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    fetchSession();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white font-bold text-[#6366F1] animate-pulse uppercase text-[10px] tracking-widest">Loading Criteria...</div>;

  return (
    <div className="bg-[#fcfcfc] text-[#1a1a1a] antialiased">
      
      {/* --- STICKY TOP BAR --- */}
      <div className="fixed top-0 w-full z-[120] bg-[#0a0a0a] text-slate-400 py-2 hidden lg:block border-b border-white/5">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[9px] font-bold uppercase tracking-[0.2em]">
          <div className="flex gap-8 items-center">
            <span className="flex items-center gap-2"><Phone size={10} className="text-[#6366F1]" /> Admissions: +91 141 2345678</span>
            <span className="flex items-center gap-2"><Mail size={10} className="text-[#6366F1]" /> join@mvgacademy.com</span>
          </div>
          <div className="flex items-center gap-3">
             <span className="bg-[#6366F1] text-white px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter">Live</span>
             <span>Session {activeSession} Enrollment Criteria</span>
          </div>
        </div>
      </div>

      {/* --- STICKY HEADER --- */}
      <header className="fixed top-0 lg:top-[35px] w-full z-[110] bg-white/95 backdrop-blur-md py-4 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <img src={LogoImg.src} alt="Logo" className="w-10 h-10 object-contain" />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">MVG Academy</span>
              <span className="text-[8px] font-black text-[#6366F1] uppercase tracking-[0.3em]">Selection Standards</span>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/" className="text-[10px] font-bold uppercase tracking-widest hover:text-[#6366F1]">Home</Link>
            <Link href="/admission" className="text-[10px] font-bold uppercase tracking-widest hover:text-[#6366F1]">Apply</Link>
            <Link href="/fees" className="text-[10px] font-bold uppercase tracking-widest hover:text-[#6366F1]">Fees</Link>
            <Link href="/admission" className="bg-black text-white px-6 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-[#6366F1] transition-all">Start Application</Link>
          </nav>
          <button onClick={() => setMobileMenu(false)} className="lg:hidden p-2"><Menu size={20}/></button>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <main className="pt-52 pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          
          <div className="mb-20">
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#6366F1] text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Eligibility & Norms</motion.span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 italic max-w-3xl">Admission <br/>Criteria {activeSession}.</h1>
            <p className="text-slate-400 text-lg font-light leading-relaxed max-w-2xl">MVG Academy follows a holistic selection process. While academic readiness is key, we prioritize students who demonstrate curiosity, creativity, and a spirit of innovation.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* 1. AGE ELIGIBILITY TABLE */}
            <div className="lg:col-span-2 space-y-10">
                <section className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-xl shadow-slate-100/50">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#6366F1]"><Calendar size={24}/></div>
                        <h2 className="text-2xl font-bold tracking-tight">Age Requirements</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-50">
                                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-300">Grade</th>
                                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-300">Minimum Age (Years)</th>
                                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-300">As on 31st March {activeSession.split('-')[0]}</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-medium">
                                <AgeRow grade="LKG" age="3+" />
                                <AgeRow grade="UKG" age="4+" />
                                <AgeRow grade="Grade 1" age="6+" />
                                <AgeRow grade="Grade 6" age="11+" />
                                <AgeRow grade="Grade 9" age="14+" />
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 2. SELECTION PARAMETERS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <CriteriaCard 
                        icon={<BookOpen size={20}/>}
                        title="Academic Proficiency"
                        desc="Evaluation of previous 2 years' academic reports. For Grade 9 and above, an entrance test in English and Math is required."
                    />
                    <CriteriaCard 
                        icon={<Users size={20}/>}
                        title="Interaction Rounds"
                        desc="A friendly interaction with the student and parents to understand the child's learning style and family values."
                    />
                </div>
            </div>

            {/* SIDEBAR: POINTS SYSTEM */}
            <div className="space-y-8">
                <div className="bg-[#0a0a0a] text-white p-10 rounded-[3rem] shadow-2xl shadow-indigo-100">
                    <Scale className="text-[#6366F1] mb-6" size={32}/>
                    <h3 className="text-xl font-bold mb-4">Weightage Points</h3>
                    <p className="text-slate-400 text-xs font-light mb-8 italic leading-relaxed">Selection is based on the following distribution:</p>
                    <ul className="space-y-6">
                        <PointItem label="Neighborhood (Proximity)" percent="30%" />
                        <PointItem label="Academic Record" percent="25%" />
                        <PointItem label="Siblings in MVG" percent="20%" />
                        <PointItem label="Interaction/Aptitude" percent="25%" />
                    </ul>
                </div>

                <div className="p-10 border border-slate-100 rounded-[3rem] bg-white">
                    <ShieldAlert className="text-orange-400 mb-4" size={24}/>
                    <h4 className="font-bold text-sm mb-2">Important Note</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Submission of form does not guarantee admission. Seats are allocated based on merit and availability.</p>
                </div>
            </div>

          </div>
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-white pt-24 pb-12 px-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="text-xl font-bold tracking-tighter italic text-[#6366F1] uppercase">MVG ACADEMY</div>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-2 leading-loose">Sanctuary of Learning • Jaipur, Rajasthan</p>
            </div>
            <div className="flex gap-4">
                <Link href="/admission" className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-8 py-3 rounded-full hover:bg-[#6366F1] transition-all">Apply Now</Link>
            </div>
        </div>
      </footer>
    </div>
  );
}

// --- SUB COMPONENTS ---
function AgeRow({ grade, age }) {
    return (
        <tr className="border-b border-slate-50 last:border-none group">
            <td className="py-6 font-black text-[#6366F1]">{grade}</td>
            <td className="py-6 text-slate-600">{age}</td>
            <td className="py-6 text-slate-400 font-light italic">Birth Certificate Required</td>
        </tr>
    );
}

function CriteriaCard({ icon, title, desc }) {
    return (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 hover:border-[#6366F1] transition-all group">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-[#6366F1] transition-all mb-6">
                {icon}
            </div>
            <h4 className="text-lg font-bold mb-3">{title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-light">{desc}</p>
        </div>
    );
}

function PointItem({ label, percent }) {
    return (
        <li className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <span>{label}</span>
                <span className="text-[#6366F1]">{percent}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }} 
                    whileInView={{ width: percent }} 
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-[#6366F1]" 
                />
            </div>
        </li>
    );
}