"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LogoImg from '../../../images/logo.jpg';
import { 
  Menu, X, ChevronDown, Phone, Mail, Receipt, 
  ShieldCheck, Search, ArrowRight, Banknote, Calendar
} from 'lucide-react';

export default function FirebaseFeeExplorer() {
  const [activeSession, setActiveSession] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feeLoading, setFeeLoading] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const classes = ["LKG", "UKG", "Prep", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

  // 1. Fetch Active Session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const configSnap = await getDoc(doc(db, "config", "settings"));
        if (configSnap.exists()) setActiveSession(configSnap.data().activeSession);
      } catch (error) { console.error("Session fetch error:", error); }
      finally { setLoading(false); }
    };
    fetchSession();
  }, []);

  // 2. Fetch Fee Data based on the array structure in your screenshot
  useEffect(() => {
    if (activeSession && selectedClass) {
      setFeeLoading(true);
      const feeRef = doc(db, `sessions/${activeSession}/studentFeeStructures`, selectedClass);
      
      const unsub = onSnapshot(feeRef, (docSnap) => {
        if (docSnap.exists()) {
          setFeeData(docSnap.data());
        } else {
          setFeeData(null);
        }
        setFeeLoading(false);
      });
      return () => unsub();
    }
  }, [selectedClass, activeSession]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white font-bold text-[#6366F1] animate-pulse uppercase text-[10px] tracking-widest">Initialising Ledger...</div>;

  return (
    <div className="bg-[#fcfcfc] text-[#1a1a1a] min-h-screen">
      
      {/* STICKY TOP BAR */}
      <div className="fixed top-0 w-full z-[120] bg-[#0a0a0a] text-slate-400 py-2 hidden lg:block border-b border-white/5">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[9px] font-bold uppercase tracking-[0.2em]">
          <div className="flex gap-8 items-center">
            <span className="flex items-center gap-2"><Phone size={10} className="text-[#6366F1]" /> Support: +91 141 2345678</span>
            <span className="flex items-center gap-2"><Mail size={10} className="text-[#6366F1]" /> accounts@mvgacademy.com</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar size={10} className="text-[#6366F1]"/>
            <span>Academic Cycle: {activeSession}</span>
          </div>
        </div>
      </div>

      {/* STICKY HEADER */}
      <header className="fixed top-0 lg:top-[35px] w-full z-[110] bg-white/95 backdrop-blur-md py-4 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <img src={LogoImg.src} alt="Logo" className="w-10 h-10 object-contain" />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">MVG Academy</span>
              <span className="text-[8px] font-bold text-[#6366F1] uppercase tracking-[0.3em]">Fee Portal</span>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/" className="text-[10px] font-bold uppercase tracking-widest hover:text-[#6366F1]">Home</Link>
            <Link href="/admission" className="text-[10px] font-bold uppercase tracking-widest hover:text-[#6366F1]">Admissions</Link>
            <Link href="/contact" className="bg-black text-white px-6 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-[#6366F1] transition-all">Enquire Now</Link>
          </nav>
          <button onClick={() => setMobileMenu(true)} className="lg:hidden p-2"><Menu size={20}/></button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="pt-52 pb-32 px-6">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4 italic">Class Financials.</h1>
            <p className="text-slate-400 text-sm mb-10 max-w-lg mx-auto font-light">Select a class to view the mandatory fee components as per the {activeSession} schedule.</p>
            
            <div className="flex items-center bg-white rounded-2xl shadow-2xl shadow-indigo-100/40 border border-slate-100 p-1.5 max-w-xs mx-auto">
                <div className="pl-4 text-[#6366F1]"><Search size={16}/></div>
                <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-transparent border-none py-4 px-4 text-[10px] font-bold uppercase tracking-[0.2em] focus:ring-0 cursor-pointer"
                >
                    <option value="">Select Class</option>
                    {classes.map((cls) => <option key={cls} value={cls}>Class {cls}</option>)}
                </select>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {feeLoading ? (
              <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
              </motion.div>
            ) : selectedClass && feeData && feeData.components ? (
              <motion.div 
                key={selectedClass}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                className="bg-white rounded-[3rem] p-8 md:p-14 border border-slate-100 shadow-xl shadow-slate-100/50"
              >
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#6366F1]"><Receipt size={24}/></div>
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight">Fee Breakdown</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grade {selectedClass} • Official Structure</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* ARRAY MAPPING: This matches your Firebase structure specifically */}
                    {feeData.components.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-4 border-b border-slate-50 last:border-none group">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-[#6366F1] transition-colors">{item.name}</span>
                                <span className="text-[8px] font-bold text-slate-300 uppercase mt-1">Component {index + 1}</span>
                            </div>
                            <span className="text-lg font-bold tracking-tight">₹ {Number(item.amount).toLocaleString()}</span>
                        </div>
                    ))}

                    <div className="mt-12 p-8 bg-[#0a0a0a] rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl shadow-indigo-100">
                        <div>
                            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-1 block">Total Annual Commitment</span>
                            <p className="text-xs text-slate-400 font-light italic">Calculated including all mandatory components.</p>
                        </div>
                        <div className="text-4xl font-black text-[#6366F1]">₹ {Number(feeData.totalFee || 0).toLocaleString()}</div>
                    </div>
                </div>
              </motion.div>
            ) : selectedClass ? (
              <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-400 italic font-light">
                No fee components found for Class {selectedClass} in Session {activeSession}.
              </div>
            ) : (
              <div className="text-center py-20 opacity-20">
                <Banknote className="mx-auto mb-4" size={48}/>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Awaiting Selection</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white pt-20 pb-12 px-8 border-t border-slate-100 text-center">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.5em]">© 2025 MVG Academy Jaipur</p>
      </footer>
    </div>
  );
}