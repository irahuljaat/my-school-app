"use client";

import React, { useState, useEffect, memo } from "react";
import {
  HiOutlineAcademicCap,
  HiOutlineCurrencyRupee,
  HiOutlineTrendingUp,
  HiExclamationCircle,
  HiOutlineCake,
} from "react-icons/hi";

import { db } from "../firebase/config";
import {
  collection,
  onSnapshot,
  doc,
  getDocs,
  writeBatch,
  updateDoc,
} from "firebase/firestore";

const CLASS_PROMOTION_MAP = {
  Nursery: "LKG", LKG: "UKG", UKG: "1", 1: "2", 2: "3", 3: "4", 4: "5",
  5: "6", 6: "7", 7: "8", 8: "9", 9: "10", 10: "11", 11: "12", 12: "PASSED OUT",
};

// Memoized Stat Card styled like image_9dae0f.jpg
const StatCard = memo(({ icon: Icon, label, value, bgClass, iconColorClass }) => (
  <div className={`${bgClass} p-6 rounded-[20px] flex items-center justify-between transition-transform hover:scale-[1.02]`}>
    <div>
      <p className="text-slate-500 text-sm font-medium mb-2">{label}</p>
      <h2 className="text-3xl font-bold text-slate-800">{value}</h2>
    </div>
    <div className={`${iconColorClass}`}>
      <Icon size={44} strokeWidth={1.2} />
    </div>
  </div>
));
StatCard.displayName = "StatCard";

export default function ProfessionalDashboard() {
  const [data, setData] = useState({ session: null, all: [], loading: true });
  const [stats, setStats] = useState({ total: 0, coll: 0, dues: 0 });
  const [bdays, setBdays] = useState([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [targetSess, setTargetSess] = useState("");

  // Listen for config changes
  useEffect(() => {
    return onSnapshot(doc(db, "config", "settings"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setData({ session: d.activeSession, all: d.sessions || [], loading: false });
      }
    });
  }, []);

  // Fetch dynamic data
  useEffect(() => {
    if (!data.session) return;
    const unsubS = onSnapshot(collection(db, "sessions", data.session, "students"), (snap) => {
      const docs = snap.docs.map(d => d.data());
      const active = docs.filter(s => s.grade !== "PASSED OUT").length;
      const dues = docs.reduce((sum, s) => sum + Number(s.previouslyDue || s.previousDue || 0), 0);
      
      const today = new Date();
      const upcoming = docs.filter(s => s.dob && s.dob !== "N/A").map(s => {
        const d = new Date(s.dob);
        const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
        if (next < today) next.setFullYear(today.getFullYear() + 1);
        return { ...s, nextBirthday: next };
      }).sort((a, b) => a.nextBirthday - b.nextBirthday).slice(0, 5);
      
      setStats(prev => ({ ...prev, total: active, dues }));
      setBdays(upcoming);
    });

    const unsubF = onSnapshot(collection(db, "sessions", data.session, "feePayments"), (snap) => {
      const total = snap.docs.reduce((sum, d) => sum + (Number(d.data().amount) || 0), 0);
      setStats(prev => ({ ...prev, coll: total }));
    });

    return () => { unsubS(); unsubF(); };
  }, [data.session]);

  const handleMigrate = async () => {
    if (!targetSess || !window.confirm("Promote all students to the selected session?")) return;
    setIsMigrating(true);
    try {
      const batch = writeBatch(db);
      const sSnap = await getDocs(collection(db, "sessions", data.session, "students"));
      sSnap.forEach((d) => {
        const docData = d.data();
        const nextGrade = CLASS_PROMOTION_MAP[String(docData.grade)] || docData.grade;
        const newId = `S${docData.scholarNo || "NA"}_${nextGrade}_${Date.now()}`;
        batch.set(doc(db, "sessions", targetSess, "students", newId), { ...docData, id: newId, grade: nextGrade, migratedFrom: data.session });
      });
      await batch.commit();
      await updateDoc(doc(db, "config", "settings"), { activeSession: targetSess });
      alert("Migration Successful!");
    } catch (e) { alert(e.message); } finally { setIsMigrating(false); }
  };

  if (data.loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#fafbfe] p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h1 className="text-[22px] font-bold text-slate-800 tracking-wide">Admin Dashboard</h1>
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500">Active Session:</span>
            <select 
              value={data.session} 
              onChange={(e) => updateDoc(doc(db, "config", "settings"), { activeSession: e.target.value })} 
              className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm"
            >
              {data.all.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Stats Grid (Matching the 4-card layout style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <StatCard 
            icon={HiOutlineAcademicCap} 
            label="Students" 
            value={stats.total} 
            bgClass="bg-[#f3efff]" 
            iconColorClass="text-[#9853eb]" 
          />
          <StatCard 
            icon={HiOutlineCurrencyRupee} 
            label="Collection" 
            value={`₹${stats.coll}`} 
            bgClass="bg-[#e9fbf2]" 
            iconColorClass="text-[#36c276]" 
          />
          <StatCard 
            icon={HiExclamationCircle} 
            label="Dues" 
            value={`₹${stats.dues}`} 
            bgClass="bg-[#fff0f0]" 
            iconColorClass="text-[#ff6b6b]" 
          />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Migration Engine (Styled like the large tables/charts in the image) */}
          <div className="xl:col-span-2 bg-white p-6 rounded-[20px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
                <HiOutlineTrendingUp className="text-purple-500" size={20} /> 
                Migration Engine
              </h2>
            </div>
            
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Target Session</label>
                <select 
                  onChange={(e) => setTargetSess(e.target.value)} 
                  className="w-full bg-white border border-slate-200 text-slate-700 p-3 rounded-xl font-medium outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 transition-all"
                >
                  <option value="">Select Target...</option>
                  {data.all.filter(s => s !== data.session).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button 
                onClick={handleMigrate} 
                disabled={isMigrating || !targetSess} 
                className="w-full sm:w-auto mt-6 sm:mt-0 bg-[#9853eb] hover:bg-[#8541d6] text-white px-8 py-3.5 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-500/20"
              >
                {isMigrating ? "Migrating..." : "Migrate Now"}
              </button>
            </div>
          </div>

          {/* Birthdays List (Styled like the side lists in the image) */}
          <div className="bg-white p-6 rounded-[20px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
                <HiOutlineCake className="text-[#ff9800]" size={20} /> 
                Upcoming Birthdays
              </h2>
            </div>
            
            <div className="space-y-4">
              {bdays.length > 0 ? bdays.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-bold text-sm">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 text-sm">{s.name}</p>
                      <p className="text-xs text-slate-400">Class {s.grade}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                    {new Date(s.nextBirthday).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )) : (
                <div className="text-center py-8 text-slate-400 text-sm font-medium">
                  No upcoming birthdays found.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}