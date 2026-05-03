"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../../images/logo.jpg';
import { 
  Menu, X, Facebook, Instagram, ChevronDown, 
  Phone, Mail, MapPin, Send, CheckCircle,
  User, Users, GraduationCap
} from 'lucide-react';

export default function FinalAdmissionPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeMobileSub, setActiveMobileSub] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    studentName: '',
    gradeSeeking: 'Nursery',
    parentName: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) setData(docSnap.data());
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Save to Firestore 'enquiries' collection
      await addDoc(collection(db, "enquiries"), {
        ...formData,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting enquiry:", error);
      alert("Submission failed. Please try again.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white italic font-light tracking-widest text-slate-400 uppercase text-[10px]">Preparing Enquiry Portal...</div>;

  return (
    <div className="bg-[#fcfcfc] text-[#1a1a1a] antialiased">
      
      

      

      {/* --- 3. STREAMLINED ENQUIRY FORM --- */}
      <main className="pt-56 pb-32 px-6">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-16">
            <span className="text-[#6366F1] text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Quick Registration</span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">Enquiry <br/>Form.</h1>
          </div>

          <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl shadow-slate-200/40 border border-slate-100">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-12">
                
                {/* Simplified Student Info */}
                <div className="space-y-8">
                  <FormHeading title="Student & Grade" icon={<GraduationCap size={18}/>} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField 
                      label="Student Full Name" 
                      name="studentName"
                      required 
                      value={formData.studentName}
                      onChange={handleInputChange}
                    />
                    <SelectField 
                      label="Grade Seeking" 
                      name="gradeSeeking"
                      value={formData.gradeSeeking}
                      onChange={handleInputChange}
                      options={['LKG', 'UKG' , 'Prep', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']} 
                    />
                  </div>
                </div>

                {/* Simplified Contact Info */}
                <div className="space-y-8">
                  <FormHeading title="Parent / Guardian Contact" icon={<Users size={18}/>} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField 
                      label="Parent Name" 
                      name="parentName"
                      required 
                      value={formData.parentName}
                      onChange={handleInputChange}
                    />
                    <InputField 
                      label="Mobile Number" 
                      name="phone"
                      type="tel" 
                      required 
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                    <InputField 
                      label="Email Address" 
                      name="email"
                      type="email" 
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <button type="submit" className="w-full bg-black text-white py-6 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-[#6366F1] transition-all flex items-center justify-center gap-4 shadow-xl shadow-indigo-100">
                  Submit Enquiry <Send size={16}/>
                </button>
              </form>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <CheckCircle size={60} className="text-green-500 mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-4">Submission Received</h2>
                <p className="text-slate-400 mb-8">Thank you. Our admissions desk will contact you on <b>{formData.phone}</b> within 24 hours.</p>
                <button onClick={() => setIsSubmitted(false)} className="text-[#6366F1] font-bold uppercase text-[10px] tracking-widest underline underline-offset-8">Send Another Enquiry</button>
              </motion.div>
            )}
          </div>
        </div>
      </main>

     
    </div>
  );
}

// --- SUB-COMPONENTS ---
function FormHeading({ title, icon }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#6366F1]">{icon}</div>
      <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      <div className="flex-1 h-[1px] bg-slate-100 ml-4"></div>
    </div>
  );
}

function InputField({ label, name, type = "text", required = false, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label} {required && '*'}</label>
      <input 
        type={type} 
        name={name}
        required={required} 
        value={value}
        onChange={onChange}
        className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-sm focus:ring-1 focus:ring-[#6366F1] transition-all" 
      />
    </div>
  );
}

function SelectField({ label, name, options, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</label>
      <select 
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-sm focus:ring-1 focus:ring-[#6366F1] appearance-none cursor-pointer"
      >
        {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function NavItem({ label, href }) {
  return <Link href={href} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:text-[#6366F1] transition-colors">{label}</Link>;
}

function NavDropdown({ label, items }) {
  return (
    <div className="relative group px-4 py-2 cursor-pointer">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest group-hover:text-[#6366F1] transition-colors">
        {label} <ChevronDown size={10} />
      </div>
      <div className="absolute top-full left-0 pt-6 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
        <div className="bg-white min-w-[200px] shadow-2xl rounded-2xl border border-slate-50 p-2">
          {items.map((it, i) => <Link key={i} href={it.link} className="block px-4 py-3 rounded-xl hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#6366F1] transition-all">{it.label}</Link>)}
        </div>
      </div>
    </div>
  );
}