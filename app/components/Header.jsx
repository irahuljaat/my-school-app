"use client";

import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/config'; 
import { onAuthStateChanged } from 'firebase/auth';
import { 
    HiMenuAlt2, 
    HiOutlineSearch, 
    HiOutlineBell, 
    HiOutlineChevronDown,
    HiOutlineX
} from 'react-icons/hi';

const Header = ({ onMenuClick }) => {
    const [user, setUser] = useState({ name: "Admin", photo: null });
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser({
                    name: currentUser.displayName || "MVG SCHOOL",
                    photo: currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName || 'Admin'}&background=000&color=fff`
                });
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <header className="sticky top-0 z-40 w-full bg-[#F6F6F6]/80 backdrop-blur-xl border-b border-zinc-200/50 px-4 lg:px-8 py-4">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
                
                {/* Left: Mobile Toggle & Search */}
                <div className="flex items-center gap-4 flex-1">
                    <button 
                        onClick={onMenuClick} 
                        className="p-2.5 bg-white hover:bg-zinc-100 text-black rounded-2xl lg:hidden shadow-sm border border-zinc-200/50 transition-all active:scale-95"
                    >
                        <HiMenuAlt2 className="w-5 h-5" />
                    </button>

                    {/* Desktop Search Bar */}
                    <div className="relative hidden md:block w-full max-w-md">
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search anything..." 
                            className="w-full pl-12 pr-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-full focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all placeholder:text-zinc-400 font-medium shadow-sm" 
                        />
                        <HiOutlineSearch className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    </div>

                    {/* Mobile Search Trigger */}
                    <button 
                        onClick={() => setIsSearchOpen(true)}
                        className="md:hidden p-2.5 text-zinc-500 hover:text-black transition-colors"
                    >
                        <HiOutlineSearch className="w-6 h-6" />
                    </button>
                </div>

                {/* Right: Actions & Profile */}
                <div className="flex items-center gap-2 lg:gap-5">
                    {/* Notifications */}
                    <button className="relative p-2.5 text-zinc-500 hover:bg-white hover:text-black rounded-full transition-all group">
                        <HiOutlineBell size={22} />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-black rounded-full border-2 border-[#F6F6F6] group-hover:scale-110 transition-transform"></span>
                    </button>

                    {/* Profile Dropdown */}
                    <div className="flex items-center gap-3 pl-2 lg:pl-5 border-l border-zinc-200 group cursor-pointer">
                        <div className="text-right hidden sm:block">
                            <p className="text-[11px] font-black text-black uppercase tracking-tight leading-none mb-1">
                                {user.name}
                            </p>
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                                Master Admin
                            </p>
                        </div>
                        
                        <div className="relative">
                            <img 
                                className="h-10 w-10 rounded-2xl object-cover ring-2 ring-white shadow-md group-hover:shadow-lg transition-shadow" 
                                src={user.photo} 
                                alt="Profile" 
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        
                        <HiOutlineChevronDown className="text-zinc-400 group-hover:text-black transition-colors hidden sm:block" />
                    </div>
                </div>
            </div>

            {/* Fullscreen Mobile Search Overlay */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-50 bg-white p-4 flex flex-col md:hidden">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <input 
                                autoFocus
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..." 
                                className="w-full pl-10 pr-4 py-3 bg-zinc-100 border-none rounded-2xl focus:ring-0 outline-none font-medium" 
                            />
                            <HiOutlineSearch className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        </div>
                        <button 
                            onClick={() => setIsSearchOpen(false)}
                            className="p-2 text-zinc-500 font-bold text-sm"
                        >
                            <HiOutlineX className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <div className="mt-8">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 px-2">Recent Searches</p>
                        <div className="space-y-2">
                            {searchQuery ? (
                                <div className="p-4 rounded-2xl bg-zinc-50 text-sm text-zinc-600 italic">
                                    Searching for "{searchQuery}"...
                                </div>
                            ) : (
                                <p className="px-2 text-sm text-zinc-400">Type to search records, students or fees.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;