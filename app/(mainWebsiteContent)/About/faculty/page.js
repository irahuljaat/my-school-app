"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../../images/logo.jpg';
import { 
  Menu, X, Facebook, Instagram, Mail, Phone, MapPin, 
  ChevronDown, ArrowUpRight, GraduationCap, Users, Award, BookOpen, Briefcase, ArrowRight
} from 'lucide-react';

export default function FacultyAndCareersPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeMobileSub, setActiveMobileSub] = useState(null);

  const facultyMembers = [
    { name: "Kedar Mal Jat", role: "Principal ", edu: "Ph.D, M.Sc (Physics)", img: "https://res.cloudinary.com/db6ssceun/image/upload/v1766668773/DSC_1002_zazos5.jpg" },
    { name: "Pusparaj Choudhary", role: "Management Staff", edu: "M.Sc, B.Ed", img: "https://res.cloudinary.com/db6ssceun/image/upload/v1766669135/124_rsixia.jpg" },
    { name: "Nishant Bhardwaj", role: "HOD Mathematics", edu: "M.Tech, B.E", img: "https://res.cloudinary.com/db6ssceun/image/upload/v1766669134/45_jdnae8.jpg" },
    { name: "Rahul Choudhary", role: "Computer Science & AI", edu: "Ph.D, MBBS", img: "https://res.cloudinary.com/db6ssceun/image/upload/v1766669134/874_osiqsv.jpg" },
  ];

  const openPositions = [
    { title: "Senior PGT English", type: "Full-Time", experience: "5+ Years" },
    { title: "TGT Mathematics", type: "Full-Time", experience: "3+ Years" },
    { title: "Sports Instructor", type: "Part-Time", experience: "2+ Years" },
  ];

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) setData(docSnap.data());
      setLoading(false);
    });
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => { unsub(); window.removeEventListener('scroll', handleScroll); };
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white italic font-light tracking-widest text-slate-400 uppercase text-[10px]">Loading Personnel...</div>;

  return (
    <div className="bg-white text-[#1a1a1a] antialiased selection:bg-[#6366F1] selection:text-white">
      
      {/* --- HEADER --- */}
      <header className={`fixed w-full z-[100] transition-all duration-700 ${isScrolled ? 'py-4 bg-white/90 backdrop-blur-xl border-b border-slate-100' : 'py-8 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 overflow-hidden">
                <img src={LogoImg.src} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className={`text-lg font-bold tracking-tight transition-colors duration-500 ${isScrolled ? 'text-slate-900' : 'text-white'}`}>{data?.schoolName || "MVG Academy"}</span>
              <span className="text-[9px] font-medium tracking-[0.4em] text-[#6366F1] uppercase">Jaipur</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-2">
            <NavItem label="Home" href="/" isScrolled={isScrolled} />
            <NavDropdown label="About" isScrolled={isScrolled} items={[{ label: 'History', link: '/About/history' }, { label: 'Our Aim', link: '/About/aim' }, { label: 'Director', link: '/About/director' }]} />
            <NavDropdown label="Academics" isScrolled={isScrolled} items={[{ label: 'Curriculum', link: '/academics' }, { label: 'Faculty & Careers', link: '/About/faculty' }]} />
            <NavItem label="Contact" href="/contact" isScrolled={isScrolled} />
            <Link href="/apply" className="ml-6 bg-[#6366F1] text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100">Apply Now</Link>
          </div>

          <button onClick={() => setMobileMenu(true)} className={`lg:hidden p-2 ${isScrolled ? 'text-slate-900' : 'text-white'}`}><Menu size={24} /></button>
        </div>
      </header>

      {/* --- MOBILE MENU --- */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed inset-0 z-[200] bg-white flex flex-col">
            <div className="p-8 flex justify-between items-center border-b border-slate-50">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6366F1]">Navigation</span>
              <button onClick={() => setMobileMenu(false)} className="p-2 bg-slate-50 rounded-full"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              <MobileLink label="Home" href="/" setMobileMenu={setMobileMenu} />
              <MobileAccordion label="About" isOpen={activeMobileSub === 'about'} onClick={() => setActiveMobileSub(activeMobileSub === 'about' ? null : 'about')} items={[{label: 'History', href: '/About/history'}, {label: 'Aim', href: '/About/aim'}]} />
              <MobileLink label="Faculty & Careers" href="/About/faculty" setMobileMenu={setMobileMenu} />
              <MobileLink label="Contact" href="/contact" setMobileMenu={setMobileMenu} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HERO --- */}
      <section className="relative h-[40vh] flex items-center bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070" className="w-full h-full object-cover opacity-20 grayscale" alt="Personnel" />
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
              {facultyMembers.map((member, idx) => (
                  <div key={idx} className="group">
                      <div className="aspect-[3/4] overflow-hidden rounded-[2rem] bg-slate-50 mb-6 border border-slate-100 shadow-sm">
                          <img src={member.img} className="w-full h-full object-cover  transition-all duration-700" alt={member.name} />
                      </div>
                      <h3 className="text-xl font-bold tracking-tight">{member.name}</h3>
                      <p className="text-[#6366F1] text-[9px] font-bold uppercase tracking-[0.2em] mt-1">{member.role}</p>
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
                <a href={`mailto:${data?.email}`} className="text-[#6366F1] text-xs font-bold uppercase tracking-widest border-b border-[#6366F1] pb-1">mvgschooljaipur@gmail.com</a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white pt-24 pb-12 px-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
            <div className="max-w-xs">
                <div className="text-xl font-bold tracking-tighter italic uppercase text-[#6366F1] mb-6">MVG ACADEMY</div>
                <p className="text-slate-400 font-light text-sm">Building pillars of knowledge and innovation in Jaipur since 1998.</p>
            </div>
            <div className="grid grid-cols-2 gap-16">
                <FooterList title="Navigation" items={['Home', 'About', 'Contact']} />
                <FooterList title="Social" items={['Facebook', 'Instagram']} />
            </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-50 flex justify-between text-[9px] font-bold uppercase tracking-[0.4em] text-slate-300">
            <span>© 2025 MVG ACADEMY</span>
            <span>Jaipur, RJ</span>
        </div>
      </footer>
    </div>
  );
}

// --- HELPERS ---
function NavItem({ label, href, isScrolled }) {
  return <Link href={href} className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest hover:text-[#6366F1] transition-colors ${isScrolled ? 'text-slate-600' : 'text-white'}`}>{label}</Link>;
}
function NavDropdown({ label, items, isScrolled }) {
  return (
    <div className="relative group px-4 py-2 cursor-pointer">
      <div className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest group-hover:text-[#6366F1] transition-colors ${isScrolled ? 'text-slate-600' : 'text-white'}`}>
        {label} <ChevronDown size={10} className="group-hover:rotate-180 transition-transform" />
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
function MobileAccordion({ label, items, isOpen, onClick }) {
  return (
    <div className="border-b border-slate-50">
      <button onClick={onClick} className="w-full flex justify-between items-center p-4 text-xl font-bold tracking-tighter uppercase italic">{label} <ChevronDown size={18} /></button>
      {isOpen && <div className="bg-slate-50 rounded-2xl mb-4">{items.map((it, i) => <Link key={i} href={it.href} className="block p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">{it.label}</Link>)}</div>}
    </div>
  );
}
function FooterList({ title, items }) {
  return (
    <div>
      <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-6 text-slate-300">{title}</h5>
      <ul className="space-y-3 text-xs font-bold text-slate-500 uppercase tracking-widest">{items.map((it, i) => <li key={i} className="hover:text-[#6366F1] cursor-pointer transition-colors">{it}</li>)}</ul>
    </div>
  );
}