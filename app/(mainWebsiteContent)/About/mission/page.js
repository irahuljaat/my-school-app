"use client"
import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image'; // Next.js Image for millisecond loading
import { 
  Target, Rocket, ShieldCheck, ChevronDown, 
  CheckCircle2 
} from 'lucide-react';

export default function MissionPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  // Optimization 1: Memoize static data so it doesn't recalculate on scroll/renders
  const coreValues = useMemo(() => [
    {
      title: "Intellectual Growth",
      desc: "Cultivating a thirst for knowledge that goes beyond textbooks and examinations.",
      icon: Target,
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "Ethical Integrity",
      desc: "Instilling values of honesty, respect, and responsibility in every student.",
      icon: ShieldCheck,
      color: "bg-emerald-50 text-emerald-600"
    },
    {
      title: "Global Citizenship",
      desc: "Preparing students to lead and serve in an increasingly interconnected world.",
      icon: Rocket,
      color: "bg-purple-50 text-purple-600"
    }
  ], []);

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
    // Passive scroll listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
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
    <div className="bg-[#FDFBF9] text-slate-900 antialiased overflow-x-hidden font-sans">
      
      {/* --- 2. MISSION HERO --- */}
      <section className="relative min-h-[60vh] flex items-center bg-slate-950 pt-20">
        <div className="absolute inset-0 opacity-40">
           {/* Optimization 2: Added priority and fill for instant Hero display */}
           <Image 
              src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070" 
              alt="Mission" 
              fill
              priority
              className="object-cover"
           />
           <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 to-slate-950" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-[#6366F1] font-black tracking-[0.4em] uppercase text-xs mb-6 block">Our Purpose</span>
            <h1 className="text-6xl md:text-8xl font-black uppercase text-white tracking-tighter leading-none mb-8">
              The <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Mission</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* --- 3. MISSION STATEMENT --- */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="w-20 h-2 bg-[#6366F1] mb-10" />
              <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-tight mb-8">
                Empowering every student to <span className="text-[#6366F1]">reach higher</span> and dream bigger.
              </h2>
              <p className="text-xl text-slate-500 font-medium leading-relaxed mb-8">
                Our mission is to provide a nurturing and innovative learning environment that fosters academic excellence, creative expression, and strong moral character.
              </p>
              <ul className="space-y-4">
                {['Innovation in Learning', 'Character Development', 'Community Leadership'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-black uppercase tracking-widest text-xs text-slate-700">
                    <CheckCircle2 size={18} className="text-[#6366F1]" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="relative aspect-[5/5] bg-slate-100 rounded-[3rem] overflow-hidden shadow-2xl">
                {/* Optimization 3: WebP delivery through Next/Image */}
                <Image 
                  src="https://res.cloudinary.com/db6ssceun/image/upload/v1766151252/lywz5x0c1sqx5dmsxs0c.jpg" 
                  alt="Student Life" 
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 bg-white p-12 rounded-[2.5rem] shadow-xl hidden md:block border border-slate-50">
                <div className="text-4xl font-black text-[#6366F1]">100%</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Commitment to Success</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 4. CORE VALUES --- */}
      <section className="py-32 bg-slate-900 rounded-[4rem] mx-4 mb-12 md:mx-10 overflow-hidden text-white">
        <div className="max-w-7xl mx-auto px-6 text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4">Core <span className="text-[#6366F1]">Values</span></h2>
          <p className="text-slate-400 font-medium">The pillars that hold our institution together.</p>
        </div>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {coreValues.map((value, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-sm"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${value.color}`}>
                <value.icon size={30} />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4">{value.title}</h3>
              <p className="text-slate-400 font-medium leading-relaxed">{value.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}