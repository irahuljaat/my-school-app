"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../../images/logo.jpg';
import { 
  Target, Rocket, Heart, ShieldCheck, ChevronDown, ArrowRight,
  GraduationCap, Menu, X, Facebook, Instagram, Twitter, 
  Mail, Phone, MapPin, ArrowUpRight, CheckCircle2
} from 'lucide-react';

export default function MissionPage() {
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

  const coreValues = [
    {
      title: "Intellectual Growth",
      desc: "Cultivating a thirst for knowledge that goes beyond textbooks and examinations.",
      icon: Target,
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "Ethical Integrity",
      desc: "Instilling values of honesty, respect, and responsibility in every student.",
      icon: ShieldCheck,
      color: "bg-emerald-50 text-emerald-600"
    },
    {
      title: "Global Citizenship",
      desc: "Preparing students to lead and serve in an increasingly interconnected world.",
      icon: Rocket,
      color: "bg-purple-50 text-purple-600"
    }
  ];

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="bg-[#FDFBF9] text-slate-900 antialiased overflow-x-hidden font-sans">
      
      {/* --- 1. SHARED HEADER --- */}
      <header className="fixed w-full z-[100]">
        <div className={`hidden xl:block border-b transition-all duration-500 ${
          isScrolled ? 'bg-slate-900 border-white/5 py-1' : 'bg-black/20 backdrop-blur-md border-white/10 py-2'
        }`}>
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-white/90">
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
                { label: 'Apply for 2026-27', link: '/apply' },
                { label: 'Admission Enquiry', link: '/admission/enquiry' },
                { label: 'How to Apply?', link: '/admission/process' },
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

            <button onClick={() => setMobileMenu(true)} className="xl:hidden p-3 bg-white rounded-xl shadow-md text-[#6366F1]"><Menu size={20} /></button>
          </div>
        </nav>
      </header>

      {/* --- MOBILE MENU --- */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 z-[300] bg-white flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">Navigation</span>
              <button onClick={() => setMobileMenu(false)} className="p-3 bg-slate-100 rounded-full text-slate-900"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <MobileNavItem label="Home" href="/" setMobileMenu={setMobileMenu} />
              <MobileNavDropdown label="About Us" items={[{ label: 'About School', link: '/About' }, { label: 'History', link: '/About/history' }, { label: 'Our Mission', link: '/About/mission' }, { label: 'Our Vision', link: '/About/vision' }, { label: "Director's Desk", link: '/About/director' }, { label: 'Our AIM', link: '/About/aim' }, { label: 'Faculties', link: '/About/faculty' }]} setMobileMenu={setMobileMenu} />
              <MobileNavItem label="Contact Us" href="/contact" setMobileMenu={setMobileMenu} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 2. MISSION HERO --- */}
      <section className="relative min-h-[60vh] flex items-center bg-slate-950 pt-20">
        <div className="absolute inset-0 opacity-40">
           <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070" className="w-full h-full object-cover" alt="Mission" />
           <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 to-slate-950" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-[#6366F1] font-black tracking-[0.4em] uppercase text-xs mb-6 block">Our Purpose</span>
            <h1 className="text-6xl md:text-8xl font-black uppercase text-white tracking-tighter leading-none mb-8">
              The <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Mission</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* --- 3. MISSION STATEMENT --- */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="w-20 h-2 bg-[#6366F1] mb-10" />
              <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-tight mb-8">
                Empowering every student to <span className="text-[#6366F1]">reach higher</span> and dream bigger.
              </h2>
              <p className="text-xl text-slate-500 font-medium leading-relaxed mb-8">
                Our mission is to provide a nurturing and innovative learning environment that fosters academic excellence, creative expression, and strong moral character.
              </p>
              <ul className="space-y-4">
                {['Innovation in Learning', 'Character Development', 'Community Leadership'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-black uppercase tracking-widest text-xs text-slate-700">
                    <CheckCircle2 size={18} className="text-[#6366F1]" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-[5/5] bg-slate-100 rounded-[3rem] overflow-hidden shadow-2xl">
                <img src="https://res.cloudinary.com/db6ssceun/image/upload/v1766151252/lywz5x0c1sqx5dmsxs0c.jpg" className="w-full h-full object-cover" alt="Student Life" />
              </div>
              <div className="absolute -bottom-10 -left-10 bg-white p-12 rounded-[2.5rem] shadow-xl hidden md:block border border-slate-50">
                <div className="text-4xl font-black text-[#6366F1]">100%</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Commitment to Success</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 4. CORE VALUES --- */}
      <section className="py-32 bg-slate-900 rounded-[4rem] mx-4 md:mx-10 overflow-hidden text-white">
        <div className="max-w-7xl mx-auto px-6 text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4">Core <span className="text-[#6366F1]">Values</span></h2>
          <p className="text-slate-400 font-medium">The pillars that hold our institution together.</p>
        </div>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {coreValues.map((value, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-sm"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${value.color}`}>
                <value.icon size={30} />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4">{value.title}</h3>
              <p className="text-slate-400 font-medium leading-relaxed">{value.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- SHARED FOOTER --- */}
      <footer className="bg-white border-t border-slate-100 pt-24 pb-12 px-6 mt-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="space-y-6">
              <div className="text-2xl font-black tracking-tighter uppercase italic">{data?.schoolName || "MVG ACADEMY"}</div>
              <p className="text-slate-500 text-sm font-medium">Empowering minds and building character since 1998.</p>
              <div className="flex gap-4">
                <a href={data?.facebook} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-[#6366F1] hover:text-white transition-all"><Facebook size={18} /></a>
                <a href={data?.instagram} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-[#6366F1] hover:text-white transition-all"><Instagram size={18} /></a>
              </div>
            </div>
            <div>
              <h4 className="font-black uppercase tracking-widest text-xs mb-8">Navigation</h4>
              <ul className="space-y-4 text-sm font-bold uppercase text-slate-500">
                <li><Link href="/About" className="hover:text-[#6366F1] flex items-center gap-2">About Us <ArrowUpRight size={14}/></Link></li>
                <li><Link href="/admission" className="hover:text-[#6366F1] flex items-center gap-2">Admissions <ArrowUpRight size={14}/></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black uppercase tracking-widest text-xs mb-8">Resources</h4>
              <ul className="space-y-4 text-sm font-bold uppercase text-slate-500">
                <li className="hover:text-[#6366F1] cursor-pointer">Student Login</li>
                <li className="hover:text-[#6366F1] cursor-pointer">Fee Payment</li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="font-black uppercase tracking-widest text-xs mb-2">Get in touch</h4>
              <div className="flex items-start gap-4 text-sm font-medium text-slate-500">
                <MapPin size={20} className="text-[#6366F1] shrink-0" />
                <p>{data?.address || "123 Education Lane, Vidhyadhar Nagar, Jaipur"}</p>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                <Phone size={20} className="text-[#6366F1] shrink-0" />
                <p>{data?.phone || "+91 (141) 2345-678"}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-300">
            <p>© 2025 {data?.schoolName || "MVG ACADEMY"}. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- SUB COMPONENTS (KEEP THESE AT BOTTOM) ---
function NavItem({ label, href, isScrolled }) {
  return (
    <Link href={href} className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors hover:text-[#6366F1] ${
      isScrolled ? 'text-slate-600' : 'text-white/80'
    }`}>{label}</Link>
  );
}

function NavDropdown({ label, items, isScrolled }) {
  return (
    <div className="relative group px-4 py-2 cursor-pointer">
      <div className={`flex items-center gap-1 text-[11px] font-black uppercase tracking-widest group-hover:text-[#6366F1] transition-colors ${
        isScrolled ? 'text-slate-600' : 'text-white/80'
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
    <Link href={href} onClick={() => setMobileMenu(false)} className="py-5 border-b border-slate-50 block font-black uppercase italic tracking-tighter text-2xl text-slate-900">{label}</Link>
  );
}

function MobileNavDropdown({ label, items, setMobileMenu }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-50">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center py-5 text-left font-black uppercase italic tracking-tighter text-2xl text-slate-900">
        {label} <ChevronDown size={20} className={`text-[#6366F1] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden flex flex-col gap-2 pb-4 pl-4 border-l-2 border-[#6366F1]/20 ml-2">
            {items.map((item, idx) => (
              <Link key={idx} href={item.link} onClick={() => setMobileMenu(false)} className="py-2 text-slate-500 font-bold uppercase tracking-widest text-[10px]">{item.label}</Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}