"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { 
  Menu, X, Facebook, Instagram, ChevronDown, 
  ArrowUpRight, Palette, Brush, Scissors, Camera, 
  Phone, Mail, MapPin, Globe, Sparkles, Image as ImageIcon
} from 'lucide-react';

export default function VisualArtsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) setData(docSnap.data());
      setLoading(false);
    });
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => { unsub(); window.removeEventListener('scroll', handleScroll); };
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FAF8F4] italic font-light tracking-widest text-[#52607A] uppercase text-[10px]">
      Unveiling the Canvas...
    </div>
  );

  return (
    <div className="bg-[#FAF8F4] text-[#142440] antialiased selection:bg-[#B8892B] selection:text-white">
      
      {/* --- 1. TOP CONTACT BAR --- */}
      <div className="hidden lg:block bg-[#142440] text-[#E9DCBD] py-3 relative z-[110] border-b border-[#E4DFD3]">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.32em]">
          <div className="flex gap-8">
            <span className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone size={12} className="text-[#B8892B]" /> {data?.phone || "+91 141 2345678"}
            </span>
            <span className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail size={12} className="text-[#B8892B]" /> {data?.email || "arts@mvgacademy.com"}
            </span>
          </div>
          <div className="flex gap-6 items-center">
            <span className="flex items-center gap-2">
              <MapPin size={12} className="text-[#B8892B]" /> Arts District, Jaipur
            </span>
            <div className="flex gap-4 border-l border-[#E4DFD3]/20 pl-6">
              <Facebook size={14} className="hover:text-[#B8892B] cursor-pointer transition-colors" />
              <Instagram size={14} className="hover:text-[#B8892B] cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* --- 4. HERO: ARTISTIC EXPRESSION --- */}
      <section className="relative py-20 md:py-28 px-8 bg-[#FAF8F4] overflow-hidden">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.32em] text-[#B8892B] mb-6 block">
              The Fine Arts Wing
            </span>
            <h1 className="text-5xl md:text-[6.5rem] font-serif font-bold tracking-tight text-[#142440] leading-[1.05] mb-8">
              Where <span className="italic font-light text-[#52607A]">Soul</span> meets <span className="text-[#B8892B]">Canvas.</span>
            </h1>
            <p className="text-[#52607A] text-lg font-light leading-relaxed max-w-md">
              Our Visual Arts program empowers students to find their unique voice through traditional techniques and contemporary media.
            </p>
          </div>
          <div className="relative hidden lg:block">
            <div className="aspect-[4/5] bg-[#F1ECE1] rounded-[24px] overflow-hidden border border-[#E4DFD3] shadow-xl">
              <img src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2071" className="w-full h-full object-cover" alt="Art Studio" />
            </div>
          </div>
        </div>
      </section>

      {/* --- 5. THE CREATIVE DISCIPLINES --- */}
      <section className="py-20 md:py-28 px-8 bg-[#F1ECE1] border-y border-[#E4DFD3]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ArtPillar icon={<Palette size={20}/>} title="Painting" desc="Mastering oils, acrylics, and the heritage of Indian watercolours." />
            <ArtPillar icon={<Brush size={20}/>} title="Sculpting" desc="Hands-on clay modeling and structural design in our pottery studio." />
            <ArtPillar icon={<Camera size={20}/>} title="Digital Arts" desc="Modern graphic design, digital illustration, and 2D animation." />
            <ArtPillar icon={<Scissors size={20}/>} title="Mixed Media" desc="Exploring the boundaries of collage, textiles, and installation art." />
          </div>
        </div>
      </section>

      {/* --- 6. STUDENT GALLERY --- */}
      <section id="gallery" className="py-20 md:py-28 px-8 bg-[#FAF8F4]">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <span className="text-[10px] font-mono uppercase tracking-[0.32em] text-[#B8892B] mb-3 block">
            Exhibition Showcase
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#142440] tracking-tight mb-4">
            The Student Exhibition.
          </h2>
          <div className="w-16 h-[2px] bg-[#B8892B] mx-auto" />
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <GalleryItem img="https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1976" title="Heritage in Ink" year="2024" />
          <GalleryItem img="https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=1974" title="Modern Perspectives" year="2024" />
          <GalleryItem img="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=2090" title="Floral Abstract" year="2023" />
        </div>
      </section>

    </div>
  );
}

// --- ART COMPONENTS ---
function ArtPillar({ icon, title, desc }) {
  return (
    <div className="p-8 bg-[#FFFFFF] border border-[#E4DFD3] rounded-[24px] transition-all hover:border-[#B8892B]">
      <div className="mb-6 w-12 h-12 rounded-full border border-[#E4DFD3] flex items-center justify-center text-[#B8892B] bg-[#FAF8F4]">
        {icon}
      </div>
      <h3 className="text-xl font-serif font-bold text-[#142440] mb-3 tracking-tight">{title}</h3>
      <p className="text-[#52607A] text-xs font-light leading-relaxed">{desc}</p>
    </div>
  );
}

function GalleryItem({ img, title, year }) {
  return (
    <div className="group cursor-pointer">
      <div className="aspect-square bg-white rounded-[20px] overflow-hidden mb-6 border border-[#E4DFD3]">
        <img 
          src={img} 
          className="w-full h-full object-cover lg:grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" 
          alt={title} 
        />
      </div>
      <h4 className="text-lg font-serif font-bold text-[#142440] tracking-tight">{title}</h4>
      <p className="text-[#B8892B] text-[10px] font-mono uppercase tracking-[0.32em] mt-1">{year} Exhibition Item</p>
    </div>
  );
}