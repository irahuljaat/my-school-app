'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileSubmenu, setMobileSubmenu] = useState(null); // Track which mobile menu is open

  const menus = [
    { title: 'Home', items: null, path: '/' },
    { 
      title: 'About Us', 
      path: '/about', // Added path for main title
      items: [
        { label: 'About MVG', path: '/About' },
        { label: 'Vision', path: '/About/vision' },
        { label: 'Mission', path: '/About/mission' },
        { label: 'Our Aim', path: '/About/aim' },
        { label: "Director's Message", path: '/About/director' }
      ] 
    },
    { title: 'Academics', items: [
    
      { label: 'Cultural', path: '/Academics/cultural' },
      { label: 'Robotics', path: '/Academics/robotics' },
      { label: 'Visual Art', path: '/Academics/visual-art' }
    ]},
    { title: 'Admission', items: [
      { label: 'Apply', path: '/Admission/apply' },
      { label: 'Criteria', path: '/Admission/criteria' },
      { label: 'Enquiry', path: '/Admission/enquiry' },
      { label: 'Fees', path: '/Admission/fees' },
      { label: 'Why US?', path: '/Admission/why-us' }
    ]},

     { title: 'Gallery', items: [
      { label: 'Event', path: '/Gallery/event' },
      { label: 'News', path: '/Gallery/news' },
      { label: 'School Gallery', path: '/Gallery/school-gallery' }
    
    ]},

    { title: 'Contact', items: null, path: '/contact' },

    { title: 'Blog', items: null, path: '/blog' },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-[1000] transition-all duration-300 
        ${isScrolled ? 'bg-white shadow-xl py-3' : 'bg-slate-900 xl:bg-transparent py-4 xl:py-6'}`}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 bg-white rounded-xl overflow-hidden shadow-md border border-slate-200">
                <img src="https://res.cloudinary.com/db6ssceun/image/upload/v1771071585/SCHOOL_SENIOR_SECONDARY_LOGO_t88t8l.png" alt="Logo" className="w-full h-full object-contain p-1" />
              </div>
              <span className={`font-black tracking-tighter whitespace-nowrap transition-all ${isScrolled ? 'text-blue-600 text-lg' : 'text-white text-lg md:text-2xl'}`}>
                MVG <span className={isScrolled ? 'text-slate-900' : 'text-blue-400'}>Public School</span>
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden xl:flex items-center gap-1">
              {menus.map((m) => (
                <div key={m.title} className="relative group px-2" onMouseEnter={() => setActiveMenu(m.title)} onMouseLeave={() => setActiveMenu(null)}>
                  {m.items ? (
                    <div className="flex items-center gap-1 cursor-pointer">
                      <Link href={m.path || "#"} className={`text-[11px] font-bold uppercase tracking-tight transition-colors py-2 ${isScrolled ? 'text-slate-700 hover:text-blue-600' : 'text-white/90 hover:text-white'}`}>
                        {m.title}
                      </Link>
                      <ChevronDown size={12} className={`opacity-50 ${isScrolled ? 'text-slate-700' : 'text-white'}`} />
                    </div>
                  ) : (
                    <Link href={m.path || "#"} className={`text-[11px] font-bold uppercase tracking-tight transition-colors py-2 ${isScrolled ? 'text-slate-700 hover:text-blue-600' : 'text-white/90 hover:text-white'}`}>
                      {m.title}
                    </Link>
                  )}
                  
                  <AnimatePresence>
                    {m.items && activeMenu === m.title && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 w-56 bg-white rounded-2xl shadow-2xl p-3 border border-slate-100 mt-2">
                        {m.items.map((i) => (
                          <Link key={i.label} href={i.path} onClick={() => setActiveMenu(null)} className="block px-4 py-2.5 text-[11px] font-bold text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all">
                            {i.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <button onClick={() => setIsMobileMenuOpen(true)} className={`xl:hidden p-2.5 rounded-xl border transition-all ${isScrolled ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-white/10 border-white/20 text-white'}`}>
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl p-6 flex flex-col">
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <img src="https://res.cloudinary.com/db6ssceun/image/upload/v1771071585/SCHOOL_SENIOR_SECONDARY_LOGO_t88t8l.png" className="w-8 h-8 object-contain" alt="logo" />
                  <span className="font-black text-blue-600 text-lg">MVG PUBLIC</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-900"><X size={20} /></button>
              </div>

              <div className="flex flex-col gap-1 overflow-y-auto pr-2">
                {menus.map((m) => (
                  <div key={m.title} className="mb-2">
                    {m.items ? (
                      <>
                        <button 
                          onClick={() => setMobileSubmenu(mobileSubmenu === m.title ? null : m.title)}
                          className="text-xl font-black tracking-tighter text-slate-800 flex items-center justify-between w-full uppercase italic py-3"
                        >
                          {m.title} 
                          <ChevronDown size={18} className={`text-blue-600 transition-transform ${mobileSubmenu === m.title ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {mobileSubmenu === m.title && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }} 
                              animate={{ height: 'auto', opacity: 1 }} 
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden grid grid-cols-1 gap-1 pl-4 border-l-2 border-blue-50"
                            >
                              {m.items.map(item => (
                                <Link key={item.label} href={item.path} onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-slate-400 py-2 hover:text-blue-600">
                                  {item.label}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <Link href={m.path || "#"} onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-black tracking-tighter text-slate-800 block uppercase italic py-3">
                        {m.title}
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-8 border-t border-slate-100">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <button className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 mb-4 cursor-pointer">
                    Student Portal
                  </button>
                </Link>
                <div className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">Jaipur • Since 2005</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
