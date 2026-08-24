"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Search, Banknote, ChevronDown } from 'lucide-react';

export default function FirebaseFeeExplorer() {
  const [selectedClass, setSelectedClass] = useState("");
  const [feeData, setFeeData] = useState(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const activeSession = "2026-27";

  // Class list matching Firestore document IDs inside studentFeeStructures
  const classes = ['LKG', 'UKG' , 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11' , '12'];

  useEffect(() => {
    if (selectedClass) {
      setFeeLoading(true);
      
      // Targeting path: sessions > {activeSession} > studentFeeStructures > {selectedClass}
      const feeRef = doc(db, "sessions", activeSession, "studentFeeStructures", selectedClass);
      
      const unsub = onSnapshot(feeRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Map feeBreakdown array from Firestore document
          const breakdown = data.feeBreakdown || [];
          const sortedComponents = breakdown
            .map(item => ({ 
              name: item.name, 
              amount: Number(item.amount || 0) 
            }))
            .filter(item => item.amount > 0)
            .sort((a, b) => a.amount - b.amount);

          setFeeData({
            ...data,
            sortedComponents
          });
        } else {
          setFeeData(null);
        }
        setFeeLoading(false);
      });
      return () => unsub();
    }
  }, [selectedClass]);

  return (
    <div className="bg-[#FAF8F4] text-[#142440] min-h-screen antialiased selection:bg-[#B8892B] selection:text-white">
      <main className="pt-32 pb-32 px-6">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-16">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#B8892B] mb-4 block">Official Ledger • {activeSession}</span>
            <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tighter mb-4 italic text-[#142440]">Class Financials.</h1>
            <p className="text-[#52607A] text-[10px] font-mono uppercase tracking-[0.32em] mb-10">Fee schedule sorted by value</p>
            
            <div className="flex items-center bg-white rounded-full border border-[#E4DFD3] p-2 max-w-sm mx-auto shadow-sm">
                <div className="pl-4 text-[#B8892B]"><Search size={16}/></div>
                <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-transparent border-none py-3 px-4 text-[10px] font-mono uppercase tracking-[0.32em] text-[#142440] focus:ring-0 cursor-pointer outline-none"
                >
                    <option value="">Select Class</option>
                    {classes.map((cls) => <option key={cls} value={cls}>Class {cls}</option>)}
                </select>
                <div className="pr-4"><ChevronDown size={14} className="text-[#52607A]"/></div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {feeLoading ? (
              <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#B8892B] border-t-transparent rounded-full animate-spin" />
              </motion.div>
            ) : selectedClass && feeData ? (
              <motion.div 
                key={selectedClass}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                className="bg-white rounded-[28px] p-8 md:p-14 border border-[#E4DFD3] shadow-xl"
              >
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 rounded-full border border-[#E4DFD3] bg-[#FAF8F4] flex items-center justify-center text-[#B8892B] shrink-0"><Receipt size={22}/></div>
                    <div>
                        <h3 className="text-2xl font-serif font-bold tracking-tight text-[#142440]">Fee Structure</h3>
                        <p className="text-[10px] font-mono text-[#52607A] uppercase tracking-[0.32em]">Grade {selectedClass} • Session {activeSession}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {(feeData?.sortedComponents || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-4 border-b border-[#E4DFD3] last:border-none group">
                          <div className="flex flex-col">
                              <span className="text-[10px] font-mono uppercase tracking-[0.32em] text-[#52607A] group-hover:text-[#B8892B] transition-colors">{item.name}</span>
                              <span className="text-[8px] font-mono text-[#52607A]/60 uppercase tracking-widest mt-1">Academic Year</span>
                          </div>
                          <span className="text-lg font-serif font-bold tracking-tight text-[#142440]">₹ {item.amount.toLocaleString()}</span>
                      </div>
                    ))}

                    <div className="mt-12 p-8 bg-[#142440] rounded-[24px] text-white flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl border border-[#E4DFD3]/20">
                        <div>
                            <span className="text-[9px] font-mono uppercase tracking-[0.32em] text-[#E9DCBD] mb-1 block">Total Annual Fee</span>
                            <p className="text-xs text-[#E4DFD3] font-light italic">Combined institutional charges for current session.</p>
                        </div>
                        <div className="text-4xl font-serif font-black text-[#E9DCBD]">₹ {Number(feeData.totalFee || 0).toLocaleString()}</div>
                    </div>
                </div>
              </motion.div>
            ) : selectedClass ? (
              <div className="text-center py-20 bg-white rounded-[28px] border border-[#E4DFD3] text-[#52607A] italic font-light">
                 No fee data found for Class {selectedClass}.
              </div>
            ) : (
              <div className="text-center py-20 opacity-30 text-[#52607A]">
                <Banknote className="mx-auto mb-4" size={48}/>
                <p className="text-[10px] font-mono uppercase tracking-[0.32em]">Select class to view ledger</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}