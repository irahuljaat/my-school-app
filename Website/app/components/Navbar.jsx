'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, Phone, Instagram, Facebook , Mail, Youtube , MapPin} from 'lucide-react';
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
    { label: 'About Us', items: [
        { label: 'About School', href: '/About' },
        { label: 'Director’s Desk', href: '/About/director' },
        { label: 'Our Mission', href: '/About/mission' },
        { label: 'Faculties', href: '/About/faculty' },
    ]},
    { label: 'Academics', items: [
      { label: 'Academic Calendar', href: '/Academics/Acadcalender' },
        { label: 'Admission Procedure', href: '/Academics/admission-process' },
        { label: 'Robotics Lab', href: '/Academics/robotics' },
        { label: 'Visual Arts', href: '/Academics/visual-art' },
        { label: 'Cultural', href: '/Academics/cultural' },
        { label: 'Prospectus', href: '/Academics/prospectus' },
    ]},
    { label: 'Admission', items: [
        { label: 'Why MVG?', href: '/Admission/why-us' },
        { label: 'Apply 2026-27', href: '/Admission/apply' },
        { label: 'Fee Structure', href: '/Admission/fees' },
        { label: 'Enquiry Form', href: '/Admission/enquiry' },
    ]},

    

    { label: 'Contact', href: '/contact' },
    { label: 'Gallery', href: '/gallery' },
  ];

  return (
    <header className="fixed w-full z-50 transition-all duration-500 font-sans">
      
      {/* --- TOP CONTACT BAR --- */}
      <div className="hidden lg:block bg-[#142440] text-[#E9DCBD] py-3 relative z-[110] border-b border-[#E4DFD3]">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.32em]">
          <div className="flex gap-8">
            <span className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone size={12} className="text-[#B8892B]" /> { "+91 141 3152600"}
            </span>
            <span className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail size={12} className="text-[#B8892B]" /> {"mvgschooljaipur@gmail.com"}
            </span>
          </div>
          <div className="flex gap-6 items-center">
            <span className="flex items-center gap-2">
              <MapPin size={12} className="text-[#B8892B]" /> Jaipur, Rajasthan
            </span>
           <div className="flex gap-4 border-l border-[#E4DFD3]/20 pl-6">
  <a href="https://www.facebook.com/mvgpublicschool" target="_blank" rel="noopener noreferrer">
    <Facebook size={14} className="hover:text-[#B8892B] cursor-pointer transition-colors" />
  </a>
  <a href="https://www.instagram.com/mvgpublicschool/" target="_blank" rel="noopener noreferrer">
    <Instagram size={14} className="hover:text-[#B8892B] cursor-pointer transition-colors" />
  </a>
  <a href="https://www.youtube.com/mvgschool" target="_blank" rel="noopener noreferrer">
    <Youtube size={14} className="hover:text-[#B8892B] cursor-pointer transition-colors" />
  </a>
</div>
          </div>
        </div>
      </div>

      {/* --- MAIN NAVBAR --- */}
      <nav className={`transition-all duration-300 border-b border-[#E4DFD3] ${
        isScrolled 
        ? 'bg-[#FAF8F4] py-3' 
        : 'bg-[#F1ECE1]/90 backdrop-blur-md py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-12 h-12 overflow-hidden rounded-[20px] border border-[#E4DFD3]">
                <Image src={LogoImg} alt="Logo" fill className="object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold text-[#142440]">MVG PUBLIC SCHOOL</span>
              <span className="text-[10px] font-mono uppercase tracking-[0.32em] text-[#B8892B]">Jaipur</span>
            </div>
          </Link>

          <div className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => (
              link.items ? (
                <Dropdown key={link.label} label={link.label} items={link.items} pathname={pathname} />
              ) : (
                <Link key={link.href} href={link.href} className="px-4 py-2 rounded-[20px] text-[13px] font-mono uppercase tracking-[0.1em] text-[#142440] hover:text-[#B8892B] transition-colors">
                  {link.label}
                </Link>
              )
            ))}
            
            {/* Utility Buttons */}
            <Link 
              href="/login" 
              className="ml-4 bg-[#52607A] text-white px-6 py-2.5 rounded-[20px] text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-[#142440] transition-colors"
            >
              Login
            </Link>
            <Link 
              href="/Admission/apply" 
              className="ml-2 bg-[#B8892B] text-white px-6 py-2.5 rounded-[20px] text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-[#142440] transition-colors"
            >
              Apply Now
            </Link>
          </div>

          <button onClick={() => setMobileMenu(true)} className="xl:hidden p-2 text-[#142440]"><Menu /></button>
        </div>
      </nav>

      {/* MOBILE OVERLAY */}
      {mobileMenu && (
        <div className="fixed inset-0 bg-[#142440] z-[100] p-8 flex flex-col">
          <div className="flex justify-between items-center mb-12">
            <span className="text-[#FAF8F4] font-serif text-xl font-bold">MVG PUBLIC SCHOOL</span>
            <button onClick={() => setMobileMenu(false)} className="text-[#FAF8F4]"><X size={24} /></button>
          </div>
          <div className="flex flex-col gap-6">
            {navLinks.map((link) => (
              <div key={link.label}>
                <p className="text-[#B8892B] text-[10px] font-mono uppercase tracking-[0.3em] mb-2">{link.label}</p>
                {link.items ? (
                   link.items.map(sub => (
                    <Link key={sub.href} href={sub.href} className="block py-2 text-2xl font-serif text-white/90" onClick={() => setMobileMenu(false)}>{sub.label}</Link>
                   ))
                ) : (
                  <Link href={link.href} className="text-3xl font-serif text-white" onClick={() => setMobileMenu(false)}>{link.label}</Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

function Dropdown({ label, items, pathname }) {
  return (
    <div className="relative group">
      <button className="flex items-center gap-1 px-4 py-2 rounded-[20px] text-[13px] font-mono uppercase tracking-[0.1em] text-[#142440] hover:text-[#B8892B]">
        {label} <ChevronDown size={12} />
      </button>
      <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-[24px] border border-[#E4DFD3] shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2">
        {items.map(item => (
          <Link key={item.href} href={item.href} className="block px-4 py-3 text-[11px] font-mono uppercase tracking-[0.1em] text-[#52607A] hover:text-[#B8892B] hover:bg-[#FAF8F4] rounded-[20px]">
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Navbar;