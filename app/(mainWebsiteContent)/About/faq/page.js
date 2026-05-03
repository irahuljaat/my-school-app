"use client"
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Minus, HelpCircle, MessageSquare, Link,
  ChevronRight, PhoneCall, BookOpen, GraduationCap 
} from 'lucide-react';

export default function FAQPage() {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqData = [
    {
      category: "Admissions",
      question: "What is the age criteria for Nursery admission for 2026-27?",
      answer: "For the 2026-27 academic session, a child should be at least 3 years old as of March 31st, 2026, for Nursery admission. We follow RBSE guidelines for all grade-level placements."
    },
    {
      category: "Curriculum",
      question: "Does the school provide English Medium instruction for all subjects?",
      answer: "Yes, MVG Public School is an RBSE English Medium institution. All core subjects including Science, Mathematics, and Social Studies are taught in English to ensure global competency."
    },
    {
      category: "Transport",
      question: "Which areas in Jaipur are covered by the school's bus facility?",
      answer: "We provide secure transportation across Pratap Nagar, Sanganer, Sheopur, and nearby sectors. All our buses are equipped with GPS tracking and trained female attendants."
    },
    {
      category: "Academics",
      question: "What streams are available for Senior Secondary (Class 11 & 12)?",
      answer: "Our school is recently upgraded to Senior Secondary level. We offer comprehensive streams including Science (Medical/Non-Medical), Commerce, and Arts with modern lab facilities."
    },
    {
      category: "Fees",
      question: "How can I pay the school fees?",
      answer: "Fees can be paid online , Credit/Debit cards, or Net Banking. You can also visit the school office during working hours (8:00 AM — 2:00 PM) for offline payments."
    }
  ];

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="bg-[#fcfcfc] text-[#1a1a1a] min-h-screen antialiased selection:bg-[#6366F1] selection:text-white">
      
      {/* --- PREMIUM HEADER --- */}
      <section className="relative pt-32 pb-20 bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#6366F1]/10 via-transparent to-transparent opacity-50" />
        <div className="max-w-7xl mx-auto px-8 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
              <HelpCircle size={14} className="text-[#6366F1]" />
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em]">Support Center</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tighter mb-8 leading-[0.85]">
              Common <br/><span className="italic font-light text-slate-500">Queries.</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* --- FAQ GRID --- */}
      <main className="max-w-4xl mx-auto px-8 py-32">
        <div className="space-y-6">
          {faqData.map((faq, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div 
                onClick={() => toggleFAQ(index)}
                className={`cursor-pointer p-8 rounded-[2.5rem] border transition-all duration-500 ${
                  activeIndex === index 
                  ? 'bg-white border-[#6366F1] shadow-2xl shadow-indigo-100' 
                  : 'bg-slate-50 border-transparent hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-6">
                  <div className="flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#6366F1] mb-2 block">
                      {faq.category}
                    </span>
                    <h3 className={`text-xl font-bold tracking-tight transition-colors ${activeIndex === index ? 'text-black' : 'text-slate-700'}`}>
                      {faq.question}
                    </h3>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${activeIndex === index ? 'bg-[#6366F1] text-white rotate-180' : 'bg-white text-slate-300'}`}>
                    {activeIndex === index ? <Minus size={18} /> : <Plus size={18} />}
                  </div>
                </div>

                <AnimatePresence>
                  {activeIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pt-8 text-slate-500 leading-relaxed font-medium">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {/* --- CONTACT CTA --- */}
        <div className="mt-32 p-12 bg-black rounded-[4rem] text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#6366F1]/20 blur-[80px] -mr-32 -mt-32 rounded-full transition-transform group-hover:scale-150 duration-700" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
            <div>
              <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
              <p className="text-slate-400 text-sm font-light max-w-md">
                Our admissions desk is available Mon-Sat (8 AM - 2 PM) to assist you with specific documentation or visit requests.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <Link 
                href="/contact" 
                className="px-8 py-5 bg-[#6366F1] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white hover:text-black transition-all"
              >
                <PhoneCall size={16} /> Contact Desk
              </Link>
              <Link 
                href="/admission" 
                className="px-8 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
              >
                Apply Now <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}