"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../../images/logo.jpg';
import { 
  Menu, X, Facebook, Instagram, ChevronDown, 
  Trophy, Medal, Star, Award, Phone, Mail, 
  MapPin, Crown, Target, Sparkles, ArrowUpRight
} from 'lucide-react';

export default function AwardsPage() {
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-white italic font-light tracking-widest text-slate-400 uppercase text-[10px]">Polishing the Trophies...</div>;

  return (
    <div className="bg-white text-[#1a1a1a] antialiased selection:bg-[#D4AF37] selection:text-white">
      
      {/* --- 1. TOP CONTACT BAR --- */}
      <div className="hidden lg:block bg-[#0a0a0a] text-slate-400 py-3 relative z-[110]">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em]">
          <div className="flex gap-8">
            <span className="flex items-center gap-2 hover:text-white transition-colors"><Phone size={12} className="text-[#D4AF37]" /> {data?.phone || "+91 141 2345678"}</span>
            <span className="flex items-center gap-2 hover:text-white transition-colors"><Mail size={12} className="text-[#D4AF37]" /> {data?.email || "awards@mvgacademy.com"}</span>
          </div>
          <div className="flex gap-6 items-center">
            <span className="flex items-center gap-2"><MapPin size={12} className="text-[#D4AF37]" /> Excellence Circle, Jaipur</span>
            <div className="flex gap-4 border-l border-white/10 pl-6">
              <Facebook size={14} className="hover:text-[#D4AF37] cursor-pointer" />
              <Instagram size={14} className="hover:text-[#D4AF37] cursor-pointer" />
            </div>
          </div>
        </div>
      </div>

      {/* --- 2. HEADER WITH SUBMENUS --- */}
      <header className={`fixed w-full z-[100] transition-all duration-700 ${isScrolled ? 'top-0 py-4 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm' : 'lg:top-10 py-8 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 overflow-hidden shadow-sm">
                <img src={LogoImg.src} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className={`text-lg font-bold tracking-tight transition-colors duration-500 ${isScrolled ? 'text-slate-900' : 'text-white'}`}>{data?.schoolName || "MVG Academy"}</span>
              <span className="text-[9px] font-medium tracking-[0.4em] text-[#D4AF37] uppercase">The Hall of Fame</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-2">
            <NavItem label="Home" href="/" isScrolled={isScrolled} />
            <NavDropdown label="Academics" isScrolled={isScrolled} items={[
                { label: 'Robotics & AI', link: '/academics/robotics' },
                { label: 'Cultural Love', link: '/academics/cultural' },
                { label: 'Visual Arts', link: '/academics/arts' }
            ]} />
            <NavItem label="Careers" href="/About/faculty#careers" isScrolled={isScrolled} />
            <Link href="/contact" className="ml-6 bg-black text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all">Get in Touch</Link>
          </div>

          <button onClick={() => setMobileMenu(true)} className={`lg:hidden p-2 ${isScrolled ? 'text-slate-900' : 'text-white'}`}><Menu size={24} /></button>
        </div>
      </header>

      {/* --- 3. MOBILE MENU --- */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 z-[200] bg-white flex flex-col">
            <div className="p-8 flex justify-between items-center border-b border-slate-50">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]">Navigation</div>
              <button onClick={() => setMobileMenu(false)} className="p-2 bg-slate-50 rounded-full"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              <MobileLink label="Home" href="/" setMobileMenu={setMobileMenu} />
              <MobileAccordion label="Excellence" isOpen={activeMobileSub === 'awards'} onClick={() => setActiveMobileSub(activeMobileSub === 'awards' ? null : 'awards')} items={[
                  {label: 'Robotics AI', href: '/academics/robotics'},
                  {label: 'Cultural Love', href: '/academics/cultural'}
              ]} setMobileMenu={setMobileMenu} />
              <MobileLink label="Careers" href="/About/faculty#careers" setMobileMenu={setMobileMenu} />
              <MobileLink label="Contact" href="/contact" setMobileMenu={setMobileMenu} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 4. HERO: THE HALL OF FAME --- */}
      <section className="relative h-[70vh] flex items-center bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=2070" className="w-full h-full object-cover opacity-30 grayscale" alt="Winners" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
        </div>
        <div className="max-w-7xl mx-auto px-8 relative z-10 w-full text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }}>
            <span className="text-[#D4AF37] text-[11px] font-bold uppercase tracking-[0.6em] mb-6 block">Celebrating Victory</span>
            <h1 className="text-6xl md:text-[9rem] font-bold text-white tracking-tighter leading-none mb-8">
              Awards & <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB]">Honours.</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* --- 5. MAJOR ACHIEVEMENTS GRID --- */}
      <section className="py-32 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AchievementCard icon={<Crown size={32}/>} year="2025" title="Best Innovative School" org="National STEM Council" />
                <AchievementCard icon={<Medal size={32}/>} year="2024" title="State Cultural Excellence" org="Rajasthan Arts Board" />
                <AchievementCard icon={<Target size={32}/>} year="2024" title="Academic Leadership Award" org="Jaipur Education Forum" />
            </div>
        </div>
      </section>

      {/* --- 6. MOMENTS OF PRIDE (VIBRANT MOBILE IMAGES) --- */}
      <section className="py-24 px-8 bg-[#fdfaf0] border-y border-orange-100">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-8">
                    <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest">Our Legacy</span>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight">More than just trophies, <br/> it's about the <span className="italic">growth.</span></h2>
                    <p className="text-slate-500 font-light text-lg leading-relaxed">Every award sitting in our halls represents a student who pushed their limits, a teacher who inspired, and a school that never settled for average.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                        <img src="https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?q=80&w=1974" className="w-full h-full object-cover" alt="Student Medal" />
                    </div>
                    <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl translate-y-8">
                        <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070" className="w-full h-full object-cover" alt="Graduation" />
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- 7. FOOTER --- */}
      <footer className="bg-white pt-32 pb-12 px-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 lg:col-span-2 space-y-8">
                <div className="text-xl font-bold tracking-tighter italic uppercase text-[#D4AF37]">MVG ACADEMY</div>
                <p className="text-slate-400 font-light text-sm max-w-sm">Nurturing excellence and celebrating the unique journey of every student since 1998.</p>
            </div>
            <FooterCol title="Sections" items={['Robotics', 'Cultural', 'Arts', 'Faculty']} />
            <FooterCol title="Social" items={['Facebook', 'Instagram', 'Twitter']} />
        </div>
        <div className="max-w-7xl mx-auto pt-10 border-t border-slate-50 flex justify-between items-center text-[9px] font-bold uppercase tracking-[0.4em] text-slate-300">
            <span>© 2025 MVG EXCELLENCE</span>
            <span>Jaipur, RJ</span>
        </div>
      </footer>
    </div>
  );
}

// --- UI COMPONENTS ---
function AchievementCard({ icon, year, title, org }) {
    return (
        <div className="p-10 bg-white border border-slate-50 hover:border-[#D4AF37] rounded-[3rem] transition-all hover:shadow-2xl hover:shadow-orange-50 group">
            <div className="text-[#D4AF37] mb-8 group-hover:scale-110 transition-transform duration-500">{icon}</div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300 mb-2 block">{year}</span>
            <h3 className="text-xl font-bold mb-4 tracking-tight">{title}</h3>
            <p className="text-slate-400 text-xs font-light tracking-widest uppercase">{org}</p>
        </div>
    );
}

function NavItem({ label, href, isScrolled }) {
    return <Link href={href} className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest hover:text-[#D4AF37] transition-colors ${isScrolled ? 'text-slate-600' : 'text-white'}`}>{label}</Link>;
}

function NavDropdown({ label, items, isScrolled }) {
    return (
      <div className="relative group px-4 py-2 cursor-pointer">
        <div className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest group-hover:text-[#D4AF37] transition-colors ${isScrolled ? 'text-slate-600' : 'text-white'}`}>
          {label} <ChevronDown size={10} className="group-hover:rotate-180 transition-transform duration-300" />
        </div>
        <div className="absolute top-full left-0 pt-6 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
          <div className="bg-white min-w-[200px] shadow-2xl rounded-2xl border border-slate-50 p-2">
            {items.map((it, i) => <Link key={i} href={it.link} className="block px-4 py-3 rounded-xl hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#D4AF37] transition-all">{it.label}</Link>)}
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
            <ul className="space-y-3 text-xs font-bold text-slate-500 uppercase tracking-widest">{items.map((it, i) => <li key={i} className="hover:text-[#D4AF37] transition-colors cursor-pointer">{it}</li>)}</ul>
        </div>
    );
}