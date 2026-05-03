"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="bg-[#f8f9fa] text-[#1a1a1a] antialiased">
      <main className="pt-48 pb-32 px-6">
        <div className="max-w-5xl mx-auto">
            
            <div className="text-center mb-16">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">Candidate <br/>Registration.</h1>
                <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> Digital Portal</span>
                    <span className="w-8 h-[1px] bg-slate-200"></span>
                    <span className="flex items-center gap-2"><Info size={14} className="text-[#6366F1]"/> Admission 2026-27</span>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl shadow-slate-200/50 border border-slate-100">
                {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="space-y-16">
                        
                        {/* 1. STUDENT IDENTITY */}
                        <FormSection title="Student Identity" icon={<User size={18}/>}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <InputField label="First Name" name="firstName" onChange={handleChange} placeholder="First name" required />
                                <InputField label="Last Name" name="lastName" onChange={handleChange} placeholder="Last name" required />
                                <InputField label="Date of Birth" name="dob" onChange={handleChange} type="date" required />
                                <SelectField label="Grade" name="grade" onChange={handleChange} options={['LKG', 'UKG', 'Prep', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11 (Sci)', 'Grade 11 (Comm)', 'Grade 11 (Arts)' , 'Grade 12 (Sci)', 'Grade 12 (Comm)', 'Grade 12 (Arts)']} />
                                <SelectField label="Gender" name="gender" onChange={handleChange} options={['Male', 'Female']} />
                            </div>
                        </FormSection>

                        {/* 2. FAMILY BACKGROUND */}
                        <FormSection title="Family & Contact" icon={<Users size={18}/>}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Father's Full Name" name="fatherName" onChange={handleChange} placeholder="As per ID proof" required />
                                <InputField label="Mother's Full Name" name="motherName" onChange={handleChange} placeholder="As per ID proof" required />
                                <InputField label="Primary Mobile" name="phone" onChange={handleChange} type="tel" placeholder="+91" required />
                                <InputField label="Email Address" name="email" onChange={handleChange} type="email" placeholder="official email" required />
                            </div>
                            <div className="mt-6">
                                <InputField label="Residential Address" name="address" onChange={handleChange} placeholder="Street, Area, City & Pincode" />
                            </div>
                        </FormSection>

                        {/* 3. ACADEMIC */}
                        <FormSection title="Academic" icon={<GraduationCap size={18}/>}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Previous School" name="prevSchool" onChange={handleChange} placeholder="Full school name" />
                                <SelectField label="Transport?" name="transport" onChange={handleChange} options={['No, Personal Drop', 'Yes, School Bus']} />
                            </div>
                            <div className="mt-6">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-3">Talents / Hobbies</label>
                                <textarea name="hobbies" onChange={handleChange} className="w-full bg-slate-50 rounded-2xl p-5 text-sm focus:ring-1 focus:ring-[#6366F1] outline-none min-h-[120px]" placeholder="Tell us more..."/>
                            </div>
                        </FormSection>

                        <div className="pt-8">
                            <button disabled={loading} className="group w-full bg-black text-white py-6 rounded-2xl font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-[#6366F1] transition-all flex items-center justify-center gap-4 shadow-xl disabled:bg-slate-400">
                                {loading ? "Registering..." : "Submit Formal Application"} <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>
                        </div>
                    </form>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
                        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <CheckCircle size={48} className="text-green-500" />
                        </div>
                        <h2 className="text-4xl font-bold mb-4">Registration Success!</h2>
                        <p className="text-slate-400 max-w-sm mx-auto mb-10">Our admission counselor will reach out to you within 24-48 working hours.</p>
                        <button onClick={() => setIsSubmitted(false)} className="bg-slate-100 px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all">Submit another registration</button>
                    </motion.div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS (Kept exactly same UI) ---
function FormSection({ title, icon, children }) {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#6366F1]">{icon}</div>
                <h2 className="text-xl font-bold tracking-tight">{title}</h2>
                <div className="flex-1 h-[1px] bg-slate-100 ml-4"></div>
            </div>
            {children}
        </div>
    );
}

function InputField({ label, name, type = "text", placeholder, required, onChange }) {
    return (
        <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label} {required && "*"}</label>
            <input name={name} type={type} required={required} placeholder={placeholder} onChange={onChange}
                className="w-full bg-slate-50 border border-transparent rounded-xl px-5 py-4 text-sm focus:bg-white focus:border-[#6366F1]/30 focus:ring-4 focus:ring-[#6366F1]/5 transition-all outline-none"
            />
        </div>
    );
}

function SelectField({ label, name, options, onChange }) {
    return (
        <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</label>
            <div className="relative">
                <select name={name} onChange={onChange} className="w-full bg-slate-50 border border-transparent rounded-xl px-5 py-4 text-sm focus:bg-white focus:border-[#6366F1]/30 transition-all outline-none appearance-none cursor-pointer">
                    {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
        </div>
    );
}