"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
// Import Firebase elements
import { db } from '../../firebase/config'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Phone, Mail, MapPin, Clock, Send, 
  Instagram, Facebook, ChevronRight, 
  ArrowRight, CheckCircle2, Loader2
} from 'lucide-react';

export default function ContactPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  
  // 1. Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    enquiryType: 'Admission Enquiry',
    message: ''
  });
  const [status, setStatus] = useState('idle'); // idle | submitting | success

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Handle Submit to Firebase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      await addDoc(collection(db, "enquiries"), {
        ...formData,
        createdAt: serverTimestamp(),
      });
      setStatus('success');
      // Reset form
      setFormData({ name: '', email: '', phone: '', enquiryType: 'Admission Enquiry', message: '' });
      setTimeout(() => setStatus('idle'), 5000); // Hide success message after 5s
    } catch (error) {
      console.error("Error saving message:", error);
      setStatus('idle');
      alert("Failed to send message. Please try again.");
    }
  };

  return (
    <div className="bg-[#fcfcfc] text-[#1a1a1a] antialiased selection:bg-[#6366F1] selection:text-white">
      
      {/* HERO SECTION */}
      <section className="relative h-[60vh] flex items-center bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#6366F1]/20 via-transparent to-transparent opacity-50" />
        </div>
        <div className="max-w-7xl mx-auto px-8 relative z-10 w-full text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-[#6366F1] text-[11px] font-black uppercase tracking-[0.6em] mb-8 block">Global Support</span>
            <h1 className="text-6xl md:text-[9rem] font-bold text-white tracking-tighter leading-[0.85] mb-8">
              Let's <br/><span className="italic font-light text-slate-500">Connect.</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* MAIN AREA */}
      <main className="py-32 px-8 -mt-20 relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          
          <div className="lg:col-span-5 space-y-16">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-12 italic underline decoration-[#6366F1] decoration-2 underline-offset-8">Reach Out.</h2>
              <div className="space-y-12">
                <ContactItem icon={<Phone size={20}/>} title="Voice Support" val="+91 141-3152600, 9829018332, 8875646366" sub="Mon-Sat (8 AM - 2 PM)" />
                <ContactItem icon={<Mail size={20}/>} title="Email Queries" val="mvgschooljaipur@gmail.com"  />
                <ContactItem icon={<MapPin size={20}/>} title="Our Campus" val="Sector 7, Pratap Nagar" sub="Jaipur, Rajasthan 302033" />
              </div>
            </div>

            <div className="p-10 bg-black rounded-[3rem] text-white space-y-6">
                <div className="flex items-center gap-4 text-[#6366F1]">
                    <Clock size={24}/>
                    <span className="text-[10px] font-black uppercase tracking-widest">Office Timings</span>
                </div>
                <div className="space-y-2">
                    <p className="text-xl font-bold">Weekdays: 8:00 — 2:00</p>
                    <p className="text-slate-500 text-sm font-light">Saturdays: 8:30 — 12:30 (Enquiry Only)</p>
                </div>
            </div>
          </div>

          {/* FORM AREA */}
          <div className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[4rem] p-10 md:p-20 border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden"
            >
                {/* Success State Overlay */}
                <AnimatePresence>
                  {status === 'success' && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center text-center p-10"
                    >
                      <CheckCircle2 size={80} className="text-[#6366F1] mb-6" />
                      <h3 className="text-3xl font-bold mb-2">Message Delivered</h3>
                      <p className="text-slate-400 font-light">We've received your enquiry and will contact you shortly.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mb-12">
                    <h3 className="text-3xl font-bold tracking-tight mb-4">Send a Message</h3>
                    <p className="text-slate-400 text-sm font-light leading-relaxed">Fill the form and our team will get back to you within 24 hours.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <FloatingInput 
                          label="Your Full Name" 
                          placeholder="e.g. Aryan Sharma" 
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                        <FloatingInput 
                          label="Email Address" 
                          placeholder="aryan@example.com" 
                          type="email" 
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <FloatingInput 
                          label="Phone Number" 
                          placeholder="+91 00000 00000" 
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nature of Enquiry</label>
                            <select 
                              value={formData.enquiryType}
                              onChange={(e) => setFormData({...formData, enquiryType: e.target.value})}
                              className="w-full bg-slate-50 border-none rounded-2xl py-5 px-8 text-sm focus:ring-2 focus:ring-[#6366F1] appearance-none cursor-pointer"
                            >
                                <option>Admission Enquiry</option>
                                <option>Career Opportunity</option>
                                <option>General Information</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Your Message</label>
                        <textarea 
                          rows="5" 
                          required
                          value={formData.message}
                          onChange={(e) => setFormData({...formData, message: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-3xl py-5 px-8 text-sm focus:ring-2 focus:ring-[#6366F1]" 
                          placeholder="How can we assist you?"
                        ></textarea>
                    </div>
                    <button 
                      disabled={status === 'submitting'}
                      className="w-full bg-[#6366F1] text-white py-6 rounded-3xl font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-black transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                    >
                        {status === 'submitting' ? (
                          <>Sending... <Loader2 className="animate-spin" size={16}/></>
                        ) : (
                          <>Deliver Message <Send size={16}/></>
                        )}
                    </button>
                </form>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Updated Reusable Components to handle props
function FloatingInput({ label, placeholder, type = "text", value, onChange, required }) {
    return (
        <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{label}</label>
            <input 
                type={type} 
                required={required}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full bg-slate-50 border-none rounded-2xl py-5 px-8 text-sm focus:ring-2 focus:ring-[#6366F1] transition-all"
            />
        </div>
    );
}

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