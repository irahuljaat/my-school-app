"use client"
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion'; // For instant visual feedback
import { Facebook, Instagram, Mail, Phone, MapPin, ChevronRight, ArrowUpRight } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#142440] text-white pt-24 pb-10 px-6 border-t border-[#E4DFD3]/10 overflow-hidden font-sans">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          
          {/* School Identity */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-[14px] p-1.5 shrink-0 shadow-md">
                <img 
                  src="https://res.cloudinary.com/db6ssceun/image/upload/v1771071585/SCHOOL_SENIOR_SECONDARY_LOGO_t88t8l.png" 
                  alt="MVG Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-2xl font-black tracking-tighter">
                MVG <span className="text-[#B8892B]">PUBLIC SCHOOL</span>
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed font-medium max-w-xs">
              Providing excellence in RBSE English Medium education. Shaping the future of Jaipur since 2005.
            </p>
            <div className="flex gap-3">
              <SocialLink href="https://www.facebook.com/mvgpublicschool" icon={<Facebook size={16} />} color="hover:bg-[#B8892B]" />
              <SocialLink href="https://www.instagram.com/mvgpublicschool" icon={<Instagram size={16} />} color="hover:bg-[#B8892B]" />
            </div>
          </div>

          {/* Quick Links with Prefetching */}
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#B8892B] mb-8 font-bold">Quick Navigation</h4>
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
                    prefetch={true} 
                    className="text-slate-300 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all group py-1"
                  >
                    <ChevronRight 
                      size={12} 
                      className="text-[#B8892B] group-hover:translate-x-1 transition-transform" 
                    />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#B8892B] mb-8 font-bold">Get In Touch</h4>
            <ul className="space-y-6">
              <ContactInfo icon={<MapPin size={16}/>} text={<>Sheopur, Pratap Nagar,<br /> Sanganer, Jaipur</>} />
              <ContactInfo icon={<Phone size={16}/>} text="+91 141-3152600" />
              <ContactInfo icon={<Mail size={16}/>} text="mvgschooljaipur@gmail.com" lowercase />
            </ul>
          </div>

          {/* URGENT CALL TO ACTION */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white/5 backdrop-blur-md rounded-[24px] p-8 border border-[#E4DFD3]/20 relative group shadow-lg"
          >
            <div className="absolute top-4 right-4 text-[#B8892B]/50 group-hover:text-[#B8892B] transition-colors">
              <ArrowUpRight size={20} />
            </div>
            <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#B8892B] mb-2 font-bold">Admissions Open</h4>
            <h3 className="text-lg font-bold mb-3 tracking-tight">Join Our Family</h3>
            <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest mb-6 leading-loose">
              Limited seats available for English Medium curriculum.
            </p>
            <Link 
              href="/Admission/apply" 
              prefetch={true}
              className="block w-full py-3.5 bg-[#B8892B] hover:bg-white hover:text-[#142440] text-white text-center rounded-[16px] text-[10px] font-mono font-black uppercase tracking-[0.3em] transition-all duration-300 shadow-md"
            >
              Apply Now
            </Link>
          </motion.div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#E4DFD3]/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-slate-400">
            © {currentYear} MVG Public Senior Secondary School
          </p>
          <div className="flex gap-8 text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-slate-400">
            <Link href="/About/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/About/legal/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- Helper Components ---

const SocialLink = ({ href, icon, color }) => (
  <motion.a 
    whileTap={{ scale: 0.9 }}
    href={href} 
    className={`p-2.5 bg-white/10 rounded-[12px] transition-all text-slate-200 hover:text-white ${color} shadow-sm`}
  >
    {icon}
  </motion.a>
);

const ContactInfo = ({ icon, text, lowercase }) => (
  <li className="flex items-start gap-3">
    <div className="text-[#B8892B] shrink-0 mt-0.5">{icon}</div>
    <span className={`text-slate-300 text-xs font-bold leading-relaxed tracking-wider ${lowercase ? 'lowercase' : 'uppercase'}`}>
      {text}
    </span>
  </li>
);

export default Footer;