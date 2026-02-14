"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../../images/logo.jpg';
import { 
  Menu, X, Facebook, Instagram, ChevronDown, 
  Phone, Mail, MapPin, Send, CheckCircle,
  User, Users, GraduationCap, Heart, Clock, Award, Info,
  Globe, ShieldCheck, Zap
} from 'lucide-react';

export default function FinalAdmissionPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeMobileSub, setActiveMobileSub] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) setData(docSnap.data());
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsSubmitted(true);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white italic font-light tracking-widest text-slate-400 uppercase text-[10px]">Preparing Enquiry Portal...</div>;

  return (
    <div className="bg-[#fcfcfc] text-[#1a1a1a] antialiased">
      
      {/* --- 1. STICKY TOP BAR --- */}
      <div className="fixed top-0 w-full z-[120] bg-[#0a0a0a] text-slate-400 py-2 hidden lg:block border-b border-white/5">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[9px] font-bold uppercase tracking-[0.2em]">
          <div className="flex gap-8">
            <span className="flex items-center gap-2 hover:text-white transition-colors"><Phone size={11} className="text-[#6366F1]" /> {data?.phone || "+91 141 2345678"}</span>
            <span className="flex items-center gap-2 hover:text-white transition-colors"><Mail size={11} className="text-[#6366F1]" /> admissions@mvgacademy.com</span>
          </div>
          <div className="flex gap-6 items-center">
            <span className="flex items-center gap-2"><MapPin size={11} className="text-[#6366F1]" /> Jaipur, Rajasthan</span>
            <div className="flex gap-4 border-l border-white/10 pl-6">
              <Facebook size={12} className="hover:text-white cursor-pointer" />
              <Instagram size={12} className="hover:text-white cursor-pointer" />
            </div>
          </div>
        </div>
      </div>

      {/* --- 2. STICKY HEADER WITH COMPLETE SUBMENUS --- */}
      <header className="fixed top-0 lg:top-[35px] w-full z-[110] bg-white/95 backdrop-blur-md py-4 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <img src={LogoImg.src} alt="Logo" className="w-10 h-10 object-contain" />
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight">{data?.schoolName || "MVG Academy"}</span>
              <span className="text-[8px] font-black text-[#6366F1] uppercase tracking-[0.3em]">Excellence Portal</span>
            </div>
          </Link>

          {/* Full Navigation Menu */}
          <nav className="hidden lg:flex items-center gap-2">
            <NavItem label="Home" href="/" />
            
            <NavDropdown label="Academics" items={[
              { label: 'Robotics & AI Lab', link: '/academics/robotics' },
              { label: 'Visual Arts Studio', link: '/academics/arts' },
              { label: 'Cultural Heritage', link: '/academics/cultural' },
              { label: 'Curriculum Overview', link: '/academics/curriculum' }
            ]} />

            <NavDropdown label="Life at MVG" items={[
              { label: 'Hall of Fame (Awards)', link: '/awards' },
              { label: 'Our Expert Faculty', link: '/About/faculty' },
              { label: 'Campus Gallery', link: '/gallery' },
              { label: 'School Calendar', link: '/calendar' }
            ]} />

            <NavDropdown label="Join Us" items={[
              { label: 'Admission 2026-27', link: '/admission' },
              { label: 'Careers & Faculty Jobs', link: '/About/faculty#careers' },
              { label: 'Visit Campus', link: '/contact' }
            ]} />

            <Link href="/contact" className="ml-6 bg-black text-white px-7 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-[#6366F1] transition-all shadow-xl shadow-indigo-100">Contact Desk</Link>
          </nav>

          <button onClick={() => setMobileMenu(true)} className="lg:hidden p-2 bg-slate-50 rounded-full"><Menu size={20}/></button>
        </div>
      </header>

      {/* --- 3. MOBILE MENU --- */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 z-[200] bg-white flex flex-col">
            <div className="p-8 flex justify-between items-center border-b border-slate-50">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#6366F1]">Portal Menu</span>
              <button onClick={() => setMobileMenu(false)} className="p-3 bg-slate-50 rounded-full"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              <MobileLink label="Home" href="/" setMobileMenu={setMobileMenu} />
              <MobileAccordion label="Academics" isOpen={activeMobileSub === 'acad'} onClick={() => setActiveMobileSub(activeMobileSub === 'acad' ? null : 'acad')} items={[{label: 'Robotics', href: '/academics/robotics'}, {label: 'Arts', href: '/academics/arts'}, {label: 'Cultural', href: '/academics/cultural'}]} setMobileMenu={setMobileMenu} />
              <MobileAccordion label="Admissions" isOpen={activeMobileSub === 'adm'} onClick={() => setActiveMobileSub(activeMobileSub === 'adm' ? null : 'adm')} items={[{label: 'Apply 2026-27', href: '/admission'}, {label: 'Fee Structure', href: '/fees'}]} setMobileMenu={setMobileMenu} />
              <MobileLink label="Awards" href="/awards" setMobileMenu={setMobileMenu} />
              <MobileLink label="Careers" href="/About/faculty#careers" setMobileMenu={setMobileMenu} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 4. THE COMPREHENSIVE FORM --- */}
      <main className="pt-56 pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center mb-16">
            <span className="text-[#6366F1] text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Official Enrollment</span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">Admission <br/>Enquiry 2026-27.</h1>
          </div>

          <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl shadow-slate-200/40 border border-slate-100">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-16">
                
                {/* PART 1: STUDENT */}
                <div className="space-y-8">
                  <FormHeading title="Student Profile" icon={<User size={18}/>} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField label="First Name" required />
                    <InputField label="Middle Name" />
                    <InputField label="Last Name" required />
                    <InputField label="Date of Birth" type="date" required />
                    <SelectField label="Grade Seeking" options={['Nursery', 'Prep', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']} />
                    <SelectField label="Gender" options={['Male', 'Female', 'Other']} />
                  </div>
                </div>

                {/* PART 2: GUARDIANS */}
                <div className="space-y-8">
                  <FormHeading title="Guardian Details" icon={<Users size={18}/>} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Father's Name" required />
                    <InputField label="Mother's Name" required />
                    <InputField label="Primary Mobile" type="tel" required />
                    <InputField label="Father's Occupation" />
                    <InputField label="Email Address" type="email" required />
                    <InputField label="Emergency Number" type="tel" />
                  </div>
                  <div className="mt-6">
                    <InputField label="Full Residential Address" placeholder="House No, Locality, City, PIN" />
                  </div>
                </div>

                {/* PART 3: PREVIOUS ACADEMICS & INTERESTS */}
                <div className="space-y-8">
                  <FormHeading title="Academic Background" icon={<GraduationCap size={18}/>} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Last School Attended" />
                    <InputField label="Reason for Transfer" />
                    <SelectField label="Transport Required" options={['No', 'Yes (School Bus)']} />
                    <InputField label="Medical Condition (if any)" placeholder="Allergies, etc." />
                  </div>
                  <div className="mt-6">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-3">Interests in Robotics, Arts or Culture?</label>
                    <textarea className="w-full bg-slate-50 rounded-2xl p-5 text-sm min-h-[120px] outline-none focus:ring-1 focus:ring-[#6366F1]" placeholder="Tell us what your child loves..."/>
                  </div>
                </div>

                <button className="w-full bg-black text-white py-6 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-[#6366F1] transition-all flex items-center justify-center gap-4 shadow-xl shadow-indigo-100">
                  Send Enrollment Enquiry <Send size={16}/>
                </button>
              </form>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <CheckCircle size={60} className="text-green-500 mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-4">Form Submitted Successfully</h2>
                <p className="text-slate-400 mb-8">Our counselor will call you shortly on the provided mobile number.</p>
                <button onClick={() => setIsSubmitted(false)} className="text-[#6366F1] font-bold uppercase text-[10px] tracking-widest underline underline-offset-8">New Enquiry</button>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* --- 5. FOOTER --- */}
      <footer className="bg-white pt-32 pb-12 px-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-2 space-y-8">
            <div className="text-xl font-bold tracking-tighter italic uppercase text-[#6366F1]">MVG ACADEMY</div>
            <p className="text-slate-400 font-light text-sm max-w-sm">Where tradition meets technology. Join Jaipur's most innovative learning community.</p>
          </div>
          <FooterList title="Quick Links" items={['Robotics AI', 'Visual Arts', 'Cultural Love', 'Awards']} />
          <FooterList title="Admission" items={['Enquiry Form', 'Fee Policy', 'Scholarships', 'Contact']} />
        </div>
        <div className="max-w-7xl mx-auto pt-10 border-t border-slate-50 flex justify-between items-center text-[9px] font-bold uppercase tracking-[0.4em] text-slate-300">
          <span>© 2025 MVG ACADEMY</span>
          <span className="flex items-center gap-4"><Facebook size={14}/> <Instagram size={14}/></span>
        </div>
      </footer>
    </div>
  );
}

// --- LOGIC COMPONENTS ---
function FormHeading({ title, icon }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#6366F1]">{icon}</div>
      <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      <div className="flex-1 h-[1px] bg-slate-100 ml-4"></div>
    </div>
  );
}

function InputField({ label, type = "text", required = false, placeholder = "" }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label} {required && '*'}</label>
      <input type={type} placeholder={placeholder} required={required} className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-sm focus:ring-1 focus:ring-[#6366F1] transition-all" />
    </div>
  );
}

function SelectField({ label, options }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</label>
      <select className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-sm focus:ring-1 focus:ring-[#6366F1] appearance-none cursor-pointer">
        {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

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
      <ul className="space-y-3 text-xs font-bold text-slate-500 uppercase tracking-widest">{items.map((it, i) => <li key={i} className="hover:text-[#6366F1] transition-colors cursor-pointer">{it}</li>)}</ul>
    </div>
  );
}