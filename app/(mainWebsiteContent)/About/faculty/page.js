"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image'; // Optimized Image Component
import { 
  Menu, X, Facebook, Instagram, Mail, Phone, MapPin, 
  ChevronDown, ArrowUpRight, GraduationCap, Users, Award, BookOpen, Briefcase, ArrowRight
} from 'lucide-react';

export default function FacultyAndCareersPage() {
  const [data, setData] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) setData(docSnap.data());
    });

    const teachersQuery = query(collection(db, "teachers"), where("status", "==", "Active"));
    
    const unsubTeachers = onSnapshot(teachersQuery, (snapshot) => {
      const teachersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const sortedTeachers = teachersList.sort((a, b) => Number(a.srNo) - Number(b.srNo));
      setTeachers(sortedTeachers);
      setLoading(false);
    });

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    return () => { 
      unsubConfig(); 
      unsubTeachers(); 
      window.removeEventListener('scroll', handleScroll); 
    };
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white italic font-light tracking-widest text-slate-400 uppercase text-[10px]">
      Loading Personnel...
    </div>
  );

  return (
    <div className="bg-white text-[#1a1a1a] antialiased selection:bg-[#6366F1] selection:text-white">
      
      {/* --- HERO --- */}
      <section className="relative h-[40vh] flex items-center bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070" 
            alt="Personnel"
            fill
            priority // Forces this image to load immediately (LCP optimization)
            className="object-cover opacity-20 grayscale"
          />
        </div>
        <div className="max-w-7xl mx-auto px-8 relative z-10 w-full pt-10">
          <h1 className="text-5xl md:text-9xl font-bold text-white tracking-tighter leading-none">
            Our <span className="text-[#6366F1] italic font-light">People.</span>
          </h1>
        </div>
      </section>

      {/* --- FACULTY GRID --- */}
      <section className="py-24 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-xs font-bold uppercase tracking-[0.4em] text-[#6366F1] mb-4">Core Academic Team</h2>
            <div className="h-[1px] w-20 bg-slate-200" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {teachers.map((member) => (
                  <div key={member.id} className="group">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] bg-slate-50 mb-6 border border-slate-100 shadow-sm">
                          <Image 
                            src={member.imageUrl || "https://via.placeholder.com/400x533?text=Faculty"} 
                            alt={member.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            className="object-cover transition-all duration-700 hover:scale-105" 
                            loading="lazy" // Only loads when scrolled into view
                          />
                      </div>
                      <h3 className="text-xl font-bold tracking-tight uppercase">{member.name}</h3>
                      <p className="text-[#6366F1] text-[9px] font-bold uppercase tracking-[0.2em] mt-1">
                        {member.subjectsTaught} | {member.qualification}
                      </p>
                  </div>
              ))}
          </div>
        </div>
      </section>

      {/* --- CAREERS SECTION --- */}
      <section id="careers" className="py-32 px-8 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
            <div>
              <span className="text-[10px] font-bold text-[#6366F1] uppercase tracking-[0.4em] mb-6 block">Join the Legacy</span>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">Careers at <br/>MVG Public School.</h2>
              <p className="text-slate-500 text-lg font-light leading-relaxed max-w-md">
                We are looking for visionaries, educators, and leaders who want to shape the next generation of global citizens.
              </p>
              <div className="mt-12 p-8 bg-white rounded-3xl border border-slate-200/50 shadow-xl shadow-indigo-50/50">
                <h4 className="font-bold text-sm mb-4 uppercase tracking-widest">General Inquiry?</h4>
                <a href={`mailto:${data?.email}`} className="text-[#6366F1] text-xs font-bold uppercase tracking-widest border-b border-[#6366F1] pb-1">
                  {data?.email || "mvgschooljaipur@gmail.com"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}