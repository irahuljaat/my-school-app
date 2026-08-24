"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config'; 
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ChevronDown, Send, CheckCircle,
  Users, GraduationCap
} from 'lucide-react';

export default function FinalAdmissionPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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
      // Save to Firestore 'enquiries' collection[cite: 4]
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

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FAF8F4]">
      <div className="font-mono uppercase text-[10px] tracking-[0.32em] text-[#52607A] animate-pulse">
        Preparing Enquiry Portal...
      </div>
    </div>
  );

  return (
    <div className="bg-[#FAF8F4] text-[#142440] antialiased selection:bg-[#B8892B] selection:text-white">
      {/* --- STREAMLINED ENQUIRY FORM --- */}
      <main className="pt-56 pb-32 px-6">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-16">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#B8892B] mb-4 block">Quick Registration</span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tighter mb-6 text-[#142440]">
              Enquiry <br/><span className="italic font-light text-[#52607A]">Form.</span>
            </h1>
          </div>

          <div className="bg-white rounded-[28px] p-8 md:p-16 border border-[#E4DFD3] shadow-xl">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-16">
                
                {/* Simplified Student Info */}
                <div className="space-y-8">
                  <FormHeading title="Student & Grade" icon={<GraduationCap size={16} className="text-[#B8892B]"/>} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                  <FormHeading title="Parent / Guardian Contact" icon={<Users size={16} className="text-[#B8892B]"/>} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

                <div className="pt-8">
                  <button type="submit" className="w-full bg-[#142440] text-white py-6 rounded-[24px] font-mono uppercase tracking-[0.32em] text-[10px] hover:bg-[#B8892B] transition-all flex items-center justify-center gap-4 shadow-xl">
                    Submit Enquiry <Send size={16}/>
                  </button>
                </div>
              </form>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <div className="w-24 h-24 bg-[#FAF8F4] border border-[#E4DFD3] rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle size={48} className="text-[#B8892B]" />
                </div>
                <h2 className="text-3xl font-serif font-bold mb-4 text-[#142440]">Submission Received</h2>
                <p className="text-[#52607A] mb-8 text-sm font-light">Thank you. Our admissions desk will contact you on <b className="text-[#142440] font-medium">{formData.phone}</b> within 24 hours.</p>
                <button onClick={() => setIsSubmitted(false)} className="bg-[#FAF8F4] border border-[#E4DFD3] px-8 py-3 rounded-full font-mono text-[10px] uppercase tracking-[0.32em] text-[#142440] hover:bg-[#142440] hover:text-white transition-all">Send Another Enquiry</button>
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
      <div className="w-10 h-10 rounded-full border border-[#E4DFD3] bg-white flex items-center justify-center shrink-0">{icon}</div>
      <h3 className="text-xl font-serif font-bold tracking-tight text-[#142440]">{title}</h3>
      <div className="flex-1 h-[1px] bg-[#E4DFD3] ml-4"></div>
    </div>
  );
}

function InputField({ label, name, type = "text", required = false, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-mono uppercase tracking-[0.32em] text-[#52607A] block">{label} {required && '*'}</label>
      <input 
        type={type} 
        name={name}
        required={required} 
        value={value}
        onChange={onChange}
        className="w-full bg-[#FAF8F4] border-b-2 border-[#E4DFD3] rounded-t-lg px-0 py-3 text-sm text-[#142440] focus:bg-white focus:border-[#B8892B] transition-all outline-none placeholder:text-[#52607A]/50" 
      />
    </div>
  );
}

function SelectField({ label, name, options, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-mono uppercase tracking-[0.32em] text-[#52607A] block">{label}</label>
      <div className="relative">
        <select 
          name={name}
          value={value}
          onChange={onChange}
          className="w-full bg-[#FAF8F4] border-b-2 border-[#E4DFD3] rounded-t-lg px-0 py-3 text-sm text-[#142440] focus:bg-white focus:border-[#B8892B] transition-all outline-none appearance-none cursor-pointer"
        >
          {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#52607A] pointer-events-none" />
      </div>
    </div>
  );
}