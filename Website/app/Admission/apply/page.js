"use client"
import React, { useState } from 'react';
import { db } from '../../firebase/config'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { 
  CheckCircle, User, Users, GraduationCap, Send, ChevronDown, Info
} from 'lucide-react';

export default function AdmissionMegaPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Functional State Management
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', dob: '', grade: 'Nursery', gender: 'Male',
    fatherName: '', motherName: '', phone: '', email: '', address: '',
    prevSchool: '', transport: 'No, Personal Drop', hobbies: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. Optimized Submit Logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "admissions"), {
        ...formData,
        appliedAt: serverTimestamp(),
        session: "2026-27"
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsSubmitted(true);
    } catch (err) {
      console.error("Submission Error:", err);
      alert("System busy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FAF8F4] text-[#142440] antialiased selection:bg-[#B8892B] selection:text-white">
      <main className="pt-48 pb-32 px-6">
        <div className="max-w-5xl mx-auto">
            
            <div className="text-center mb-16">
                <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#B8892B] mb-4 block">Official Portal</span>
                <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tighter mb-6 text-[#142440]">Candidate <br/><span className="italic font-light text-[#52607A]">Registration.</span></h1>
                <div className="flex items-center justify-center gap-4 text-[10px] font-mono uppercase tracking-[0.32em] text-[#52607A]">
                    <span className="flex items-center gap-2"><CheckCircle size={14} className="text-[#B8892B]"/> Digital Portal</span>
                    <span className="w-8 h-[1px] bg-[#E4DFD3]"></span>
                    <span className="flex items-center gap-2"><Info size={14} className="text-[#B8892B]"/> Admission 2026-27</span>
                </div>
            </div>

            <div className="bg-white rounded-[28px] p-8 md:p-16 border border-[#E4DFD3] shadow-xl">
                {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="space-y-16">
                        
                        {/* 1. STUDENT IDENTITY */}
                        <FormSection title="Student Identity" icon={<User size={16} className="text-[#B8892B]"/>}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <InputField label="First Name" name="firstName" onChange={handleChange} placeholder="First name" required />
                                <InputField label="Last Name" name="lastName" onChange={handleChange} placeholder="Last name" required />
                                <InputField label="Date of Birth" name="dob" onChange={handleChange} type="date" required />
                                <SelectField label="Grade" name="grade" onChange={handleChange} options={['LKG', 'UKG', 'Prep', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11 (Sci)', 'Grade 11 (Comm)', 'Grade 11 (Arts)' , 'Grade 12 (Sci)', 'Grade 12 (Comm)', 'Grade 12 (Arts)']} />
                                <SelectField label="Gender" name="gender" onChange={handleChange} options={['Male', 'Female']} />
                            </div>
                        </FormSection>

                        {/* 2. FAMILY BACKGROUND */}
                        <FormSection title="Family & Contact" icon={<Users size={16} className="text-[#B8892B]"/>}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <InputField label="Father's Full Name" name="fatherName" onChange={handleChange} placeholder="As per ID proof" required />
                                <InputField label="Mother's Full Name" name="motherName" onChange={handleChange} placeholder="As per ID proof" required />
                                <InputField label="Primary Mobile" name="phone" onChange={handleChange} type="tel" placeholder="+91" required />
                                <InputField label="Email Address" name="email" onChange={handleChange} type="email" placeholder="official email" required />
                            </div>
                            <div className="mt-8">
                                <InputField label="Residential Address" name="address" onChange={handleChange} placeholder="Street, Area, City & Pincode" />
                            </div>
                        </FormSection>

                        {/* 3. ACADEMIC */}
                        <FormSection title="Academic" icon={<GraduationCap size={16} className="text-[#B8892B]"/>}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <InputField label="Previous School" name="prevSchool" onChange={handleChange} placeholder="Full school name" />
                                <SelectField label="Transport?" name="transport" onChange={handleChange} options={['No, Personal Drop', 'Yes, School Bus']} />
                            </div>
                            <div className="mt-8 space-y-3">
                                <label className="text-[10px] font-mono uppercase tracking-[0.32em] text-[#52607A] block">Talents / Hobbies</label>
                                <textarea name="hobbies" onChange={handleChange} className="w-full bg-[#FAF8F4] border-b-2 border-[#E4DFD3] rounded-t-lg px-0 py-3 text-sm text-[#142440] focus:border-[#B8892B] outline-none min-h-[120px] transition-all resize-y" placeholder="Tell us more..."/>
                            </div>
                        </FormSection>

                        <div className="pt-8">
                            <button disabled={loading} className="group w-full bg-[#142440] text-white py-6 rounded-[24px] font-mono uppercase tracking-[0.32em] text-[10px] hover:bg-[#B8892B] transition-all flex items-center justify-center gap-4 shadow-xl disabled:bg-slate-400">
                                {loading ? "Registering..." : "Submit Formal Application"} <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>
                        </div>
                    </form>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
                        <div className="w-24 h-24 bg-[#FAF8F4] border border-[#E4DFD3] rounded-full flex items-center justify-center mx-auto mb-8">
                            <CheckCircle size={48} className="text-[#B8892B]" />
                        </div>
                        <h2 className="text-4xl font-serif font-bold mb-4 text-[#142440]">Registration Success!</h2>
                        <p className="text-[#52607A] max-w-sm mx-auto mb-10 text-sm font-light">Our admission counselor will reach out to you within 24-48 working hours.</p>
                        <button onClick={() => setIsSubmitted(false)} className="bg-[#FAF8F4] border border-[#E4DFD3] px-8 py-3 rounded-full font-mono text-[10px] uppercase tracking-[0.32em] text-[#142440] hover:bg-[#142440] hover:text-white transition-all">Submit another registration</button>
                    </motion.div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS WITH NEW DESIGN TOKENS ---
function FormSection({ title, icon, children }) {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border border-[#E4DFD3] bg-white flex items-center justify-center shrink-0">{icon}</div>
                <h2 className="text-xl font-serif font-bold tracking-tight text-[#142440]">{title}</h2>
                <div className="flex-1 h-[1px] bg-[#E4DFD3] ml-4"></div>
            </div>
            {children}
        </div>
    );
}

function InputField({ label, name, type = "text", placeholder, required, onChange }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-[0.32em] text-[#52607A] block">{label} {required && "*"}</label>
            <input name={name} type={type} required={required} placeholder={placeholder} onChange={onChange}
                className="w-full bg-[#FAF8F4] border-b-2 border-[#E4DFD3] rounded-t-lg px-0 py-3 text-sm text-[#142440] focus:bg-white focus:border-[#B8892B] transition-all outline-none placeholder:text-[#52607A]/50"
            />
        </div>
    );
}

function SelectField({ label, name, options, onChange }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-[0.32em] text-[#52607A] block">{label}</label>
            <div className="relative">
                <select name={name} onChange={onChange} className="w-full bg-[#FAF8F4] border-b-2 border-[#E4DFD3] rounded-t-lg px-0 py-3 text-sm text-[#142440] focus:bg-white focus:border-[#B8892B] transition-all outline-none appearance-none cursor-pointer">
                    {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#52607A] pointer-events-none" />
            </div>
        </div>
    );
}