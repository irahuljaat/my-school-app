"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../../images/logo.jpg';
import { 
  Menu, X, Facebook, Instagram, ChevronDown, 
  ArrowUpRight, Cpu, Bot, Rocket, ShieldCheck, 
  Lightbulb, Zap, ArrowRight, Cog, Phone, Mail, MapPin, Globe, Microscope, Atom
} from 'lucide-react';

export default function RoboticsAndModernScience() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeMobileSub, setActiveMobileSub] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) setData(docSnap.data());
      setLoading(false);
    });
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => { unsub(); window.removeEventListener('scroll', handleScroll); };
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white italic font-light tracking-widest text-slate-400 uppercase text-[10px]">Preparing Future Scientists...</div>;

  return (
    <div className="bg-white text-[#1a1a1a] antialiased selection:bg-[#6366F1] selection:text-white">
      
      {/* --- 1. TOP CONTACT BAR --- */}
      <div className="hidden lg:block bg-[#0a0a0a] text-slate-400 py-3 relative z-[110]">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em]">
          <div className="flex gap-8">
            <span className="flex items-center gap-2 hover:text-white transition-colors"><Phone size={12} className="text-[#6366F1]" /> {data?.phone || "+91 141 2345678"}</span>
            <span className="flex items-center gap-2 hover:text-white transition-colors"><Mail size={12} className="text-[#6366F1]" /> {data?.email || "info@mvgacademy.com"}</span>
          </div>
          <div className="flex gap-6 items-center">
            <span className="flex items-center gap-2"><MapPin size={12} className="text-[#6366F1]" /> Jaipur, India</span>
            <div className="flex gap-4 border-l border-white/10 pl-6">
              <Facebook size={14} className="hover:text-[#6366F1] cursor-pointer transition-colors" />
              <Instagram size={14} className="hover:text-[#6366F1] cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* --- 2. HEADER --- */}
      <header className={`fixed w-full z-[100] transition-all duration-700 ${isScrolled ? 'top-0 py-4 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm' : 'lg:top-10 py-8 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 overflow-hidden">
                <img src={LogoImg.src} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className={`text-lg font-bold tracking-tight transition-colors duration-500 ${isScrolled ? 'text-slate-900' : 'text-white'}`}>{data?.schoolName || "MVG Public School"}</span>
              <span className="text-[9px] font-medium tracking-[0.4em] text-[#6366F1] uppercase">Innovation Hub</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-2">
            <NavItem label="Home" href="/" isScrolled={isScrolled} />
            <NavDropdown label="Academics" isScrolled={isScrolled} items={[{ label: 'Robotics & AI', link: '/academics/robotics' }, { label: 'Faculty', link: '/About/faculty' }]} />
            <NavItem label="Careers" href="/About/faculty#careers" isScrolled={isScrolled} />
            <Link href="/apply" className="ml-6 bg-[#6366F1] text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100">Admission 2025</Link>
          </div>

          <button onClick={() => setMobileMenu(true)} className={`lg:hidden p-2 ${isScrolled ? 'text-slate-900' : 'text-white'}`}><Menu size={24} /></button>
        </div>
      </header>

      {/* --- 3. MOBILE MENU --- */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 z-[200] bg-white flex flex-col">
            <div className="p-8 flex justify-between items-center border-b border-slate-50">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6366F1]">Menu</div>
              <button onClick={() => setMobileMenu(false)} className="p-2 bg-slate-50 rounded-full"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              <MobileLink label="Home" href="/" setMobileMenu={setMobileMenu} />
              <MobileLink label="Robotics & AI" href="/academics/robotics" setMobileMenu={setMobileMenu} />
              <MobileLink label="Faculty" href="/About/faculty" setMobileMenu={setMobileMenu} />
              <MobileLink label="Contact" href="/contact" setMobileMenu={setMobileMenu} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 4. HERO: THE VISION --- */}
      <section className="relative h-[80vh] flex items-center bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2070" className="w-full h-full object-cover opacity-30 grayscale" alt="Student with Robot" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-8 relative z-10 w-full">
          <div className="max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <span className="text-[#6366F1] text-[11px] font-bold uppercase tracking-[0.5em] mb-6 block">Beyond the Classroom</span>
              <h1 className="text-5xl md:text-8xl font-bold text-white tracking-tighter leading-[0.95] mb-8">
                Coding the <br/>Future with <span className="italic font-light text-slate-400">AI & Science.</span>
              </h1>
              <p className="text-slate-400 text-lg md:text-xl font-light leading-relaxed mb-10">
                At MVG Academy, students don't just read about technology—they build it. We integrate Modern Science with Robotics and Artificial Intelligence to turn curiosity into innovation.
              </p>
              
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- 5. THE THREE PILLARS OF LEARNING --- */}
      <section className="py-32 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">
            <LearningPillar 
              icon={<Atom className="text-[#6366F1]" size={32}/>} 
              title="Modern Science" 
              desc="Moving from theory to discovery. Students explore Quantum physics, Space Science, and Advanced Chemistry in a hands-on environment."
            />
            <LearningPillar 
              icon={<Bot className="text-[#6366F1]" size={32}/>} 
              title="Robotics & Engineering" 
              desc="From mechanical gears to automated drones. Our students design, assemble, and pilot their own robotic creations."
            />
            <LearningPillar 
              icon={<Cpu className="text-[#6366F1]" size={32}/>} 
              title="Artificial Intelligence" 
              desc="The language of tomorrow. We teach Machine Learning and Python, allowing students to build software that thinks and evolves."
            />
          </div>
        </div>
      </section>

      {/* --- 6. "THE STUDENT JOURNEY" SECTION --- */}
      <section className="py-24 px-8 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
             <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl">
                <img src="https://res.cloudinary.com/db6ssceun/image/upload/v1766668550/WhatsApp_Image_2025-12-25_at_18.45.22_sdgubl.jpg" className="w-full h-full object-cover grayscale md:grayscale-0 lg:grayscale hover:grayscale-0 transition-all duration-700" alt="Students working" />
             </div>
             <div className="absolute -bottom-8 -left-8 bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 hidden md:block">
                <span className="text-[4rem] font-bold tracking-tighter text-[#6366F1] leading-none">95%</span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">Practical Learning Ratio</p>
             </div>
          </div>
          <div className="space-y-10">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">How our students <br/>evolve.</h2>
            <div className="space-y-8">
               <Step num="Phase 01" title="Conceptual Curiosity" desc="Students are introduced to the logic of physics and the mechanics of modern technology." />
               <Step num="Phase 02" title="The Build" desc="Using our state-of-the-art lab, students begin prototyping hardware using 3D printing and circuits." />
               <Step num="Phase 03" title="Intelligence Integration" desc="Code meets Hardware. Students apply AI algorithms to make their robots perform complex tasks." />
            </div>
          </div>
        </div>
      </section>

      {/* --- 7. COMPLETE FOOTER --- */}
      <footer className="bg-white pt-32 pb-12 px-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
            <div className="space-y-8">
                <div className="text-xl font-bold tracking-tighter italic uppercase text-[#6366F1]">MVG ACADEMY</div>
                <p className="text-slate-400 font-light text-sm max-w-xs leading-relaxed">Providing a sanctuary for innovation and academic rigor in the heart of Jaipur since 1998.</p>
            </div>
            <div className="flex gap-20">
                <FooterGroup title="Hub" items={['Robotics Lab', 'Science Lab', 'Innovation']} />
                <FooterGroup title="Connect" items={['Instagram', 'Facebook', 'LinkedIn']} />
            </div>
            <div className="lg:text-right space-y-4">
                <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300">Headquarters</h5>
                <p className="text-xs font-bold text-slate-600 leading-loose">Sector 4, Jaipur Main Road<br/>Rajasthan, India</p>
            </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-bold uppercase tracking-[0.4em] text-slate-300">
            <span>© 2025 MVG ACADEMY - ALL RIGHTS RESERVED</span>
            <span>Est. 1998</span>
        </div>
      </footer>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function LearningPillar({ icon, title, desc }) {
  return (
    <div className="space-y-6 group">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:bg-[#6366F1] group-hover:text-white transition-all duration-500">
        {icon}
      </div>
      <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
      <p className="text-slate-500 font-light leading-relaxed text-sm">{desc}</p>
    </div>
  );
}

function Step({ num, title, desc }) {
  return (
    <div className="flex gap-6 group cursor-default">
      <span className="text-[10px] font-black text-[#6366F1] uppercase tracking-[0.3em] pt-1">{num}</span>
      <div>
        <h4 className="text-lg font-bold tracking-tight mb-2 group-hover:text-[#6366F1] transition-colors">{title}</h4>
        <p className="text-slate-400 font-light text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function NavItem({ label, href, isScrolled }) {
  return <Link href={href} className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest hover:text-[#6366F1] transition-colors ${isScrolled ? 'text-slate-600' : 'text-white'}`}>{label}</Link>;
}

