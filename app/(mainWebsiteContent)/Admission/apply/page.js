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
  User, Users, GraduationCap, Heart, Home, FileText,
  Clock, Award, Info
} from 'lucide-react';

export default function AdmissionMegaPage() {
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-white italic font-light tracking-widest text-slate-400 uppercase text-[10px]">Configuring Portal...</div>;

  return (
    <div className="bg-[#f8f9fa] text-[#1a1a1a] antialiased">
      
      {/* --- STICKY NAVIGATION STACK --- */}
      <div className="fixed top-0 w-full z-[100]">
        {/* TOP CONTACT BAR */}
        <div className="bg-[#0a0a0a] text-slate-400 py-2 hidden lg:block border-b border-white/5">
            <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[9px] font-bold uppercase tracking-[0.2em]">
                <div className="flex gap-6">
                    <span className="flex items-center gap-2 hover:text-white transition-colors"><Phone size={10} className="text-[#6366F1]" /> {data?.phone || "+91 141 2345678"}</span>
                    <span className="flex items-center gap-2 hover:text-white transition-colors"><Mail size={10} className="text-[#6366F1]" /> admissions@mvgacademy.com</span>
                </div>
                <div className="flex gap-4">
                    <span className="flex items-center gap-2 uppercase tracking-widest text-[#6366F1]"><Clock size={10}/> Office Hours: 8AM - 4PM</span>
                </div>
            </div>
        </div>

        {/* MAIN HEADER WITH SUBMENUS */}
        <header className="bg-white/95 backdrop-blur-md py-4 border-b border-slate-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-3 group">
                    <img src={LogoImg.src} alt="Logo" className="w-10 h-10 object-contain group-hover:rotate-12 transition-transform" />
                    <div className="flex flex-col">
                        <span className="text-base font-bold tracking-tight">{data?.schoolName || "MVG Academy"}</span>
                        <span className="text-[8px] font-black text-[#6366F1] uppercase tracking-[0.3em]">Session 2026-27</span>
                    </div>
                </Link>

                {/* DESKTOP MENU WITH SUBMENUS */}
                <nav className="hidden lg:flex items-center gap-4">
                    <NavItem label="Home" href="/" />
                    <NavDropdown label="Academics" items={[
                        { label: 'Robotics & AI', link: '/academics/robotics' },
                        { label: 'Modern Science', link: '/academics/robotics#science' },
                        { label: 'Visual Arts', link: '/academics/arts' },
                        { label: 'Cultural Love', link: '/academics/cultural' }
                    ]} />
                    <NavDropdown label="Our School" items={[
                        { label: 'Faculty', link: '/About/faculty' },
                        { label: 'Awards', link: '/awards' },
                        { label: 'Careers', link: '/About/faculty#careers' }
                    ]} />
                    <Link href="/contact" className="ml-6 bg-[#6366F1] text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-indigo-100">Enquire Now</Link>
                </nav>

                <button onClick={() => setMobileMenu(true)} className="lg:hidden p-2 bg-slate-50 rounded-full"><Menu size={20}/></button>
            </div>
        </header>
      </div>

      {/* --- MOBILE MENU --- */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 z-[200] bg-white flex flex-col">
            <div className="p-8 flex justify-between items-center border-b border-slate-50">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#6366F1]">Portal Navigation</span>
                <button onClick={() => setMobileMenu(false)} className="p-3 bg-slate-50 rounded-full"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              <MobileLink label="Home" href="/" setMobileMenu={setMobileMenu} />
              <MobileAccordion label="Academics" isOpen={activeMobileSub === 'acad'} onClick={() => setActiveMobileSub(activeMobileSub === 'acad' ? null : 'acad')} items={[{label: 'Robotics', href: '/academics/robotics'}, {label: 'Arts', href: '/academics/arts'}, {label: 'Cultural', href: '/academics/cultural'}]} setMobileMenu={setMobileMenu} />
              <MobileAccordion label="About" isOpen={activeMobileSub === 'about'} onClick={() => setActiveMobileSub(activeMobileSub === 'about' ? null : 'about')} items={[{label: 'Faculty', href: '/About/faculty'}, {label: 'Awards', href: '/awards'}]} setMobileMenu={setMobileMenu} />
              <MobileLink label="Contact Us" href="/contact" setMobileMenu={setMobileMenu} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- REGISTRATION FORM SECTION --- */}
      <main className="pt-48 pb-32 px-6">
        <div className="max-w-5xl mx-auto">
            
            {/* Form Header */}
            <div className="text-center mb-16">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">Candidate <br/>Registration.</h1>
                <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> Digital Portal</span>
                    <span className="w-8 h-[1px] bg-slate-200"></span>
                    <span className="flex items-center gap-2"><Info size={14} className="text-[#6366F1]"/> Admission 2026-27</span>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl shadow-slate-200/50 border border-slate-100">
                {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="space-y-16">
                        
                        {/* 1. STUDENT IDENTITY */}
                        <FormSection title="Student Identity" icon={<User size={18}/>}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <InputField label="First Name" placeholder="Student's first name" required />
                                <InputField label="Last Name" placeholder="Student's last name" required />
                                <InputField label="Date of Birth" type="date" required />
                                <SelectField label="Grade Applying For" options={['Nursery', 'KG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11 (Sci)', 'Grade 11 (Comm)', 'Grade 11 (Arts)']} />
                                <SelectField label="Gender" options={['Male', 'Female', 'Prefer not to say']} />
                                <InputField label="Nationality" placeholder="e.g. Indian" />
                            </div>
                        </FormSection>

                        {/* 2. FAMILY BACKGROUND */}
                        <FormSection title="Family & Contact" icon={<Users size={18}/>}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Father's Full Name" placeholder="As per ID proof" required />
                                <InputField label="Mother's Full Name" placeholder="As per ID proof" required />
                                <InputField label="Primary Mobile Number" type="tel" placeholder="+91" required />
                                <InputField label="Alternative Mobile" type="tel" placeholder="WhatsApp Number" />
                                <InputField label="Email Address" type="email" placeholder="for official communication" required />
                                <InputField label="Father's Occupation" placeholder="e.g. Engineer, Business" />
                            </div>
                            <div className="mt-6">
                                <InputField label="Residential Address" placeholder="Street, Area, City & Pincode" />
                            </div>
                        </FormSection>

                        {/* 3. ACADEMIC & MEDICAL */}
                        <FormSection title="Academic & Medical" icon={<GraduationCap size={18}/>}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Current/Previous School" placeholder="Full school name" />
                                <InputField label="Previous Grade Percentage" placeholder="e.g. 92% or Grade A" />
                                <SelectField label="Transport Required?" options={['No, Personal Drop', 'Yes, School Bus']} />
                                <InputField label="Any Medical Allergies?" placeholder="Mention 'None' if not applicable" />
                            </div>
                            <div className="mt-6">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-3">Special Talents / Hobbies</label>
                                <textarea className="w-full bg-slate-50 rounded-2xl p-5 text-sm focus:ring-1 focus:ring-[#6366F1] outline-none min-h-[120px]" placeholder="Is your child into Robotics, Classical Music, Art, or Sports? Tell us more..."/>
                            </div>
                        </FormSection>

                        {/* SUBMIT */}
                        <div className="pt-8">
                            <button className="group w-full bg-black text-white py-6 rounded-2xl font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-[#6366F1] transition-all flex items-center justify-center gap-4 shadow-xl shadow-indigo-100">
                                Submit Formal Application <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>
                            <p className="text-center text-[9px] text-slate-400 mt-6 uppercase tracking-widest font-medium">By submitting, you agree to our admission policy and terms.</p>
                        </div>
                    </form>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
                        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <CheckCircle size={48} className="text-green-500" />
                        </div>
                        <h2 className="text-4xl font-bold mb-4">Registration Success!</h2>
                        <p className="text-slate-400 max-w-sm mx-auto mb-10">Our admission counselor will reach out to you on your primary mobile number within 24-48 working hours.</p>
                        <button onClick={() => setIsSubmitted(false)} className="bg-slate-100 px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all">Submit another registration</button>
                    </motion.div>
                )}
            </div>
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-white pt-32 pb-12 px-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-2 space-y-8">
                <div className="text-xl font-bold tracking-tighter italic uppercase text-[#6366F1]">MVG ACADEMY</div>
                <p className="text-slate-400 font-light text-sm max-w-sm leading-relaxed">A sanctuary for innovation, tradition, and academic excellence in the heart of Rajasthan.</p>
            </div>
            <FooterCol title="Explore" items={['Robotics Lab', 'Arts Wing', 'Faculty', 'Awards']} />
            <FooterCol title="Socials" items={['Instagram', 'Facebook', 'LinkedIn']} />
        </div>
        <div className="max-w-7xl mx-auto pt-10 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-bold uppercase tracking-[0.4em] text-slate-300">
            <span>© 2025 MVG ACADEMY JAIPUR</span>
            <span className="flex items-center gap-2"><Heart size={10} className="text-red-400"/> Proudly Serving Since 1998</span>
        </div>
      </footer>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function FormSection({ title, icon, children }) {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#6366F1]">
                    {icon}
                </div>
                <h2 className="text-xl font-bold tracking-tight">{title}</h2>
                <div className="flex-1 h-[1px] bg-slate-100 ml-4"></div>
            </div>
            {children}
        </div>
    );
}

function InputField({ label, type = "text", placeholder, required = false }) {
    return (
        <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <input 
                type={type} 
                required={required}
                placeholder={placeholder}
                className="w-full bg-slate-50 border border-transparent rounded-xl px-5 py-4 text-sm focus:bg-white focus:border-[#6366F1]/30 focus:ring-4 focus:ring-[#6366F1]/5 transition-all outline-none"
            />
        </div>
    );
}

function SelectField({ label, options }) {
    return (
        <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</label>
            <div className="relative">
                <select className="w-full bg-slate-50 border border-transparent rounded-xl px-5 py-4 text-sm focus:bg-white focus:border-[#6366F1]/30 transition-all outline-none appearance-none cursor-pointer">
                    {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
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
          <div className="bg-white min-w-[220px] shadow-2xl rounded-2xl border border-slate-50 p-2">
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

function FooterCol({ title, items }) {
    return (
        <div className="space-y-6">
            <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300">{title}</h5>
            <ul className="space-y-3 text-xs font-bold text-slate-500 uppercase tracking-widest">{items.map((it, i) => <li key={i} className="hover:text-[#6366F1] transition-colors cursor-pointer">{it}</li>)}</ul>
        </div>
    );
}