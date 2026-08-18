"use client";
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, Quote, ExternalLink, ShieldCheck, Sparkles, BookOpen, Sun 
} from 'lucide-react';

export default function CulturalLovePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) setData(docSnap.data());
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#142440] text-[#E9DCBD] font-mono text-xs uppercase tracking-[0.3em]">
      Loading Cultural Heritage...
    </div>
  );

  const schoolName = data?.schoolName || "MVG Public Senior Secondary School";

  return (
    <div className="bg-[#FAF8F4] text-[#142440] antialiased selection:bg-[#B8892B] selection:text-white font-sans">
      
      {/* --- 1. HERO SECTION --- */}
      <section className="relative h-[88vh] flex items-center bg-[#142440] overflow-hidden">
        <div className="absolute inset-0">
          <Image 
            src="https://res.cloudinary.com/db6ssceun/image/upload/v1772013782/Gemini_Generated_Image_9xm7ie9xm7ie9xm7_jljpt9.png" 
            alt="Cultural Heritage"
            fill
            priority
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#142440] via-[#142440]/80 to-transparent" />
        </div>
        
        <div className="max-w-7xl mx-auto px-8 relative z-10 w-full">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 bg-[#E9DCBD]/10 border border-[#E9DCBD]/20 px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
                <Heart className="text-[#E9DCBD] fill-[#E9DCBD]" size={14} />
                <span className="text-[#E9DCBD] text-[10px] font-mono font-medium uppercase tracking-[0.3em]">
                  Culture & Character at {schoolName}
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-normal text-white tracking-tight leading-[1.1] mb-8">
                Grounded in <span className="italic text-[#E9DCBD]">Culture,</span> <br />Built for Tomorrow.
              </h1>
              <p className="text-[#FAF8F4]/80 text-lg md:text-xl font-normal leading-relaxed mb-10 max-w-2xl">
                We blend traditional Indian values with modern academic excellence. Here, education goes beyond textbooks to nurture respect, integrity, and cultural pride in every student.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- 2. WHY PARENTS CHOOSE US (Admissions Value) --- */}
      <section className="py-28 px-8 bg-[#FAF8F4]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-[#B8892B] text-[10px] font-mono font-medium uppercase tracking-[0.3em] mb-4 block">
              Parent's Choice
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-normal tracking-tight text-[#142440]">
              Why Parents Entrust Their Children to Us
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <CulturePillar 
              icon={<ShieldCheck size={24} />}
              title="Sanskriti & Ethics"
              desc="Daily morning prayers, ethical grounding, and respect for elders form the foundation of our daily discipline."
            />
            <CulturePillar 
              icon={<Sun size={24} />}
              title="Heritage & Tradition"
              desc="Active participation in Rajasthani folk arts, classical performances, and regional celebrations that preserve our identity."
            />
            <CulturePillar 
              icon={<BookOpen size={24} />}
              title="Academic Integrity"
              desc="A holistic RBSE curriculum delivered with modern teaching methods, ensuring strong career readiness."
            />
          </div>
        </div>
      </section>

      {/* --- 3. CULTURAL CALENDAR --- */}
      <section className="py-28 px-8 bg-[#F1ECE1] border-y border-[#E4DFD3]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-2xl">
              <span className="text-[#B8892B] text-[10px] font-mono font-medium uppercase tracking-[0.3em] mb-3 block">
                Annual Celebrations
              </span>
              <h2 className="text-4xl md:text-5xl font-serif font-normal tracking-tight text-[#142440]">
                Cultural Calendar <span className="italic text-[#B8892B]">2026-27</span>
              </h2>
            </div>
            <Link 
              href="/Academics/calender" 
              className="inline-flex items-center gap-2 text-xs font-mono font-medium uppercase tracking-[0.2em] text-[#142440] hover:text-[#B8892B] border-b border-[#142440] pb-1 transition-colors"
            >
              View Full Academic Calendar <ExternalLink size={14}/>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <EventCard date="AUG 15" event="Independence Day" desc="Grand patriotic showcase featuring traditional drill, folk dance, and musical tributes." />
            <EventCard date="OCT" event="Navratri Utsav" desc="Traditional Garba and Dandiya evening celebrating our rich heritage." />
            <EventCard date="JAN 14" event="Kite Festival" desc="Makar Sankranti celebration reflecting the vibrant spirit of Rajasthan." />
            <EventCard date="FEB" event="Annual Function" desc="Our flagship event 'Sanskriti' celebrating a year of artistic and academic growth." />
          </div>
        </div>
      </section>

      {/* --- 4. DIRECTOR'S VISION & ADMISSION CALL --- */}
      <section className="py-32 px-8 bg-[#FAF8F4]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="aspect-[4/5] rounded-[28px] overflow-hidden shadow-xl bg-[#FFFFFF] border border-[#E4DFD3] relative">
              <Image 
                src="https://res.cloudinary.com/db6ssceun/image/upload/v1772172686/1772172574607_mv0amq.png" 
                alt="School Life & Culture" 
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-[#142440] p-8 rounded-[24px] shadow-2xl border border-[#E4DFD3] hidden md:block max-w-xs text-white">
              <Sparkles className="text-[#E9DCBD] mb-2" size={24} />
              <p className="text-xs font-serif text-[#FAF8F4]/90 italic leading-relaxed">
                "Where root values inspire grand vision."
              </p>
            </div>
          </div>

          <div className="space-y-10">
            <Quote className="text-[#B8892B] opacity-40" size={60} />
            <h2 className="text-4xl md:text-5xl font-serif font-normal tracking-tight text-[#142440] leading-tight">
              Nurturing Roots, <br /><span className="italic text-[#B8892B]">Inspiring Wings.</span>
            </h2>
            <p className="text-[#52607A] text-lg font-normal leading-relaxed italic">
              "At {schoolName}, education goes beyond academic achievement. Our focus on combining state syllabus excellence with rich cultural immersion ensures every student matures into a confident, responsible citizen."
            </p>

            <div className="pt-6 border-t border-[#E4DFD3] flex flex-col sm:flex-row justify-between sm:items-center gap-6">
              <div>
                <p className="text-lg font-serif text-[#142440]">Director's Message</p>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#B8892B] mt-1">{schoolName}</p>
              </div>

              <Link 
                href="/Admissions" 
                className="inline-flex items-center justify-center bg-[#142440] text-[#FAF8F4] px-8 py-4 rounded-full text-xs font-mono uppercase tracking-[0.2em] hover:bg-[#B8892B] transition-colors"
              >
                Apply for Admission
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

// --- SUB-COMPONENTS ---

function CulturePillar({ icon, title, desc }) {
  return (
    <div className="p-8 rounded-[24px] bg-[#FFFFFF] border border-[#E4DFD3] hover:border-[#B8892B]/50 transition-all duration-300 group flex flex-col justify-between">
      <div>
        <div className="w-12 h-12 rounded-full border border-[#E4DFD3] text-[#B8892B] flex items-center justify-center mb-6">
          {icon}
        </div>
        <h3 className="font-serif text-2xl text-[#142440] font-normal tracking-tight mb-3">{title}</h3>
        <p className="text-[#52607A] font-normal leading-relaxed text-sm">{desc}</p>
      </div>
    </div>
  );
}

function EventCard({ date, event, desc }) {
  return (
    <div className="p-8 bg-[#FFFFFF] border border-[#E4DFD3] hover:border-[#B8892B]/50 rounded-[24px] transition-all duration-300 flex flex-col justify-between">
      <div>
        <span className="text-[10px] font-mono font-medium text-[#B8892B] block mb-3 uppercase tracking-[0.25em]">{date}</span>
        <h3 className="text-xl font-serif font-normal text-[#142440] mb-3">{event}</h3>
        <p className="text-[#52607A] text-xs leading-relaxed font-normal">{desc}</p>
      </div>
    </div>
  );
}