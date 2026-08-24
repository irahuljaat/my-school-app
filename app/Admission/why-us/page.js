"use client"
import React, { useState, useEffect, memo } from 'react';
import { db } from '../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
// Optimization: Only import what is strictly used
import { 
  Facebook, Instagram, 
  ShieldCheck, Zap, ArrowRight, 
  Phone, Mail, MapPin, Users, Sparkles, Target
} from 'lucide-react';

// Memoized static components styled with the new design system tokens
const PillarCard = memo(({ icon, title, desc }) => (
  <div className="p-10 border border-[#E4DFD3] rounded-[24px] bg-white hover:bg-[#FAF8F4] transition-all duration-500 group">
    <div className="mb-6 group-hover:scale-110 transition-transform w-12 h-12 rounded-full border border-[#E4DFD3] flex items-center justify-center bg-white">{icon}</div>
    <h3 className="text-xl font-bold mb-4 font-serif text-[#142440]">{title}</h3>
    <p className="text-[#52607A] text-sm font-light leading-relaxed">{desc}</p>
  </div>
));

const Stat = memo(({ num, label }) => (
  <div className="px-6 first:pl-0 last:pr-0">
    <div className="text-5xl font-serif font-bold text-[#142440] mb-2 tracking-tighter">{num}</div>
    <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-[#B8892B]">{label}</div>
  </div>
));

export default function WhyChooseMVG() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase Subscription
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) setData(docSnap.data());
      setLoading(false);
    });

    return () => { unsub(); };
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FAF8F4]">
      <div className="font-mono uppercase text-[10px] tracking-[0.32em] text-[#52607A] animate-pulse">
        Defining Excellence...
      </div>
    </div>
  );

  return (
    <div className="bg-[#FAF8F4] text-[#142440] antialiased selection:bg-[#B8892B] selection:text-white">
      
      {/* 1. TOP CONTACT BAR */}
      <div className="hidden lg:block bg-[#142440] text-[#E9DCBD] py-3 relative z-[110]">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.32em]">
          <div className="flex gap-8">
            <span className="flex items-center gap-2 transition-colors hover:text-white">
              <Phone size={12} className="text-[#B8892B]" /> {data?.phone || "+91 141 3152600"}
            </span>
            <span className="flex items-center gap-2 transition-colors hover:text-white">
              <Mail size={12} className="text-[#B8892B]" /> mvgschooljaipur@gmail.com
            </span>
          </div>
          <div className="flex gap-6 items-center">
            <span className="flex items-center gap-2"><MapPin size={12} className="text-[#B8892B]" /> Jaipur, Rajasthan</span>
            <div className="flex gap-4 border-l border-[#E4DFD3]/20 pl-6">
              <Facebook size={14} className="cursor-pointer transition-colors hover:text-white" />
              <Instagram size={14} className="cursor-pointer transition-colors hover:text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. HERO SECTION */}
      <section className="relative h-[85vh] flex items-center bg-[#142440] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://res.cloudinary.com/db6ssceun/image/upload/v1777730300/ChatGPT_Image_May_2_2026_07_28_04_PM_pnaxem.png" 
            className="h-full w-full object-cover opacity-30 grayscale shadow-2xl" 
            alt="Excellence" 
            fetchPriority="high"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#142440]/60 via-[#142440]/80 to-[#142440]" />
        </div>
        <div className="max-w-7xl mx-auto px-8 relative z-10 w-full text-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#E9DCBD] mt-12 mb-8 block">The MVG Distinction</span>
            <h1 className="text-6xl md:text-[8rem] font-serif font-bold text-white tracking-tighter leading-[0.85] mb-12">
              Choosing <br/><span className="italic font-light text-[#E9DCBD]">Excellence.</span>
            </h1>
            <p className="mx-auto mb-12 max-w-2xl text-lg font-light leading-relaxed text-[#E4DFD3] md:text-xl font-sans">
              Academic rigor meets modern innovation to build Jaipur's future leaders.
            </p>
            <div className="flex justify-center">
                <div className="animate-bounce rounded-full border border-[#E4DFD3]/30 p-3 bg-[#142440]">
                    <ArrowRight size={20} className="rotate-90 text-[#E9DCBD]" />
                </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. THE PILLARS */}
      <section className="bg-[#FAF8F4] py-20 md:py-28 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#B8892B]">Core Foundations</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#142440]">Built on lasting principles</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <PillarCard icon={<ShieldCheck size={24} className="text-[#B8892B]"/>} title="Academic Legacy" desc="25+ years blending traditional discipline with modern curriculum." />
            <PillarCard icon={<Sparkles size={24} className="text-[#B8892B]"/>} title="Holistic Growth" desc="Focusing on EQ alongside IQ through sports and leadership." />
            <PillarCard icon={<Users size={24} className="text-[#B8892B]"/>} title="Expert Mentors" desc="Subject matter experts dedicated to individual student success." />
            <PillarCard icon={<Target size={24} className="text-[#B8892B]"/>} title="Future Ready" desc="AI labs and public speaking training for 21st-century demands." />
          </div>
        </div>
      </section>

      {/* 4. VALUE SECTION */}
      <section className="border-y border-[#E4DFD3] bg-[#F1ECE1] py-20 md:py-28 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-12">
            <div className="space-y-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#B8892B]">Our Environment</span>
                <h2 className="text-5xl md:text-7xl font-serif font-bold text-[#142440] tracking-tight leading-[0.9]">Why students <br/>thrive here.</h2>
            </div>
            <div className="space-y-10">
                <ValueItem title="Safety & Security" desc="Zero-tolerance campus with 24/7 CCTV and verified staff." />
                <ValueItem title="Innovation Labs" desc="Robotics and Science labs to turn concepts into reality." />
                <ValueItem title="Global Standards" desc="Curriculum inspired by international benchmarks." />
            </div>
          </div>

          <div className="relative group">
              <div className="aspect-[4/5] overflow-hidden rounded-[28px] border border-[#E4DFD3] bg-white shadow-xl">
                <img 
                  src="https://res.cloudinary.com/db6ssceun/image/upload/v1766231170/DSC_0614_qr56qm.jpg" 
                  className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105" 
                  alt="Student Life" 
                  loading="lazy" 
                />
              </div>
              <div className="absolute -bottom-10 -right-10 hidden rounded-[24px] bg-[#142440] p-12 text-white shadow-2xl md:block border border-[#E4DFD3]/20">
                  <span className="mb-2 block text-6xl font-serif font-bold text-[#E9DCBD]">100%</span>
                  <p className="font-mono text-[10px] uppercase tracking-[0.32em] opacity-80">University Placement</p>
              </div>
          </div>
        </div>
      </section>

      {/* 5. LEDGER STATS ROW */}
      <section className="bg-white py-24 px-8 border-b border-[#E4DFD3]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center divide-x-0 md:divide-x divide-[#E4DFD3]">
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
      <div className="pt-1">
        <div className="w-10 h-10 rounded-full border border-[#E4DFD3] flex items-center justify-center bg-white">
          <Zap size={16} className="text-[#B8892B] opacity-40 transition-opacity group-hover:opacity-100"/>
        </div>
      </div>
      <div>
        <h4 className="text-lg font-bold mb-1 font-serif text-[#142440]">{title}</h4>
        <p className="text-sm font-light text-[#52607A]">{desc}</p>
      </div>
    </div>
  );
}