"use client"
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  UserPlus, FileText, ClipboardCheck, 
  CreditCard, GraduationCap, ArrowRight, MapPin,
  CheckCircle2, HelpCircle, Download
} from 'lucide-react';

export default function AdmissionPage() {
  
  const admissionSteps = [
    {
      title: "Online Registration",
      desc: "Fill out the digital enquiry form with student details and academic history.",
      icon: <UserPlus className="text-blue-500" size={24} />,
    },
    {
      title: "Document Upload",
      desc: "Submit birth certificate, previous marksheet, and Aadhaar card copies.",
      icon: <FileText className="text-blue-500" size={24} />,
    },
    {
      title: "Interaction/Test",
      desc: "A brief session with the student to understand their potential and grade placement.",
      icon: <ClipboardCheck className="text-blue-500" size={24} />,
    },
    {
      title: "Final Enrollment",
      desc: "Complete the fee formalities to secure the seat.",
      icon: <CheckCircle2 className="text-blue-500" size={24} />,
    }
  ];

  return (
    <div className="bg-[#fcfcfc] text-[#1a1a1a] selection:bg-blue-600 selection:text-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.5em] mb-6 block">Admissions </span>
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter mb-8">
              Join the <span className="italic font-light text-slate-400">Legacy.</span>
            </h1>
            <p className="text-slate-400 font-medium leading-relaxed">
              Experience RBSE English Medium excellence. We are now accepting applications for Primary to Senior Secondary levels.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 2. ADMISSION PROCESS FLOW */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-4">The Pathway</h2>
              <p className="text-slate-500 text-sm font-medium italic">Four simple steps to secure your child's future.</p>
            </div>
            <Link href="/contact" className="text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
              Need Help? Talk to us <ArrowRight size={14}/>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {admissionSteps.map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                  {step.icon}
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-4">Step 0{index + 1}</span>
                <h4 className="text-xl font-bold mb-4">{step.title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed font-medium">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. ACTION HUB (REDirection Buttons) */}
      <section className="pb-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-950 rounded-[4rem] p-12 md:p-20 relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] -mr-40 -mt-40 rounded-full" />
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-8">Ready to start?</h3>
                <p className="text-slate-400 font-light mb-12 max-w-md">
                  Choose an option below to proceed with registration or manage existing academic fees.
                </p>
                <div className="flex flex-wrap gap-6">
                  <Link href="/Admission/apply" className="px-8 py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-white hover:text-blue-600 transition-all">
                    Apply Online <UserPlus size={16}/>
                  </Link>
                  <Link href="/Admission/fees" className="px-8 py-5 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-white hover:text-black transition-all">
                    Fee Structure <CreditCard size={16}/>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuickCard 
                  icon={<Download size={20}/>} 
                  title="Prospectus" 
                  sub="Download 2026-27 Brochure"
                  href="/downloads/prospectus.pdf"
                />
                <QuickCard 
                  icon={<GraduationCap size={20}/>} 
                  title="Scholarships" 
                  sub="Check Merit Eligibility"
                  href="/admission/scholarships"
                />
                <QuickCard 
                  icon={<HelpCircle size={20}/>} 
                  title="FAQs" 
                  sub="Common Admission Queries"
                  href="/About/faq"
                />
                <QuickCard 
                  icon={<MapPin size={20}/>} 
                  title="Visit Us" 
                  sub="Take a Virtual Tour Now"
                  href="/About/virtual-tour"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

// Sub-component for the Action Grid
function QuickCard({ icon, title, sub, href }) {
  return (
    <Link href={href} className="p-8 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 transition-all group">
      <div className="text-blue-500 mb-6 group-hover:scale-110 transition-transform">{icon}</div>
      <h5 className="text-white font-bold text-sm mb-1">{title}</h5>
      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{sub}</p>
    </Link>
  );
}