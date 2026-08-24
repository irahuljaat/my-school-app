"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Import Firebase elements[cite: 5]
import { db } from '../firebase/config'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Phone, Mail, MapPin, Clock, Send, 
  CheckCircle2, Loader2
} from 'lucide-react';

export default function ContactPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  
  // 1. Form State[cite: 5]
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    enquiryType: 'Admission Enquiry',
    message: ''
  });
  const [status, setStatus] = useState('idle'); // idle | submitting | success[cite: 5]

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Handle Submit to Firebase[cite: 5]
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
      setTimeout(() => setStatus('idle'), 5000); // Hide success message after 5s[cite: 5]
    } catch (error) {
      console.error("Error saving message:", error);
      setStatus('idle');
      alert("Failed to send message. Please try again.");
    }
  };

  return (
    <div className="bg-[#FAF8F4] text-[#142440] antialiased selection:bg-[#B8892B] selection:text-white">
      
      {/* HERO SECTION */}
      <section className="relative h-[60vh] flex items-center bg-[#142440] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#B8892B]/20 via-transparent to-transparent opacity-50" />
        </div>
        <div className="max-w-7xl mx-auto px-8 relative z-10 w-full text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#E9DCBD] mb-8 block">Global Support</span>
            <h1 className="text-6xl md:text-[9rem] font-serif font-bold text-white tracking-tighter leading-[0.85] mb-8">
              Let's <br/><span className="italic font-light text-[#E9DCBD]">Connect.</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* MAIN AREA */}
      <main className="py-32 px-8 -mt-20 relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          
          <div className="lg:col-span-5 space-y-16">
            <div>
              <h2 className="text-4xl font-serif font-bold tracking-tight mb-12 italic text-[#142440] border-b-2 border-[#B8892B] pb-4 inline-block">Reach Out.</h2>
              <div className="space-y-10">
                <ContactItem icon={<Phone size={18}/>} title="Voice Support" val="+91 141-3152600, 9829018332, 8875646366" sub="Mon-Sat (8 AM - 2 PM)" />
                <ContactItem icon={<Mail size={18}/>} title="Email Queries" val="mvgschooljaipur@gmail.com"  />
                <ContactItem icon={<MapPin size={18}/>} title="Our Campus" val="Sector 7, Pratap Nagar" sub="Jaipur, Rajasthan 302033" />
              </div>
            </div>

            <div className="p-10 bg-[#142440] rounded-[28px] text-white space-y-6 border border-[#E4DFD3]/20 shadow-xl">
                <div className="flex items-center gap-4 text-[#B8892B]">
                    <Clock size={20}/>
                    <span className="font-mono text-[10px] uppercase tracking-[0.32em]">Office Timings</span>
                </div>
                <div className="space-y-2">
                    <p className="text-xl font-serif font-bold text-white">Weekdays: 8:00 — 2:00</p>
                    <p className="text-[#E4DFD3] text-sm font-light">Saturdays: 8:30 — 12:30 (Enquiry Only)</p>
                </div>
            </div>
          </div>

          {/* FORM AREA */}
          <div className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[28px] p-10 md:p-20 border border-[#E4DFD3] shadow-xl relative overflow-hidden"
            >
                {/* Success State Overlay */}
                <AnimatePresence>
                  {status === 'success' && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center text-center p-10"
                    >
                      <CheckCircle2 size={64} className="text-[#B8892B] mb-6" />
                      <h3 className="text-3xl font-serif font-bold mb-2 text-[#142440]">Message Delivered</h3>
                      <p className="text-[#52607A] font-light text-sm">We've received your enquiry and will contact you shortly.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mb-12">
                    <h3 className="text-3xl font-serif font-bold tracking-tight mb-4 text-[#142440]">Send a Message</h3>
                    <p className="text-[#52607A] text-sm font-light leading-relaxed">Fill the form and our team will get back to you within 24 hours.</p>
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
                        <div className="space-y-3">
                            <label className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#52607A] block">Nature of Enquiry</label>
                            <div className="relative">
                                <select 
                                  value={formData.enquiryType}
                                  onChange={(e) => setFormData({...formData, enquiryType: e.target.value})}
                                  className="w-full bg-[#FAF8F4] border-b-2 border-[#E4DFD3] rounded-t-lg px-0 py-3 text-sm text-[#142440] focus:bg-white focus:border-[#B8892B] transition-all outline-none appearance-none cursor-pointer"
                                >
                                    <option>Admission Enquiry</option>
                                    <option>Career Opportunity</option>
                                    <option>General Information</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#52607A] block">Your Message</label>
                        <textarea 
                          rows="5" 
                          required
                          value={formData.message}
                          onChange={(e) => setFormData({...formData, message: e.target.value})}
                          className="w-full bg-[#FAF8F4] border-b-2 border-[#E4DFD3] rounded-t-lg px-0 py-3 text-sm text-[#142440] focus:bg-white focus:border-[#B8892B] transition-all outline-none resize-y" 
                          placeholder="How can we assist you?"
                        ></textarea>
                    </div>
                    <div className="pt-4">
                        <button 
                          disabled={status === 'submitting'}
                          className="w-full bg-[#142440] text-white py-6 rounded-[24px] font-mono uppercase tracking-[0.32em] text-[10px] hover:bg-[#B8892B] transition-all flex items-center justify-center gap-4 shadow-xl disabled:opacity-50"
                        >
                            {status === 'submitting' ? (
                              <>Sending... <Loader2 className="animate-spin" size={16}/></>
                            ) : (
                              <>Deliver Message <Send size={16}/></>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Reusable Components matching tokens[cite: 5]
function FloatingInput({ label, placeholder, type = "text", value, onChange, required }) {
    return (
        <div className="space-y-3">
            <label className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#52607A] block">{label} {required && "*"}</label>
            <input 
                type={type} 
                required={required}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full bg-[#FAF8F4] border-b-2 border-[#E4DFD3] rounded-t-lg px-0 py-3 text-sm text-[#142440] focus:bg-white focus:border-[#B8892B] transition-all outline-none placeholder:text-[#52607A]/50"
            />
        </div>
    );
}

function ContactItem({ icon, title, val, sub }) {
    return (
        <div className="flex gap-6 group cursor-default">
            <div className="w-12 h-12 rounded-full border border-[#E4DFD3] bg-white flex items-center justify-center text-[#B8892B] shrink-0">
                {icon}
            </div>
            <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#52607A] mb-1">{title}</p>
                <p className="text-xl font-serif font-bold tracking-tight text-[#142440] group-hover:text-[#B8892B] transition-colors">{val}</p>
                <p className="text-xs text-[#52607A]/70 font-light italic mt-1">{sub}</p>
            </div>
        </div>
    );
}