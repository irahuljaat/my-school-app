"use client"
import React, { useState, useEffect, useCallback, memo } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Link from 'next/link';
// Optimization: Only import what is strictly used
import { 
  Facebook, Instagram, ChevronDown, 
  ShieldCheck, Zap, ArrowRight, 
  Phone, Mail, MapPin, Users, Sparkles, Target
} from 'lucide-react';

// Memoized static components to prevent re-renders on scroll
const PillarCard = memo(({ icon, title, desc }) => (
  <div className="p-10 border border-slate-100 rounded-[2.5rem] hover:bg-slate-50 transition-all duration-500 group">
    <div className="mb-6 group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-xl font-bold mb-4">{title}</h3>
    <p className="text-slate-500 text-sm font-light leading-relaxed">{desc}</p>
  </div>
));

const Stat = memo(({ num, label }) => (
  <div>
    <div className="text-5xl font-bold text-slate-900 mb-2 tracking-tighter">{num}</div>
    <div className="text-[10px] font-bold uppercase tracking-widest text-[#6366F1]">{label}</div>
  </div>
));

export default function WhyChooseMVG() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Firebase Subscription
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) setData(docSnap.data());
      setLoading(false);
    });

    // Optimization: Passive event listener for smoother scrolling
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => { 
      unsub(); 
      window.removeEventListener('scroll', handleScroll); 
    };
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="italic font-light tracking-widest text-slate-400 uppercase text-[10px] animate-pulse">
        Defining Excellence...
      </div>
    </div>
  );

  return (
    <div className="bg-white text-[#1a1a1a] antialiased selection:bg-[#6366F1] selection:text-white">
      
      {/* 1. TOP CONTACT BAR (Hidden on mobile for speed) */}
      <div className="hidden lg:block bg-[#0a0a0a] text-slate-400 py-3 relative z-[110]">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em]">
          <div className="flex gap-8">
            <span className="flex items-center gap-2 transition-colors hover:text-white">
              <Phone size={12} className="text-[#6366F1]" /> {data?.phone || "+91 141 2345678"}
            </span>
            <span className="flex items-center gap-2 transition-colors hover:text-white">
              <Mail size={12} className="text-[#6366F1]" /> admissions@mvgacademy.com
            </span>
          </div>
          <div className="flex gap-6 items-center">
            <span className="flex items-center gap-2"><MapPin size={12} className="text-[#6366F1]" /> Jaipur, Rajasthan</span>
            <div className="flex gap-4 border-l border-white/10 pl-6">
              <Facebook size={14} className="cursor-pointer transition-colors hover:text-[#6366F1]" />
              <Instagram size={14} className="cursor-pointer transition-colors hover:text-[#6366F1]" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. HERO: Optimized Loading */}
      <section className="relative h-[85vh] flex items-center bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://res.cloudinary.com/db6ssceun/image/upload/v1777730300/ChatGPT_Image_May_2_2026_07_28_04_PM_pnaxem.png" 
            className="h-full w-full object-cover opacity-40 grayscale" 
            alt="Excellence" 
            fetchPriority="high" // Tell browser to load this first
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-[#0a0a0a]" />
        </div>
        <div className="max-w-7xl mx-auto px-8 relative z-10 w-full text-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="text-[#6366F1] text-[11px] font-bold uppercase tracking-[0.6em] mt-12 mb-8 block">The MVG Distinction</span>
            <h1 className="text-6xl md:text-[8rem] font-bold text-white tracking-tighter leading-[0.85] mb-12">
              Choosing <br/><span className="italic font-light text-slate-500">Excellence.</span>
            </h1>
            <p className="mx-auto mb-12 max-w-2xl text-lg font-light leading-relaxed text-slate-400 md:text-xl">
              Academic rigor meets modern innovation to build Jaipur's future leaders.
            </p>
            <div className="flex justify-center">
                <div className="animate-bounce rounded-full border border-white/10 p-3">
                    <ArrowRight size={20} className="rotate-90 text-white" />
                </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. THE PILLARS */}
      <section className="bg-white py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <PillarCard icon={<ShieldCheck size={32} className="text-[#6366F1]"/>} title="Academic Legacy" desc="25+ years blending traditional discipline with modern curriculum." />
            <PillarCard icon={<Sparkles size={32} className="text-[#6366F1]"/>} title="Holistic Growth" desc="Focusing on EQ alongside IQ through sports and leadership." />
            <PillarCard icon={<Users size={32} className="text-[#6366F1]"/>} title="Expert Mentors" desc="Subject matter experts dedicated to individual student success." />
            <PillarCard icon={<Target size={32} className="text-[#6366F1]"/>} title="Future Ready" desc="AI labs and public speaking training for 21st-century demands." />
          </div>
        </div>
      </section>

      {/* 4. VALUE SECTION: Lazy Loading Image */}
      <section className="border-y border-slate-100 bg-slate-50 py-24 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-12">
            <div className="space-y-4">
                <span className="text-[#6366F1] text-[10px] font-bold uppercase tracking-widest">Our Environment</span>
                <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9]">Why students <br/>thrive here.</h2>
            </div>
            <div className="space-y-10">
                <ValueItem title="Safety & Security" desc="Zero-tolerance campus with 24/7 CCTV and verified staff." />
                <ValueItem title="Innovation Labs" desc="Robotics and Science labs to turn concepts into reality." />
                <ValueItem title="Global Standards" desc="Curriculum inspired by international benchmarks." />
            </div>
          </div>

          <div className="relative group">
              <div className="aspect-[4/5] overflow-hidden rounded-[4rem] shadow-2xl">
                <img 
                  src="https://res.cloudinary.com/db6ssceun/image/upload/v1766231170/DSC_0614_qr56qm.jpg" 
                  className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105" 
                  alt="Student Life" 
                  loading="lazy" // Optimization: Don't load until near viewport
                />
              </div>
              <div className="absolute -bottom-10 -right-10 hidden rounded-[3rem] bg-[#6366F1] p-12 text-white shadow-2xl md:block">
                  <span className="mb-2 block text-6xl font-bold">100%</span>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">University Placement</p>
              </div>
          </div>
        </div>
      </section>

      {/* 5. STATS */}
      <section className="bg-white py-32 px-8 text-center">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
            <Stat num="25+" label="Years of Excellence" />
            <Stat num="15:1" label="Student Ratio" />
            <Stat num="50+" label="Activities" />
            <Stat num="5k+" label="Alumni" />
        </div>
      </section>
    </div>
  );
}

function ValueItem({ title, desc }) {
  return (
    <div className="group flex gap-6">
      <div className="pt-1"><Zap size={20} className="text-[#6366F1] opacity-30 transition-opacity group-hover:opacity-100"/></div>
      <div>
        <h4 className="text-lg font-bold mb-1">{title}</h4>
        <p className="text-sm font-light text-slate-400">{desc}</p>
      </div>
    </div>
  );
}