function NavDropdown({ label, items, isScrolled }) {
  return (
    <div className="relative group px-4 py-2 cursor-pointer">
      <div className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest group-hover:text-[#6366F1] transition-colors ${isScrolled ? 'text-slate-600' : 'text-white'}`}>
        {label} <ChevronDown size={10} className="group-hover:rotate-180 transition-transform duration-300" />
      </div>
      <div className="absolute top-full left-0 pt-6 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
        <div className="bg-white min-w-[200px] shadow-2xl rounded-2xl border border-slate-50 p-2">
          {items.map((it, i) => <Link key={i} href={it.link} className="block px-4 py-3 rounded-xl hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#6366F1] transition-all">{it.label}</Link>)}
        </div>
      </div>
    </div>
  );
}

function MobileLink({ label, href, setMobileMenu }) {
  return <Link href={href} onClick={() => setMobileMenu(false)} className="block p-4 text-xl font-bold tracking-tighter uppercase italic text-slate-900 border-b border-slate-50">{label}</Link>;
}

function FooterGroup({ title, items }) {
  return (
    <div className="space-y-6">
      <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300">{title}</h5>
      <ul className="space-y-3 text-xs font-bold text-slate-500 uppercase tracking-widest">{items.map((it, i) => <li key={i} className="hover:text-[#6366F1] transition-colors cursor-pointer">{it}</li>)}</ul>
    </div>
  );
}