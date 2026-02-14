"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../../images/logo.jpg';
import { 
  Quote, ChevronDown, ArrowRight, Menu, X, Facebook, Instagram, Twitter, 
  Mail, Phone, MapPin, ArrowUpRight, CheckCircle2, Award
} from 'lucide-react';

export default function DirectorDesk() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

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
    window.addEventListener('scroll', handleScroll);
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
    <div className="bg-white text-slate-900 antialiased overflow-x-hidden font-sans">
      
      {/* --- 1. FULL HEADER & NAVIGATION --- */}
      <header className="fixed w-full z-[100]">
        <div className={`hidden xl:block border-b transition-all duration-500 ${
          isScrolled ? 'bg-slate-900 border-white/5 py-1' : 'bg-black/40 backdrop-blur-md border-white/10 py-2'
        }`}>
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-white">
            <div className="flex gap-8 items-center">
              <a href={`tel:${data?.phone}`} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#6366F1]">
                <Phone size={12} className="text-[#6366F1]" />
                <span>{data?.phone || "+91 (141) 2345-678"}</span>
              </a>
              <a href={`mailto:${data?.email}`} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#6366F1]">
                <Mail size={12} className="text-[#6366F1]" />
                <span>{data?.email || "info@mvgacademy.edu"}</span>
              </a>
            </div>
            <div className="flex gap-4 items-center border-l border-white/20 pl-6">
                <Facebook size={14} className="hover:text-[#6366F1] cursor-pointer" />
                <Instagram size={14} className="hover:text-[#6366F1] cursor-pointer" />
            </div>
          </div>
        </div>

        <nav className={`transition-all duration-500 ${isScrolled ? 'bg-white py-3 shadow-xl' : 'bg-transparent py-6'}`}>
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl shadow-md p-1 border border-slate-100 flex items-center justify-center">
                <img src={LogoImg.src} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className={`text-xl font-black uppercase tracking-tighter ${isScrolled ? 'text-slate-900' : 'text-white'}`}>
                  {data?.schoolName || "MVG Academy"}
                </span>
                <span className="text-[9px] font-black text-[#6366F1] tracking-[0.3em]">JAIPUR</span>
              </div>
            </Link>

            <div className="hidden xl:flex items-center gap-2">
              <NavItem label="Home" href="/" isScrolled={isScrolled} />
              <NavDropdown label="About Us" isScrolled={isScrolled} items={[
                { label: 'About School', link: '/About' },
                { label: 'History', link: '/About/history' },
                { label: 'Our Mission', link: '/About/mission' },
                { label: 'Our Vision', link: '/About/vision' },
                { label: "Director's Desk", link: '/About/director' },
                { label: 'Our AIM', link: '/About/aim' },
                { label: 'Faculties', link: '/About/faculty' },
              ]} />
              <NavDropdown label="Academics" isScrolled={isScrolled} items={[
                { label: 'Robotics', link: '/academics/robotics' },
                { label: 'Visual Art', link: '/academics/visual-art' },
                { label: 'Cultural', link: '/academics/cultural' },
                { label: 'Awards', link: '/About/awards' },
              ]} />
              <NavDropdown label="Admission" isScrolled={isScrolled} items={[
                { label: 'Apply Now', link: '/apply' },
                { label: 'Admission Enquiry', link: '/admission/enquiry' },
                { label: 'Fee Structure', link: '/admission/fees' },
                { label: 'Admission Criteria', link: '/admission/criteria' },
                { label: 'Why Choose MVG?', link: '/About/why-us' },
              ]} />
              <NavDropdown label="Gallery" isScrolled={isScrolled} items={[
                { label: 'Events', link: '/gallery/events' },
                { label: 'School Gallery', link: '/gallery' },
                { label: 'In the News', link: '/gallery/news' },
              ]} />
              <NavItem label="Contact" href="/contact" isScrolled={isScrolled} />
              <Link href="/apply" className="ml-4 bg-[#6366F1] text-white px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all">Apply Now!</Link>
            </div>

            <button onClick={() => setMobileMenu(true)} className={`xl:hidden p-3 rounded-xl shadow-md ${isScrolled ? 'bg-slate-100 text-slate-900' : 'bg-white text-[#6366F1]'}`}>
              <Menu size={20} />
            </button>
          </div>
        </nav>
      </header>

      {/* --- MOBILE OVERLAY --- */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 z-[300] bg-white flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">Navigation</span>
              <button onClick={() => setMobileMenu(false)} className="p-3 bg-slate-100 rounded-full text-slate-900"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <MobileNavItem label="Home" href="/" setMobileMenu={setMobileMenu} />
              <MobileNavItem label="Director's Message" href="/About/director" setMobileMenu={setMobileMenu} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 2. DIRECTOR HERO (DARK THEME FOR VISIBILITY) --- */}
      <section className="relative min-h-[60vh] flex items-center bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
           <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069" className="w-full h-full object-cover" alt="Desk background" />
           <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 to-slate-950" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full pt-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-[#6366F1] font-black tracking-[0.4em] uppercase text-xs mb-6 block">Leadership</span>
            <h1 className="text-5xl md:text-8xl font-black uppercase text-white tracking-tighter leading-none">
              Director's <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">Desk</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* --- 3. MAIN MESSAGE CONTENT --- */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            {/* Image Side */}
            <div className="lg:col-span-5 sticky top-32">
              <div className="relative">
                <div className="aspect-[4/5] bg-slate-100 rounded-[3rem] overflow-hidden shadow-2xl group">
                  <img 
                    src="https://res.cloudinary.com/db6ssceun/image/upload/v1766668773/DSC_1002_zazos5.jpg" 
                    className="w-full h-full object-cover  group-hover:grayscale-0 transition-all duration-1000" 
                    alt="Director Portrait" 
                  />
                </div>
                {/* Floating Badge */}
                <div className="absolute -bottom-10 -right-6 bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-50 max-w-[200px]">
                    <Quote size={32} className="text-[#6366F1] mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-tight">Empowering students through innovation.</p>
                </div>
              </div>
            </div>

            {/* Text Side */}
            <div className="lg:col-span-7 space-y-12">
              <div>
                <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6">Message from the  <span className="text-[#6366F1]">Director</span></h2>
                <div className="h-1.5 w-24 bg-[#6366F1] mb-10" />
                <div className="prose prose-lg text-slate-600 font-medium space-y-6">
                    <p className="text-xl leading-relaxed text-slate-800">"Education is the foundation upon which strong individuals and responsible societies are built. Our school was established with a deep commitment to nurturing young minds with knowledge, values, and discipline.

A significant milestone in our journey came in 2010, when we transformed our institution into a complete English-medium school. This decision was driven by a clear vision—to prepare our students for a rapidly changing world while preserving the moral and cultural values that define us.

Since then, we have continuously worked towards improving academic standards, modernizing infrastructure, and adopting innovative teaching methodologies. Our focus has always been on holistic development—academic excellence, character building, confidence, and lifelong learning.

I firmly believe that every child has unique potential. We strive to provide a nurturing environment where students can grow into capable, confident, and responsible citizens.

I welcome you to be a part of our journey as we continue to shape the future through quality education.</p>
                </div>
              </div>

              <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
                <h4 className="text-2xl font-black uppercase italic tracking-tighter">KEDAR MAL JAT</h4>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6366F1] mb-6">Director & Founder</p>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest"><Award size={16}/> B.A,B.Ed</div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest"><Award size={16}/> 25+ Years Experience</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 4. FOOTER --- */}
      <footer className="bg-white border-t border-slate-100 pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="space-y-6">
              <div className="text-2xl font-black tracking-tighter uppercase italic">{data?.schoolName || "MVG ACADEMY"}</div>
              <p className="text-slate-500 text-sm font-medium">Shaping leaders and innovators since 1998.</p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-[#6366F1] hover:text-white transition-all"><Facebook size={18} /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-[#6366F1] hover:text-white transition-all"><Instagram size={18} /></a>
              </div>
            </div>

            <div>
              <h4 className="font-black uppercase tracking-widest text-xs mb-8 text-slate-400">Useful Links</h4>
              <ul className="space-y-4 text-sm font-bold uppercase text-slate-500">
                <li><Link href="/About/history" className="hover:text-[#6366F1]">Our History</Link></li>
                <li><Link href="/admission" className="hover:text-[#6366F1]">Admission Process</Link></li>
                <li><Link href="/apply" className="hover:text-[#6366F1]">Online Application</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black uppercase tracking-widest text-xs mb-8 text-slate-400">Campus</h4>
              <ul className="space-y-4 text-sm font-bold uppercase text-slate-500">
                <li><Link href="/gallery" className="hover:text-[#6366F1]">Virtual Tour</Link></li>
                <li><Link href="/academics/robotics" className="hover:text-[#6366F1]">Robotics Lab</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-black uppercase tracking-widest text-xs mb-8 text-slate-400">Location</h4>
              <div className="flex items-start gap-4 text-sm font-medium text-slate-600">
                <MapPin size={20} className="text-[#6366F1] shrink-0" />
                <p>{data?.address || "123 Education Lane, Jaipur"}</p>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
                <Phone size={20} className="text-[#6366F1] shrink-0" />
                <p>{data?.phone || "+91 (141) 2345-678"}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
            <p>© 2025 {data?.schoolName || "MVG ACADEMY"}.</p>
            <p>Jaipur, India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- SHARED UI COMPONENTS ---
function NavItem({ label, href, isScrolled }) {
  return (
    <Link href={href} className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors hover:text-[#6366F1] ${
      isScrolled ? 'text-slate-600' : 'text-white'
    }`}>{label}</Link>
  );
}

function NavDropdown({ label, items, isScrolled }) {
  return (
    <div className="relative group px-4 py-2 cursor-pointer">
      <div className={`flex items-center gap-1 text-[11px] font-black uppercase tracking-widest group-hover:text-[#6366F1] transition-colors ${
        isScrolled ? 'text-slate-600' : 'text-white'
      }`}>{label} <ChevronDown size={12} className="group-hover:rotate-180 transition-transform" /></div>
      <div className="absolute top-full left-0 pt-4 opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
        <div className="bg-white min-w-[240px] shadow-2xl rounded-2xl border border-slate-50 p-3 grid gap-1">
          {items.map((item, idx) => (
            <Link key={idx} href={item.link} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-[#6366F1] transition-all">
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              <ArrowRight size={12} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileNavItem({ label, href, setMobileMenu }) {
  return (
    <Link href={href} onClick={() => setMobileMenu(false)} className="py-5 border-b border-slate-50 block">
      <span className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">{label}</span>
    </Link>
  );
}