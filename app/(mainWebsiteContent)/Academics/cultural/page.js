"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Menu, X, Facebook, Instagram, ChevronDown, 
  Heart, Phone, Mail, MapPin, Quote, ExternalLink
} from 'lucide-react';

export default function CulturalLovePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

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
    <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-bold tracking-widest uppercase text-[10px]">
      Loading...
    </div>
  );

  return (
    <div className="bg-[#ffffff] text-[#1a1a1a] antialiased selection:bg-blue-600 selection:text-white">
      
    

    

      {/* --- 4. HERO SECTION --- */}
      <section className="relative h-[90vh] flex items-center bg-slate-950 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://res.cloudinary.com/db6ssceun/image/upload/v1772013782/Gemini_Generated_Image_9xm7ie9xm7ie9xm7_jljpt9.png" className="w-full h-full object-cover opacity-40" alt="Cultural Heritage" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>
        <div className="max-w-[1400px] mx-auto px-8 relative z-10 w-full mt-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 bg-blue-600/20 backdrop-blur-md border border-blue-500/30 px-4 py-2 rounded-full mb-8">
                <Heart className="text-blue-400 fill-blue-400" size={14} />
                <span className="text-blue-100 text-[10px] font-black uppercase tracking-[0.4em]">Culture & Heritage at MVG</span>
            </div>
            <h1 className="text-6xl md:text-[8rem] font-black text-white tracking-tighter leading-[0.85] mb-8">
              Where Talent <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 italic">Meets Tradition.</span>
            </h1>
            <p className="max-w-2xl text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
              From Rajasthani folk traditions to modern performing arts, we nurture the creative soul of every student. At MVG Public School, culture is the foundation of character.
            </p>
          </motion.div>
        </div>
      </section>

      {/* --- 5. SCHOOL EVENTS --- */}
      <section className="py-32 px-8 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-5xl font-black tracking-tighter mb-6 text-slate-900">Academic & Cultural <br/> Calendar <span className="text-blue-600">2026-27</span></h2>
              <p className="text-slate-500 text-lg">Experience the vibrant life at our Jaipur campus through year-round celebrations.</p>
            </div>
            <Link href="/Academics/calender" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600 border-b-2 border-blue-600 pb-1">View Complete Academic Calender <ExternalLink size={14}/></Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <EventCard date="AUG 15" event="Independence Day" desc="Grand patriotic showcase with drill, folk dance, and musical tributes." />
            <EventCard date="OCT" event="Navratri Utsav" desc="Traditional Dandiya and Garba night celebrating our vibrant Indian heritage." />
            <EventCard date="JAN 14" event="Kite Festival" desc="Markar Sankranti celebration at Sheopur campus with traditional Jaipur spirit." />
            <EventCard date="FEB" event="Annual Function" desc="Our signature event 'Sanskriti' showcasing the year's artistic journey." />
          </div>
        </div>
      </section>

      {/* --- 6. DIRECTOR'S VISION --- */}
      <section className="py-32 px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20 items-center">
          <div className="relative w-full lg:w-1/2">
            <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl relative z-10">
               <img src="https://res.cloudinary.com/db6ssceun/image/upload/v1772172686/1772172574607_mv0amq.png" className="w-full h-full object-cover" alt="School Life" />
            </div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-blue-600 rounded-[3rem] -z-0 hidden md:block"></div>
          </div>
          <div className="lg:w-1/2 space-y-10">
            <Quote className="text-blue-600 opacity-20" size={80} />
            <h2 className="text-5xl font-black tracking-tighter leading-tight text-slate-900">Nurturing Roots, <br/>Inspiring Wings.</h2>
            <p className="text-slate-600 text-xl font-medium italic leading-relaxed">
              "We provide an environment where education goes beyond books. Our focus on RBSE curriculum combined with cultural immersion ensures that every MVG student becomes a proud, capable citizen of tomorrow."
            </p>
            <div className="pt-6 border-t border-slate-200">
                <p className="text-lg font-black text-slate-900">Director's Message</p>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mt-1">MVG Public Senior Secondary School</p>
            </div>
          </div>
        </div>
      </section>

     
    </div>
  );
}

// --- REFINED SUB-COMPONENTS ---
function EventCard({ date, event, desc }) {
  return (
    <div className="p-10 bg-white border border-slate-100 hover:border-blue-200 rounded-[2.5rem] transition-all hover:shadow-2xl hover:shadow-blue-900/5 group">
      <span className="text-sm font-black text-blue-600 block mb-4 uppercase tracking-widest">{date}</span>
      <h3 className="text-2xl font-black mb-4 tracking-tighter text-slate-900 group-hover:text-blue-600 transition-colors">{event}</h3>
      <p className="text-slate-500 text-sm font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

function NavItem({ label, href, isScrolled }) {
  return (
    <Link href={href} className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest hover:text-blue-500 transition-colors ${isScrolled ? 'text-slate-700' : 'text-white'}`}>
      {label}
    </Link>
  );
}

function FooterGroup({ title, items }) {
  return (
    <div className="space-y-8">
      <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500">{title}</h5>
      <ul className="space-y-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
        {items.map((it, i) => <li key={i} className="hover:text-white transition-colors cursor-pointer">{it}</li>)}
      </ul>
    </div>
  );
}