"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Search, Banknote, ChevronDown } from 'lucide-react';

export default function FirebaseFeeExplorer() {
  const [selectedClass, setSelectedClass] = useState("");
  const [feeData, setFeeData] = useState(null);
  const [feeLoading, setFeeLoading] = useState(false);

  // Class list based on your Firestore document IDs
  const classes = ['LKG', 'UKG' , 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11 (Sci)', '11 (Comm)', '11 (Arts)' , '12 (Sci)', '12 (Comm)', '12 (Arts)'];

  useEffect(() => {
    if (selectedClass) {
      setFeeLoading(true);
      
      // Targeting the root collection: studentFeeStructures
      const feeRef = doc(db, "studentFeeStructures", selectedClass);
      
      const unsub = onSnapshot(feeRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // 1. Identify specific fields from your Firestore screenshot
          const keys = ["Tuition Fee", "Admission Fee", "Exam Fee", "Activity Fee"];
          
          // 2. Create objects, filter out zeros, and SORT (Low to High)
          const sortedComponents = keys
            .map(key => ({ 
              name: key, 
              amount: Number(data[key] || 0) 
            }))
            .filter(item => item.amount > 0)
            .sort((a, b) => a.amount - b.amount);

          // 3. Update state with both original data and the sorted array
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
    <div className="bg-[#fcfcfc] text-[#1a1a1a] min-h-screen antialiased">
      <main className="pt-32 pb-32 px-6">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4 italic">Class Financials.</h1>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-10">Fee schedule sorted by value</p>
            
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
                <div className="pr-4"><ChevronDown size={14} className="text-slate-300"/></div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {feeLoading ? (
              <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
              </motion.div>
            ) : selectedClass && feeData ? (
              <motion.div 
                key={selectedClass}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                className="bg-white rounded-[3rem] p-8 md:p-14 border border-slate-100 shadow-xl shadow-slate-100/50"
              >
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#6366F1]"><Receipt size={24}/></div>
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight">Fee Structure</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grade {selectedClass} • Official Ledger</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* The fix: Using Optional Chaining and Fallback Array to prevent crashes */}
                    {(feeData?.sortedComponents || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-4 border-b border-slate-50 last:border-none group">
                          <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-[#6366F1] transition-colors">{item.name}</span>
                              <span className="text-[8px] font-bold text-slate-300 uppercase mt-1">Academic Year</span>
                          </div>
                          <span className="text-lg font-bold tracking-tight">₹ {item.amount.toLocaleString()}</span>
                      </div>
                    ))}

                    <div className="mt-12 p-8 bg-[#0a0a0a] rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl shadow-indigo-100">
                        <div>
                            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-1 block">Total Annual Fee</span>
                            <p className="text-xs text-slate-400 font-light italic">Combined institutional charges for current session.</p>
                        </div>
                        <div className="text-4xl font-black text-[#6366F1]">₹ {Number(feeData.totalFee || 0).toLocaleString()}</div>
                    </div>
                </div>
              </motion.div>
            ) : selectedClass ? (
              <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 text-slate-400 italic">
                 No fee data found for Class {selectedClass}.
              </div>
            ) : (
              <div className="text-center py-20 opacity-20">
                <Banknote className="mx-auto mb-4" size={48}/>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Select class to view ledger</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}