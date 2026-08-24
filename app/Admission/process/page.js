"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../../images/logo.jpg';
import { 
  Menu, X, Facebook, Instagram, ChevronDown, 
  Phone, Mail, MapPin, ClipboardList, Users, 
  FileCheck, Sparkles, ArrowRight, Download,
  MessageSquare, CalendarCheck, CheckCircle2
} from 'lucide-react';

export default function HowToApply() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeMobileSub, setActiveMobileSub] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) setData(docSnap.data());
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white italic font-light tracking-widest text-slate-400 uppercase text-[10px]">Loading Roadmap...</div>;

  return (
    <div className="bg-white text-[#1a1a1a] antialiased">
      
      {/* --- 1. STICKY TOP BAR --- */}
      <div className="fixed top-0 w-full z-[120] bg-[#0a0a0a] text-slate-400 py-2 hidden lg:block border-b border-white/5">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[9px] font-bold uppercase tracking-[0.2em]">
          <div className="flex gap-8">
            <span className="flex items-center gap-2 hover:text-white transition-colors"><Phone size={11} className="text-[#6366F1]" /> {data?.phone || "+91 141 2345678"}</span>
            <span className="flex items-center gap-2 hover:text-white transition-colors"><Mail size={11} className="text-[#6366F1]" /> admissions@mvgacademy.com</span>
          </div>
          <div className="flex gap-4 items-center">
             <span className="flex items-center gap-2"><MapPin size={11} className="text-[#6366F1]" /> Jaipur, RJ</span>
          </div>
        </div>
      </div>

      {/* --- 2. STICKY HEADER WITH SUBMENUS --- */}
      <header className="fixed top-0 lg:top-[35px] w-full z-[110] bg-white/95 backdrop-blur-md py-4 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <img src={LogoImg.src} alt="Logo" className="w-10 h-10 object-contain" />
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight">{data?.schoolName || "MVG Academy"}</span>
              <span className="text-[8px] font-black text-[#6366F1] uppercase tracking-[0.3em]">Join Our Legacy</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-2">
            <NavItem label="Home" href="/" />
            <NavDropdown label="Academics" items={[
              { label: 'Robotics & AI', link: '/academics/robotics' },
              { label: 'Visual Arts', link: '/academics/arts' },
              { label: 'Cultural Love', link: '/academics/cultural' }
            ]} />
            <NavDropdown label="Admissions" items={[
              { label: 'How to Apply', link: '/how-to-apply' },
              { label: 'Enquiry Form', link: '/admission' },
              { label: 'Fee Structure', link: '/fees' }
            ]} />
            <NavDropdown label="About" items={[
              { label: 'Expert Faculty', link: '/About/faculty' },
              { label: 'Awards', link: '/awards' }
            ]} />
            <Link href="/admission" className="ml-6 bg-black text-white px-7 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-[#6366F1] transition-all">Apply Now</Link>
          </nav>

          <button onClick={() => setMobileMenu(true)} className="lg:hidden p-2 bg-slate-50 rounded-full"><Menu size={20}/></button>
        </div>
      </header>

      {/* --- MOBILE MENU --- */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 z-[200] bg-white flex flex-col">
            <div className="p-8 flex justify-between items-center border-b border-slate-50">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#6366F1]">Main Menu</span>
              <button onClick={() => setMobileMenu(false)} className="p-3 bg-slate-50 rounded-full"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              <MobileLink label="Home" href="/" setMobileMenu={setMobileMenu} />
              <MobileAccordion label="Academics" isOpen={activeMobileSub === 'acad'} onClick={() => setActiveMobileSub(activeMobileSub === 'acad' ? null : 'acad')} items={[{label: 'Robotics', href: '/academics/robotics'}, {label: 'Arts', href: '/academics/arts'}]} setMobileMenu={setMobileMenu} />
              <MobileLink label="Apply Now" href="/admission" setMobileMenu={setMobileMenu} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HERO SECTION --- */}
      <main className="pt-56 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center mb-24">
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#6366F1] text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Admission Process 2026-27</motion.span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 italic">Your Journey to <br/>Excellence Starts Here.</h1>
            <p className="text-slate-400 text-lg font-light leading-relaxed max-w-2xl mx-auto">We have simplified our admission process into four easy steps to ensure a smooth transition for your child.</p>
        </div>

        {/* --- STEP BY STEP ROADMAP --- */}
        <div className="max-w-5xl mx-auto space-y-12">
            <StepCard 
                num="01" 
                title="Online Enquiry" 
                icon={<ClipboardList size={28}/>} 
                desc="Fill out our digital enquiry form with basic details. Our admissions team will review it and get back to you within 24 hours."
                cta="Go to Enquiry Form"
                link="/admission"
            />
            <StepCard 
                num="02" 
                title="Campus Interaction" 
                icon={<MessageSquare size={28}/>} 
                desc="Visit our campus for a personalized tour. Both student and parents will have a friendly interaction with our Principal and Department Heads."
            />
            <StepCard 
                num="03" 
                title="Document Verification" 
                icon={<FileCheck size={28}/>} 
                desc="Submit the necessary documents (Birth Certificate, Previous Report Cards, Transfer Certificate) for final verification."
            />
            <StepCard 
                num="04" 
                title="Seat Confirmation" 
                icon={<CheckCircle2 size={28}/>} 
                desc="Once verified, complete the fee formalities to secure your child's place for the 2026-27 academic session."
                isLast
            />
        </div>

        {/* --- DOCUMENT CHECKLIST --- */}
        <section className="max-w-5xl mx-auto mt-32 p-12 bg-slate-50 rounded-[3rem] border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-6">Required <br/>Documents.</h2>
                    <p className="text-slate-500 text-sm font-light mb-8 italic">Please keep these digital or physical copies ready for Step 3.</p>
                    <button className="flex items-center gap-3 bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#6366F1] transition-all">
                        <Download size={14}/> Download Checklist PDF
                    </button>
                </div>
                <ul className="space-y-4">
                    <CheckItem text="Student's Birth Certificate (Original + Copy)" />
                    <CheckItem text="6 Recent Passport-sized Photographs" />
                    <CheckItem text="Previous 2 Years Academic Progress Reports" />
                    <CheckItem text="Original Transfer Certificate (TC)" />
                    <CheckItem text="Copy of Parent's Aadhaar Card / ID Proof" />
                </ul>
            </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-white pt-32 pb-12 px-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-2 space-y-6">
            <div className="text-xl font-bold italic uppercase text-[#6366F1]">MVG ACADEMY</div>
            <p className="text-slate-400 font-light text-sm max-w-sm">Nurturing curiosity and creativity in every student. Join Jaipur's premier academic community.</p>
          </div>
          <FooterList title="Quick Links" items={['Robotics AI', 'Visual Arts', 'How to Apply', 'Contact']} />
          <FooterList title="Connect" items={['Facebook', 'Instagram', 'YouTube']} />
        </div>
        <div className="max-w-7xl mx-auto pt-10 border-t border-slate-50 flex justify-between items-center text-[9px] font-bold uppercase tracking-[0.4em] text-slate-300">
          <span>© 2025 MVG ACADEMY JAIPUR</span>
          <span>Since 1998</span>
        </div>
      </footer>
    </div>
  );
}

