"use client";
import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Eye, Award, Users, BookOpen, ShieldCheck, 
  History, Landmark, Sparkles, Microscope, Trophy, ArrowRight, 
  Globe, Fingerprint, Lightbulb, Menu, X, ChevronDown, Mail, Twitter, Quote, Instagram, Facebook, MapPin, Phone
} from 'lucide-react';
import Link from 'next/link';
import LogoImg from '../../images/logo.jpg'; // Make sure this path is correct

export default function AboutPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);


  


  
  // FETCH DYNAMIC DATA FROM FIREBASE
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      }
      setLoading(false);
    });

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => { 
      unsub(); 
      window.removeEventListener('scroll', handleScroll); 
    };
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FDF8F6]">
      <div className="w-16 h-16 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const displayData = data || {
    stats: [
      { label: "Years of Excellence", value: "25+" },
      { label: "Expert Educators", value: "50+" },
      { label: "Student Alumni", value: "5000+" },
      { label: "State Awards", value: "12" }
    ],
    principal: {
      name: "Dr. S. K. Sharma",
      message: "At MVG Academy, we nurture brilliance and character through a balanced approach to modern education.",
      image: "https://images.unsplash.com/photo-1544717297-fa154da09f9d?q=80&w=2070"
    }
  };

  return (
    <div className="bg-[#FDFBF9] text-slate-900 antialiased overflow-x-hidden font-sans">
      
      {/* --- 1. HEADER & NAVIGATION --- */}
      <header className="fixed w-full z-[100]">
        {/* TOP CONTACT BAR */}
        <div className={`hidden xl:block border-b transition-all duration-500 ${
          isScrolled ? 'bg-slate-900 border-white/5 py-1' : 'bg-black/20 backdrop-blur-md border-white/10 py-2'
        }`}>
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-white/90">
            <div className="flex gap-8 items-center">
              <a href="tel:+911412345678" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#6366F1]">
                <Phone size={12} className="text-[#6366F1]" />
                <span>+91 (141) 2345-678</span>
              </a>
              <a href="mailto:info@mvgacademy.edu" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#6366F1]">
                <Mail size={12} className="text-[#6366F1]" />
                <span>info@mvgacademy.edu</span>
              </a>
            </div>
            <div className="flex gap-4 items-center border-l border-white/20 pl-6">
                <Facebook size={14} className="hover:text-[#6366F1] cursor-pointer" />
                <Instagram size={14} className="hover:text-[#6366F1] cursor-pointer" />
            </div>
          </div>
        </div>

        {/* MAIN NAV */}
        <nav className={`transition-all duration-500 ${isScrolled ? 'bg-white py-3 shadow-xl' : 'bg-transparent py-6'}`}>
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl shadow-md p-1 border border-slate-100 flex items-center justify-center">
                <img src={LogoImg.src} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className={`text-xl font-black uppercase tracking-tighter ${isScrolled ? 'text-slate-900' : 'text-white'}`}>MVG Academy</span>
                <span className="text-[9px] font-black text-[#6366F1] tracking-[0.3em]">JAIPUR</span>
              </div>
            </Link>

            {/* DESKTOP MENU */}
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
                { label: 'Robotics', link: '/Academics/robotics' },
                { label: 'Visual Art', link: '/Academics/visual-art' },
                { label: 'Cultural', link: '/Academics/cultural' },
                { label: 'Awards', link: '/Academics/awards' },
              ]} />
              <NavDropdown label="Admission" isScrolled={isScrolled} items={[
                { label: 'Apply for 2026-27', link: '/Admission/apply' },
                { label: 'Admission Enquiry', link: '/Admission/enquiry' },
                { label: 'How to Apply?', link: '/Admission/process' },
                { label: 'Fee Structure', link: '/Admission/fees' },
                { label: 'Admission Criteria', link: '/Admission/criteria' },
                { label: 'Why Choose MVG?', link: '/Admission/why-us' },
              ]} />
              <NavDropdown label="Gallery" isScrolled={isScrolled} items={[
                { label: 'Events', link: '/gallery/events' },
                { label: 'School Gallery', link: '/gallery/school-gallery' },
                { label: 'In the News', link: '/gallery/news' },
              ]} />
              <NavItem label="Contact" href="/contact" isScrolled={isScrolled} />
              <Link href="/apply" className="ml-4 bg-[#6366F1] text-white px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all">Apply Now!</Link>
            </div>

            <button onClick={() => setMobileMenu(true)} className="xl:hidden p-3 bg-white rounded-xl shadow-md text-[#6366F1]"><Menu size={20} /></button>
          </div>
        </nav>
      </header>

      {/* --- MOBILE OVERLAY MENU --- */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
            className="fixed inset-0 z-[300] bg-white flex flex-col"
          >
            {/* Mobile Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100">
                  <img src={LogoImg.src} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">Navigation</span>
              </div>
              <button 
                onClick={() => setMobileMenu(false)} 
                className="p-3 bg-slate-100 rounded-full text-slate-900 active:scale-90 transition-transform"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Menu Items */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col gap-2">
                <MobileNavItem label="Home" href="/" setMobileMenu={setMobileMenu} />
                
                <MobileNavDropdown label="About Us" items={[
                  { label: 'About School', link: '/About' },
                  { label: 'History', link: '/About/history' },
                  { label: 'Our Mission', link: '/About/mission' },
                  { label: 'Our Vision', link: '/About/vision' },
                  { label: "Director's Desk", link: '/About/director' },
                  { label: 'Our AIM', link: '/About/aim' },
                  { label: 'Faculties', link: '/About/faculty' },
                ]} setMobileMenu={setMobileMenu} />

                <MobileNavDropdown label="Academics" items={[
                  { label: 'Robotics', link: '/academics/robotics' },
                  { label: 'Visual Art', link: '/academics/visual-art' },
                  { label: 'Cultural', link: '/academics/cultural' },
                  { label: 'Awards', link: '/About/awards' },
                ]} setMobileMenu={setMobileMenu} />

                <MobileNavDropdown label="Admission" items={[
                  { label: 'Apply for 2026-27', link: '/apply' },
                  { label: 'Admission Enquiry', link: '/admission/enquiry' },
                  { label: 'How to Apply?', link: '/admission/process' },
                  { label: 'Fee Structure', link: '/admission/fees' },
                  { label: 'Admission Criteria', link: '/admission/criteria' },
                  { label: 'Why Choose MVG?', link: '/About/why-us' },
                ]} setMobileMenu={setMobileMenu} />

                <MobileNavDropdown label="Gallery" items={[
                  { label: 'Events', link: '/gallery/events' },
                  { label: 'School Gallery', link: '/gallery' },
                  { label: 'In the News', link: '/gallery/news' },
                ]} setMobileMenu={setMobileMenu} />

                <MobileNavItem label="Contact Us" href="/contact" setMobileMenu={setMobileMenu} />
              </div>
            </div>

            {/* Mobile Footer CTA */}
            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <Link 
                href="/apply" 
                onClick={() => setMobileMenu(false)}
                className="w-full bg-[#6366F1] text-white py-5 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100"
              >
                Apply for 2026-27 <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HERO SECTION --- */}
      <section className="relative h-[80vh] flex items-center justify-center bg-slate-900">
        <div className="absolute inset-0 opacity-40">
           <img src="https://res.cloudinary.com/db6ssceun/image/upload/v1766151247/ksc9iyuyyj7k0kibdsum.jpg" className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-[#FDF8F6]" />
        </div>
        <div className="relative z-10 text-center px-4">
          <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-6xl md:text-9xl font-black text-white uppercase italic tracking-tighter">
            OUR <span className="text-[#6366F1]">STORY.</span>
          </motion.h1>
        </div>
      </section>

     

     






          {/* --- SCHOOL IDENTITY & CORE DETAILS --- */}
      <section id="details" className="py-32 bg-white scroll-mt-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            
            {/* Left Side: Editorial Content */}
            <div className="space-y-12">
              <div className="space-y-4">
                <span className="text-[#6366F1] font-black tracking-[0.4em] uppercase text-[10px] block">Institutional Profile</span>
                <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.9] text-slate-900">
                  Where Tradition <br /> 
                  <span className="text-[#6366F1]">Meets Innovation.</span>
                </h2>
              </div>
              
              <div className="space-y-6 text-slate-600 text-lg leading-relaxed font-medium italic">
                <p>
                  Established in 1994, MVG Public School has grown from a visionary local school into a powerhouse of academic and athletic excellence in Rajasthan.
                </p>
              </div>

              {/* INTEGRATED CONTACT RIBBON */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-y border-slate-100">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-50 rounded-2xl text-[#6366F1]"><MapPin size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#6366F1] mb-1">Visit Us</p>
                    <p className="text-slate-900 font-bold text-sm leading-snug">Shyopur, Pratap Nagar, Sanganer, Jaipur <br/>India 302033</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-50 rounded-2xl text-[#6366F1]"><Phone size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#6366F1] mb-1">Call Us</p>
                    <p className="text-slate-900 font-bold text-sm">+91 9829018332</p>
                  
                  </div>
                </div>
              </div>

              {/* Quick Info Tags */}
              <div className="flex flex-wrap gap-3">
                {['RBSE Affiliated', 'Co-Ed Campus', 'K-12 Education', 'Smart Campus'].map((tag) => (
                  <span key={tag} className="px-5 py-2 rounded-full border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Side: Visual Stats & Identity */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-[#6366F1] p-10 rounded-[3rem] text-white">
                    <h3 className="text-5xl font-black italic mb-2">30+</h3>
                    <p className="text-white/80 uppercase tracking-widest text-[10px] font-bold">Years of Legacy</p>
                  </div>
                  <div className="bg-slate-900 p-10 rounded-[3rem] text-white">
                    <h3 className="text-5xl font-black italic mb-2">100%</h3>
                    <p className="text-white/80 uppercase tracking-widest text-[10px] font-bold">Result Record</p>
                  </div>
                </div>
                <div className="space-y-4 pt-12">
                  <div className="bg-slate-100 p-10 rounded-[3rem] text-slate-900 border border-slate-200">
                    <h3 className="text-5xl font-black italic mb-2">2200+</h3>
                    <p className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Global Alumni</p>
                  </div>
                  <div className="bg-[#6366F1]/10 p-10 rounded-[3rem] text-[#6366F1]">
                    <h3 className="text-5xl font-black italic mb-2">25+</h3>
                    <p className="text-[#6366F1]/80 uppercase tracking-widest text-[10px] font-bold">Quality Faculty</p>
                  </div>
                </div>
              </div>
              <div className="absolute -z-10 -right-20 -bottom-20 w-64 h-64 bg-[#6366F1]/5 rounded-full blur-3xl" />
            </div>

          </div>
        </div>
      </section>



          {/* --- MISSION & VISION (NEW PREMIUM BENTO DESIGN) --- */}
      <section className="py-32 px-4 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT: MAIN CONTENT (7 COLS) */}
          <div className="lg:col-span-7 space-y-8 flex flex-col">
            <div className="bg-white p-12 md:p-16 rounded-[4rem] shadow-sm border border-slate-100 flex-1">
              <motion.span 
                initial={{ opacity: 0 }} 
                whileInView={{ opacity: 1 }}
                className="text-[#6366F1] font-black tracking-[0.4em] uppercase text-[10px] mb-6 block"
              >
                Our Purpose
              </motion.span>
              <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none mb-8">
                Mission <br /> <span className="text-[#6366F1]">& Values.</span>
              </h2>
              <p className="text-xl md:text-2xl text-slate-500 leading-relaxed font-medium mb-12">
                We don't just teach subjects; we cultivate a mindset. At MVG Public School, we provide an environment that 
                encourages <span className="text-slate-900 border-b-2 border-[#6366F1]/30">infinite curiosity </span> 
                and fosters a relentless passion for excellence.
              </p>

              {/* ICON GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: <Target className="w-5 h-5" />, label: "Excellence", desc: "Setting global benchmarks." },
                  { icon: <ShieldCheck className="w-5 h-5" />, label: "Integrity", desc: "Honesty in every action." },
                  { icon: <Sparkles className="w-5 h-5" />, label: "Innovation", desc: "Future-ready learning." }
                ].map((v, i) => (
                  <div key={i} className="group p-6 rounded-3xl bg-slate-50 hover:bg-[#6366F1] transition-all duration-500">
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#6366F1] mb-4 group-hover:scale-110 transition-transform">
                      {v.icon}
                    </div>
                    <h4 className="font-black uppercase text-[10px] tracking-widest group-hover:text-white transition-colors">{v.label}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 group-hover:text-white/70 transition-colors">{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: VISION CARD (5 COLS) */}
          <div className="lg:col-span-5">
            <div className="h-full bg-slate-900 rounded-[4rem] p-12 md:p-16 relative overflow-hidden flex flex-col justify-end group shadow-2xl">
              {/* DECORATIVE BACKGROUND ELEMENT */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#6366F1] rounded-full blur-[120px] opacity-20 group-hover:opacity-40 transition-opacity" />
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-[#6366F1] rounded-3xl flex items-center justify-center mb-10 rotate-6 group-hover:rotate-0 transition-transform duration-500">
                  <Eye size={40} className="text-white" />
                </div>
                <h3 className="text-white text-4xl font-black uppercase italic tracking-tighter mb-6">
                  The <span className="text-[#6366F1]">Vision</span>
                </h3>
                <p className="text-xl md:text-2xl text-slate-300 font-medium italic leading-relaxed">
                  "To be a global lighthouse of knowledge, where tradition meets future-tech to produce leaders who change the world."
                </p>
                
                <div className="mt-12 pt-8 border-t border-white/10 flex items-center gap-4">
                 
                  
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>




                  {/* --- EDUCATIONAL PHILOSOPHY --- */}
      <section className="py-32 px-4 bg-[#FDF8F6]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <span className="text-[#6366F1] font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">How We Lead</span>
              <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
                The <span className="text-[#6366F1]">MVG</span> <br /> Method.
              </h2>
            </div>
            <p className="text-slate-500 font-medium max-w-xs pb-2 border-l-2 border-[#6366F1] pl-6">
              Our pedagogy is built on the pillars of inquiry, application, and character building.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: "01", title: "Inquiry Based", desc: "We encourage students to ask 'Why' before they learn 'How', sparking genuine curiosity.", icon: <Lightbulb /> },
              { num: "02", title: "Digital First", desc: "Integrating AI and global digital resources into the daily curriculum for a tech-ready future.", icon: <Globe /> },
              { num: "03", title: "Character Core", desc: "Focusing on empathy and leadership to ensure students grow as good humans, not just good scorers.", icon: <ShieldCheck /> }
            ].map((item, i) => (
              <div key={i} className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group">
                <div className="text-[#6366F1] mb-8 group-hover:scale-110 transition-transform duration-500">{item.icon}</div>
                <span className="text-4xl font-black text-slate-100 group-hover:text-[#6366F1]/10 transition-colors mb-4 block">{item.num}</span>
                <h4 className="text-2xl font-black uppercase italic mb-4 tracking-tighter">{item.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>










{/* --- PRINCIPAL'S MESSAGE (EDITORIAL DESIGN) --- */}
      <section className="py-40 bg-white relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#FDF8F6] -skew-x-12 translate-x-20 hidden lg:block" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            
            {/* IMAGE SIDE (5 COLS) */}
            <div className="lg:col-span-5 relative">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="relative z-10"
              >
                <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-white relative">
                  <img 
                    src={displayData.principal.image} 
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
                    alt="Principal"
                  />
                  {/* Floating Experience Badge */}
                  <div className="absolute bottom-6 right-6 bg-[#6366F1] text-white p-6 rounded-3xl shadow-xl hidden md:block">
                    <p className="text-3xl font-black italic leading-none">25+</p>
                    <p className="text-[8px] uppercase font-bold tracking-widest mt-1">Years of Leadership</p>
                  </div>
                </div>
              </motion.div>
              
              {/* Decorative Frame */}
              <div className="absolute -top-6 -left-6 w-full h-full border-2 border-[#6366F1]/20 rounded-[3rem] -z-10 hidden lg:block" />
            </div>

            {/* CONTENT SIDE (7 COLS) */}
            <div className="lg:col-span-7 space-y-10">
              <div className="space-y-4">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: "80px" }}
                  className="h-1.5 bg-[#6366F1] rounded-full"
                />
                <span className="text-[#6366F1] font-black uppercase tracking-[0.5em] text-[10px] block">
                  The Principal's Desk
                </span>
              </div>

              <div className="relative">
                {/* Large Decorative Quote Mark */}
                <span className="absolute -top-12 -left-8 text-[12rem] text-[#6366F1]/10 font-serif leading-none select-none">“</span>
                
                <h3 className="text-xl md:text-2xl font-medium text-slate-800 italic leading-tight relative z-10">
                  {displayData.principal.quote}
                </h3>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-8 pt-6">
                <div className="space-y-1">
                  <h4 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
                    {displayData.principal.name}
                  </h4>
                  <p className="text-[10px] font-black text-[#6366F1] uppercase tracking-[0.3em]">
                    Managing Director & Head of Institution
                  </p>
                </div>
                
               
              </div>

              
            </div>

          </div>
        </div>
      </section>




        


            {/* --- HISTORY & LEGACY (INTEGRATED BACKGROUND UI) --- */}
      <section id="history" className=" py-40 bg-[#FDF8F6] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative">
          
          <div className="text-center mb-48 space-y-4">
            <span className="text-[#6366F1] font-black tracking-[0.5em] uppercase text-[10px] block">Est. 1994</span>
            <h2 className="text-6xl md:text-9xl font-black uppercase italic tracking-tighter leading-none text-slate-900">
              The <span className="text-[#6366F1]">Timeline.</span>
            </h2>
          </div>

          <div className="space-y-80"> 
            {[
              {
                year: "1994",
                title: "The Visionary Start",
                desc: "A humble beginning with a revolutionary goal: to bring world-class education to the heart of Rajasthan.",
                img: "https://res.cloudinary.com/db6ssceun/image/upload/v1766658336/DSC06663_tsuoxo.jpg",
                align: "left"
              },
              {
                year: "2014",
                title: "A Vision for Transformation",
                desc: "The year 2014 marked a historic milestone in the school’s journey. Recognizing the changing educational needs of society and the growing importance of English-medium education, the management took a bold and visionary decision to completely transform the institution The school was re-established in 2010 as a fully English-medium school,",
                img: "https://res.cloudinary.com/db6ssceun/image/upload/v1766659018/DSC_0385_aojhyi.jpg",
                align: "right"
              },
              {
                year: "2025",
                title: "Future Ready",
                desc: "Now standing as a lighthouse of excellence, integrating AI-driven pedagogy and global exchange programs.",
                img: "https://res.cloudinary.com/db6ssceun/image/upload/v1766668550/WhatsApp_Image_2025-12-25_at_18.45.22_sdgubl.jpg",
                align: "left"
              }
            ].map((item, i) => (
              <div key={i} className={`relative flex flex-col ${item.align === 'left' ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-10`}>
                
                {/* BACKDROP YEAR: Blended with background */}
                <div className={`absolute -top-48 md:-top-64 ${item.align === 'left' ? 'left-0' : 'right-0'} pointer-events-none select-none z-0`}>
                  <motion.h3 
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5 }}
                    className="text-[14rem] md:text-[26rem] font-black leading-none tracking-tighter text-slate-900/[0.03]"
                  >
                    {item.year}
                  </motion.h3>
                </div>

                {/* CONTENT CARD */}
                <div className="flex-1 z-10 w-full">
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className={`max-w-md ${item.align === 'left' ? 'mr-auto text-left' : 'ml-auto text-right'}`}
                  >
                    <div className="flex flex-col gap-2 mb-8">
                        <span className="text-[#6366F1] font-black text-xs uppercase tracking-widest">Chapter {i + 1}</span>
                        <div className="w-12 h-1 bg-[#6366F1] rounded-full" />
                    </div>
                    <h4 className="text-4xl md:text-5xl font-black uppercase italic text-slate-900 mb-6 leading-tight tracking-tighter">
                      {item.title}
                    </h4>
                    <p className="text-slate-500 text-lg font-medium leading-relaxed italic">
                      {item.desc}
                    </p>
                  </motion.div>
                </div>

                {/* IMAGE COMPONENT */}
                <div className="flex-1 z-10 w-full group">
                  <motion.div 
                    initial={{ opacity: 0, x: item.align === 'left' ? 50 : -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative aspect-[16/11] rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)]"
                  >
                    <img 
                      src={item.img} 
                      className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105" 
                      alt={item.year} 
                    />
                  </motion.div>
                </div>

              </div>
            ))}
          </div>
        </div>
      </section>







      {/* --- FACULTY & LEADERSHIP SECTION --- */}
      <section className="py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="max-w-2xl">
              <span className="text-[#6366F1] font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">The Mentors</span>
              <h2 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.85] text-slate-900">
                OUR <br /> <span className="text-[#6366F1]">Faculty.</span>
              </h2>
            </div>
            <p className="text-slate-500 font-medium max-w-xs pb-2 border-l-2 border-[#6366F1] pl-6 italic">
              Our educators aren't just teachers; they are industry veterans, researchers, and lifelong mentors.
            </p>
          </div>

          {/* Faculty Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                name: "Kedar Mal Jat", 
                role: "HOD Mathematics", 
                exp: "15+ Years", 
                edu: "Ph.D. IIT Delhi",
                img: "https://res.cloudinary.com/db6ssceun/image/upload/v1766668773/DSC_1002_zazos5.jpg" 
              },
              { 
                name: "Pusparaj Choudhary", 
                role: "Management Staff", 
                exp: "7+ Years", 
                edu: "B.A,B.Ed, Rajasthan University",
                img: "https://res.cloudinary.com/db6ssceun/image/upload/v1766669135/124_rsixia.jpg" 
              },
              { 
                name: "Nishant Bhardwaj", 
                role: "Mathematics", 
                exp: "12+ Years", 
                edu: "",
                img: "https://res.cloudinary.com/db6ssceun/image/upload/v1766669134/45_jdnae8.jpg" 
              },
              { 
                name: "Rahul Choudhary", 
                role: "Robotics & AI Lab", 
                exp: "2+ Years", 
                edu: "National School of Drama",
                img: "https://res.cloudinary.com/db6ssceun/image/upload/v1766669134/874_osiqsv.jpg" 
              }
            ].map((staff, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative"
              >
                {/* Image Container */}
                <div className="relative aspect-[3/4] rounded-[3rem] overflow-hidden mb-6 shadow-xl">
                  <img 
                    src={staff.img} 
                    className="w-full h-full object-cover  transition-all duration-1000" 
                    alt={staff.name} 
                  />
                  
                  
                </div>

                {/* Text Content */}
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">{staff.name}</h4>
                    <span className="text-[10px] font-black text-[#6366F1] border border-[#6366F1]/20 px-2 py-1 rounded-full">{staff.exp}</span>
                  </div>
                  <p className="text-[#6366F1] font-black uppercase tracking-[0.2em] text-[10px]">{staff.role}</p>
                </div>
              </motion.div>
            ))}
          </div>

         
        </div>
      </section>





              {/* --- CAMPUS & FACILITIES SECTION --- */}
      <section className="py-32 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Header */}
          <div className="mb-20">
            <span className="text-[#6366F1] font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">Infrastructure</span>
            <h2 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none text-slate-900">
              The <span className="text-[#6366F1]">Campus.</span>
            </h2>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full lg:h-[800px]">
            
            {/* Main Feature: Digital Classrooms */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="md:col-span-8 relative rounded-[3rem] overflow-hidden group shadow-2xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1523050853051-f750c7582ef7?q=80&w=2070" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                alt="Digital Classrooms"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent p-12 flex flex-col justify-end">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white"><Users size={24} /></div>
                  <h3 className="text-3xl font-black text-white uppercase italic">Digital Classrooms</h3>
                </div>
                <p className="text-white/70 max-w-lg font-medium">
                  Equipped with smart boards and ergonomic seating, our classrooms are designed for collaborative, tech-enabled learning.
                </p>
              </div>
            </motion.div>

            {/* Side Feature 1: Science Labs */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="md:col-span-4 relative rounded-[3rem] overflow-hidden group shadow-xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070" 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                alt="Science Labs"
              />
              <div className="absolute inset-0 bg-[#6366F1]/10 group-hover:bg-transparent transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="p-3 bg-white w-fit rounded-2xl mb-4 text-[#6366F1] shadow-lg"><Microscope size={20} /></div>
                  <h3 className="text-xl font-black text-white uppercase italic bg-slate-900/50 backdrop-blur-md w-fit px-4 py-2 rounded-lg">Innovation Labs</h3>
              </div>
            </motion.div>

            {/* Bottom Left: Library */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="md:col-span-4 relative rounded-[3rem] overflow-hidden group shadow-xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1507738911748-9c7846279f05?q=80&w=2070" 
                className="w-full h-full object-cover transition-all duration-700 brightness-75 group-hover:brightness-100"
                alt="Library"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-widest border-2 border-white/50 px-6 py-2 rounded-full backdrop-blur-sm">The Library</h3>
              </div>
            </motion.div>

            {/* Bottom Right: Sports Complex */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="md:col-span-8 relative rounded-[3rem] overflow-hidden group shadow-2xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2070" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                alt="Sports"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-transparent p-12 flex flex-col justify-center">
                <span className="text-[#6366F1] font-black uppercase text-xs mb-2">Athletics</span>
                <h3 className="text-4xl font-black text-white uppercase italic leading-none mb-4">Olympic Grade <br /> Sports Arena</h3>
                <div className="w-12 h-1 bg-[#6366F1] rounded-full" />
              </div>
            </motion.div>

          </div>
        </div>
      </section>







              {/* --- TESTIMONIALS SECTION --- */}
      <section className="py-32 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="flex flex-col md:flex-row justify-between items-start mb-24 gap-8">
            <div>
              <span className="text-[#6366F1] font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">Voices of MVG</span>
              <h2 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">
                The <span className="text-[#6366F1]">Impact.</span>
              </h2>
            </div>
            <div className="flex gap-4 pt-4">
               {/* Custom Navigation buttons could go here */}
               <Quote size={60} className="text-[#6366F1] opacity-20" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {[
              {
                quote: "MVG Academy didn't just teach me science; they taught me how to think. The labs and the mentors here are at par with international standards.",
                author: "Arjun Shekhawat",
                status: "Alumni, Stanford University",
                img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974"
              },
              {
                quote: "As a parent, I've seen my daughter transform from a shy student to a confident leader. The focus on holistic growth is what sets this school apart.",
                author: "Dr. Meera Oberoi",
                status: "Parent (Batch 2024)",
                img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974"
              },
              {
                quote: "The sports infrastructure here is incredible. It provided me the perfect launchpad for my national-level career in athletics.",
                author: "Kabir Singh",
                status: "National Athlete",
                img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1974"
              }
            ].map((t, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="relative group"
              >
                {/* Large Background Quote Mark */}
                <div className="absolute -top-10 -left-6 text-9xl font-black text-white/[0.03] pointer-events-none">“</div>
                
                <div className="relative z-10 space-y-8">
                  <p className="text-xl md:text-2xl font-medium leading-relaxed italic text-slate-300">
                    "{t.quote}"
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                      <img src={t.img} className="w-full h-full object-cover" alt={t.author} />
                    </div>
                    <div>
                      <h4 className="font-black uppercase italic tracking-tighter text-white">{t.author}</h4>
                      <p className="text-[#6366F1] text-[10px] font-black uppercase tracking-widest">{t.status}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>




            {/* --- PREMIUM FOOTER --- */}
      <footer className="bg-[#0A0A0A] text-white pt-24 pb-12 rounded-t-[0rem] overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-4 md:grid-cols-2 gap-16">
          <div className="col-span-full lg:col-span-2 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white p-2">
                <img src={LogoImg.src} alt="Footer Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase italic leading-none">MVG Academy</h3>
                <p className="text-[#6366F1] text-[10px] font-black tracking-[0.3em] uppercase mt-1">Nurturing Brilliance</p>
              </div>
            </div>
            <p className="text-slate-500 max-w-sm text-sm leading-relaxed">
              Redefining education through innovation and traditional values. Join us in shaping the leaders of tomorrow in the heart of Jaipur.
            </p>
          </div>

          <div className="space-y-6">
            <h5 className="text-white font-black uppercase text-[10px] tracking-widest border-b border-white/10 pb-4">Quick Links</h5>
            <div className="grid gap-3">
              {['Campus', 'Admissions', 'Academic', 'Facilities'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-slate-400 hover:text-[#6366F1] text-sm font-medium transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h5 className="text-white font-black uppercase text-[10px] tracking-widest border-b border-white/10 pb-4">Follow Us</h5>
            <div className="flex gap-4">
                <SocialCircle icon={<Instagram size={18}/>} />
                <SocialCircle icon={<Facebook size={18}/>} />
                <SocialCircle icon={<Twitter size={18}/>} />
            </div>
            <p className="text-slate-500 text-[10px] font-medium italic">Updates daily on socials</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em]">© 2025 MVG ACADEMY • PREMIER INSTITUTION</p>
          <div className="flex gap-8">
            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest hover:text-slate-400 cursor-pointer">Privacy</span>
            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest hover:text-slate-400 cursor-pointer">Terms</span>
          </div>
        </div>
      </footer>




    </div>
  );
}



    








// Small Helper Components
// --- MOBILE ACCORDION ENGINE ---
function MobileNavDropdown({ label, items, setMobileMenu }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-50 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-5 text-left"
      >
        <span className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">{label}</span>
        <ChevronDown size={20} className={`text-[#6366F1] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1 pb-4 pl-4 border-l-2 border-[#6366F1]/20 ml-2">
              {items.map((item, idx) => (
                <Link 
                  key={idx} 
                  href={item.link} 
                  onClick={() => setMobileMenu(false)}
                  className="py-3 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-[#6366F1]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileNavItem({ label, href, setMobileMenu }) {
  return (
    <Link 
      href={href} 
      onClick={() => setMobileMenu(false)}
      className="py-5 border-b border-slate-50 last:border-0 block"
    >
      <span className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">{label}</span>
    </Link>
  );
}






function NavItem({ label, href, isScrolled }) {
  return (
    <Link href={href} className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors hover:text-[#6366F1] ${
      isScrolled ? 'text-slate-600' : 'text-white/80'
    }`}>
      {label}
    </Link>
  );
}

// Sub-Component: Dropdown Engine
function NavDropdown({ label, items, isScrolled }) {
  return (
    <div className="relative group px-4 py-2 cursor-pointer">
      <div className={`flex items-center gap-1 text-[11px] font-black uppercase tracking-widest group-hover:text-[#6366F1] transition-colors ${
        isScrolled ? 'text-slate-600' : 'text-white/80'
      }`}>
        {label} <ChevronDown size={12} className="group-hover:rotate-180 transition-transform" />
      </div>
      
      {/* The Actual Dropdown Menu */}
      <div className="absolute top-full left-0 pt-4 opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
        <div className="bg-white min-w-[240px] shadow-2xl rounded-2xl border border-slate-50 p-3 grid gap-1">
          {items.map((item, idx) => (
            <Link key={idx} href={item.link} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-[#6366F1] transition-all">
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function SocialCircle({ icon }) {
  return <div className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-[#6366F1] transition-all cursor-pointer">{icon}</div>;
}