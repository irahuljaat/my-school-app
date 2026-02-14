'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { db } from './firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

// Import your logo directly
import LogoImg from './images/logo.jpg';

// Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

// Icons
import { 
  GraduationCap, Menu, X, MapPin, Phone, Mail, Instagram, Facebook, Twitter,
  PlayCircle, Star, CheckCircle2, Globe, Send, Trophy, BookOpen, ShieldCheck, 
  Sparkles, Users, Cpu, Music, Microscope, Heart, ChevronDown, ArrowRight, Quote,
  Lightbulb, Rocket, Target, Award, Newspaper, ChevronLeft, ChevronRight, Plus, Play
} from 'lucide-react';

export default function MVG_Academy_Final_Complete() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

 // FETCH DYNAMIC DATA FROM FIREBASE
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      }
      setLoading(false);
    });

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => { unsub(); window.removeEventListener('scroll', handleScroll); };
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FDF8F6]">
      <div className="w-16 h-16 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
   <div className="bg-[#FDFBF9] text-slate-900 antialiased overflow-x-hidden font-sans">
      
      {/* --- 1. HEADER & NAVIGATION --- */}
      <header className="fixed w-full z-[100]">
        {/* TOP CONTACT BAR */}
        <div className={`hidden xl:block border-b transition-all duration-500 ${
          isScrolled ? 'bg-slate-900 border-white/5 py-1' : 'bg-black/20 backdrop-blur-md border-white/10 py-2'
        }`}>
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-white/90">
            <div className="flex gap-8 items-center">
              <a href="tel:+911412345678" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#6366F1]">
                <Phone size={12} className="text-[#6366F1]" />
                <span>+91 (141) 2345-678</span>
              </a>
              <a href="mailto:info@mvgacademy.edu" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#6366F1]">
                <Mail size={12} className="text-[#6366F1]" />
                <span>info@mvgacademy.edu</span>
              </a>
            </div>
            <div className="flex gap-4 items-center border-l border-white/20 pl-6">
                <Facebook size={14} className="hover:text-[#6366F1] cursor-pointer" />
                <Instagram size={14} className="hover:text-[#6366F1] cursor-pointer" />
            </div>
          </div>
        </div>

        {/* MAIN NAV */}
        <nav className={`transition-all duration-500 ${isScrolled ? 'bg-white py-3 shadow-xl' : 'bg-transparent py-6'}`}>
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl shadow-md p-1 border border-slate-100 flex items-center justify-center">
                <img src={LogoImg.src} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className={`text-xl font-black uppercase tracking-tighter ${isScrolled ? 'text-slate-900' : 'text-white'}`}>MVG Academy</span>
                <span className="text-[9px] font-black text-[#6366F1] tracking-[0.3em]">JAIPUR</span>
              </div>
            </Link>

            {/* DESKTOP MENU */}
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
                { label: 'Robotics', link: '/Academics/robotics' },
                { label: 'Visual Art', link: '/Academics/visual-art' },
                { label: 'Cultural', link: '/Academics/cultural' },
                { label: 'Awards', link: '/Academics/awards' },
              ]} />
              <NavDropdown label="Admission" isScrolled={isScrolled} items={[
                { label: 'Apply for 2026-27', link: '/Admission/apply' },
                { label: 'Admission Enquiry', link: '/Admission/enquiry' },
                { label: 'How to Apply?', link: '/Admission/process' },
                { label: 'Fee Structure', link: '/Admission/fees' },
                { label: 'Admission Criteria', link: '/Admission/criteria' },
                { label: 'Why Choose MVG?', link: '/Admission/why-us' },
              ]} />
              <NavDropdown label="Gallery" isScrolled={isScrolled} items={[
                { label: 'Events', link: '/gallery/events' },
                { label: 'School Gallery', link: '/gallery/school-gallery' },
                { label: 'In the News', link: '/gallery/news' },
              ]} />
              <NavItem label="Contact" href="/contact" isScrolled={isScrolled} />
              <Link href="/apply" className="ml-4 bg-[#6366F1] text-white px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all">Apply Now!</Link>
            </div>

            <button onClick={() => setMobileMenu(true)} className="xl:hidden p-3 bg-white rounded-xl shadow-md text-[#6366F1]"><Menu size={20} /></button>
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
            {/* Mobile Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100">
                  <img src={LogoImg.src} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">Navigation</span>
              </div>
              <button 
                onClick={() => setMobileMenu(false)} 
                className="p-3 bg-slate-100 rounded-full text-slate-900 active:scale-90 transition-transform"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Menu Items */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col gap-2">
                <MobileNavItem label="Home" href="/" setMobileMenu={setMobileMenu} />
                
                <MobileNavDropdown label="About Us" items={[
                  { label: 'About School', link: '/About' },
                  { label: 'History', link: '/About/history' },
                  { label: 'Our Mission', link: '/About/mission' },
                  { label: 'Our Vision', link: '/About/vision' },
                  { label: "Director's Desk", link: '/About/director' },
                  { label: 'Our AIM', link: '/About/aim' },
                  { label: 'Faculties', link: '/About/faculty' },
                ]} setMobileMenu={setMobileMenu} />

                <MobileNavDropdown label="Academics" items={[
                  { label: 'Robotics', link: '/academics/robotics' },
                  { label: 'Visual Art', link: '/academics/visual-art' },
                  { label: 'Cultural', link: '/academics/cultural' },
                  { label: 'Awards', link: '/About/awards' },
                ]} setMobileMenu={setMobileMenu} />

                <MobileNavDropdown label="Admission" items={[
                  { label: 'Apply for 2026-27', link: '/apply' },
                  { label: 'Admission Enquiry', link: '/admission/enquiry' },
                  { label: 'How to Apply?', link: '/admission/process' },
                  { label: 'Fee Structure', link: '/admission/fees' },
                  { label: 'Admission Criteria', link: '/admission/criteria' },
                  { label: 'Why Choose MVG?', link: '/About/why-us' },
                ]} setMobileMenu={setMobileMenu} />

                <MobileNavDropdown label="Gallery" items={[
                  { label: 'Events', link: '/gallery/events' },
                  { label: 'School Gallery', link: '/gallery' },
                  { label: 'In the News', link: '/gallery/news' },
                ]} setMobileMenu={setMobileMenu} />

                <MobileNavItem label="Contact Us" href="/contact" setMobileMenu={setMobileMenu} />
              </div>
            </div>

            {/* Mobile Footer CTA */}
            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <Link 
                href="/apply" 
                onClick={() => setMobileMenu(false)}
                className="w-full bg-[#6366F1] text-white py-5 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100"
              >
                Apply for 2026-27 <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HERO SLIDER --- */}
      <section className="h-[75vh] md:h-[90vh] relative group">
        <Swiper modules={[Autoplay, EffectFade, Navigation, Pagination]} effect="fade" loop autoplay={{ delay: 5000 }} navigation={{ prevEl: '.prev-hero', nextEl: '.next-hero' }} pagination={{ clickable: true }} className="h-full">
          {data?.heroSlider?.map((slide, i) => (
            <SwiperSlide key={i}>
              <div className="absolute inset-0 bg-black/40 z-10"></div>
              {slide.image && <img src={slide.image} className="w-full h-full object-cover" alt="Slide" />}
              <div className="absolute inset-0 z-20 flex items-center justify-center text-center text-white px-4">
                <motion.div initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
                  <h1 className="text-3xl md:text-9xl font-black uppercase tracking-tighter leading-tight md:leading-none mb-6" dangerouslySetInnerHTML={{ __html: slide.heading }}></h1>
                  
                </motion.div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <button className="prev-hero absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-40 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 hover:bg-[#6366F1] transition-all"><ChevronLeft size={20}/></button>
        <button className="next-hero absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 hover:bg-[#6366F1] transition-all"><ChevronRight size={20}/></button>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="relative z-30 -mt-10 md:-mt-16 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {data?.stats?.length > 0 ? data.stats.slice(0, 4).map((stat, i) => {
            const colors = ["bg-[#FFD93D]", "bg-[#6BCB77]", "bg-[#4D96FF]", "bg-[#FF6B6B]"];
            const icons = [<Users key="1"/>, <Award key="2"/>, <Microscope key="3"/>, <Star key="4"/>];
            return <StatCard key={i} color={colors[i % 4]} icon={icons[i % 4]} num={stat.value} label={stat.label} />
          }) : <div className="col-span-4 text-center py-10 text-slate-400 font-bold uppercase tracking-widest bg-white rounded-3xl">Add Stats in Admin Panel</div>}
        </div>
      </section>

      {/* --- ABOUT SECTION --- */}
      <section className="py-16 md:py-24 px-4 md:px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="relative z-10 w-full md:w-[90%] aspect-square shadow-2xl overflow-hidden" 
     style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}>
  <img 
    src="https://res.cloudinary.com/db6ssceun/image/upload/v1766231170/DSC_0614_qr56qm.jpg" 
    className="w-full h-full object-cover" 
    alt="About" 
    style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}
  />
