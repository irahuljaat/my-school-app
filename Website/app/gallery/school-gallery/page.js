"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../../images/logo.jpg';
import { 
  Menu, X, Facebook, Instagram, ChevronDown, 
  ArrowRight, Camera, Play, Layers,
  Maximize2, Phone, Mail, Image as ImageIcon,
  Compass, Heart, Award
} from 'lucide-react';

export default function SchoolGallery() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('Campus');

  // Categorized Gallery Assets
  const galleryData = {
    Campus: [
      { id: 1, title: "Modern Robotics Lab", img: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070" },
      { id: 2, title: "Olympic Size Pool", img: "https://images.unsplash.com/photo-1519315901367-f34ff9154487?q=80&w=2070" },
      { id: 3, title: "The Central Library", img: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=2070" },
    ],
    Learning: [
      { id: 4, title: "Physics Experiment", img: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2070" },
      { id: 5, title: "Digital Arts Workshop", img: "https://images.unsplash.com/photo-1547891269-045ad91d039b?q=80&w=2070" },
      { id: 6, title: "Morning Assembly", img: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070" },
    ],
    Life: [
      { id: 7, title: "Annual Sports Meet", img: "https://images.unsplash.com/photo-1511871893393-82e9c16b81e3?q=80&w=2070" },
      { id: 8, title: "Cultural Heritage Fest", img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070" },
      { id: 9, title: "Convocation Ceremony", img: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070" },
    ]
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) setData(docSnap.data());
      setLoading(false);
    });
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => { unsub(); window.removeEventListener('scroll', handleScroll); };
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white italic font-light tracking-widest text-slate-400 uppercase text-[10px]">Curation in Progress...</div>;

  return (
    <div className="bg-white text-[#1a1a1a] antialiased">
      
      {/* --- HEADER (Consistent with Robotics/Why Choose) --- */}
      <header className={`fixed w-full z-[100] transition-all duration-700 ${isScrolled ? 'top-0 py-4 bg-white/95 backdrop-blur-md border-b border-slate-100' : 'lg:top-10 py-8 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 overflow-hidden shadow-sm">
                <img src={LogoImg.src} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className={`text-lg font-bold tracking-tight transition-colors duration-500 ${isScrolled ? 'text-slate-900' : 'text-white'}`}>{data?.schoolName || "MVG Academy"}</span>
              <span className="text-[9px] font-black text-[#6366F1] uppercase tracking-[0.4em]">Visual Gallery</span>
            </div>
          </Link>
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/" className={`text-[11px] font-bold uppercase tracking-widest ${isScrolled ? 'text-slate-600' : 'text-white'}`}>Home</Link>
            <Link href="/admission" className="bg-[#6366F1] text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-slate-900 transition-all">Apply Online</Link>
          </div>
        </div>
      </header>

      {/* --- HERO: IMMERSIVE IMAGE --- */}
      <section className="relative h-[70vh] flex items-center bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=2070" className="w-full h-full object-cover opacity-30 grayscale" alt="Campus" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-8 relative z-10 w-full">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <span className="text-[#6366F1] text-[11px] font-black uppercase tracking-[0.6em] mb-6 block">Window into MVG</span>
            <h1 className="text-6xl md:text-[10rem] font-bold text-white tracking-tighter leading-[0.8] mb-8">
              Visual <br/><span className="italic font-light text-slate-500 text-[0.8em]">Heritage.</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* --- GALLERY EXPLORER --- */}
      <section className="py-32 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          
          {/* CATEGORY SWITCHER */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-20">
              <div className="max-w-md">
                  <h2 className="text-4xl font-bold tracking-tight mb-6 italic">Curation of Moments.</h2>
                  <p className="text-slate-400 font-light leading-relaxed">Explore the architecture, the academic rigor, and the vibrant student life that defines the MVG experience.</p>
              </div>
              <div className="flex gap-1 border-b border-slate-100 w-full md:w-auto overflow-x-auto no-scrollbar">
                  {Object.keys(galleryData).map((tab) => (
                      <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)}
                        className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-[#6366F1]' : 'text-slate-300'}`}
                      >
                          {tab}
                          {activeTab === tab && <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-1 bg-[#6366F1]" />}
                      </button>
                  ))}
              </div>
          </div>

          {/* DYNAMIC MASONRY GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="wait">
              {galleryData[activeTab].map((item, index) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative group overflow-hidden rounded-[2.5rem] border border-slate-50 ${index === 1 ? 'md:row-span-2 h-full' : 'h-[400px]'}`}
                >
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000 ease-in-out" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <div className="absolute bottom-0 left-0 p-10 translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <span className="text-[#6366F1] text-[9px] font-black uppercase tracking-[0.3em] mb-2 block">Feature Collection</span>
                        <h4 className="text-white text-xl font-bold tracking-tight">{item.title}</h4>
                    </div>
                    <div className="absolute top-8 right-8 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 size={18}/>
                    </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="py-24 px-8 bg-slate-50 border-y border-slate-100">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-20">
              <Stat icon={<Compass/>} value="25 Acres" label="Lush Green Campus" />
              <Stat icon={<Heart/>} value="1500+" label="Happy Students" />
              <Stat icon={<Award/>} value="50+" label="Excellence Awards" />
          </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white pt-24 pb-12 px-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-xl font-bold tracking-tighter italic text-[#6366F1] uppercase">MVG ACADEMY</div>
            <div className="flex gap-8 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <Link href="/admission" className="hover:text-black">Admissions</Link>
                <Link href="/events" className="hover:text-black">Events</Link>
                <Link href="/contact" className="hover:text-black">Contact</Link>
            </div>
            <div className="flex gap-4">
                <Facebook size={16} className="text-slate-300 hover:text-black cursor-pointer transition-colors" />
                <Instagram size={16} className="text-slate-300 hover:text-black cursor-pointer transition-colors" />
            </div>
        </div>
      </footer>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function Stat({ icon, value, label }) {
    return (
        <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-[#6366F1] mb-6 group-hover:-translate-y-2 transition-transform duration-500">
                {icon}
            </div>
            <div className="text-4xl font-bold tracking-tighter mb-2">{value}</div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">{label}</div>
        </div>
    );
}