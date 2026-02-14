'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { db } from '../../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

// Import your logo directly
import LogoImg from '../../images/logo.jpg';

// Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

// Icons
import { 
  GraduationCap, Menu, X, MapPin, Phone, Mail, Instagram, Facebook, Twitter, FileText,
  PlayCircle, Star, CheckCircle2, Globe, Send, Trophy, BookOpen, ShieldCheck, ClipboardCheck,
  Sparkles, Users, Cpu, Music, Microscope, Heart, ChevronDown, ArrowRight, Quote, Calendar,
  Lightbulb, Rocket, Target, Award, Newspaper, ChevronLeft, ChevronRight, Plus, Play, Download
} from 'lucide-react';



export default function AdmissionPage() {
  const [formData, setFormData] = useState({ name: '', grade: '', phone: '' });
    const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <main className="bg-white">


         {/* --- HEADER WRAPPER --- */}
      <header className="fixed w-full z-[100]">
        
        {/* --- TOP CONTACT BAR (Always Visible) --- */}
        <div className="hidden xl:block border-b border-white/10 h-10 bg-slate-900/40 backdrop-blur-md transition-colors duration-500">
          <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center text-white/90">
            <div className="flex gap-8 items-center">
              <a href="tel:+911412345678" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#6366F1] transition-colors">
                <Phone size={12} className="text-[#6366F1]" />
                <span>+91 (141) 2345-678</span>
              </a>
              <a href="mailto:info@mvgacademy.edu" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#6366F1] transition-colors">
                <Mail size={12} className="text-[#6366F1]" />
                <span>info@mvgacademy.edu</span>
              </a>
            </div>
            <div className="flex gap-8 items-center">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                <MapPin size={12} className="text-[#6366F1]" />
                <span>Jaipur, Rajasthan</span>
              </div>
              <div className="flex gap-4 items-center ml-4 border-l border-white/20 pl-6">
                <Facebook size={14} className="hover:text-[#6366F1] cursor-pointer transition-colors" />
                <Instagram size={14} className="hover:text-[#6366F1] cursor-pointer transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* --- NAVIGATION --- */}
        <nav className={`transition-all duration-500 ${isScrolled ? 'bg-white/95 py-3 shadow-xl' : 'bg-transparent py-4 md:py-6'}`}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 md:gap-3 group">
              
              <div className="relative w-10 h-10 md:w-14 md:h-14 flex-shrink-0 bg-white rounded-xl overflow-hidden shadow-md flex items-center justify-center border border-white">
                <img 
                  src={LogoImg.src} 
                  alt="MVG Academy Logo" 
                  className="w-full h-full object-contain p-1"
                  style={{ imageRendering: 'crisp-edges' }} 
                />
              </div>
              
              <div className="flex flex-col">
                <span className={`text-lg md:text-2xl font-black tracking-tighter uppercase leading-none transition-colors ${isScrolled ? 'text-slate-900' : 'text-white'}`}>
                  {data?.schoolName || "MVG ACADEMY"}
                </span>
                <span className="text-[8px] md:text-[10px] font-bold text-[#6366F1] tracking-[0.2em] uppercase">Jaipur</span>
              </div>
            </Link>

            {/* DESKTOP MENU */}
            <div className="hidden xl:flex items-center gap-6">
              <NavItem label="Home" href="/" active isScrolled={isScrolled} />
              <NavDropdown 
                label="About Us" 
                href="/About" 
                isScrolled={isScrolled} 
                items={[
                  { label: 'History', link: '/About#history' },
                  { label: 'Our Faculty', link: '/About#faculty' },
                  { label: 'Campus Labs', link: '/About#facilities' }
                ]} 
              />
              <NavDropdown label="Admission" isScrolled={isScrolled} items={[{ label: 'Fees Structure', link: '/admission/fees' }, { label: 'Process', link: '/admission/process' }, { label: 'Registration', link: '/admission/registration' }]} />
              <NavItem label="Facilities" href="/About" isScrolled={isScrolled} />
              <NavItem label="Academics" href="/academics" isScrolled={isScrolled} />
              <NavItem label="Gallery" href="/gallery" isScrolled={isScrolled} />
              <NavItem label="Contact" href="/contact" isScrolled={isScrolled} />
              <Link href="/apply" className="bg-[#6366F1] text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-indigo-200">Apply 2025</Link>
            </div>

            <button onClick={() => setMobileMenu(true)} className="xl:hidden p-2 md:p-3 bg-white rounded-xl shadow-md text-[#6366F1] active:scale-95 transition-transform"><Menu size={24} /></button>
          </div>
        </nav>
      </header>

      {/* --- MOBILE OVERLAY MENU --- */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-0 z-[200] bg-white p-8 flex flex-col">
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100">
                  <img src={LogoImg.src} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-xl font-black text-[#6366F1]">MENU</span>
              </div>
              <button onClick={() => setMobileMenu(false)} className="p-2 bg-slate-100 rounded-full"><X /></button>
            </div>
            <div className="flex flex-col gap-6">
              <Link href="/" className="text-3xl font-black" onClick={() => setMobileMenu(false)}>HOME</Link>
              <Link href="/about" className="text-3xl font-black" onClick={() => setMobileMenu(false)}>ABOUT</Link>
              <Link href="/admission" className="text-3xl font-black" onClick={() => setMobileMenu(false)}>ADMISSION</Link>
              <Link href="/academics" className="text-3xl font-black" onClick={() => setMobileMenu(false)}>ACADEMICS</Link>
              <Link href="/contact" className="text-3xl font-black" onClick={() => setMobileMenu(false)}>CONTACT</Link>
            </div>
            <Link href="/apply" className="mt-auto bg-[#6366F1] text-white py-6 rounded-3xl text-center font-black uppercase tracking-widest shadow-xl">Apply Now 2025</Link>
          </motion.div>
        )}
      </AnimatePresence>


      {/* --- HERO SECTION --- */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-slate-900">
        <img 
          src="https://images.unsplash.com/photo-1523050853051-f750c7582ef7?q=80&w=2070" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale"
          alt="Campus"
        />
        <div className="relative z-10 text-center space-y-4 px-6">
          <span className="text-[#6366F1] font-black tracking-[0.5em] uppercase text-[10px] block">Admissions 2025-26</span>
          <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-none">
            Join the <br /> <span className="text-[#6366F1]">Legacy.</span>
          </h1>
          <p className="text-slate-300 max-w-lg mx-auto font-medium italic">
            Your journey towards academic excellence and character building begins here. 
          </p>
        </div>
      </section>

      {/* --- THE PROCESS (3-STEP JOURNEY) --- */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">The Enrollment Path</h2>
            <div className="w-20 h-1 bg-[#6366F1] mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: FileText, title: "Inquiry", desc: "Submit an online inquiry or visit our campus for a personalized tour." },
              { icon: ClipboardCheck, title: "Assessment", desc: "A friendly interaction/test to understand the student's current level." },
              { icon: Calendar, title: "Finalization", desc: "Document verification and fee submission to secure the seat." }
            ].map((step, i) => (
              <div key={i} className="relative p-10 bg-white rounded-[3rem] shadow-xl border border-slate-100 group hover:border-[#6366F1] transition-all">
                <div className="absolute -top-6 -left-6 w-16 h-16 bg-[#6366F1] text-white rounded-2xl flex items-center justify-center font-black text-2xl italic">
                  0{i + 1}
                </div>
                <step.icon size={40} className="text-[#6366F1] mb-6" />
                <h3 className="text-2xl font-black uppercase italic text-slate-900 mb-4">{step.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEE STRUCTURE (EDITORIAL TABLE) --- */}
      <section className="py-32 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <h2 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900">Fee <br/><span className="text-[#6366F1]">Structure.</span></h2>
            <button className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-[#6366F1] transition-all">
              <Download size={16} /> Download Full PDF
            </button>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-100 shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-8 font-black uppercase italic tracking-widest text-xs">Grade Level</th>
                  <th className="p-8 font-black uppercase italic tracking-widest text-xs">Annual Tuition</th>
                  <th className="p-8 font-black uppercase italic tracking-widest text-xs">Admission Fee</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 font-bold">
                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-8 italic">Primary (Grade 1-5)</td>
                  <td className="p-8 text-[#6366F1]">₹45,000</td>
                  <td className="p-8">₹5,000</td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-8 italic">Middle School (Grade 6-8)</td>
                  <td className="p-8 text-[#6366F1]">₹55,000</td>
                  <td className="p-8">₹5,000</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-8 italic">High School (Grade 9-12)</td>
                  <td className="p-8 text-[#6366F1]">₹65,000</td>
                  <td className="p-8">₹5,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* --- REGISTRATION FORM --- */}
      <section className="py-32 bg-[#FDF8F6]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div className="space-y-8">
            <span className="text-[#6366F1] font-black uppercase tracking-widest text-xs">Apply Now</span>
            <h2 className="text-6xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
              Start Your <br />Application.
            </h2>
            <p className="text-slate-500 text-lg italic font-medium">
              Fill out this form and our admissions counselor will reach out within 24 hours.
            </p>
            <div className="space-y-4">
               {['Birth Certificate', 'Transfer Certificate', 'Previous Report Card', '4 Passport Photos'].map((item, i) => (
                 <div key={i} className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                   <CheckCircle2 size={18} className="text-[#6366F1]" /> {item}
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-white p-12 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(99,102,241,0.1)] border border-slate-100">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Student Name</label>
                  <input type="text" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#6366F1] outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Grade Applying For</label>
                  <select className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#6366F1] outline-none transition-all appearance-none">
                    <option>Select Grade</option>
                    <option>Grade 1-5</option>
                    <option>Grade 6-10</option>
                    <option>Grade 11-12</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Parent Phone Number</label>
                <input type="tel" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#6366F1] outline-none transition-all" />
              </div>
              <button className="w-full bg-[#6366F1] text-white py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-900 transition-all flex items-center justify-center gap-4">
                Submit Inquiry <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );

}
  function NavItem({ label, href = "#", active, isScrolled }) {
  return <Link href={href} className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-[#6366F1]' : (isScrolled ? 'text-slate-700' : 'text-white')} hover:text-[#6366F1]`}>{label}</Link>;
}

function NavDropdown({ label, href, items, isScrolled }) {
  return (
    <div className="relative group cursor-pointer">
      <Link href={href || "#"}>
        <div className={`flex items-center gap-1 text-[11px] font-black uppercase tracking-widest ${isScrolled ? 'text-slate-700' : 'text-white'} group-hover:text-[#6366F1]`}>
          {label} <ChevronDown size={14} />
        </div>
      </Link>

      <div className="absolute top-full left-0 hidden group-hover:block pt-4 z-50 min-w-[200px]">
        <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-50 flex flex-col gap-1">
          {items.map((item, i) => (
            /* Using <a> instead of <Link> for sub-items makes anchor jumping 100% reliable */
            <a 
              key={i} 
              href={item.link} 
              className="text-[10px] font-black uppercase text-slate-500 hover:text-[#6366F1] hover:bg-slate-50 p-3 rounded-xl transition-all"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