// --- ROADMAP HELPERS ---
function StepCard({ num, title, icon, desc, cta, link, isLast }) {
    return (
        <div className="flex gap-8 md:gap-16 relative">
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-3xl bg-white border-2 border-slate-100 flex items-center justify-center text-black shadow-lg shadow-slate-100 relative z-10">
                    {icon}
                </div>
                {!isLast && <div className="w-[2px] h-full bg-slate-100 absolute top-16" />}
            </div>
            <div className="pb-20">
                <span className="text-[11px] font-black text-[#6366F1] tracking-[0.3em] mb-2 block">STEP {num}</span>
                <h3 className="text-2xl font-bold tracking-tight mb-4">{title}</h3>
                <p className="text-slate-500 font-light text-base leading-relaxed max-w-xl mb-6">{desc}</p>
                {cta && (
                    <Link href={link} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black hover:text-[#6366F1] transition-colors">
                        {cta} <ArrowRight size={14}/>
                    </Link>
                )}
            </div>
        </div>
    );
}

function CheckItem({ text }) {
    return (
        <li className="flex items-center gap-4 text-slate-600 text-sm font-medium p-4 bg-white rounded-2xl border border-slate-50 shadow-sm">
            <CheckCircle2 size={18} className="text-green-500" /> {text}
        </li>
    );
}

// --- NAV HELPERS ---
function NavItem({ label, href }) {
    return <Link href={href} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:text-[#6366F1] transition-colors">{label}</Link>;
}

function NavDropdown({ label, items }) {
    return (
      <div className="relative group px-4 py-2 cursor-pointer">
        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest group-hover:text-[#6366F1] transition-colors">
          {label} <ChevronDown size={10} className="group-hover:rotate-180 transition-transform duration-300" />
        </div>
        <div className="absolute top-full left-0 pt-6 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
          <div className="bg-white min-w-[200px] shadow-2xl rounded-2xl border border-slate-100 p-2">
            {items.map((it, i) => <Link key={i} href={it.link} className="block px-4 py-3 rounded-xl hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#6366F1] transition-all">{it.label}</Link>)}
          </div>
        </div>
      </div>
    );
}

function MobileLink({ label, href, setMobileMenu }) {
    return <Link href={href} onClick={() => setMobileMenu(false)} className="block p-4 text-xl font-bold tracking-tighter uppercase italic border-b border-slate-50">{label}</Link>;
}

function MobileAccordion({ label, items, isOpen, onClick, setMobileMenu }) {
    return (
      <div className="border-b border-slate-50">
        <button onClick={onClick} className="w-full flex justify-between items-center p-4 text-xl font-bold tracking-tighter uppercase italic">{label} <ChevronDown size={18} /></button>
        {isOpen && <div className="bg-slate-50 rounded-2xl mb-4">{items.map((it, i) => <Link key={i} href={it.href} onClick={() => setMobileMenu(false)} className="block p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">{it.label}</Link>)}</div>}
      </div>
    );
}

function FooterList({ title, items }) {
    return (
      <div className="space-y-6">
        <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300">{title}</h5>
        <ul className="space-y-3 text-xs font-bold text-slate-500 uppercase tracking-widest">{items.map((it, i) => <li key={i} className="hover:text-[#6366F1] cursor-pointer transition-colors">{it}</li>)}</ul>
      </div>
    );
}