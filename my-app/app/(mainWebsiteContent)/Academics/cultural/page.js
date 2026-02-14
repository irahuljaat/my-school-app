"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../../images/logo.jpg';
import { 
  Menu, X, Facebook, Instagram, ChevronDown, 
  Music, Theater, Mic2, Heart, Phone, Mail, 
  MapPin, Sparkles, PlayCircle, Star, Calendar, Quote
} from 'lucide-react';

export default function CulturalLovePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeMobileSub, setActiveMobileSub] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) setData(docSnap.data());
      setLoading(false);
    });
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => { unsub(); window.removeEventListener('scroll', handleScroll); };
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white italic font-light tracking-widest text-slate-400 uppercase text-[10px]">Gathering the Artiste...</div>;

  return (
    <div className="bg-[#fffcf9] text-[#1a1a1a] antialiased selection:bg-[#fbbf24] selection:text-black">
      
      {/* --- 1. TOP CONTACT BAR --- */}
      <div className="hidden lg:block bg-[#0a0a0a] text-slate-400 py-3 relative z-[110]">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em]">
          <div className="flex gap-8">
            <span className="flex items-center gap-2 hover:text-white transition-colors"><Phone size={12} className="text-[#fbbf24]" /> {data?.phone || "+91 141 2345678"}</span>
            <span className="flex items-center gap-2 hover:text-white transition-colors"><Mail size={12} className="text-[#fbbf24]" /> {data?.email || "culture@mvgacademy.com"}</span>
          </div>
          <div className="flex gap-6 items-center">
            <span className="flex items-center gap-2"><MapPin size={12} className="text-[#fbbf24]" /> The Pink City, Jaipur</span>
            <div className="flex gap-4 border-l border-white/10 pl-6">
              <Facebook size={14} className="hover:text-[#fbbf24] cursor-pointer transition-colors" />
              <Instagram size={14} className="hover:text-[#fbbf24] cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* --- 2. HEADER --- */}
      <header className={`fixed w-full z-[100] transition-all duration-700 ${isScrolled ? 'top-0 py-4 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm' : 'lg:top-10 py-8 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 overflow-hidden shadow-sm">
                <img src={LogoImg.src} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className={`text-lg font-bold tracking-tight transition-colors duration-500 ${isScrolled ? 'text-slate-900' : 'text-white'}`}>{data?.schoolName || "MVG Academy"}</span>
              <span className="text-[9px] font-medium tracking-[0.4em] text-[#fbbf24] uppercase">Hearts of Culture</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-2">
            <NavItem label="Home" href="/" isScrolled={isScrolled} />
            <NavDropdown label="Academics" isScrolled={isScrolled} items={[{ label: 'Robotics', link: '/academics/robotics' }, { label: 'Visual Arts', link: '/academics/arts' }, { label: 'Cultural Love', link: '/academics/cultural' }]} />
            <NavItem label="Careers" href="/About/faculty#careers" isScrolled={isScrolled} />
            <Link href="/apply" className="ml-6 bg-black text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#fbbf24] hover:text-black transition-all">Join Our Family</Link>
          </div>

          <button onClick={() => setMobileMenu(true)} className={`lg:hidden p-2 ${isScrolled ? 'text-slate-900' : 'text-white'}`}><Menu size={24} /></button>
        </div>
      </header>

      {/* --- 3. MOBILE MENU --- */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 z-[200] bg-white flex flex-col">
            <div className="p-8 flex justify-between items-center border-b border-orange-50">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#fbbf24]">Cultural Hub</div>
              <button onClick={() => setMobileMenu(false)} className="p-2 bg-orange-50 rounded-full"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              <MobileLink label="Home" href="/" setMobileMenu={setMobileMenu} />
              <MobileAccordion label="Experience" isOpen={activeMobileSub === 'exp'} onClick={() => setActiveMobileSub(activeMobileSub === 'exp' ? null : 'exp')} items={[{label: 'Visual Arts', href: '/academics/arts'}, {label: 'Robotics & AI', href: '/academics/robotics'}]} setMobileMenu={setMobileMenu} />
              <MobileLink label="School Careers" href="/About/faculty#careers" setMobileMenu={setMobileMenu} />
              <MobileLink label="Contact" href="/contact" setMobileMenu={setMobileMenu} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 4. HERO: VIBRANT LOVE FOR CULTURE --- */}
      <section className="relative h-[85vh] flex items-center bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070" className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-1000" alt="Cultural Dance" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-8 relative z-10 w-full">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }}>
            <div className="flex items-center gap-3 mb-6">
                <Heart className="text-[#fbbf24] fill-[#fbbf24]" size={20} />
                <span className="text-[#fbbf24] text-[10px] font-bold uppercase tracking-[0.5em]">A Legacy of Jaipur</span>
            </div>
            <h1 className="text-6xl md:text-[9rem] font-bold text-white tracking-tighter leading-[0.85] mb-8">
              Soul of the <br/><span className="italic font-light text-slate-400 underline decoration-1 underline-offset-[12px]">Academy.</span>
            </h1>
            <p className="max-w-xl text-slate-300 text-lg md:text-xl font-light leading-relaxed">
              At MVG Academy, culture isn't a subject—it's the heartbeat of our halls. From the rhythm of the Tabla to the grace of the Ghoomar, we live and breathe our heritage every single day.
            </p>
          </motion.div>
        </div>
      </section>

      {/* --- 5. THE CULTURAL CALENDAR (EVENTS) --- */}
      <section className="py-32 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Our Celebration Cycle.</h2>
            <p className="text-slate-400 font-light">Culture at MVG is a year-round journey. We don't just wait for the annual day; we celebrate every season.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <EventCard month="AUG" event="Virasat Fest" desc="A week-long immersion into folk crafts and traditional Rajasthani music." />
            <EventCard month="OCT" event="Navrang" desc="The grand celebration of dance, drama, and the triumph of light." />
            <EventCard month="JAN" event="Kite Symphony" desc="Celebrating Makar Sankranti with Jaipur's traditional kite-flying spirit." />
            <EventCard month="APR" event="Sanskriti" desc="Our flagship Annual Performing Arts Showcase at the city auditorium." />
          </div>
        </div>
      </section>

      {/* --- 6. "LIVING THE HERITAGE" (COLOURFUL GALLERY) --- */}
      <section className="py-24 px-8 bg-[#fffcf9]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-square rounded-[2rem] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1514525253344-f81bcd0ce582?q=80&w=1974" className="w-full h-full object-cover" alt="Dance" />
            </div>
            <div className="aspect-square rounded-[2rem] overflow-hidden translate-y-8">
                <img src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=2069" className="w-full h-full object-cover" alt="Music" />
            </div>
            <div className="aspect-square rounded-[2rem] overflow-hidden -translate-y-4">
                <img src="https://images.unsplash.com/photo-1503095396549-80703901828b?q=80&w=2070" className="w-full h-full object-cover" alt="Theater" />
            </div>
            <div className="aspect-square rounded-[2rem] overflow-hidden translate-y-4">
                <img src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070" className="w-full h-full object-cover" alt="Festival" />
            </div>
          </div>
          <div className="space-y-10 lg:pl-10">
            <Quote className="text-[#fbbf24] opacity-20" size={60} />
            <h2 className="text-5xl font-bold tracking-tight leading-tight">Roots that go deep, <br/> Wings that fly high.</h2>
            <p className="text-slate-500 font-light text-lg italic">
              "We believe that a student who knows their roots is a student who can stand tall anywhere in the world. Our school isn't just about grades; it's about the character formed in the resonance of the sitar and the precision of the stage."
            </p>
            <div className="pt-6">
                <p className="text-sm font-bold uppercase tracking-widest text-slate-900">— The Cultural Dean, MVG Academy</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 7. FOOTER --- */}
      <footer className="bg-white pt-32 pb-12 px-8 border-t border-orange-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
            <div className="space-y-6">
                <div className="text-xl font-bold tracking-tighter italic uppercase text-[#fbbf24]">MVG ACADEMY</div>
                <p className="text-slate-400 font-light text-sm max-w-xs leading-relaxed">Preserving the vibrant heritage of Jaipur through education, art, and love since 1998.</p>
            </div>
            <div className="flex gap-20">
                <FooterGroup title="Heritage" items={['Dance Wing', 'Music Lab', 'Theater Studio']} />
                <FooterGroup title="Join" items={['Careers', 'Admissions', 'Visit Us']} />
            </div>
            <div className="lg:text-right">
                <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300 mb-6">Connect With Us</h5>
                <div className="flex lg:justify-end gap-6 text-slate-400">
                    <Facebook size={20} className="hover:text-[#fbbf24] cursor-pointer" />
                    <Instagram size={20} className="hover:text-[#fbbf24] cursor-pointer" />
                </div>
            </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-bold uppercase tracking-[0.4em] text-slate-300">
            <span>© 2025 MVG ACADEMY JAIPUR</span>
            <span>Made with ❤️ for Jaipur</span>
        </div>
      </footer>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function EventCard({ month, event, desc }) {
  return (
    <div className="p-8 bg-white border border-slate-50 hover:border-[#fbbf24] rounded-[2.5rem] transition-all hover:shadow-2xl hover:shadow-orange-50/50 group">
      <span className="text-4xl font-black text-slate-100 group-hover:text-orange-50 transition-colors block mb-4">{month}</span>
      <h3 className="text-xl font-bold mb-3 tracking-tight">{event}</h3>
      <p className="text-slate-400 text-xs font-light leading-relaxed">{desc}</p>
    </div>
  );
}

function NavItem({ label, href, isScrolled }) {
  return <Link href={href} className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest hover:text-[#fbbf24] transition-colors ${isScrolled ? 'text-slate-600' : 'text-white'}`}>{label}</Link>;
}

