"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';


import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
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
        { label: 'STEM Curriculum', href: '/Academics/curriculum' },
        { label: 'Visual Arts', href: '/Academics/visual-art' },
        { label: 'Cultural', href: '/Academics/cultural' },
      ]
    },
    { 
      label: 'Admission', 
      items: [
        { label: 'Apply 2026-27', href: '/Admission/apply' },
        { label: 'Fee Structure', href: '/Admission/fees' },
        { label: 'Enquiry Form', href: '/Admission/enquiry' },
      ]
    },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-lg py-2' : 'bg-transparent py-5'}`}>
      <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        
        {/* LOGO */}
        <Link href="/" className="flex flex-col">
          <span className={`font-black text-2xl leading-none ${isScrolled ? 'text-slate-900' : 'text-white'}`}>MVG PUBLIC SCHOOL</span>
          <span className={`text-[10px] font-bold tracking-widest uppercase ${isScrolled ? 'text-indigo-600' : 'text-indigo-300'}`}>Jaipur • RBSE</span>
        </Link>

        {/* DESKTOP MENU */}
        <div className="hidden xl:flex items-center gap-2">
          {navLinks.map((link) => (
            link.items ? (
              <Dropdown key={link.label} label={link.label} items={link.items} isScrolled={isScrolled} />
            ) : (
              <Link 
                key={link.href} 
                href={link.href} 
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${pathname === link.href ? 'text-indigo-600' : isScrolled ? 'text-slate-600 hover:bg-slate-50' : 'text-white hover:bg-white/10'}`}
              >
                {link.label}
              </Link>
            )
          ))}
          <Link href="/Admission/apply" className="ml-4 bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-indigo-500/20">
            Apply Now
          </Link>
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button onClick={() => setMobileMenu(true)} className="xl:hidden p-2 bg-indigo-600 text-white rounded-lg">
          <Menu size={20} />
        </button>
      </nav>

      {/* MOBILE OVERLAY */}
      {mobileMenu && (
        <div className="fixed inset-0 bg-slate-900 z-[100] p-8 flex flex-col">
          <div className="flex justify-between items-center mb-12">
            <span className="text-white font-black text-2xl">MENU</span>
            <button onClick={() => setMobileMenu(false)} className="text-white border border-slate-700 p-2 rounded-full"><X size={24} /></button>
          </div>
          <div className="flex flex-col gap-6 overflow-y-auto">
            {navLinks.map((link) => (
              <div key={link.label}>
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{link.label}</p>
                {link.items ? (
                  <div className="flex flex-col gap-4 pl-2 border-l border-slate-700">
                    {link.items.map(sub => (
                      <Link key={sub.href} href={sub.href} className="text-xl font-bold text-white" onClick={() => setMobileMenu(false)}>{sub.label}</Link>
                    ))}
                  </div>
                ) : (
                  <Link href={link.href} className="text-2xl font-bold text-white" onClick={() => setMobileMenu(false)}>{link.label}</Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

function Dropdown({ label, items, isScrolled }) {
  return (
    <div className="relative group">
      <button className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isScrolled ? 'text-slate-600 hover:bg-slate-50' : 'text-white hover:bg-white/10'}`}>
        {label} <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />
      </button>
      <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0">
        <div className="p-2 flex flex-col">
          {items.map(item => (
            <Link key={item.href} href={item.href} className="px-4 py-3 text-[13px] font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Navbar;