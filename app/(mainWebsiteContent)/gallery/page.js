"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase/config'; 
import { collection, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X, ChevronLeft, ChevronRight, Clock, Camera } from 'lucide-react';

export default function SchoolGallery() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "gallery"), (snapshot) => {
      const galleryData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const allImages = galleryData.flatMap(album => {
        return Object.entries(album)
          .filter(([key]) => key.startsWith('image'))
          .map(([key, url]) => ({
            url,
            date: album.id,
            id: `${album.id}-${key}`
          }));
      });

      setAlbums(allImages.sort((a, b) => b.date.localeCompare(a.date)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const nextImage = useCallback(() => {
    if (currentIndex !== null) setCurrentIndex((prev) => (prev + 1) % albums.length);
  }, [currentIndex, albums.length]);

  const prevImage = useCallback(() => {
    if (currentIndex !== null) setCurrentIndex((prev) => (prev - 1 + albums.length) % albums.length);
  }, [currentIndex, albums.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (currentIndex === null) return;
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'Escape') setCurrentIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, nextImage, prevImage]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/20 animate-pulse italic">
        Rendering Excellence...
      </div>
    </div>
  );

  return (
    <div className="bg-[#0a0a0a] min-h-screen antialiased selection:bg-[#6366F1]">
      
      {/* --- PREMIUM HEADER --- */}
      <header className="relative pt-32 pb-20 px-8 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[#6366F1]/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
              <Camera size={14} className="text-[#6366F1]" />
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em]">Institutional Gallery</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tighter mb-8 leading-[0.85]">
              Moments of <br/><span className="italic font-light text-white/30">Discovery.</span>
            </h1>
            <p className="max-w-xl mx-auto text-slate-500 text-sm font-light leading-relaxed">
              A visual journey through academic rigor, athletic spirit, and the daily pursuit of excellence.
            </p>
          </motion.div>
        </div>
      </header>

      {/* --- MASONRY GRID --- */}
      <main className="max-w-7xl mx-auto px-6 pb-32">
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {albums.map((img, index) => (
            <motion.div 
              key={img.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative group cursor-pointer break-inside-avoid rounded-3xl overflow-hidden bg-white/5 border border-white/10"
              onClick={() => setCurrentIndex(index)}
            >
              <img 
                src={img.url} 
                className="w-full h-auto  transition-all duration-700  group-hover:scale-110"
                loading="lazy"
                alt="School Activity"
              />
              
              {/* Glass Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                 <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-white/70 mb-2">
                    <Clock size={10} className="text-[#6366F1]" /> 
                 </div>
                 <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white">
                    <Maximize2 size={14} />
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* --- LIGHTBOX (Clean UI, Arrow Support) --- */}
      <AnimatePresence>
        {currentIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/98 backdrop-blur-2xl flex items-center justify-center"
          >
            {/* Close UI */}
            <button 
              className="absolute top-10 right-10 z-[510] w-14 h-14 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
              onClick={() => setCurrentIndex(null)}
            >
              <X size={24} />
            </button>

            {/* Navigation Arrows (Glass style) */}
            <button 
              className="absolute left-6 md:left-12 z-[510] w-16 h-16 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/20 hover:text-white hover:bg-[#6366F1] transition-all group"
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
            >
              <ChevronLeft size={32} strokeWidth={1.5} className="group-hover:-translate-x-1 transition-transform" />
            </button>

            <button 
              className="absolute right-6 md:right-12 z-[510] w-16 h-16 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/20 hover:text-white hover:bg-[#6366F1] transition-all group"
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
            >
              <ChevronRight size={32} strokeWidth={1.5} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            {/* Main Image View */}
            <motion.div 
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full h-full flex items-center justify-center p-8 md:p-24"
              onClick={() => setCurrentIndex(null)}
            >
              <img 
                src={albums[currentIndex].url} 
                className="max-w-full max-h-full object-contain rounded-lg shadow-[0_0_80px_rgba(0,0,0,0.5)] pointer-events-none"
                alt="Enlarged"
              />
            </motion.div>
            
            {/* Image Counter (Subtle) */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.3em] text-white/30 uppercase">
              {currentIndex + 1} / {albums.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}