"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../../images/logo.jpg';
import { 
  Menu, X, Facebook, Instagram, ChevronDown, 
  ArrowUpRight, Palette, Brush, Scissors, Camera, 
  Phone, Mail, MapPin, Globe, Sparkles, Image as ImageIcon
} from 'lucide-react';

export default function VisualArtsPage() {
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-white italic font-light tracking-widest text-slate-400 uppercase text-[10px]">Unveiling the Canvas...</div>;

  return (
    <div className="bg-white text-[#1a1a1a] antialiased selection:bg-[#6366F1] selection:text-white">
      
      {/* --- 1. TOP CONTACT BAR --- */}
      <div className="hidden lg:block bg-[#0a0a0a] text-slate-400 py-3 relative z-[110]">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em]">
          <div className="flex gap-8">
            <span className="flex items-center gap-2 hover:text-white transition-colors"><Phone size={12} className="text-[#6366F1]" /> {data?.phone || "+91 141 2345678"}</span>
            <span className="flex items-center gap-2 hover:text-white transition-colors"><Mail size={12} className="text-[#6366F1]" /> {data?.email || "arts@mvgacademy.com"}</span>
          </div>
          <div className="flex gap-6 items-center">
            <span className="flex items-center gap-2"><MapPin size={12} className="text-[#6366F1]" /> Arts District, Jaipur</span>
            <div className="flex gap-4 border-l border-white/10 pl-6">
              <Facebook size={14} className="hover:text-[#6366F1] cursor-pointer" />
              <Instagram size={14} className="hover:text-[#6366F1] cursor-pointer" />
            </div>
          </div>
        </div>
      </div>

      {/* --- 2. HEADER --- */}
      <header className={`fixed w-full z-[100] transition-all duration-700 ${isScrolled ? 'top-0 py-4 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm' : 'lg:top-10 py-8 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 overflow-hidden shadow-sm">
                <img src={LogoImg.src} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className={`text-lg font-bold tracking-tight transition-colors duration-500 ${isScrolled ? 'text-slate-900' : 'text-white'}`}>{data?.schoolName || "MVG Academy"}</span>
              <span className="text-[9px] font-medium tracking-[0.4em] text-[#6366F1] uppercase">Creative Arts</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-2">
            <NavItem label="Home" href="/" isScrolled={isScrolled} />
            <NavDropdown label="Academics" isScrolled={isScrolled} items={[{ label: 'Robotics & AI', link: '/academics/robotics' }, { label: 'Visual Arts', link: '/academics/arts' }, { label: 'Faculty', link: '/About/faculty' }]} />
            <NavItem label="Exhibition" href="#gallery" isScrolled={isScrolled} />
            <Link href="/apply" className="ml-6 bg-[#6366F1] text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100">Apply Now</Link>
          </div>

          <button onClick={() => setMobileMenu(true)} className={`lg:hidden p-2 ${isScrolled ? 'text-slate-900' : 'text-white'}`}><Menu size={24} /></button>
        </div>
      </header>

      {/* --- 3. MOBILE MENU --- */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 z-[200] bg-white flex flex-col">
            <div className="p-8 flex justify-between items-center border-b border-slate-50">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6366F1]">The Studio</div>
              <button onClick={() => setMobileMenu(false)} className="p-2 bg-slate-50 rounded-full"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              <MobileLink label="Home" href="/" setMobileMenu={setMobileMenu} />
              <MobileAccordion label="Departments" isOpen={activeMobileSub === 'dept'} onClick={() => setActiveMobileSub(activeMobileSub === 'dept' ? null : 'dept')} items={[{label: 'Visual Arts', href: '/academics/arts'}, {label: 'Robotics', href: '/academics/robotics'}]} setMobileMenu={setMobileMenu} />
              <MobileLink label="Careers" href="/About/faculty#careers" setMobileMenu={setMobileMenu} />
              <MobileLink label="Contact" href="/contact" setMobileMenu={setMobileMenu} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 4. HERO: ARTISTIC EXPRESSION --- */}
      <section className="relative h-[70vh] flex items-center bg-[#fdfdfd] overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }}>
            <span className="text-[#6366F1] text-[11px] font-bold uppercase tracking-[0.4em] mb-6 block italic">The Fine Arts Wing</span>
            <h1 className="text-6xl md:text-[7.5rem] font-bold tracking-tighter leading-[0.9] mb-8">
              Where <span className="italic font-light text-slate-300">Soul</span> meets <span className="text-[#6366F1]">Canvas.</span>
            </h1>
            <p className="text-slate-500 text-lg font-light leading-relaxed max-w-md">
              Our Visual Arts program empowers students to find their unique voice through traditional techniques and contemporary media.
            </p>
          </motion.div>
          <div className="relative hidden lg:block">
            <div className="aspect-[4/5] bg-slate-100 rounded-[4rem] overflow-hidden rotate-3 scale-95 shadow-2xl">
                <img src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2071" className="w-full h-full object-cover" alt="Art Studio" />
            </div>
          </div>
        </div>
      </section>

      {/* --- 5. THE CREATIVE DISCIPLINES --- */}
      <section className="py-32 px-8 bg-white border-y border-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <ArtPillar icon={<Palette size={24}/>} title="Painting" desc="Mastering oils, acrylics, and the heritage of Indian watercolours." />
            <ArtPillar icon={<Brush size={24}/>} title="Sculpting" desc="Hands-on clay modeling and structural design in our pottery studio." />
            <ArtPillar icon={<Camera size={24}/>} title="Digital Arts" desc="Modern graphic design, digital illustration, and 2D animation." />
            <ArtPillar icon={<Scissors size={24}/>} title="Mixed Media" desc="Exploring the boundaries of collage, textiles, and installation art." />
          </div>
        </div>
      </section>

      {/* --- 6. STUDENT GALLERY (COLOURFUL ON MOBILE) --- */}
      <section id="gallery" className="py-32 px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 italic font-serif">The Student Exhibition.</h2>
            <div className="w-20 h-[1px] bg-[#6366F1] mx-auto" />
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <GalleryItem img="https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1976" title="Heritage in Ink" year="2024" />
            <GalleryItem img="https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=1974" title="Modern Perspectives" year="2024" />
            <GalleryItem img="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=2090" title="Floral Abstract" year="2023" />
        </div>
      </section>

      {/* --- 7. FOOTER --- */}
      <footer className="bg-white pt-32 pb-12 px-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 lg:col-span-2 space-y-8">
                <div className="text-xl font-bold tracking-tighter italic uppercase text-[#6366F1]">MVG ACADEMY</div>
                <p className="text-slate-400 font-light text-sm max-w-sm">Nurturing the creative spirit and building the future leaders of the global art world.</p>
            </div>
            <FooterCol title="Studios" items={['Traditional Lab', 'Digital Suite', 'Sculpture Garden']} />
            <FooterCol title="Connect" items={['Virtual Gallery', 'Instagram', 'Contact']} />
        </div>
        <div className="max-w-7xl mx-auto pt-10 border-t border-slate-50 flex justify-between text-[9px] font-bold uppercase tracking-[0.4em] text-slate-300">
            <span>© 2025 MVG CREATIVE ARTS</span>
            <span>Jaipur, RJ</span>
        </div>
      </footer>
    </div>
  );
}

// --- ART COMPONENTS ---
function ArtPillar({ icon, title, desc }) {
  return (
    <div className="p-8 border border-slate-50 hover:border-slate-200 rounded-[2.5rem] transition-all hover:bg-slate-50/50">
      <div className="mb-6 text-[#6366F1]">{icon}</div>
      <h3 className="text-xl font-bold mb-3 tracking-tight">{title}</h3>
      <p className="text-slate-400 text-xs font-light leading-relaxed">{desc}</p>
    </div>
  );
}

function GalleryItem({ img, title, year }) {
  return (
    <div className="group cursor-pointer">
      <div className="aspect-square rounded-[2rem] overflow-hidden mb-6 border border-slate-100 shadow-sm">
        {/* Colorful on mobile, Grayscale on desktop hover */}
        <img src={img} className="w-full h-full object-cover lg:grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" alt={title} />
      </div>
      <h4 className="text-lg font-bold tracking-tight">{title}</h4>
      <p className="text-[#6366F1] text-[9px] font-bold uppercase tracking-widest">{year} Exhibition Item</p>
    </div>
  );
}

// --- HELPER UI ---
function NavItem({ label, href, isScrolled }) {
  return <Link href={href} className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest hover:text-[#6366F1] transition-colors ${isScrolled ? 'text-slate-600' : 'text-white'}`}>{label}</Link>;
}
function NavDropdown({ label, items, isScrolled }) {
  return (
    <div className="relative group px-4 py-2 cursor-pointer">
      <div className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest group-hover:text-[#6366F1] transition-colors ${isScrolled ? 'text-slate-600' : 'text-white'}`}>
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
function FooterCol({ title, items }) {
  return (
    <div className="space-y-6">
      <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300">{title}</h5>
      <ul className="space-y-3 text-xs font-bold text-slate-500 uppercase tracking-widest">{items.map((it, i) => <li key={i} className="hover:text-[#6366F1] transition-colors cursor-pointer">{it}</li>)}</ul>
    </div>
  );
}