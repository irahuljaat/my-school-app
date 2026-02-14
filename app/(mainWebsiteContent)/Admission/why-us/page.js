"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../../images/logo.jpg';
import { 
  Menu, X, Facebook, Instagram, ChevronDown, 
  ArrowUpRight, ShieldCheck, Zap, ArrowRight, 
  Phone, Mail, MapPin, Globe, Award, Target, Heart, 
  Users, Sparkles, BookOpen
} from 'lucide-react';

export default function WhyChooseMVG() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) setData(docSnap.data());
      setLoading(false);
    });
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => { unsub(); window.removeEventListener('scroll', handleScroll); };
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white italic font-light tracking-widest text-slate-400 uppercase text-[10px]">Defining Excellence...</div>;

  return (
    <div className="bg-white text-[#1a1a1a] antialiased selection:bg-[#6366F1] selection:text-white">
      
      {/* --- 1. TOP CONTACT BAR --- */}
      <div className="hidden lg:block bg-[#0a0a0a] text-slate-400 py-3 relative z-[110]">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em]">
          <div className="flex gap-8">
            <span className="flex items-center gap-2 hover:text-white transition-colors"><Phone size={12} className="text-[#6366F1]" /> {data?.phone || "+91 141 2345678"}</span>
            <span className="flex items-center gap-2 hover:text-white transition-colors"><Mail size={12} className="text-[#6366F1]" /> admissions@mvgacademy.com</span>
          </div>
          <div className="flex gap-6 items-center">
            <span className="flex items-center gap-2"><MapPin size={12} className="text-[#6366F1]" /> Jaipur, Rajasthan</span>
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
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 overflow-hidden shadow-sm">
                <img src={LogoImg.src} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className={`text-lg font-bold tracking-tight transition-colors duration-500 ${isScrolled ? 'text-slate-900' : 'text-white'}`}>{data?.schoolName || "MVG Academy"}</span>
              <span className="text-[9px] font-medium tracking-[0.4em] text-[#6366F1] uppercase tracking-widest">Est. 1998</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-2">
            <NavItem label="Home" href="/" isScrolled={isScrolled} />
            <NavDropdown label="About" isScrolled={isScrolled} items={[{ label: 'Our Philosophy', link: '/about' }, { label: 'Why MVG', link: '/why-mvg' }, { label: 'Faculty', link: '/faculty' }]} />
            <NavItem label="Admissions" href="/admission" isScrolled={isScrolled} />
            <Link href="/admission" className="ml-6 bg-[#6366F1] text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-slate-900 transition-all">Apply Now</Link>
          </div>

          <button onClick={() => setMobileMenu(true)} className={`lg:hidden p-2 ${isScrolled ? 'text-slate-900' : 'text-white'}`}><Menu size={24} /></button>
        </div>
      </header>

      {/* --- 3. HERO: THE CORE PROMISE --- */}
      <section className="relative h-[85vh] flex items-center bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1524178232363-1fb28f74b553?q=80&w=2070" className="w-full h-full object-cover opacity-40 grayscale" alt="Excellence" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-[#0a0a0a]" />
        </div>
        <div className="max-w-7xl mx-auto px-8 relative z-10 w-full text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }}>
            <span className="text-[#6366F1] text-[11px] font-bold uppercase tracking-[0.6em] mb-8 block">The MVG Distinction</span>
            <h1 className="text-6xl md:text-[9rem] font-bold text-white tracking-tighter leading-[0.85] mb-12">
              Choosing <br/><span className="italic font-light text-slate-500">Excellence.</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed mb-12">
              We provide more than an education; we provide a sanctuary where academic rigor meets modern innovation to build Jaipur's future leaders.
            </p>
            <div className="flex justify-center">
                <div className="animate-bounce p-3 border border-white/10 rounded-full">
                    <ArrowRight size={20} className="text-white rotate-90" />
                </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- 4. THE FOUR PILLARS --- */}
      <section className="py-32 px-8 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <PillarCard 
              icon={<ShieldCheck size={32} className="text-[#6366F1]"/>}
              title="Academic Legacy"
              desc="With 25+ years of experience, we blend traditional discipline with world-class curriculum."
            />
            <PillarCard 
              icon={<Sparkles size={32} className="text-[#6366F1]"/>}
              title="Holistic Growth"
              desc="Focusing on EQ (Emotional Intelligence) alongside IQ through sports, arts, and leadership."
            />
            <PillarCard 
              icon={<Users size={32} className="text-[#6366F1]"/>}
              title="Expert Mentors"
              desc="Our faculty aren't just teachers; they are subject matter experts dedicated to student success."
            />
            <PillarCard 
              icon={<Target size={32} className="text-[#6366F1]"/>}
              title="Future Ready"
              desc="From AI labs to public speaking, we prepare students for the demands of the 21st century."
            />
          </div>
        </div>
      </section>

      {/* --- 5. INTERACTIVE VALUE SECTION --- */}
      <section className="py-24 px-8 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-12">
            <div className="space-y-4">
                <span className="text-[#6366F1] text-[10px] font-bold uppercase tracking-widest">Our Environment</span>
                <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9]">Why students <br/>thrive here.</h2>
            </div>
            
            <div className="space-y-10">
                <ValueItem title="Safety & Security" desc="A zero-tolerance campus with 24/7 CCTV surveillance and verified staff." />
                <ValueItem title="Innovation Labs" desc="Fully equipped Robotics and Science labs to turn concepts into physical reality." />
                <ValueItem title="Global Standards" desc="Curriculum inspired by international benchmarks while staying rooted in Indian values." />
            </div>
          </div>

          <div className="relative group">
              <div className="aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070" className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-105" alt="Student Life" />
              </div>
              <div className="absolute -bottom-10 -right-10 bg-[#6366F1] p-12 rounded-[3rem] text-white shadow-2xl hidden md:block">
                  <span className="text-6xl font-bold block mb-2">100%</span>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">University Placement Record</p>
              </div>
          </div>
        </div>
      </section>

      {/* --- 6. STATS / TRUST --- */}
      <section className="py-32 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                <Stat num="25+" label="Years of Excellence" />
                <Stat num="15:1" label="Student-Teacher Ratio" />
                <Stat num="50+" label="Sports & Club Activities" />
                <Stat num="5k+" label="Successful Alumni" />
            </div>
        </div>
      </section>

      {/* --- 7. FINAL FOOTER --- */}
      <footer className="bg-[#0a0a0a] text-white pt-32 pb-12 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 md:col-span-2 space-y-8">
                <div className="text-2xl font-bold tracking-tighter italic uppercase text-[#6366F1]">MVG ACADEMY</div>
                <p className="text-slate-500 font-light text-sm max-w-sm leading-relaxed">Join the most progressive educational community in Jaipur. Admissions for the academic year 2025-26 are now open.</p>
                <div className="flex gap-4">
                    <Facebook size={18} className="hover:text-[#6366F1] cursor-pointer" />
                    <Instagram size={18} className="hover:text-[#6366F1] cursor-pointer" />
                </div>
            </div>
            <div>
                <FooterGroup title="Explore" items={['About Us', 'Why MVG', 'Curriculum', 'Faculty']} />
            </div>
            <div>
                <FooterGroup title="Admissions" items={['Admission Criteria', 'Fee Structure', 'Apply Online', 'Scholarships']} />
            </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 border-t border-white/5 flex justify-between items-center text-[9px] font-bold uppercase tracking-[0.4em] text-slate-600">
            <span>© 2025 MVG ACADEMY JAIPUR</span>
            <span className="text-[#6366F1]">Designed for the Future</span>
        </div>
      </footer>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function PillarCard({ icon, title, desc }) {
    return (
        <div className="p-10 border border-slate-100 rounded-[2.5rem] hover:bg-slate-50 transition-all duration-500 group">
            <div className="mb-6 group-hover:scale-110 transition-transform">{icon}</div>
            <h3 className="text-xl font-bold mb-4">{title}</h3>
            <p className="text-slate-500 text-sm font-light leading-relaxed">{desc}</p>
        </div>
    );
}

function ValueItem({ title, desc }) {
    return (
        <div className="flex gap-6 group">
            <div className="pt-1"><Zap size={20} className="text-[#6366F1] opacity-30 group-hover:opacity-100 transition-opacity"/></div>
            <div>
                <h4 className="text-lg font-bold mb-1">{title}</h4>
                <p className="text-slate-400 text-sm font-light">{desc}</p>
            </div>
        </div>
    );
}

function Stat({ num, label }) {
    return (
        <div>
            <div className="text-5xl font-bold text-slate-900 mb-2 tracking-tighter">{num}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#6366F1]">{label}</div>
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

function FooterGroup({ title, items }) {
  return (
    <div className="space-y-6">
      <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6366F1]">{title}</h5>
      <ul className="space-y-3 text-xs font-bold text-slate-500 uppercase tracking-widest">{items.map((it, i) => <li key={i} className="hover:text-white transition-colors cursor-pointer">{it}</li>)}</ul>
    </div>
  );
}