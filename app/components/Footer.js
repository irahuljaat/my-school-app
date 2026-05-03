"use client"
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion'; // For instant visual feedback
import { Facebook, Instagram, Mail, Phone, MapPin, ChevronRight, ArrowUpRight } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-white pt-24 pb-10 px-6 border-t border-white/5 overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          
          {/* School Identity */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg p-1.5 shrink-0">
                <img 
                  src="https://res.cloudinary.com/db6ssceun/image/upload/v1771071585/SCHOOL_SENIOR_SECONDARY_LOGO_t88t8l.png" 
                  alt="MVG Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-2xl font-black tracking-tighter">
                MVG <span className="text-blue-500">PUBLIC</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed font-medium max-w-xs">
              Providing excellence in RBSE English Medium education. Shaping the future of Jaipur since 2005.
            </p>
            <div className="flex gap-4">
              <SocialLink href="https://www.facebook.com/mvgpublicschool" icon={<Facebook size={18} />} color="hover:bg-blue-600" />
              <SocialLink href="https://www.instagram.com/mvgpublicschool" icon={<Instagram size={18} />} color="hover:bg-pink-600" />
            </div>
          </div>

          {/* Quick Links with Prefetching */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 mb-8">Quick Navigation</h4>
            <ul className="space-y-4">
              {[
                { name: 'About Us', href: '/About' },
                { name: 'Admissions', href: '/Admission' },
                { name: 'Academic Calendar', href: '/Academics/calender' },
                { name: 'Photo Gallery', href: '/gallery' },
                { name: 'Contact Us', href: '/contact' }
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href} 
                    prefetch={true} // Speeds up page transitions
                    className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all group py-1"
                  >
                    <ChevronRight 
                      size={12} 
                      className="text-blue-500 group-hover:translate-x-1 transition-transform" 
                    />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 mb-8">Get In Touch</h4>
            <ul className="space-y-6">
              <ContactInfo icon={<MapPin size={18}/>} text={<>Sheopur, Pratap Nagar,<br /> Sanganer, Jaipur</>} />
              <ContactInfo icon={<Phone size={18}/>} text="+91 141-3152600" />
              <ContactInfo icon={<Mail size={18}/>} text="mvgschooljaipur@gmail.com" lowercase />
            </ul>
          </div>

          {/* URGENT CALL TO ACTION - Redesigned for impact */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-gradient-to-br from-blue-600/20 to-indigo-600/5 rounded-[2rem] p-8 border border-blue-500/20 relative group"
          >
            <div className="absolute top-4 right-4 text-blue-500/30 group-hover:text-blue-500 transition-colors">
              <ArrowUpRight size={24} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-2">2026-27 Session</h4>
            <h3 className="text-xl font-bold mb-4">Admissions Open</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8 leading-loose">
              Limited seats available for English Medium curriculum.
            </p>
            <Link 
              href="/Admission/apply" 
              prefetch={true}
              className="block w-full py-4 bg-blue-600 hover:bg-white hover:text-blue-600 text-white text-center rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300 shadow-xl shadow-blue-900/20"
            >
              Apply Now
            </Link>
          </motion.div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
            © {currentYear} MVG Public Senior Secondary School
          </p>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600">
            <Link href="/About/legal/privacy" className="hover:text-blue-500 transition-colors">Privacy</Link>
            <Link href="/About/legal/terms" className="hover:text-blue-500 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- Helper Components for Cleanliness & Speed ---

const SocialLink = ({ href, icon, color }) => (
  <motion.a 
    whileTap={{ scale: 0.9 }} // Instant feedback on click
    href={href} 
    className={`p-3 bg-white/5 rounded-xl transition-all text-slate-300 hover:text-white ${color}`}
  >
    {icon}
  </motion.a>
);

const ContactInfo = ({ icon, text, lowercase }) => (
  <li className="flex items-start gap-4">
    <div className="text-blue-500 shrink-0">{icon}</div>
    <span className={`text-slate-400 text-xs font-bold leading-relaxed tracking-wider ${lowercase ? 'lowercase' : 'uppercase'}`}>
      {text}
    </span>
  </li>
);

export default Footer;