function NavDropdown({ label, items, isScrolled }) {
  return (
    <div className="relative group px-4 py-2 cursor-pointer">
      <div className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest group-hover:text-[#fbbf24] transition-colors ${isScrolled ? 'text-slate-600' : 'text-white'}`}>
        {label} <ChevronDown size={10} className="group-hover:rotate-180 transition-transform duration-300" />
      </div>
      <div className="absolute top-full left-0 pt-6 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
        <div className="bg-white min-w-[200px] shadow-2xl rounded-2xl border border-slate-50 p-2">
          {items.map((it, i) => <Link key={i} href={it.link} className="block px-4 py-3 rounded-xl hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#fbbf24] transition-all">{it.label}</Link>)}
        </div>
      </div>
    </div>
  );
}

function MobileLink({ label, href, setMobileMenu }) {
  return <Link href={href} onClick={() => setMobileMenu(false)} className="block p-4 text-xl font-bold tracking-tighter uppercase italic text-slate-900 border-b border-orange-50">{label}</Link>;
}

function MobileAccordion({ label, items, isOpen, onClick, setMobileMenu }) {
  return (
    <div className="border-b border-orange-50">
      <button onClick={onClick} className="w-full flex justify-between items-center p-4 text-xl font-bold tracking-tighter uppercase italic">{label} <ChevronDown size={18} /></button>
      {isOpen && <div className="bg-orange-50/50 rounded-2xl mb-4">{items.map((it, i) => <Link key={i} href={it.href} onClick={() => setMobileMenu(false)} className="block p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">{it.label}</Link>)}</div>}
    </div>
  );
}

function FooterGroup({ title, items }) {
  return (
    <div className="space-y-6">
      <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300">{title}</h5>
      <ul className="space-y-3 text-xs font-bold text-slate-500 uppercase tracking-widest">{items.map((it, i) => <li key={i} className="hover:text-[#fbbf24] transition-colors cursor-pointer">{it}</li>)}</ul>
    </div>
  );
}