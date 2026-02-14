"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../../images/logo.jpg';
import { 
  Eye, Globe, Lightbulb, Sun, ChevronDown, ArrowRight,
  Menu, X, Facebook, Instagram, Twitter, Mail, Phone, MapPin, ArrowUpRight
} from 'lucide-react';

export default function VisionPage() {
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

      {/* --- 2. VISION HERO (DARK BACKGROUND FOR HEADER VISIBILITY) --- */}
      <section className="relative min-h-[70vh] flex items-center bg-slate-950 overflow-hidden">
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1949" 
            className="w-full h-full object-cover opacity-30 grayscale" 
            alt="Vision Background" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full pt-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="text-[#6366F1] font-black tracking-[0.4em] uppercase text-xs mb-6 block">Our Future Path</span>
            <h1 className="text-6xl md:text-9xl font-black uppercase text-white tracking-tighter leading-[0.85] mb-8">
              The <br /><span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] to-blue-400">Vision</span>
            </h1>
            <p className="text-slate-300 text-lg font-medium max-w-xl leading-relaxed">
              We envision a future where education transcends boundaries, empowering every student to become a compassionate leader and a lifelong innovator.
            </p>
          </motion.div>
        </div>
      </section>

      {/* --- 3. VISION DETAILS --- */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
                <div className="relative inline-block mb-10">
                    <Sun size={60} className="text-[#6366F1] animate-pulse" />
                    <div className="absolute -inset-4 bg-[#6366F1]/10 rounded-full blur-xl" />
                </div>
                <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-tight mb-8">
                    To be the <span className="text-[#6366F1]">Light</span> of Global Education.
                </h2>
                <div className="space-y-8">
                    <div className="flex gap-6 items-start">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 text-[#6366F1]">
                            <Globe size={24} />
                        </div>
                        <div>
                            <h4 className="font-black uppercase tracking-widest mb-2">Global Citizens</h4>
                            <p className="text-slate-500">Preparing students to engage with the world with empathy and cultural intelligence.</p>
                        </div>
                    </div>
                    <div className="flex gap-6 items-start">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 text-[#6366F1]">
                            <Lightbulb size={24} />
                        </div>
                        <div>
                            <h4 className="font-black uppercase tracking-widest mb-2">Holistic Growth</h4>
                            <p className="text-slate-500">Focusing on emotional, physical, and intellectual development in equal measure.</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="order-1 lg:order-2">
                <div className="relative">
                    <div className="aspect-square bg-slate-100 rounded-[4rem] overflow-hidden shadow-2xl">
                        <img src="https://res.cloudinary.com/db6ssceun/image/upload/v1766670728/WhatsApp_Image_2025-12-25_at_19.21.37_rd3idi.jpg" className="w-full h-full object-cover" alt="Vision Image" />
                    </div>
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#6366F1] rounded-full flex items-center justify-center text-white text-center p-4">
                        <span className="text-[10px] font-black uppercase tracking-widest">Est. 1994</span>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 4. FOOTER --- */}
      <footer className="bg-slate-900 pt-24 pb-12 px-6 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="space-y-6">
              <div className="text-2xl font-black tracking-tighter uppercase italic text-white">{data?.schoolName || "MVG ACADEMY"}</div>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">Crafting futures and inspiring excellence through quality education.</p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#6366F1] transition-all"><Facebook size={18} /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#6366F1] transition-all"><Instagram size={18} /></a>
              </div>
            </div>

            <div>
              <h4 className="font-black uppercase tracking-widest text-[10px] mb-8 text-white/40">Navigation</h4>
              <ul className="space-y-4 text-sm font-bold uppercase">
                <li><Link href="/About" className="hover:text-[#6366F1] transition-colors">About Us</Link></li>
                <li><Link href="/admission" className="hover:text-[#6366F1] transition-colors">Admissions</Link></li>
                <li><Link href="/contact" className="hover:text-[#6366F1] transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black uppercase tracking-widest text-[10px] mb-8 text-white/40">Academics</h4>
              <ul className="space-y-4 text-sm font-bold uppercase">
                <li className="hover:text-[#6366F1] cursor-pointer">Curriculum</li>
                <li className="hover:text-[#6366F1] cursor-pointer">Robotics Lab</li>
                <li className="hover:text-[#6366F1] cursor-pointer">Sports</li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-black uppercase tracking-widest text-[10px] mb-8 text-white/40">Contact</h4>
              <div className="flex items-start gap-4 text-sm font-medium">
                <MapPin size={20} className="text-[#6366F1] shrink-0" />
                <p className="text-slate-300">{data?.address || "123 Education Lane, Jaipur"}</p>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium">
                <Phone size={20} className="text-[#6366F1] shrink-0" />
                <p className="text-slate-300">{data?.phone || "+91 (141) 2345-678"}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">© 2025 {data?.schoolName || "MVG ACADEMY"}. Built for Excellence.</p>
          </div>
        </div>
      </footer>
    </div>
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