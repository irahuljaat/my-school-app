"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../../images/logo.jpg';
import { 
  Menu, X, Facebook, Instagram, ChevronDown, 
  ArrowRight, Calendar, Camera, Play, Filter,
  Maximize2, Phone, Mail, MapPin
} from 'lucide-react';

export default function EventsGallery() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [filter, setFilter] = useState('All');

  // Sample Event Data - This can also be fetched from Firebase 'gallery' collection
  const events = [
    { id: 1, title: "Annual Day 2024", category: "Cultural", img: "https://images.unsplash.com/photo-1514525253361-bee8718a7439?q=80&w=1973" },
    { id: 2, title: "Tech-Innova Expo", category: "Science", img: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070" },
    { id: 3, title: "Inter-School Athletics", category: "Sports", img: "https://images.unsplash.com/photo-1526676023641-72e0429d8f34?q=80&w=2070" },
    { id: 4, title: "Robotics Championship", category: "Science", img: "https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?q=80&w=1974" },
    { id: 5, title: "Art & Craft Workshop", category: "Cultural", img: "https://images.unsplash.com/photo-1460533893735-45cea2212645?q=80&w=2128" },
    { id: 6, title: "Independence Day", category: "General", img: "https://images.unsplash.com/photo-1532375811408-1b390000758a?q=80&w=2070" },
  ];

  const categories = ['All', 'Cultural', 'Science', 'Sports', 'General'];

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) setData(docSnap.data());
      setLoading(false);
    });
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => { unsub(); window.removeEventListener('scroll', handleScroll); };
  }, []);

  const filteredEvents = filter === 'All' ? events : events.filter(e => e.category === filter);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white italic font-light tracking-widest text-slate-400 uppercase text-[10px]">Loading Visual Memories...</div>;

  return (
    <div className="bg-white text-[#1a1a1a] antialiased">
      
      {/* --- TOP BAR --- */}
      <div className="hidden lg:block bg-[#0a0a0a] text-slate-400 py-3 relative z-[110]">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em]">
          <div className="flex gap-8">
            <span className="flex items-center gap-2"><Phone size={12} className="text-[#6366F1]" /> {data?.phone || "+91 141 2345678"}</span>
            <span className="flex items-center gap-2"><Mail size={12} className="text-[#6366F1]" /> media@mvgacademy.com</span>
          </div>
          <div className="flex gap-4 border-l border-white/10 pl-6">
              <Facebook size={14} className="hover:text-[#6366F1] cursor-pointer" />
              <Instagram size={14} className="hover:text-[#6366F1] cursor-pointer" />
          </div>
        </div>
      </div>

      {/* --- HEADER --- */}
      <header className={`fixed w-full z-[100] transition-all duration-700 ${isScrolled ? 'top-0 py-4 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm' : 'lg:top-10 py-8 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-4">
            <img src={LogoImg.src} alt="Logo" className="w-10 h-10 object-contain rounded-full" />
            <div className="flex flex-col">
              <span className={`text-lg font-bold tracking-tight ${isScrolled ? 'text-slate-900' : 'text-white'}`}>MVG Academy</span>
              <span className="text-[9px] font-black text-[#6366F1] uppercase tracking-[0.3em]">Moments</span>
            </div>
          </Link>
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/" className={`text-[11px] font-bold uppercase tracking-widest ${isScrolled ? 'text-slate-600' : 'text-white'}`}>Home</Link>
            <Link href="/admission" className="bg-[#6366F1] text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-slate-900 transition-all">Enroll 2025</Link>
          </div>
          <button onClick={() => setMobileMenu(true)} className={`lg:hidden ${isScrolled ? 'text-slate-900' : 'text-white'}`}><Menu size={24}/></button>
        </div>
      </header>

      {/* --- HERO: GALLERY --- */}
      <section className="relative h-[60vh] flex items-end pb-20 bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070" className="w-full h-full object-cover opacity-40 grayscale" alt="Events Hero" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-8 relative z-10 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-[#6366F1] text-[11px] font-bold uppercase tracking-[0.5em] mb-4 block">Archive of Excellence</span>
            <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tighter leading-[0.95]">Events & <br/><span className="italic font-light text-slate-500">Exhibitions.</span></h1>
          </motion.div>
        </div>
      </section>

      {/* --- FILTER BAR --- */}
      <section className="sticky top-[70px] lg:top-[85px] z-50 bg-white border-b border-slate-100 py-6">
          <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                  {categories.map((cat) => (
                      <button 
                        key={cat} 
                        onClick={() => setFilter(cat)}
                        className={`text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full transition-all ${filter === cat ? 'bg-black text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                      >
                          {cat}
                      </button>
                  ))}
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  <Camera size={14} className="text-[#6366F1]"/> Showing {filteredEvents.length} Memories
              </div>
          </div>
      </section>

      {/* --- MASONRY GRID --- */}
      <section className="py-20 px-8 bg-white min-h-[100vh]">
          <div className="max-w-7xl mx-auto">
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <AnimatePresence>
                    {filteredEvents.map((event) => (
                        <motion.div 
                            key={event.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4 }}
                            className="group relative h-[450px] rounded-[2.5rem] overflow-hidden bg-slate-100 border border-slate-50"
                        >
                            <img src={event.img} alt={event.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="absolute bottom-0 p-8 w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                <span className="text-[#6366F1] text-[9px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md px-3 py-1 rounded-full mb-4 inline-block">{event.category}</span>
                                <h3 className="text-2xl font-bold text-white tracking-tight mb-4">{event.title}</h3>
                                <button className="flex items-center gap-2 text-white text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all delay-100">
                                    View Album <ArrowRight size={14} className="text-[#6366F1]"/>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                  </AnimatePresence>
              </motion.div>
          </div>
      </section>

      {/* --- CALL TO ACTION --- */}
      <section className="py-24 px-8 bg-slate-50 border-y border-slate-100">
          <div className="max-w-3xl mx-auto text-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-8 text-[#6366F1]"><Play size={24}/></div>
              <h2 className="text-4xl font-bold tracking-tight mb-6">Experience our Campus Live.</h2>
              <p className="text-slate-400 font-light mb-10 leading-relaxed">Want to see the classrooms and labs in person? Book a guided campus tour for your family today.</p>
              <Link href="/contact" className="inline-flex items-center gap-4 bg-black text-white px-10 py-5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#6366F1] transition-all">Schedule Visit <Calendar size={14}/></Link>
          </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white py-12 px-8 border-t border-slate-100 text-center">
        <div className="text-xl font-bold tracking-tighter italic uppercase text-[#6366F1] mb-4">MVG ACADEMY</div>
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">Jaipur • Memories Since 1998</p>
      </footer>

    </div>
  );
}