"use client"
import React, { useState, useEffect } from 'react';

import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../../images/logo.jpg';
import { 
  Target, Rocket, Compass, Sparkles, ChevronDown, ArrowRight,
  Menu, X, Facebook, Instagram, Mail, Phone, MapPin, 
  ArrowUpRight, BookOpen, Users, Leaf
} from 'lucide-react';

export default function AimPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      }
      setLoading(false);
    });

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      unsub();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // SEO Schema Data
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": `Our Aim - ${data?.schoolName || "MVG Public School"}`,
    "description": "Discover the core objectives and educational philosophy of MVG Academy Jaipur. We aim for academic excellence, character development, and global responsibility.",
    "publisher": {
      "@type": "EducationalOrganization",
      "name": data?.schoolName || "MVG Public School",
      "logo": LogoImg.src
    }
  };

  return (
    <div className="bg-white text-slate-900 antialiased overflow-x-hidden font-sans">
      {/* SEO Head Implementation */}
     

      {/* --- 1. HEADER (Remains consistent with your brand) --- */}
      <header className="fixed w-full z-[100]">
        <div className={`hidden xl:block border-b transition-all duration-500 ${
          isScrolled ? 'bg-slate-900 border-white/5 py-1' : 'bg-black/40 backdrop-blur-md border-white/10 py-2'
        }`}>
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-white">
            <div className="flex gap-8 items-center">
              <a href={`tel:${data?.phone}`} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#6366F1]">
                <Phone size={12} className="text-[#6366F1]" />
                <span>{data?.phone || "+91 (141) 2345-678"}</span>
              </a>
              <a href={`mailto:${data?.email}`} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#6366F1]">
                <Mail size={12} className="text-[#6366F1]" />
                <span>{data?.email || "info@mvgacademy.edu"}</span>
              </a>
            </div>
            <div className="flex gap-4 items-center border-l border-white/20 pl-6">
                <Facebook size={14} className="hover:text-[#6366F1] cursor-pointer" />
                <Instagram size={14} className="hover:text-[#6366F1] cursor-pointer" />
            </div>
          </div>
        </div>

        <nav className={`transition-all duration-500 ${isScrolled ? 'bg-white py-3 shadow-xl' : 'bg-transparent py-6'}`}>
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl shadow-md p-1 border border-slate-100 flex items-center justify-center">
                <img src={LogoImg.src} alt={`${data?.schoolName} Logo`} className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className={`text-xl font-black uppercase tracking-tighter ${isScrolled ? 'text-slate-900' : 'text-white'}`}>
                  {data?.schoolName || "MVG Academy"}
                </span>
                <span className="text-[9px] font-black text-[#6366F1] tracking-[0.3em]">JAIPUR</span>
              </div>
            </Link>

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
                { label: 'Robotics', link: '/academics/robotics' },
                { label: 'Visual Art', link: '/academics/visual-art' },
                { label: 'Awards', link: '/About/awards' },
              ]} />
              <NavItem label="Contact" href="/contact" isScrolled={isScrolled} />
              <Link href="/apply" className="ml-4 bg-[#6366F1] text-white px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all">Apply Now!</Link>
            </div>

            <button onClick={() => setMobileMenu(true)} className={`xl:hidden p-3 rounded-xl shadow-md ${isScrolled ? 'bg-slate-100 text-slate-900' : 'bg-white text-[#6366F1]'}`}>
              <Menu size={20} />
            </button>
          </div>
        </nav>
      </header>

      {/* --- 2. HERO SECTION --- */}
      <section className="relative min-h-[70vh] flex items-center bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070" className="w-full h-full object-cover opacity-20 grayscale" alt="MVG Academy Educational Vision" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full pt-32 text-center lg:text-left">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="text-[#6366F1] font-black tracking-[0.4em] uppercase text-xs mb-6 block">Beyond the Textbooks</span>
            <h1 className="text-5xl md:text-8xl font-black uppercase text-white tracking-tighter leading-[0.9] mb-8">
              Shaping Minds<br /><span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] to-indigo-300">Igniting Futures</span>
            </h1>
            <p className="text-slate-400 max-w-xl text-lg font-medium leading-relaxed hidden md:block">
              We believe education is not the filling of a pail, but the lighting of a fire. Our aim is to nurture students who are curious, capable, and compassionate.
            </p>
          </motion.div>
        </div>
      </section>

      {/* --- 3. ACADEMIC RIGOR --- */}
      <section className="py-32 px-6 bg-white" id="excellence">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="aspect-[4/5] bg-slate-100 rounded-[4rem] overflow-hidden shadow-2xl">
              <img src="https://res.cloudinary.com/db6ssceun/image/upload/v1766916611/784_hku4ym.jpg" className="w-full h-full object-cover" alt="Academic Excellence at MVG Academy" />
            </div>
            <div className="absolute -bottom-10 -right-10 bg-[#6366F1] p-10 rounded-[3rem] text-white shadow-2xl hidden md:block">
              <BookOpen size={50} />
            </div>
          </div>
          <div className="space-y-8">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none text-slate-900">
              The Standard of <br /><span className="text-[#6366F1]">Excellence</span>
            </h2>
            <div className="space-y-4">
              <p className="text-xl text-slate-700 font-bold leading-relaxed">
                Education today is about more than just grades; it's about the depth of understanding and the ability to apply knowledge in a changing world.
              </p>
              <p className="text-slate-500 leading-relaxed text-lg">
                Our primary focus is on conceptual clarity. We have designed a curriculum that encourages students to ask "Why?" and "How?" rather than just "What?". By integrating modern technology with traditional values, we ensure our students remain competitive without losing their roots.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 pt-4">
              {['Critical Reasoning', 'Digital Fluency', 'Cognitive Growth', 'Research Focus'].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-800">
                  <div className="w-2 h-2 rounded-full bg-[#6366F1]" /> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- 4. LEADERSHIP CARDS (SEO FRIENDLY ARTICLES) --- */}
      <section className="py-24 px-6 bg-slate-900 rounded-[3rem] md:rounded-[6rem] mx-2 md:mx-8 text-white overflow-hidden">
        <div className="max-w-4xl mx-auto text-center mb-24">
          <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter mb-6">Our Three <span className="text-[#6366F1]">Pillars</span></h2>
          <p className="text-slate-400 text-lg font-medium">We don't just build students; we build the future leaders of India. Our methodology is built on these three non-negotiable foundations.</p>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <AimCard 
            icon={<Users size={32}/>} 
            title="Human Connection" 
            desc="In an era of AI, we prioritize empathy. Our students learn to collaborate, communicate with kindness, and build meaningful relationships across diverse social backgrounds." 
          />
          <AimCard 
            icon={<Compass size={32}/>} 
            title="Moral Integrity" 
            desc="Success without character is a failure. We instill a deep sense of honesty and ethical decision-making, ensuring our graduates are trusted wherever they go." 
          />
          <AimCard 
            icon={<Sparkles size={32}/>} 
            title="Fearless Creativity" 
            desc="Innovation happens when you aren't afraid to fail. We provide a safe space for artistic expression, robotics exploration, and out-of-the-box thinking." 
          />
        </div>
      </section>

      {/* --- 5. GLOBAL IMPACT --- */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1 space-y-10">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-tight">
              Global Vision,<br/><span className="text-[#6366F1]">Local Values</span>
            </h2>
            <p className="text-xl text-slate-600 leading-relaxed font-medium border-l-8 border-[#6366F1] pl-8">
              We aim to produce citizens who are locally rooted but globally competent. Our students are taught to respect Indian heritage while embracing global technological trends.
            </p>
            <div className="space-y-4">
               <article className="p-8 bg-slate-50 rounded-[2rem] hover:bg-slate-100 transition-colors">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#6366F1] mb-2">Environmental Stewardship</h4>
                  <p className="text-sm text-slate-500 font-medium">Through our Green Campus initiatives, students learn the importance of sustainability and protecting our planet's resources.</p>
               </article>
               <article className="p-8 bg-slate-50 rounded-[2rem] hover:bg-slate-100 transition-colors">
                  <h4 className="text-xs font-black uppercase tracking-widest text-blue-500 mb-2">Community Outreach</h4>
                  <p className="text-sm text-slate-500 font-medium">MVG students regularly engage in social service, understanding their responsibility towards the less privileged sections of society.</p>
               </article>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="aspect-square bg-slate-200 rounded-[5rem] overflow-hidden shadow-3xl relative rotate-3 hover:rotate-0 transition-transform duration-700">
              <img src="https://res.cloudinary.com/db6ssceun/image/upload/v1766917240/school_c5jhgf.jpg" className="w-full h-full object-cover" alt="Students exploring global opportunities at MVG Academy" />
              <div className="absolute inset-0 bg-indigo-900/10" />
            </div>
          </div>
        </div>
      </section>

      {/* --- 6. FOOTER (Consistent with SEO Schema) --- */}
      <footer className="bg-white border-t border-slate-100 pt-24 pb-12 px-6 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="space-y-6">
              <div className="text-2xl font-black tracking-tighter uppercase italic">{data?.schoolName || "MVG ACADEMY"}</div>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                A premier educational institution in Jaipur dedicated to providing world-class education and holistic development for over two decades.
              </p>
              <div className="flex gap-4">
                <a href="#" aria-label="Facebook" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-[#6366F1] hover:text-white transition-all"><Facebook size={18} /></a>
                <a href="#" aria-label="Instagram" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-[#6366F1] hover:text-white transition-all"><Instagram size={18} /></a>
              </div>
            </div>

            <div>
              <h4 className="font-black uppercase tracking-widest text-xs mb-8 text-slate-400">Our Academy</h4>
              <ul className="space-y-4 text-sm font-bold uppercase text-slate-500">
                <li><Link href="/About/history" className="hover:text-[#6366F1]">Heritage & History</Link></li>
                <li><Link href="/admission" className="hover:text-[#6366F1]">Admissions 2025</Link></li>
                <li><Link href="/apply" className="hover:text-[#6366F1]">Join our School</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black uppercase tracking-widest text-xs mb-8 text-slate-400">Quick Links</h4>
              <ul className="space-y-4 text-sm font-bold uppercase text-slate-500">
                <li><Link href="/gallery" className="hover:text-[#6366F1]">Campus Tour</Link></li>
                <li><Link href="/About/aim" className="hover:text-[#6366F1]">Educational Aim</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-black uppercase tracking-widest text-xs mb-8 text-slate-400">Contact Us</h4>
              <div className="flex items-start gap-4 text-sm font-medium text-slate-600">
                <MapPin size={20} className="text-[#6366F1] shrink-0" />
                <address className="not-italic">{data?.address || "123 Education Lane, Jaipur"}</address>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
                <Phone size={20} className="text-[#6366F1] shrink-0" />
                <p>{data?.phone || "+91 (141) 2345-678"}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 gap-4">
            <p>© 2025 {data?.schoolName || "MVG ACADEMY"}. All Rights Reserved.</p>
            <p>Designed for Future Leaders</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function AimCard({ icon, title, desc }) {
    return (
        <motion.article 
            whileHover={{ y: -10 }}
            className="p-12 bg-white/5 border border-white/10 rounded-[3.5rem] backdrop-blur-sm hover:bg-white/10 transition-all group"
        >
            <div className="w-20 h-20 rounded-[2rem] bg-[#6366F1]/10 flex items-center justify-center mb-10 text-[#6366F1] group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-6">{title}</h3>
            <p className="text-slate-400 font-medium leading-relaxed text-lg">{desc}</p>
        </motion.article>
    );
}

// NavItem & NavDropdown components remain as they are functionally sound, 
// but ensure labels are descriptive for accessibility.
function NavItem({ label, href, isScrolled }) {
  return (
    <Link href={href} className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors hover:text-[#6366F1] ${
      isScrolled ? 'text-slate-600' : 'text-white'
    }`}>{label}</Link>
  );
}

function NavDropdown({ label, items, isScrolled }) {
  return (
    <div className="relative group px-4 py-2 cursor-pointer">
      <div className={`flex items-center gap-1 text-[11px] font-black uppercase tracking-widest group-hover:text-[#6366F1] transition-colors ${
        isScrolled ? 'text-slate-600' : 'text-white'
      }`}>{label} <ChevronDown size={12} className="group-hover:rotate-180 transition-transform" /></div>
      <div className="absolute top-full left-0 pt-4 opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
        <div className="bg-white min-w-[240px] shadow-2xl rounded-2xl border border-slate-50 p-3 grid gap-1">
          {items.map((item, idx) => (
            <Link key={idx} href={item.link} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-[#6366F1] transition-all">
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              <ArrowRight size={12} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileNavItem({ label, href, setMobileMenu }) {
  return (
    <Link href={href} onClick={() => setMobileMenu(false)} className="py-5 border-b border-slate-50 block">
      <span className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">{label}</span>
    </Link>
  );
}