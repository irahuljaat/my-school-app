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
    <div className="bg-[#FAF8F4] text-[#142440] antialiased selection:bg-[#B8892B] selection:text-white font-sans">
      
      {/* --- 1. HERO: INSTANT LOAD --- */}
      <section className="relative h-[85vh] flex items-center bg-[#142440] overflow-hidden">
        <div className="absolute inset-0">
          <Image 
            src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2070" 
            alt="Robotics Lab"
            fill
            priority // Forces this to load in milliseconds
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#142440] via-[#142440]/70 to-transparent" />
        </div>
        
        <div className="max-w-7xl mx-auto px-8 relative z-10 w-full">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.8 }}
            >
              <span className="text-[#E9DCBD] text-[10px] font-mono font-medium uppercase tracking-[0.32em] mb-6 block">
                The Innovation Lab • 2026
              </span>
              <h1 className="text-5xl md:text-7xl font-serif font-normal text-white tracking-tight leading-[1.1] mb-8">
                Coding the <br/>Future with <span className="italic font-serif text-[#E9DCBD]">AI & Science.</span>
              </h1>
              <p className="text-[#FAF8F4]/80 text-lg md:text-xl font-normal leading-relaxed mb-10 max-w-2xl">
                At {data.schoolName}, students don't just read about technology—they build it. We integrate Modern Science with Robotics to turn curiosity into innovation.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- 2. PILLARS: PREMIUM GRID --- */}
      <section className="py-32 px-8 bg-[#FAF8F4] relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <LearningPillar 
              icon={<Atom size={24}/>} 
              title="Modern Science" 
              desc="Moving from theory to discovery. Students explore Space Science and Physics in a hands-on environment."
            />
            <LearningPillar 
              icon={<Bot size={24}/>} 
              title="Robotics Lab" 
              desc="From mechanical gears to automated drones. Our students design, assemble, and pilot their own creations."
            />
            <LearningPillar 
              icon={<Cpu size={24}/>} 
              title="AI Integration" 
              desc="The language of tomorrow. We teach Machine Learning and Python to build software that thinks."
            />
          </div>
        </div>
      </section>

      {/* --- 3. THE JOURNEY: HIGH-PERFORMANCE IMAGE --- */}
      <section className="py-24 px-8 bg-[#F1ECE1] border-y border-[#E4DFD3]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative group">
             <div className="aspect-[4/5] rounded-[28px] overflow-hidden shadow-xl bg-[#FFFFFF] border border-[#E4DFD3]">
                <Image 
                  src="https://res.cloudinary.com/db6ssceun/image/upload/v1766668550/WhatsApp_Image_2025-12-25_at_18.45.22_sdgubl.jpg" 
                  alt="Practical Learning"
                  fill
                  className="object-cover transition-all duration-1000"
                />
             </div>
             <div className="absolute -bottom-8 -left-8 bg-[#FAF8F4] p-8 rounded-[24px] shadow-xl border border-[#E4DFD3] hidden md:block">
                <span className="text-5xl font-serif font-normal tracking-tight text-[#142440] leading-none">95%</span>
                <p className="text-[10px] font-mono font-medium uppercase tracking-[0.25em] text-[#B8892B] mt-2">Practical Lab Ratio</p>
             </div>
          </div>

          <div className="space-y-12">
            <h2 className="text-4xl md:text-6xl font-serif font-normal text-[#142440] tracking-tight leading-none">How our <br/>students <span className="italic text-[#B8892B]">evolve.</span></h2>
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
    <div className="p-8 rounded-[24px] bg-[#FFFFFF] border border-[#E4DFD3] hover:border-[#B8892B]/50 transition-all duration-300 group flex flex-col justify-between">
      <div>
        <div className="w-12 h-12 rounded-full border border-[#E4DFD3] text-[#B8892B] flex items-center justify-center transition-all duration-300 mb-6">
          {icon}
        </div>
        <h3 className="font-serif text-2xl text-[#142440] font-normal tracking-tight mb-3">{title}</h3>
        <p className="text-[#52607A] font-normal leading-relaxed text-sm">{desc}</p>
      </div>
    </div>
  );
}

function Step({ num, title, desc }) {
  return (
    <div className="flex gap-6 group cursor-default">
      <div className="w-10 h-10 rounded-full border border-[#E4DFD3] flex items-center justify-center text-[#B8892B] font-mono text-xs shrink-0">
        {num}
      </div>
      <div>
        <h4 className="font-serif text-xl text-[#142440] mb-2">{title}</h4>
        <p className="text-[#52607A] font-normal text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}