</div>
            <div className="absolute top-0 right-4 w-10 h-10 bg-teal-400 rounded-full animate-bounce"></div>
          </div>
          <div className="space-y-6 order-1 lg:order-2">
            <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-indigo-600"></div><span className="text-indigo-600 font-black uppercase tracking-widest text-xs">About School</span></div>
            <h2 className="text-3xl md:text-5xl font-black text-[#2D2D2D] tracking-tight">The Best RBSE School in Jaipur</h2>
            <p className="text-slate-500 leading-relaxed text-base md:text-lg font-medium">Founded with a vision to ignite young minds, MVG Public School stands as a beacon of academic excellence and holistic development in the heart of Jaipur. We believe that education extends far beyond the pages of a textbook; it is about nurturing curiosity, fostering character, and building the leaders of tomorrow.

              Our state-of-the-art campus provides a vibrant ecosystem where traditional values meet modern innovation. From our advanced Robotics & AI Labs to our competitive sports arenas and creative arts studios, we offer a diverse platform for every student to discover their unique potential.</p>
            
          </div>
        </div>
      </section>

    {/* --- DYNAMIC PRINCIPAL MESSAGE --- */}
<section className="py-16 bg-[#1A1A1A] rounded-[2rem] md:rounded-[4rem] mx-2 md:mx-4 px-4 text-white overflow-hidden">
  <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
    
    {/* Principal Image with Blob/Rounded Style */}
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      className="relative group"
    >
      <img 
        src={data?.principal?.image || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976"} 
        className="rounded-[2rem] md:rounded-[4rem] h-[350px] md:h-[600px] w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 shadow-2xl" 
        alt="Principal" 
      />
      <div className="absolute inset-0 rounded-[2rem] md:rounded-[4rem] ring-1 ring-white/10 ring-inset pointer-events-none"></div>
    </motion.div>

    <div className="space-y-6 md:space-y-10 text-center md:text-left">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
      >
        <span className="text-[#6366F1] font-black tracking-[0.3em] uppercase text-xs mb-4 block">Leadership</span>
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">
          DIRECTOR'S <br/>
          <span className="text-[#6366F1]">DESK.</span>
        </h2>
      </motion.div>

      <p className="text-xl md:text-3xl font-light italic leading-relaxed font-serif text-slate-200">
        "{data?.principal?.quote || "Every child's unique spark is fanned into a flame of brilliance here."}"
      </p>

      <div className="pt-6 border-t border-white/10">
        <h4 className="text-2xl md:text-3xl font-black text-white">
          {data?.principal?.name || "Dr. Anjali Sharma"}
        </h4>
        <p className="text-[#6366F1] font-bold uppercase text-xs tracking-[0.2em] mt-2">
          {data?.principal?.designation || "Principal, MVG Academy"}
        </p>
      </div>
    </div>
  </div>
</section>

{/* --- CULTURAL & VALUES SECTION --- */}
      <section className="py-20 md:py-32 bg-[#FAF9F6] relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          <GraduationCap size={400} className="-rotate-12" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <span className="text-[#B8860B] font-black tracking-[0.3em] uppercase text-[10px] md:text-xs block">
                Rooted in Tradition
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-[#1A1A1A] leading-tight tracking-tighter">
                Nurturing <span className="italic font-serif text-[#B8860B]">Culture</span>, <br /> 
                Building Character.
              </h2>
              <div className="w-20 h-1 bg-[#B8860B] mx-auto mt-6"></div>
            </motion.div>
          </div>

          {/* Value Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            
            {/* Pillar 1: Heritage */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="relative h-80 rounded-[2rem] overflow-hidden mb-6 shadow-xl">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Ghoomar_dancers_%28Rajasthan%2C_India%2C_2023%29.jpg/500px-Ghoomar_dancers_%28Rajasthan%2C_India%2C_2023%29.jpg" 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" 
                  alt="Cultural Heritage" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <Heart className="text-[#B8860B] mb-2" size={24} />
                  <h4 className="text-xl font-black uppercase tracking-tight">The Ghoomar Celebration</h4>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base px-2">
               At our school, we believe that education is incomplete without a deep connection to our roots. The Ghoomar performance is one of our most cherished annual traditions, where our students bring to life the legendary folk dance of the desert.
              </p>
            </motion.div>

            {/* Pillar 2: Character */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group md:-mt-8" /* Offset for staggered look */
            >
              <div className="relative h-80 rounded-[2rem] overflow-hidden mb-6 shadow-xl border-4 border-white">
                <img 
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKp6nDN1SApCSX3PEWlxb5M-4fYbaqxSIUYg&s" 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" 
                  alt="Value Education" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <ShieldCheck className="text-[#B8860B] mb-2" size={24} />
                  <h4 className="text-xl font-black uppercase tracking-tight">Moral Compass</h4>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base px-2">
                Education is incomplete without empathy. Our "Value-First" curriculum ensures students grow into compassionate, ethical, and responsible global citizens.
              </p>
            </motion.div>

            {/* Pillar 3: Respect */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="group"
            >
              <div className="relative h-80 rounded-[2rem] overflow-hidden mb-6 shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1524069290683-0457abfe42c3?q=80&w=2070" 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" 
                  alt="Social Respect" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <Users className="text-[#B8860B] mb-2" size={24} />
                  <h4 className="text-xl font-black uppercase tracking-tight">Community Respect</h4>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base px-2">
                We foster a community of mutual respect, where every voice is heard and diversity is celebrated as our greatest strength.
              </p>
            </motion.div>

          </div>

          {/* Bottom Highlight */}
          <motion.div 
             initial={{ opacity: 0 }}
             whileInView={{ opacity: 1 }}
             className="mt-20 p-8 md:p-12 bg-white rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div className="max-w-xl text-center md:text-left">
              <h3 className="text-2xl font-black text-[#1A1A1A] mb-2">"A nation's culture resides in the hearts and the soul of its people"</h3>
              <p className="text-[#B8860B] font-bold uppercase tracking-widest text-xs">— Mahatma Gandhi</p>
            </div>
            <Link href="/culture" className="bg-[#1A1A1A] text-white px-10 py-5 rounded-full font-black uppercase tracking-widest text-[10px] whitespace-nowrap hover:bg-[#B8860B] transition-colors">
              Our Traditions
            </Link>
          </motion.div>
        </div>
      </section>

      {/* --- ROBOTICS --- */}
      <section className="py-16 md:py-24 px-4 max-w-7xl mx-auto overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative h-[400px] md:h-[500px] flex items-center justify-center">
            <div className="relative z-10 w-4/5 h-4/5 rounded-[2rem] overflow-hidden shadow-2xl rotate-2 bg-slate-100">
              {data?.robotics?.images?.[0] && <img src={data.robotics.images[0]} className="w-full h-full object-cover" alt="Robotics" />}
            </div>
            <div className="absolute -bottom-4 -left-4 z-20 w-1/2 h-1/2 rounded-[1.5rem] border-4 border-white overflow-hidden shadow-2xl -rotate-6 bg-slate-200">
              {data?.robotics?.images?.[1] && <img src={data.robotics.images[1]} className="w-full h-full object-cover" alt="Robotics" />}
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-[#6366F1]"></div><span className="text-[#6366F1] font-black uppercase tracking-widest text-xs">Innovation Lab</span></div>
            <h2 className="text-4xl md:text-5xl font-black text-[#2D2D2D] tracking-tighter leading-none">{data?.robotics?.title || "Building the Future"}</h2>
            <p className="text-slate-500 leading-relaxed text-base md:text-lg">{data?.robotics?.desc || "Our students dive deep into the world of AI."}</p>
          </div>
        </div>
      </section>

      {/* --- AWARDS --- */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl font-black uppercase tracking-tighter mb-12 underline decoration-[#6366F1] decoration-4 underline-offset-8">Awards & <span className="text-[#6366F1]">Glory</span></h2>
        <div className="grid md:grid-cols-3 gap-6">
          {data?.awards?.map((award, i) => (
            <AwardCard key={i} img={award.image} title={award.title} desc={award.desc} />
          ))}
        </div>
      </section>

   

        






      {/* --- REFINED VIDEO GALLERY (NO OVERLAP) --- */}
      <section className="py-24 bg-[#0A0A0A] text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          
          <div className="mb-16">
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">
              Campus <span className="text-[#6366F1]">Cinema.</span>
            </h2>
          </div>

          {/* The Container Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: MAIN FEATURE (8 Columns) */}
            <div className="lg:col-span-8 w-full">
              <div className="relative aspect-video w-full rounded-[3rem] overflow-hidden bg-slate-900 border border-white/10 shadow-2xl">
                {data?.galleryVideos?.[0] ? (
                  <iframe 
                    className="absolute inset-0 w-full h-full object-cover"
                    src={`https://www.youtube.com/embed/${getYouTubeID(data.galleryVideos[0].url)}?autoplay=1&mute=1&controls=1`}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-600 uppercase font-black tracking-widest">
                    No Feature Video
                  </div>
                )}
                {/* Visual Label */}
                <div className="absolute bottom-8 left-8 z-10 pointer-events-none">
                  <p className="text-[#6366F1] font-black text-[10px] uppercase tracking-[0.3em] mb-2">Featured Clip</p>
                  <h3 className="text-2xl font-black uppercase italic">{data?.galleryVideos?.[0]?.title}</h3>
                </div>
              </div>
            </div>

            {/* RIGHT: SIDEBAR (4 Columns) */}
            <div className="lg:col-span-4 w-full">
              <div className="flex flex-col gap-6 max-h-[500px] lg:max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                {data?.galleryVideos?.slice(1).map((vid, idx) => (
                  <div 
                    key={idx} 
                    className="relative aspect-video w-full shrink-0 rounded-[2rem] overflow-hidden bg-slate-900 border border-white/5 group transition-transform hover:scale-[0.98]"
                  >
                    <iframe 
                      className="w-full h-full pointer-events-auto"
                      src={`https://www.youtube.com/embed/${getYouTubeID(vid.url)}?autoplay=0&mute=1&controls=1`}
                      allow="autoplay; encrypted-media"
                    />
                    {/* Overlay to catch clicks if needed */}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent pointer-events-none transition-all" />
                  </div>
                ))}
                
                {/* Empty State for Sidebar */}
                {(!data?.galleryVideos || data.galleryVideos.length <= 1) && (
                  <div className="py-20 text-center border border-dashed border-white/10 rounded-[2rem]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Additional Videos Will Appear Here</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>












      
      {/* --- GALLERY --- */}
      <section className="py-16 bg-[#F0EEFF] px-4 rounded-[2rem] md:rounded-[5rem] mx-2">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-12">Life at <span className="text-[#6366F1]">MVG.</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data?.gallery?.map((item, i) => (
              <GalleryItem key={i} img={item.image} span={i === 0 || i === 3 ? "md:col-span-2" : ""} />
            ))}
          </div>
        </div>
      </section>

    {/* --- VOICES / TESTIMONIALS RESPONSIVE MODERN UI --- */}
      <section className="py-16 md:py-32 bg-[#0A0A0B] relative overflow-hidden">
        {/* Ambient Background Glows */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-64 h-64 md:w-96 md:h-96 bg-[#6366F1] opacity-[0.07] blur-[100px] rounded-full"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 md:w-80 md:h-80 bg-indigo-900 opacity-[0.07] blur-[80px] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* LEFT SIDE: Header (Responsive Sticky) */}
            <div className="lg:col-span-4 lg:sticky lg:top-32 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <span className="text-[#6366F1] font-black tracking-[0.3em] uppercase text-[10px] md:text-xs mb-4 block">
                  Community Feedback
                </span>
                <h2 className="text-4xl md:text-6xl font-black text-white leading-[0.9] tracking-tighter mb-6">
                  THE <span className="text-[#6366F1] italic font-serif">Voices</span> <br className="hidden md:block" /> OF TRUST.
                </h2>
                <p className="text-slate-400 text-sm md:text-base max-w-sm mx-auto lg:mx-0 leading-relaxed">
                  Real stories from the parents and students who define the excellence of MVG Academy.
                </p>
                
                {/* Navigation - Hidden on very small mobile if pagination is enough, or kept for UX */}
                <div className="flex justify-center lg:justify-start gap-4 mt-8 md:mt-12">
                  <button className="voice-prev w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-[#6366F1] hover:border-[#6366F1] transition-all active:scale-90">
                    <ChevronLeft size={20} />
                  </button>
                  <button className="voice-next w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-[#6366F1] hover:border-[#6366F1] transition-all active:scale-90">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            </div>

            {/* RIGHT SIDE: Testimonial Slider */}
            <div className="lg:col-span-8 w-full min-w-0"> {/* min-w-0 prevents swiper overflow in flex/grid */}
              <Swiper
                modules={[Autoplay, Navigation, Pagination, EffectFade]}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                loop
                autoplay={{ delay: 6000 }}
                navigation={{ prevEl: '.voice-prev', nextEl: '.voice-next' }}
                pagination={{ clickable: true, dynamicBullets: true }}
                className="testimonial-swiper w-full !pb-12 md:!pb-0"
              >
                {data?.testimonials?.map((t, i) => (
                  <SwiperSlide key={i} className="bg-transparent">
                    <div className="bg-[#111113] border border-white/[0.03] rounded-[2rem] md:rounded-[3rem] p-6 md:p-16 relative overflow-hidden shadow-2xl">
                      
                      {/* Decorative Element */}
                      <Quote className="absolute -top-4 -right-4 w-24 h-24 md:w-40 md:h-40 text-white/[0.02] -rotate-12 pointer-events-none" />
                      
                      <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start relative z-10">
                        
                        {/* Avatar with Responsive Sizing */}
                        <div className="relative flex-shrink-0">
                          <div className="w-20 h-20 md:w-36 md:h-36 rounded-2xl md:rounded-[2.5rem] overflow-hidden rotate-2 group-hover:rotate-0 transition-transform duration-500 border border-[#6366F1]/20 p-1 bg-[#1A1A1C]">
                            {t.image && (
                              <img 
                                src={t.image} 
                                className="w-full h-full object-cover rounded-xl md:rounded-[2rem]" 
                                alt={t.name} 
                              />
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-[#6366F1] p-1.5 md:p-2.5 rounded-lg shadow-xl">
                            <Star size={12} className="text-white fill-current md:w-4 md:h-4" />
                          </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 text-center md:text-left">
                          <p className="text-lg md:text-2xl lg:text-3xl text-slate-200 font-medium leading-relaxed italic font-serif mb-8 md:mb-10">
                            "{t.quote}"
                          </p>
                          
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-white/[0.05]">
                            <div>
                              <h5 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase leading-none">
                                {t.name}
                              </h5>
                              <p className="text-[#6366F1] text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
                                {t.designation}
                              </p>
                            </div>
                            
                            {/* Visual Credibility Badge */}
                            <div className="hidden sm:flex items-center gap-1 text-slate-500 text-[10px] font-bold uppercase tracking-widest bg-white/[0.02] px-3 py-1.5 rounded-full border border-white/[0.05]">
                              <ShieldCheck size={14} className="text-[#6366F1]" /> Verified Review
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

          </div>
        </div>
        
        {/* Swiper Pagination Style Fix */}
        <style jsx global>{`
          .testimonial-swiper .swiper-pagination-bullet {
            background: #475569;
            opacity: 1;
          }
          .testimonial-swiper .swiper-pagination-bullet-active {
            background: #6366F1;
            width: 20px;
            border-radius: 4px;
          }
        `}</style>
      </section>

      {/* --- CONTACT & FOOTER --- */}
      <section id="contact" className="py-24 px-4 bg-[#FAF9F6] rounded-[3.5rem] mb-12 shadow-inner">
        <div className="max-w-7xl mx-auto">
          
          <div className="grid lg:grid-cols-5 gap-16 items-start">
            
            {/* Left Column: Info Bento */}
            <div className="lg:col-span-2 space-y-10">
              <div className="space-y-4">
                <span className="text-[#6366F1] font-black tracking-[0.3em] uppercase text-[10px]">Connect</span>
                <h2 className="text-5xl md:text-7xl font-black text-[#1A1A1A] leading-none tracking-tighter">
                  LET'S <br /> 
                  <span className="italic font-serif text-[#6366F1]">TALK.</span>
                </h2>
              </div>

              <div className="grid gap-4">
                <div className="group p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-[#6366F1] transition-all duration-500">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#6366F1] group-hover:bg-[#6366F1] group-hover:text-white transition-all">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                      <p className="font-bold text-[#1A1A1A]">Pratap Nagar, Jaipur, RJ</p>
                    </div>
                  </div>
                </div>

                <div className="group p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-[#6366F1] transition-all duration-500">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#6366F1] group-hover:bg-[#6366F1] group-hover:text-white transition-all">
                      <Phone size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                      <p className="font-bold text-[#1A1A1A]">+91 141 277 0000</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Modern Form */}
            <div className="lg:col-span-3 relative">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#6366F1]/10 rounded-full blur-3xl" />
              <form className="relative p-10 bg-white rounded-[3rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-50 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-400">Student Name</label>
                    <input className="w-full p-5 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-[#6366F1]/20 border border-transparent focus:bg-white transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-400">Parent Email</label>
                    <input className="w-full p-5 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-[#6366F1]/20 border border-transparent focus:bg-white transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-400">Message</label>
                  <textarea rows="4" className="w-full p-5 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-[#6366F1]/20 border border-transparent focus:bg-white transition-all"></textarea>
                </div>
                <button className="w-full bg-[#1A1A1A] hover:bg-[#6366F1] text-white py-6 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all duration-300">
                  Send Enquiry
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* --- PREMIUM FOOTER --- */}
      <footer className="bg-[#0A0A0A] text-white pt-24 pb-12 rounded-t-[4rem] overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-4 md:grid-cols-2 gap-16">
          <div className="col-span-full lg:col-span-2 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white p-2">
                <img src={LogoImg.src} alt="Footer Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase italic leading-none">MVG Academy</h3>
                <p className="text-[#6366F1] text-[10px] font-black tracking-[0.3em] uppercase mt-1">Nurturing Brilliance</p>
              </div>
            </div>
            <p className="text-slate-500 max-w-sm text-sm leading-relaxed">
              Redefining education through innovation and traditional values. Join us in shaping the leaders of tomorrow in the heart of Jaipur.
            </p>
          </div>

          <div className="space-y-6">
            <h5 className="text-white font-black uppercase text-[10px] tracking-widest border-b border-white/10 pb-4">Quick Links</h5>
            <div className="grid gap-3">
              {['Campus', 'Admissions', 'Academic', 'Facilities'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-slate-400 hover:text-[#6366F1] text-sm font-medium transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h5 className="text-white font-black uppercase text-[10px] tracking-widest border-b border-white/10 pb-4">Follow Us</h5>
            <div className="flex gap-4">
                <SocialCircle icon={<Instagram size={18}/>} />
                <SocialCircle icon={<Facebook size={18}/>} />
                <SocialCircle icon={<Twitter size={18}/>} />
            </div>
            <p className="text-slate-500 text-[10px] font-medium italic">Updates daily on socials</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em]">© 2025 MVG ACADEMY • PREMIER INSTITUTION</p>
          <div className="flex gap-8">
            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest hover:text-slate-400 cursor-pointer">Privacy</span>
            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest hover:text-slate-400 cursor-pointer">Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- HELPER COMPONENTS ---

// Sub-Component: Individual Nav Item
function NavItem({ label, href, isScrolled }) {
  return (
    <Link href={href} className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors hover:text-[#6366F1] ${
      isScrolled ? 'text-slate-600' : 'text-white/80'
    }`}>
      {label}
    </Link>
  );
}

// Sub-Component: Dropdown Engine
function NavDropdown({ label, items, isScrolled }) {
  return (
    <div className="relative group px-4 py-2 cursor-pointer">
      <div className={`flex items-center gap-1 text-[11px] font-black uppercase tracking-widest group-hover:text-[#6366F1] transition-colors ${
        isScrolled ? 'text-slate-600' : 'text-white/80'
      }`}>
        {label} <ChevronDown size={12} className="group-hover:rotate-180 transition-transform" />
      </div>
      
      {/* The Actual Dropdown Menu */}
      <div className="absolute top-full left-0 pt-4 opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
        <div className="bg-white min-w-[240px] shadow-2xl rounded-2xl border border-slate-50 p-3 grid gap-1">
          {items.map((item, idx) => (
            <Link key={idx} href={item.link} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-[#6366F1] transition-all">
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ color, icon, num, label }) {
  return (
    <div className={`${color} p-4 md:p-8 rounded-[1.5rem] shadow-xl text-white`}>
      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-2">{icon}</div>
      <h4 className="text-xl md:text-3xl font-black">{num}</h4>
      <p className="text-[8px] md:text-[10px] font-black uppercase opacity-80">{label}</p>
    </div>
  );
}

function AwardCard({ img, title, desc }) {
  return (
    <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm group">
      <div className="h-48 overflow-hidden bg-slate-100">{img && <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={title}/>}</div>
      <div className="p-6 space-y-2">
        <h4 className="text-lg font-black uppercase italic">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function GalleryItem({ img, span }) {
  return (
    <div className={`relative rounded-[2rem] overflow-hidden group h-[200px] bg-slate-200 ${span || ''}`}>
      {img && <img src={img} className="w-full h-full object-cover transition-all group-hover:scale-110" />}
      <div className="absolute inset-0 bg-[#6366F1]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Plus size={40} className="text-white" /></div>
    </div>
  );
}

function ContactRow({ icon, text }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl justify-center md:justify-start">
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#6366F1] shadow-sm flex-shrink-0">{icon}</div>
      <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">{text}</span>
    </div>
  );
}


// Helper to extract YouTube ID from any link style
function getYouTubeID(url) {
  if (!url) return "";
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : url;
}


function SocialCircle({ icon }) {
  return <div className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-[#6366F1] transition-all cursor-pointer">{icon}</div>;
}

// --- MOBILE ACCORDION ENGINE ---
function MobileNavDropdown({ label, items, setMobileMenu }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-50 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-5 text-left"
      >
        <span className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">{label}</span>
        <ChevronDown size={20} className={`text-[#6366F1] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1 pb-4 pl-4 border-l-2 border-[#6366F1]/20 ml-2">
              {items.map((item, idx) => (
                <Link 
                  key={idx} 
                  href={item.link} 
                  onClick={() => setMobileMenu(false)}
                  className="py-3 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-[#6366F1]"
                >
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

function MobileNavItem({ label, href, setMobileMenu }) {
  return (
    <Link 
      href={href} 
      onClick={() => setMobileMenu(false)}
      className="py-5 border-b border-slate-50 last:border-0 block"
    >
      <span className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">{label}</span>
    </Link>
  );
}