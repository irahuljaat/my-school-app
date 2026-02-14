'use client';
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/config'; 
import { onAuthStateChanged } from 'firebase/auth';
import { HiMenuAlt2, HiOutlineSearch, HiOutlineBell, HiOutlineChevronDown } from 'react-icons/hi';
import { GraduationCap } from 'lucide-react';

const Header = ({ onMenuClick }) => {
  const [user, setUser] = useState({ name: "Admin", photo: null });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          name: currentUser.displayName || "MVG SCHOOL",
          photo: currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName || 'Admin'}&background=4f46e5&color=fff`
        });
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8 py-3 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="flex items-center gap-4 lg:gap-8">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuClick} 
          className="p-2 hover:bg-slate-100 rounded-xl lg:hidden active:scale-90 transition-transform bg-indigo-50 text-indigo-600"
        >
          <HiMenuAlt2 className="w-6 h-6" />
        </button>

        

        <div className="relative w-64 hidden md:block">
          <input 
            type="text" 
            placeholder="Search records..." 
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white outline-none transition-all" 
          />
          <HiOutlineSearch className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        <button className="relative p-2 text-slate-400 hover:text-indigo-600 rounded-xl transition-all">
          <HiOutlineBell size={24} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-100 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{user.name}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master Admin</p>
          </div>
          <img className="h-10 w-10 rounded-xl object-cover ring-2 ring-slate-50" src={user.photo} alt="Profile" />
          <HiOutlineChevronDown className="text-slate-400 group-hover:text-indigo-600 hidden sm:block" />
        </div>
      </div>
    </header>
  );
};

export default Header;