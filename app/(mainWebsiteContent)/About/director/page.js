"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../../images/logo.jpg';
import { 
  Quote, ChevronDown, ArrowRight, Menu, X, Facebook, Instagram, Twitter, 
  Mail, Phone, MapPin, ArrowUpRight, CheckCircle2, Award
} from 'lucide-react';

export default function DirectorDesk() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      }
      setLoading(false);
    });

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      unsub();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="bg-white text-slate-900 antialiased overflow-x-hidden font-sans">
      
     

       


      {/* --- 2. DIRECTOR HERO (DARK THEME FOR VISIBILITY) --- */}
      <section className="relative min-h-[60vh] flex items-center bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
           <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069" className="w-full h-full object-cover" alt="Desk background" />
           <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 to-slate-950" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full pt-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-[#6366F1] font-black tracking-[0.4em] uppercase text-xs mb-6 block">Leadership</span>
            <h1 className="text-5xl md:text-8xl font-black uppercase text-white tracking-tighter leading-none">
              Director's <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">Desk</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* --- 3. MAIN MESSAGE CONTENT --- */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            {/* Image Side */}
            <div className="lg:col-span-5 sticky top-32">
              <div className="relative">
                <div className="aspect-[4/5] bg-slate-100 rounded-[3rem] overflow-hidden shadow-2xl group">
                  <img 
                    src="https://res.cloudinary.com/db6ssceun/image/upload/v1772172686/1772172574607_mv0amq.png" 
                    className="w-full h-full object-cover  group-hover:grayscale-0 transition-all duration-1000" 
                    alt="Director Portrait" 
                  />
                </div>
                {/* Floating Badge */}
                <div className="absolute -bottom-10 -right-6 bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-50 max-w-[200px]">
                    <Quote size={32} className="text-[#6366F1] mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-tight">Empowering students through innovation.</p>
                </div>
              </div>
            </div>

            {/* Text Side */}
            <div className="lg:col-span-7 space-y-12">
              <div>
                <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6">Message from the  <span className="text-[#6366F1]">Director</span></h2>
                <div className="h-1.5 w-24 bg-[#6366F1] mb-10" />
                <div className="prose prose-lg text-slate-600 font-medium space-y-6">
                    <p className="text-xl leading-relaxed text-slate-800">"Education is the foundation upon which strong individuals and responsible societies are built. Our school was established with a deep commitment to nurturing young minds with knowledge, values, and discipline.

A significant milestone in our journey came in 2010, when we transformed our institution into a complete English-medium school. This decision was driven by a clear vision—to prepare our students for a rapidly changing world while preserving the moral and cultural values that define us.

Since then, we have continuously worked towards improving academic standards, modernizing infrastructure, and adopting innovative teaching methodologies. Our focus has always been on holistic development—academic excellence, character building, confidence, and lifelong learning.

I firmly believe that every child has unique potential. We strive to provide a nurturing environment where students can grow into capable, confident, and responsible citizens.

I welcome you to be a part of our journey as we continue to shape the future through quality education.</p>
                </div>
              </div>

              <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
                <h4 className="text-2xl font-black uppercase italic tracking-tighter">KEDAR MAL JAT</h4>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6366F1] mb-6">Director & Founder</p>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest"><Award size={16}/> B.A,B.Ed</div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest"><Award size={16}/> 25+ Years Experience</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

     
    </div>
  );
}

// --- SHARED UI COMPONENTS ---
function NavItem({ label, href, isScrolled }) {
  return (
    <Link href={href} className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors hover:text-[#6366F1] ${
      isScrolled ? 'text-slate-600' : 'text-white'
    }`}>{label}</Link>
  );
}

function NavDropdown({ label, items, isScrolled }) {
  return (
    <div className="relative group px-4 py-2 cursor-pointer">
      <div className={`flex items-center gap-1 text-[11px] font-black uppercase tracking-widest group-hover:text-[#6366F1] transition-colors ${
        isScrolled ? 'text-slate-600' : 'text-white'
      }`}>{label} <ChevronDown size={12} className="group-hover:rotate-180 transition-transform" /></div>
      <div className="absolute top-full left-0 pt-4 opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
        <div className="bg-white min-w-[240px] shadow-2xl rounded-2xl border border-slate-50 p-3 grid gap-1">
          {items.map((item, idx) => (
            <Link key={idx} href={item.link} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-[#6366F1] transition-all">
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              <ArrowRight size={12} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileNavItem({ label, href, setMobileMenu }) {
  return (
    <Link href={href} onClick={() => setMobileMenu(false)} className="py-5 border-b border-slate-50 block">
      <span className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">{label}</span>
    </Link>
  );
}