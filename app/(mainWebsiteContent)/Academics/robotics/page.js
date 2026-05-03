"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Bot, Cpu, Atom, ChevronDown, Download, ArrowRight 
} from 'lucide-react';

// PASS 'initialData' as a prop from your server-side page.js
export default function RoboticsAndModernScience({ initialData }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const data = initialData || { schoolName: "MVG Public School" }; // Instant fallback

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-white text-[#1a1a1a] antialiased selection:bg-[#6366F1] selection:text-white font-sans">
      
      {/* --- 1. HERO: INSTANT LOAD --- */}
      <section className="relative h-[85vh] flex items-center bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0">
          <Image 
            src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2070" 
            alt="Robotics Lab"
            fill
            priority // Forces this to load in milliseconds
            className="object-cover opacity-30 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        </div>
        
        <div className="max-w-7xl mx-auto px-8 relative z-10 w-full">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.8 }}
            >
              <span className="text-[#6366F1] text-[11px] font-black uppercase tracking-[0.5em] mb-6 block">
                The Innovation Lab • 2026
              </span>
              <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8">
                Coding the <br/>Future with <span className="italic font-light text-slate-500">AI & Science.</span>
              </h1>
              <p className="text-slate-400 text-lg md:text-xl font-light leading-relaxed mb-10 max-w-2xl">
                At {data.schoolName}, students don't just read about technology—they build it. We integrate Modern Science with Robotics to turn curiosity into innovation.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- 2. PILLARS: PREMIUM GRID --- */}
      <section className="py-32 px-8 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <LearningPillar 
              icon={<Atom size={32}/>} 
              title="Modern Science" 
              desc="Moving from theory to discovery. Students explore Space Science and Physics in a hands-on environment."
            />
            <LearningPillar 
              icon={<Bot size={32}/>} 
              title="Robotics Lab" 
              desc="From mechanical gears to automated drones. Our students design, assemble, and pilot their own creations."
            />
            <LearningPillar 
              icon={<Cpu size={32}/>} 
              title="AI Integration" 
              desc="The language of tomorrow. We teach Machine Learning and Python to build software that thinks."
            />
          </div>
        </div>
      </section>

      {/* --- 3. THE JOURNEY: HIGH-PERFORMANCE IMAGE --- */}
      <section className="py-24 px-8 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative group">
             <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl bg-slate-200">
                <Image 
                  src="https://res.cloudinary.com/db6ssceun/image/upload/v1766668550/WhatsApp_Image_2025-12-25_at_18.45.22_sdgubl.jpg" 
                  alt="Practical Learning"
                  fill
                  className="object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
                />
             </div>
             <div className="absolute -bottom-8 -left-8 bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 hidden md:block">
                <span className="text-6xl font-black tracking-tighter text-[#6366F1] leading-none">95%</span>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Practical Lab Ratio</p>
             </div>
          </div>

          <div className="space-y-12">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">How our <br/>students <span className="text-[#6366F1]">evolve.</span></h2>
            <div className="space-y-10">
                <Step num="01" title="Conceptual Curiosity" desc="Introduction to the logic of physics and mechanics." />
                <Step num="02" title="The Prototyping" desc="Using our state-of-the-art lab to build hardware." />
                <Step num="03" title="Intelligence" desc="Applying AI algorithms to make robots perform tasks." />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// --- SUB-COMPONENTS (Clean & Fast) ---

function LearningPillar({ icon, title, desc }) {
  return (
    <div className="p-10 rounded-[2.5rem] border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all duration-500 group">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#6366F1] flex items-center justify-center group-hover:bg-[#6366F1] group-hover:text-white transition-all duration-500 mb-8">
        {icon}
      </div>
      <h3 className="text-2xl font-black tracking-tight mb-4">{title}</h3>
      <p className="text-slate-500 font-light leading-relaxed text-sm">{desc}</p>
    </div>
  );
}

function Step({ num, title, desc }) {
  return (
    <div className="flex gap-8 group cursor-default">
      <span className="text-xs font-black text-[#6366F1] border-b-2 border-indigo-600 h-fit pb-1 uppercase tracking-widest">{num}</span>
      <div>
        <h4 className="text-xl font-black tracking-tight mb-2 group-hover:text-[#6366F1] transition-colors">{title}</h4>
        <p className="text-slate-400 font-light text-base leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}