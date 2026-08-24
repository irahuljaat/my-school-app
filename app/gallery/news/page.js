"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../../images/logo.jpg';
import { 
  Menu, X, Newspaper, Calendar, ExternalLink, Facebook, Instagram, 
  ChevronRight, Share2, Award, Phone, Mail, MapPin 
} from 'lucide-react';

export default function DynamicNewsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    // Syncing with site_data/config as requested
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      }
      setLoading(false);
    });

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => { unsub(); window.removeEventListener('scroll', handleScroll); };
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#fcfcfc] italic font-medium tracking-widest text-slate-400 uppercase text-[10px]">Scanning Archives...</div>;

  // Extract news from firebase or use fallback if empty
  const newsUpdates = data?.news || [];

  return (
    <div className="bg-[#fcfcfc] text-[#1a1a1a] antialiased">
      
      {/* --- HEADER --- */}
      <header className={`fixed w-full z-[100] transition-all duration-700 ${isScrolled ? 'top-0 py-4 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm' : 'lg:top-10 py-8 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-4">
            <img src={LogoImg.src} alt="Logo" className="w-10 h-10 object-contain rounded-full border border-slate-100" />
            <div className="flex flex-col">
              <span className={`text-lg font-bold tracking-tight ${isScrolled ? 'text-slate-900' : 'text-white'}`}>MVG Academy</span>
              <span className="text-[9px] font-black text-[#6366F1] uppercase tracking-[0.4em]">Press Room</span>
            </div>
          </Link>
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/" className={`text-[11px] font-bold uppercase tracking-widest ${isScrolled ? 'text-slate-600' : 'text-white'}`}>Home</Link>
            <Link href="/admission" className="bg-[#6366F1] text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-slate-900 transition-all">Join Us</Link>
          </div>
        </div>
      </header>

      {/* --- HERO: NEWS --- */}
      <section className="relative h-[50vh] flex items-center bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0 bg-[#6366F1]/10" />
        <div className="max-w-7xl mx-auto px-8 relative z-10 w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-[#6366F1] text-[11px] font-black uppercase tracking-[0.6em] mb-6 block">In the Spotlight</span>
            <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tighter leading-none mb-4">News & <br/><span className="italic font-light text-slate-500">Press.</span></h1>
          </motion.div>
        </div>
      </section>

      {/* --- MAIN NEWS FEED --- */}
      <main className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex items-center gap-4 mb-16 border-b border-slate-100 pb-8">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#6366F1]"><Newspaper size={24}/></div>
              <div>
                  <h2 className="text-2xl font-bold tracking-tight">Recent Coverage</h2>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Latest media mentions for {data?.schoolName}</p>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <AnimatePresence>
              {newsUpdates.length > 0 ? (
                newsUpdates.map((item, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    {/* News Cutting / Image Container */}
                    <div className="relative aspect-[3/4] overflow-hidden rounded-[2.5rem] bg-slate-200 mb-8 border border-slate-100 shadow-sm group-hover:shadow-2xl group-hover:shadow-indigo-100 transition-all duration-500">
                        <img 
                          src={item.imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070"} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        />
                        <div className="absolute top-6 left-6">
                            <span className="bg-white/90 backdrop-blur-md text-black text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-sm">
                                {item.source || "Press Release"}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-2">
                        <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                            <Calendar size={12} className="text-[#6366F1]"/> {item.date || "March 2025"}
                        </div>
                        <h3 className="text-xl font-bold tracking-tight mb-4 group-hover:text-[#6366F1] transition-colors leading-snug">
                            {item.title || "Innovation Award Won by MVG Academy Students"}
                        </h3>
                        <p className="text-slate-500 text-sm font-light leading-relaxed mb-6 line-clamp-2 italic">
                            {item.description || "Leading publications highlight our commitment to modern robotics and academic excellence."}
                        </p>
                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] group-hover:gap-4 transition-all">
                            View Full Clipping <ChevronRight size={14} className="text-[#6366F1]"/>
                        </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                    <p className="text-slate-300 font-light italic">No news updates available in the feed currently.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-white pt-24 pb-12 px-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tighter italic text-[#6366F1]">MVG PRESS HUB</span>
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] mt-2">© 2025 MVG ACADEMY JAIPUR</span>
            </div>
            <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center hover:bg-black hover:text-white transition-all cursor-pointer"><Facebook size={16}/></div>
                <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center hover:bg-black hover:text-white transition-all cursor-pointer"><Instagram size={16}/></div>
            </div>
        </div>
      </footer>
    </div>
  );
}