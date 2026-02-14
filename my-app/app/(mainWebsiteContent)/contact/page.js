"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../images/logo.jpg';
import { 
  Menu, X, Phone, Mail, MapPin, Clock, Send, 
  Instagram, Facebook, Twitter, ChevronRight, 
  Globe, ArrowRight, MessageSquare, ShieldCheck
} from 'lucide-react';

export default function ContactPageStatic() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-[#fcfcfc] text-[#1a1a1a] antialiased selection:bg-[#6366F1] selection:text-white">
      
      {/* --- 1. TOP CONTACT BAR (STICKY) --- */}
      <div className="fixed top-0 w-full z-[120] bg-[#0a0a0a] text-slate-400 py-2 hidden lg:block border-b border-white/5">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[9px] font-bold uppercase tracking-[0.2em]">
          <div className="flex gap-8 items-center">
            <span className="flex items-center gap-2 transition-colors hover:text-white"><Phone size={10} className="text-[#6366F1]" /> +91 141 2345678</span>
            <span className="flex items-center gap-2 transition-colors hover:text-white"><Mail size={10} className="text-[#6366F1]" /> admissions@mvgacademy.com</span>
          </div>
          <div className="flex items-center gap-6">
             <span className="flex items-center gap-2"><MapPin size={10} className="text-[#6366F1]" /> Jaipur, Rajasthan</span>
             <div className="flex gap-4 border-l border-white/10 pl-6">
                <Instagram size={12} className="hover:text-white cursor-pointer" />
                <Facebook size={12} className="hover:text-white cursor-pointer" />
             </div>
          </div>
        </div>
      </div>

      {/* --- 2. MAIN HEADER --- */}
      <header className={`fixed w-full z-[110] transition-all duration-700 ${isScrolled ? 'top-0 py-4 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm' : 'lg:top-[35px] py-8 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 overflow-hidden shadow-sm">
                <img src={LogoImg.src} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className={`text-lg font-bold tracking-tight transition-colors duration-500 ${isScrolled ? 'text-slate-900' : 'text-white'}`}>MVG Academy</span>
              <span className="text-[9px] font-black text-[#6366F1] uppercase tracking-[0.4em]">Contact Desk</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-2">
            <NavItem label="Home" href="/" isScrolled={isScrolled} />
            <NavItem label="About" href="/about" isScrolled={isScrolled} />
            <NavItem label="Admissions" href="/admission" isScrolled={isScrolled} />
            <Link href="/admission" className="ml-6 bg-[#6366F1] text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100">Apply 2025</Link>
          </nav>

          <button onClick={() => setMobileMenu(true)} className={`lg:hidden p-2 ${isScrolled ? 'text-slate-900' : 'text-white'}`}><Menu size={24} /></button>
        </div>
      </header>

      {/* --- 3. HERO SECTION --- */}
      <section className="relative h-[60vh] flex items-center bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#6366F1]/20 via-transparent to-transparent opacity-50" />
        </div>
        <div className="max-w-7xl mx-auto px-8 relative z-10 w-full text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="text-[#6366F1] text-[11px] font-black uppercase tracking-[0.6em] mb-8 block">Global Support</span>
            <h1 className="text-6xl md:text-[9rem] font-bold text-white tracking-tighter leading-[0.85] mb-8">
              Let's <br/><span className="italic font-light text-slate-500">Connect.</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* --- 4. CONTACT & FORM MAIN AREA --- */}
      <main className="py-32 px-8 -mt-20 relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          
          {/* LEFT COLUMN: INFO (Col 5) */}
          <div className="lg:col-span-5 space-y-16">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-12 italic underline decoration-[#6366F1] decoration-2 underline-offset-8">Reach Out.</h2>
              <div className="space-y-12">
                <ContactItem icon={<Phone size={20}/>} title="Voice Support" val="+91 141 2345678" sub="Available Mon-Sat (8 AM - 4 PM)" />
                <ContactItem icon={<Mail size={20}/>} title="Email Queries" val="info@mvgacademy.com" sub="Admissions: join@mvgacademy.com" />
                <ContactItem icon={<MapPin size={20}/>} title="Our Campus" val="Sector 4, Main Road" sub="Jaipur, Rajasthan 302021" />
              </div>
            </div>

            <div className="p-10 bg-black rounded-[3rem] text-white space-y-6">
                <div className="flex items-center gap-4 text-[#6366F1]">
                    <Clock size={24}/>
                    <span className="text-[10px] font-black uppercase tracking-widest">Office Timings</span>
                </div>
                <div className="space-y-2">
                    <p className="text-xl font-bold">Weekdays: 8:30 — 3:30</p>
                    <p className="text-slate-500 text-sm font-light">Saturdays: 8:30 — 12:30 (Enquiry Only)</p>
                </div>
            </div>
          </div>

          {/* RIGHT COLUMN: FORM (Col 7) */}
          <div className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[4rem] p-10 md:p-20 border border-slate-100 shadow-2xl shadow-slate-200/50"
            >
                <div className="mb-12">
                    <h3 className="text-3xl font-bold tracking-tight mb-4">Send a Message</h3>
                    <p className="text-slate-400 text-sm font-light leading-relaxed">Have a specific question about our curriculum or admission process? Fill the form and our team will get back to you within 24 hours.</p>
                </div>

                <form className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <FloatingInput label="Your Full Name" placeholder="e.g. Aryan Sharma" />
                        <FloatingInput label="Email Address" placeholder="aryan@example.com" type="email" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <FloatingInput label="Phone Number" placeholder="+91 00000 00000" />
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nature of Enquiry</label>
                            <select className="w-full bg-slate-50 border-none rounded-2xl py-5 px-8 text-sm focus:ring-2 focus:ring-[#6366F1] appearance-none">
                                <option>Admission Enquiry</option>
                                <option>Career Opportunity</option>
                                <option>General Information</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Your Message</label>
                        <textarea rows="5" className="w-full bg-slate-50 border-none rounded-3xl py-5 px-8 text-sm focus:ring-2 focus:ring-[#6366F1]" placeholder="How can we assist you?"></textarea>
                    </div>
                    <button className="w-full bg-[#6366F1] text-white py-6 rounded-3xl font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-black transition-all shadow-xl shadow-indigo-100">
                        Deliver Message <Send size={16}/>
                    </button>
                </form>
            </motion.div>
          </div>
        </div>
      </main>

      {/* --- 5. COMPREHENSIVE FOOTER --- */}
      <footer className="bg-white pt-32 pb-12 px-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
                {/* School Identity */}
                <div className="space-y-8 lg:col-span-1">
                    <div className="text-2xl font-black tracking-tighter italic uppercase text-[#6366F1]">MVG ACADEMY</div>
                    <p className="text-slate-400 font-light text-sm leading-relaxed">Building a sanctuary of innovation and academic rigor in the heart of Jaipur since 1998.</p>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center hover:bg-black hover:text-white transition-all cursor-pointer"><Instagram size={16}/></div>
                        <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center hover:bg-black hover:text-white transition-all cursor-pointer"><Facebook size={16}/></div>
                    </div>
                </div>

                {/* Quick Links */}
                <FooterList title="Academic" items={['Curriculum', 'Robotics & AI', 'Sports Academy', 'Library']} />
                <FooterList title="Admissions" items={['Apply Online', 'Fee Structure', 'Eligibility', 'Scholarships']} />
                
                {/* NewsLetter / Contact Info */}
                <div className="space-y-6">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Newsletter</h5>
                    <div className="flex gap-2">
                        <input type="email" placeholder="Email" className="bg-slate-50 border-none rounded-xl px-4 py-3 text-xs w-full focus:ring-1 focus:ring-[#6366F1]" />
                        <button className="bg-black text-white p-3 rounded-xl hover:bg-[#6366F1] transition-all"><ArrowRight size={16}/></button>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Join 500+ parents for weekly updates.</p>
                </div>
            </div>

            <div className="pt-12 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 italic">© 2025 MVG ACADEMY • The Future Begins Here</span>
                <div className="flex gap-10 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <Link href="/privacy" className="hover:text-black">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-black">Terms of Use</Link>
                    <span className="text-[#6366F1]">Jaipur, RJ</span>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}

// --- REUSABLE COMPONENTS ---

function ContactItem({ icon, title, val, sub }) {
    return (
        <div className="flex gap-6 group cursor-default">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-[#6366F1] transition-all duration-500">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">{title}</p>
                <p className="text-xl font-bold tracking-tight group-hover:text-[#6366F1] transition-colors">{val}</p>
                <p className="text-xs text-slate-400 font-light italic mt-1">{sub}</p>
            </div>
        </div>
    );
}

function FloatingInput({ label, placeholder, type = "text" }) {
    return (
        <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{label}</label>
            <input 
                type={type} 
                placeholder={placeholder}
                className="w-full bg-slate-50 border-none rounded-2xl py-5 px-8 text-sm focus:ring-2 focus:ring-[#6366F1] transition-all"
            />
        </div>
    );
}

function FooterList({ title, items }) {
    return (
        <div className="space-y-8">
            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6366F1]">{title}</h5>
            <ul className="space-y-4">
                {items.map((it, i) => (
                    <li key={i} className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-black hover:translate-x-2 transition-all cursor-pointer flex items-center gap-2">
                        <ChevronRight size={10} className="text-[#6366F1] opacity-0 group-hover:opacity-100" /> {it}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function NavItem({ label, href, isScrolled }) {
    return (
        <Link href={href} className={`px-5 py-2 text-[11px] font-bold uppercase tracking-widest hover:text-[#6366F1] transition-colors ${isScrolled ? 'text-slate-600' : 'text-white'}`}>
            {label}
        </Link>
    );
}