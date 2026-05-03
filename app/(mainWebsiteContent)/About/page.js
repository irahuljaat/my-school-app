"use client";

import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
  Target, Eye, ShieldCheck, Phone, Mail, Menu, X, 
  ChevronDown, Instagram, Facebook, MapPin, ArrowRight, Quote, Globe, Lightbulb, Microscope
} from 'lucide-react';
import Image from 'next/image'; // Optimized Next.js Image component

// 1. Define Default Data outside the component to prevent re-renders
const DEFAULT_DATA = {
  stats: [
    { label: "Years of Legacy", value: "30+" },
    { label: "Quality Faculty", value: "25+" },
    { label: "Global Alumni", value: "2200+" },
    { label: "Result Record", value: "100%" }
  ],
  principal: {
    name: "Dr. S. K. Sharma",
    quote: "At MVG Academy, we nurture brilliance and character through a balanced approach to modern education.",
    image: "https://images.unsplash.com/photo-1544717297-fa154da09f9d?q=80&w=2070"
  }
};

export default function AboutPage() {
  // Use DEFAULT_DATA as initial state so the page renders instantly
  const [data, setData] = useState(DEFAULT_DATA);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Background listener - UI stays visible while this fetches
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      }
    });

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true }); // Improved scroll performance
    
    return () => { 
      unsub(); 
      window.removeEventListener('scroll', handleScroll); 
    };
  }, []);

  return (
    <div className="bg-white text-slate-900 antialiased font-sans">
      
      {/* 2. HERO SECTION - Use Priority Loading */}
      <section className="relative h-[70vh] flex items-center justify-center bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <Image 
            src="https://res.cloudinary.com/db6ssceun/image/upload/v1766151247/ksc9iyuyyj7k0kibdsum.jpg" 
            alt="Hero"
            fill
            priority // Forces this image to load immediately with the HTML
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-white" />
        </div>
        <motion.h1 
          initial={{ y: 30, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          className="relative z-10 text-6xl md:text-9xl font-black text-white uppercase italic tracking-tighter"
        >
          OUR <span className="text-blue-600">STORY.</span>
        </motion.h1>
      </section>

      {/* 3. CORE IDENTITY */}
      <section className="py-32 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <span className="text-blue-600 font-black tracking-[0.4em] uppercase text-[10px] block">Institutional Profile</span>
            <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none text-slate-900">
              Where Tradition <br /> <span className="text-blue-600">Meets Innovation.</span>
            </h2>
            <p className="text-slate-600 text-lg font-medium italic leading-relaxed">
              Established in 1994, MVG Public School has grown from a visionary local school into a powerhouse of academic and athletic excellence in Rajasthan.
            </p>
            <div className="grid grid-cols-2 gap-8 py-8 border-y border-slate-100">
              <div className="flex gap-4"><MapPin className="text-blue-600" size={20}/><p className="text-xs font-bold">Jaipur, India 302033</p></div>
              <div className="flex gap-4"><Phone className="text-blue-600" size={20}/><p className="text-xs font-bold">+91 9829018332</p></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {data.stats.map((stat, i) => (
              <div key={i} className={`p-10 rounded-[3rem] ${i % 2 === 0 ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
                <h3 className="text-5xl font-black italic mb-2">{stat.value}</h3>
                <p className="uppercase tracking-widest text-[10px] font-bold opacity-80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}