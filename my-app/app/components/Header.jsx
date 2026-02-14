'use client';
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/config'; // Adjust path if needed
import { onAuthStateChanged } from 'firebase/auth';
import { 
  HiMenuAlt2, 
  HiOutlineSearch, 
  HiOutlineBell, 
  HiOutlineChevronDown 
} from 'react-icons/hi';
import { GraduationCap } from 'lucide-react';

const Header = () => {
  const [user, setUser] = useState({ name: "Admin", photo: null });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          name: currentUser.displayName || "Admin User",
          photo: currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName || 'Admin'}&background=4f46e5&color=fff`
        });
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-3 bg-white/80 backdrop-blur-md border-b border-slate-100">
      
      {/* --- LEFT: LOGO & BRANDING --- */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 pr-8 border-r border-slate-100">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
            <GraduationCap size={22} />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tighter text-slate-900 leading-none">MVG ACADEMY</h2>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Portal</p>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="p-2 hover:bg-slate-50 rounded-lg lg:hidden">
          <HiMenuAlt2 className="w-6 h-6 text-slate-600" />
        </button>

        {/* --- CENTER: SEARCH BAR --- */}
        <div className="relative w-80 hidden lg:block">
          <input 
            type="text" 
            placeholder="Search records, students, or news..." 
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400" 
          />
          <HiOutlineSearch className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* --- RIGHT: USER ACTIONS --- */}
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
          <HiOutlineBell size={24} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Profile Dropdown */}
        <div className="flex items-center gap-3 pl-6 border-l border-slate-100 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{user.name}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master Admin</p>
          </div>
          
          <div className="relative">
            <img 
              className="h-10 w-10 rounded-xl object-cover ring-2 ring-slate-50 group-hover:ring-indigo-100 transition-all" 
              src={user.photo} 
              alt="Admin Profile"
            />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
          
          <HiOutlineChevronDown className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
        </div>
      </div>
    </header>
  );
};

export default Header;