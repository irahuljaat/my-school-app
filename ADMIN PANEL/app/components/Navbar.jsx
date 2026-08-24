"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Menu, X, ChevronDown, Phone, Mail, 
  Instagram, Facebook, Youtube 
} from 'lucide-react';
import LogoImg from '../images/logo.png';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/' },
    { 
      label: 'About Us', 
      items: [
        { label: 'About School', href: '/About' },
        { label: 'Director’s Desk', href: '/About/director' },
        { label: 'Our Mission', href: '/About/mission' },
        { label: 'Faculties', href: '/About/faculty' },
      ]
    },
    { 
      label: 'Academics', 
      items: [
        { label: 'Robotics Lab', href: '/Academics/robotics' },
        { label: 'Visual Arts', href: '/Academics/visual-art' },
        { label: 'Cultural', href: '/Academics/cultural' },
      ]
    },
    { 
      label: 'Admission', 
      items: [
        { label: 'Why MVG?', href: '/Admission/why-us' },
        { label: 'Apply 2026-27', href: '/Admission/apply' },
        { label: 'Fee Structure', href: '/Admission/fees' },
        { label: 'Enquiry Form', href: '/Admission/enquiry' },
      ]
    },
    { label: 'Contact', href: '/contact' },
    { label: 'Gallery', href: '/gallery' },
  ];

  return (
    <header className={`fixed w-full z-50 transition-all duration-500`}>
      
      {/* --- TOP BAR --- */}
      <div className={`bg-slate-900 border-b border-white/10 transition-all duration-500 overflow-hidden ${isScrolled ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'}`}>
        <div className="max-w-7xl mx-auto px-6 h-10 flex items-center justify-between text-white/70">
          <div className="flex items-center gap-6">
            <a href="tel:+919887710342" className="flex items-center gap-2 text-[10px] font-bold hover:text-white transition-colors">
              <Phone size={12} className="text-indigo-400" /> +91 141-3152600, 9829018332, 8875646366
            </a>
            <a href="mailto:mvgschooljaipur@gmail.com" className="hidden md:flex items-center gap-2 text-[10px] font-bold hover:text-white transition-colors">
              <Mail size={12} className="text-indigo-400" /> mvgschooljaipur@gmail.com
            </a>
          </div>
         <div className="flex items-center gap-4">
  <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest text-white/30 mr-2">Follow Us</span>
  
  {/* Instagram - Link added */}
  <a 
    href="https://www.instagram.com/mvgpublicschool/" 
    target="_blank" 
    rel="noopener noreferrer"
    className="hover:text-indigo-400 cursor-pointer transition-colors"
  >
    <Instagram size={14} />
  </a>

  {/* Facebook - Link added */}
  <a 
    href="https://www.facebook.com/mvgpublicschool/" 
    target="_blank" 
    rel="noopener noreferrer"
    className="hover:text-indigo-400 cursor-pointer transition-colors"
  >
    <Facebook size={14} />
  </a>

  {/* Youtube - Link added */}
  <a 
    href="https://www.youtube.com/@mvgpublicschool" 
    target="_blank" 
    rel="noopener noreferrer"
    className="hover:text-indigo-400 cursor-pointer transition-colors"
  >
    <Youtube size={14} />
  </a>
</div>
        </div>
      </div>

      {/* --- MAIN NAVBAR --- */}
      <nav className={`transition-all duration-300 ${
        isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-xl py-2' 
        : 'bg-slate-950/30 backdrop-blur-[2px] py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          
          {/* LOGO SECTION */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 overflow-hidden rounded-xl border border-white/20 group-hover:scale-105 transition-transform">
                <Image src={LogoImg} alt="MVG Logo" fill className="object-cover" />
            </div>
            <div className="flex flex-col">
              <span className={`font-black text-xl md:text-2xl leading-none transition-colors ${isScrolled ? 'text-slate-950' : 'text-white'}`}>
                MVG PUBLIC <span className="text-indigo-500">SCHOOL</span>
              </span>
              <span className={`text-[10px] font-black tracking-[0.2em] uppercase transition-colors ${isScrolled ? 'text-slate-500' : 'text-indigo-100'}`}>
                Jaipur • RBSE 
              </span>
            </div>
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden xl:flex items-center gap-2">
            {navLinks.map((link) => (
              link.items ? (
                <Dropdown key={link.label} label={link.label} items={link.items} isScrolled={isScrolled} pathname={pathname} />
              ) : (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    pathname === link.href 
                    ? 'text-indigo-400 bg-white/10 shadow-sm' // Neon indigo for active state
                    : isScrolled 
                      ? 'text-slate-600 hover:bg-slate-100' 
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  {link.label}
                </Link>
              )
            ))}
            <Link href="/Admission/apply" className="ml-4 bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-indigo-600/30">
              Apply Now
            </Link>
          </div>

          {/* MOBILE MENU TOGGLE */}
          <button onClick={() => setMobileMenu(true)} className="xl:hidden p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/30">
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* MOBILE OVERLAY */}
      {mobileMenu && (
        <div className="fixed inset-0 bg-slate-950 z-[100] p-8 flex flex-col">
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden relative border border-white/10">
                    <Image src={LogoImg} alt="Logo" fill className="object-cover" />
                </div>
                <span className="text-white font-black text-xl">MVG SCHOOL</span>
            </div>
            <button onClick={() => setMobileMenu(false)} className="text-white border border-white/10 p-3 rounded-2xl hover:bg-white/10 transition-colors"><X size={24} /></button>
          </div>
          
          <div className="flex flex-col gap-8 overflow-y-auto pb-10">
            {navLinks.map((link) => (
              <div key={link.label}>
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">{link.label}</p>
                {link.items ? (
                  <div className="flex flex-col gap-5 pl-4 border-l-2 border-slate-800">
                    {link.items.map(sub => (
                      <Link 
                        key={sub.href} 
                        href={sub.href} 
                        className={`text-2xl font-bold transition-colors ${pathname === sub.href ? 'text-indigo-400' : 'text-white/90'}`} 
                        onClick={() => setMobileMenu(false)}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link 
                    href={link.href} 
                    className={`text-3xl font-black italic transition-colors ${pathname === link.href ? 'text-indigo-400' : 'text-white'}`} 
                    onClick={() => setMobileMenu(false)}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

function Dropdown({ label, items, isScrolled, pathname }) {
  // Check if any sub-item is currently active
  const isActive = items.some(item => item.href === pathname);

  return (
    <div className="relative group">
      <button className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
        isActive 
        ? 'text-indigo-400 bg-white/10' 
        : isScrolled 
          ? 'text-slate-600 hover:bg-slate-100' 
          : 'text-white hover:bg-white/20'
      }`}>
        {label} <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
      </button>
      <div className="absolute top-full left-0 mt-2 w-60 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 overflow-hidden">
        <div className="p-2 flex flex-col">
          {items.map(item => (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`px-4 py-3 text-[13px] font-bold rounded-xl transition-all ${
                pathname === item.href 
                ? 'bg-indigo-50 text-indigo-600 shadow-inner' 
                : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Navbar;