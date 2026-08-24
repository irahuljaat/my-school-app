"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../../images/logo.jpg';
import { 
  History as HistoryIcon, Target, Star, ChevronDown, ArrowRight,
  Quote, GraduationCap, Building2, Map, Menu, X,
  Facebook, Instagram, Twitter, Mail, Phone, MapPin, ArrowUpRight
} from 'lucide-react';

export default function HistoryPage() {
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
    <div className="bg-[#FDFBF9] text-slate-900 antialiased overflow-x-hidden font-sans">
      
      {/* --- 1. HEADER & NAVIGATION --- */}
      <header className="fixed w-full z-[100]">
        <div className={`hidden xl:block border-b transition-all duration-500 ${
          isScrolled ? 'bg-slate-900 border-white/5 py-1' : 'bg-black/20 backdrop-blur-md border-white/10 py-2'
        }`}>
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-white/90">
            <div className="flex gap-8 items-center">
              <a href={`tel:${data?.phone || "+911412345678"}`} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#6366F1]">
                <Phone size={12} className="text-[#6366F1]" />
                <span>{data?.phone || "+91 (141) 2345-678"}</span>
              </a>
              <a href={`mailto:${data?.email || "info@mvgacademy.edu"}`} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#6366F1]">
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

            <button onClick={() => setMobileMenu(true)} className={`xl:hidden p-3 rounded-xl shadow-md ${isScrolled ? 'bg-slate-100 text-[#6366F1]' : 'bg-white text-[#6366F1]'}`}>
              <Menu size={20} />
            </button>
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
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100">
                  <img src={LogoImg.src} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">Navigation</span>
              </div>
              <button onClick={() => setMobileMenu(false)} className="p-3 bg-slate-100 rounded-full text-slate-900">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col gap-2">
                <MobileNavItem label="Home" href="/" setMobileMenu={setMobileMenu} />
                <MobileNavDropdown label="About Us" items={[{ label: 'About School', link: '/About' }, { label: 'History', link: '/About/history' }, { label: 'Our Mission', link: '/About/mission' }, { label: 'Our Vision', link: '/About/vision' }, { label: "Director's Desk", link: '/About/director' }, { label: 'Our AIM', link: '/About/aim' }, { label: 'Faculties', link: '/About/faculty' }]} setMobileMenu={setMobileMenu} />
                <MobileNavDropdown label="Academics" items={[{ label: 'Robotics', link: '/academics/robotics' }, { label: 'Visual Art', link: '/academics/visual-art' }, { label: 'Cultural', link: '/academics/cultural' }, { label: 'Awards', link: '/About/awards' }]} setMobileMenu={setMobileMenu} />
                <MobileNavDropdown label="Admission" items={[{ label: 'Apply for 2026-27', link: '/apply' }, { label: 'Admission Enquiry', link: '/admission/enquiry' }, { label: 'How to Apply?', link: '/admission/process' }, { label: 'Fee Structure', link: '/admission/fees' }, { label: 'Admission Criteria', link: '/admission/criteria' }, { label: 'Why Choose MVG?', link: '/About/why-us' }]} setMobileMenu={setMobileMenu} />
                <MobileNavDropdown label="Gallery" items={[{ label: 'Events', link: '/gallery/events' }, { label: 'School Gallery', link: '/gallery' }, { label: 'In the News', link: '/gallery/news' }]} setMobileMenu={setMobileMenu} />
                <MobileNavItem label="Contact Us" href="/contact" setMobileMenu={setMobileMenu} />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <Link href="/apply" onClick={() => setMobileMenu(false)} className="w-full bg-[#6366F1] text-white py-5 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100">
                Apply for 2026-27 <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 2. HISTORY HERO --- */}
      <section className="relative min-h-[70vh] flex items-center bg-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2071" 
            className="w-full h-full object-cover opacity-20"
            alt="Legacy"
          />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <span className="text-[#6366F1] font-black tracking-[0.4em] uppercase text-xs mb-4 block underline underline-offset-8 decoration-2">Our Heritage</span>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white leading-[0.9] mb-8">
              Decades of <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 italic">Impact.</span>
            </h1>
            <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-xl">
              Since 1994, we have been crafting a legacy of academic rigor and character building in the heart of Jaipur.
            </p>
          </motion.div>
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

      {/* --- 4. FOUNDER SECTION --- */}
      <section className="py-32 bg-slate-50 rounded-[3rem] mx-4 md:mx-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="aspect-square rounded-[3rem] overflow-hidden  shadow-2xl">
              <img src="https://res.cloudinary.com/db6ssceun/image/upload/v1766668773/DSC_1002_zazos5.jpg" className="w-full h-full object-cover" alt="Founder" />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white p-10 rounded-[2rem] shadow-xl">
               <Quote size={40} className="text-[#6366F1]" />
            </div>
          </div>
          <div className="space-y-8">
            <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none">A Word from the <span className="text-[#6366F1]">Chair.</span></h2>
            <p className="text-xl text-slate-600 font-medium italic leading-relaxed">
              "Education is not merely the acquisition of knowledge; it is the foundation upon which character, confidence, and capability are built. At our school, we believe that true education nurtures the mind, shapes values, and prepares students to face life with integrity and responsibility.

Our institution has a long-standing connection with the community. While the school existed earlier with a strong focus on Hindi-medium education, the year 2014 marked a defining moment in our journey. Understanding the changing demands of the modern world and the importance of global communication, we took a visionary step to re-establish the school as a fully English-medium institution with a renewed academic structure, modern teaching practices, and a broader educational outlook."
            </p>
            <div className="pt-6 border-t border-slate-200">
              <p className="text-2xl font-black uppercase italic tracking-tighter">Kedar Mal Jat</p>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6366F1]">Founder & Director</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 5. ADMISSION CTA --- */}
      {data?.admissionOpen && (
        <section className="py-40 bg-white text-center px-6">
          <div className="max-w-4xl mx-auto p-16 bg-slate-900 rounded-[3.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 text-white/5"><GraduationCap size={160} /></div>
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white mb-6">Start Your <span className="text-[#6366F1]">History</span> Here.</h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">Admissions are officially open for {data?.academicYear || "2026-27"}. Join the legacy of MVG Academy.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Link href="/apply" className="bg-[#6366F1] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all">Apply Now 2026</Link>
              <button className="bg-white/10 text-white border border-white/20 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-all">Download Brochure</button>
            </div>
          </div>
        </section>
      )}

      {/* --- 6. FOOTER --- */}
      <footer className="bg-white border-t border-slate-100 pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="space-y-6">
              <div className="text-2xl font-black tracking-tighter uppercase italic">{data?.schoolName || "MVG ACADEMY"}</div>
              <p className="text-slate-500 text-sm font-medium">Empowering minds and building character since 1998. The gold standard for education in Jaipur.</p>
              <div className="flex gap-4">
                <a href={data?.facebook} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-[#6366F1] hover:text-white transition-all"><Facebook size={18} /></a>
                <a href={data?.instagram} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-[#6366F1] hover:text-white transition-all"><Instagram size={18} /></a>
                <a href={data?.twitter} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-[#6366F1] hover:text-white transition-all"><Twitter size={18} /></a>
              </div>
            </div>

            <div>
              <h4 className="font-black uppercase tracking-widest text-xs mb-8">Navigation</h4>
              <ul className="space-y-4 text-sm font-bold uppercase text-slate-500">
                <li><Link href="/About" className="hover:text-[#6366F1] flex items-center gap-2">About Us <ArrowUpRight size={14}/></Link></li>
                <li><Link href="/admission" className="hover:text-[#6366F1] flex items-center gap-2">Admissions <ArrowUpRight size={14}/></Link></li>
                <li><Link href="/academics" className="hover:text-[#6366F1] flex items-center gap-2">Academics <ArrowUpRight size={14}/></Link></li>
                <li><Link href="/gallery" className="hover:text-[#6366F1] flex items-center gap-2">Gallery <ArrowUpRight size={14}/></Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black uppercase tracking-widest text-xs mb-8">Resources</h4>
              <ul className="space-y-4 text-sm font-bold uppercase text-slate-500">
                <li className="hover:text-[#6366F1] cursor-pointer">Student Login</li>
                <li className="hover:text-[#6366F1] cursor-pointer">Parent Portal</li>
                <li className="hover:text-[#6366F1] cursor-pointer">Fee Payment</li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-black uppercase tracking-widest text-xs mb-2">Get in touch</h4>
              <div className="flex items-start gap-4 text-sm font-medium text-slate-500">
                <MapPin size={20} className="text-[#6366F1] shrink-0" />
                <p>{data?.address || "123 Education Lane, Vidhyadhar Nagar, Jaipur, RJ 302023"}</p>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                <Phone size={20} className="text-[#6366F1] shrink-0" />
                <p>{data?.phone || "+91 (141) 2345-678"}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <p>© 2025 {data?.schoolName || "MVG ACADEMY"}. All Rights Reserved.</p>
            <p className="text-slate-300">Designed with precision for Excellence</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function NavItem({ label, href, isScrolled }) {
  return (
    <Link href={href} className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors hover:text-[#6366F1] ${
      isScrolled ? 'text-slate-600' : 'text-white/80'
    }`}>
      {label}
    </Link>
  );
}

function NavDropdown({ label, items, isScrolled }) {
  return (
    <div className="relative group px-4 py-2 cursor-pointer">
      <div className={`flex items-center gap-1 text-[11px] font-black uppercase tracking-widest group-hover:text-[#6366F1] transition-colors ${
        isScrolled ? 'text-slate-600' : 'text-white/80'
      }`}>
        {label} <ChevronDown size={12} className="group-hover:rotate-180 transition-transform" />
      </div>
      <div className="absolute top-full left-0 pt-4 opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
        <div className="bg-white min-w-[240px] shadow-2xl rounded-2xl border border-slate-50 p-3 grid gap-1">
          {items.map((item, idx) => (
            <Link key={idx} href={item.link} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-[#6366F1] transition-all group/item">
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileNavItem({ label, href, setMobileMenu }) {
  return (
    <Link href={href} onClick={() => setMobileMenu(false)} className="py-5 border-b border-slate-50 last:border-0 block">
      <span className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">{label}</span>
    </Link>
  );
}

function MobileNavDropdown({ label, items, setMobileMenu }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-50 last:border-0">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center py-5 text-left">
        <span className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">{label}</span>
        <ChevronDown size={20} className={`text-[#6366F1] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex flex-col gap-1 pb-4 pl-4 border-l-2 border-[#6366F1]/20 ml-2">
              {items.map((item, idx) => (
                <Link key={idx} href={item.link} onClick={() => setMobileMenu(false)} className="py-3 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-[#6366F1]">
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