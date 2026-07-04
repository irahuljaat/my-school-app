"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { auth } from '../firebase/config'; 
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { 
    HiMenuAlt2, 
    HiOutlineSearch, 
    HiOutlineBell, 
    HiOutlineChevronDown,
    HiOutlineX,
    HiOutlineUser,
    HiOutlineViewGrid,
    HiOutlineCurrencyDollar
} from 'react-icons/hi';

// --- GLOBAL SEARCH DATA & HELPERS ---
// Hook these up to your Firebase queries in the future to search real students/teachers
const SYSTEM_FEATURES = [
    { id: 'f1', name: 'Dashboard', path: '/dashboard', type: 'Feature', icon: HiOutlineViewGrid },
    { id: 'f2', name: 'Students Directory', path: '/students', type: 'Feature', icon: HiOutlineUser },
    { id: 'f3', name: 'Teacher Management', path: '/teacher-manage', type: 'Feature', icon: HiOutlineUser },
    { id: 'f4', name: 'Attendance System', path: '/attendance', type: 'Feature', icon: HiOutlineViewGrid },
    { id: 'f5', name: 'Fee Collection', path: '/fees-system', type: 'Feature', icon: HiOutlineCurrencyDollar },
    { id: 'f6', name: 'School Expenses (Ledger)', path: '/school-expenses', type: 'Feature', icon: HiOutlineCurrencyDollar },
    { id: 'f7', name: 'Exam Management', path: '/exam-manage', type: 'Feature', icon: HiOutlineViewGrid },
];

const MOCK_DATABASE = [
    ...SYSTEM_FEATURES,
    { id: 's1', name: 'Aarav Sharma', subtext: 'Class 10th - A | Roll: 12', path: '/students/s1', type: 'Student', icon: HiOutlineUser },
    { id: 's2', name: 'Priya Patel', subtext: 'Class 8th - B | Roll: 34', path: '/students/s2', type: 'Student', icon: HiOutlineUser },
    { id: 't1', name: 'Ramesh Kumar', subtext: 'Mathematics Teacher', path: '/teacher-manage/t1', type: 'Staff', icon: HiOutlineUser },
];

export default function Header({ onMenuClick }) {
    const router = useRouter();
    const [user, setUser] = useState({ name: "Admin", photo: null });
    
    // Search States
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false); // For mobile overlay
    const [isDesktopSearchFocused, setIsDesktopSearchFocused] = useState(false);
    const searchContainerRef = useRef(null);

    // Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser({
                    name: currentUser.displayName || "Administrator",
                    photo: currentUser.photoURL || null
                });
            }
        });
        return () => unsubscribe();
    }, []);

    // Handle outside click for desktop search dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setIsDesktopSearchFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Search Filtering Logic
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase();
        return MOCK_DATABASE.filter(item => 
            item.name.toLowerCase().includes(query) || 
            (item.subtext && item.subtext.toLowerCase().includes(query)) ||
            item.type.toLowerCase().includes(query)
        ).slice(0, 8); // Limit to top 8 results
    }, [searchQuery]);

    const handleResultClick = (path) => {
        setSearchQuery("");
        setIsSearchOpen(false);
        setIsDesktopSearchFocused(false);
        router.push(path);
    };

    return (
        <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 lg:px-8 py-3 transition-all">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
                
                {/* Left: Mobile Toggle & Desktop Search */}
                <div className="flex items-center gap-4 flex-1">
                    <button 
                        onClick={onMenuClick} 
                        className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-[#9853eb] rounded-xl lg:hidden border border-slate-200 transition-all active:scale-95 flex items-center justify-center"
                    >
                        <HiMenuAlt2 className="w-5 h-5" />
                    </button>

                    {/* Desktop Search Engine */}
                    <div ref={searchContainerRef} className="relative hidden md:block w-full max-w-xl">
                        <div className="relative">
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsDesktopSearchFocused(true)}
                                placeholder="Search students, teachers, fees, or features..." 
                                className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 text-slate-700 rounded-full focus:border-[#9853eb] focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium shadow-sm" 
                            />
                            <HiOutlineSearch className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDesktopSearchFocused ? 'text-[#9853eb]' : 'text-slate-400'}`} />
                            
                            {/* Clear Button */}
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <HiOutlineX className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Desktop Search Results Dropdown */}
                        {isDesktopSearchFocused && searchQuery && (
                            <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-100 rounded-[20px] shadow-xl overflow-hidden z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                {searchResults.length > 0 ? (
                                    <div className="max-h-[60vh] overflow-y-auto">
                                        <div className="px-4 py-2 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Results</span>
                                            <span className="text-[10px] font-bold text-[#9853eb] bg-[#f3efff] px-2 py-0.5 rounded-full">{searchResults.length} Found</span>
                                        </div>
                                        <div className="mt-1">
                                            {searchResults.map((item) => (
                                                <button 
                                                    key={item.id}
                                                    onClick={() => handleResultClick(item.path)}
                                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left group border-l-2 border-transparent hover:border-[#9853eb]"
                                                >
                                                    <div className="p-2 bg-slate-100 group-hover:bg-[#f3efff] rounded-xl transition-colors">
                                                        <item.icon className="w-5 h-5 text-slate-500 group-hover:text-[#9853eb]" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-slate-700 group-hover:text-[#9853eb] transition-colors">{item.name}</p>
                                                        {item.subtext && <p className="text-xs text-slate-400 font-medium">{item.subtext}</p>}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">{item.type}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="px-6 py-8 text-center">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <HiOutlineSearch className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-700">No results found</p>
                                        <p className="text-xs text-slate-500 mt-1">We couldn't find anything matching "{searchQuery}"</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mobile Search Trigger */}
                    <button 
                        onClick={() => setIsSearchOpen(true)}
                        className="md:hidden p-2.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-full hover:text-[#9853eb] hover:bg-[#f3efff] transition-all"
                    >
                        <HiOutlineSearch className="w-5 h-5" />
                    </button>
                </div>

                {/* Right: Actions & Profile */}
                <div className="flex items-center gap-2 lg:gap-6">
                    {/* Notifications */}
                    <button className="relative p-2.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded-full transition-all duration-150 group border border-transparent hover:border-slate-200">
                        <HiOutlineBell size={22} />
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#9853eb] rounded-full shadow-[0_0_0_2px_white] group-hover:scale-110 transition-transform"></span>
                    </button>

                    {/* Profile Dropdown */}
                    <div className="flex items-center gap-3 pl-2 lg:pl-6 border-l border-slate-200 group cursor-pointer select-none">
                        <div className="text-right hidden sm:block">
                            <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1">
                                {user.name}
                            </p>
                            <p className="text-[9px] font-bold text-[#9853eb] uppercase tracking-widest">
                                Administrator
                            </p>
                        </div>
                        
                        <div className="relative shrink-0">
                            {user.photo ? (
                                <img 
                                    className="h-10 w-10 rounded-[12px] object-cover border border-slate-200 shadow-sm group-hover:border-[#9853eb] transition-all" 
                                    src={user.photo} 
                                    alt="Profile" 
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-[12px] bg-[#f3efff] flex items-center justify-center text-[#9853eb] text-sm font-black border border-purple-100 group-hover:border-[#9853eb] transition-all">
                                    {user.name.charAt(0)}
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                        </div>
                        
                        <HiOutlineChevronDown className="text-slate-400 group-hover:text-slate-700 transition-colors hidden sm:block" />
                    </div>
                </div>
            </div>

            {/* Mobile Fullscreen Search Overlay */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col md:hidden animate-in slide-in-from-bottom-2 duration-200">
                    <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
                        <div className="relative flex-1">
                            <input 
                                autoFocus
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search system globally..." 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl outline-none font-bold text-sm focus:border-[#9853eb] focus:bg-white transition-all" 
                            />
                            <HiOutlineSearch className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9853eb]" />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <HiOutlineX className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <button 
                            onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}
                            className="p-3 text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors font-bold text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
                        {!searchQuery ? (
                            <div className="text-center mt-10">
                                <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <HiOutlineSearch className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-slate-500 font-semibold text-sm">Type to search across</p>
                                <p className="text-slate-400 font-medium text-xs mt-1">Students, Staff, Fees, and Pages</p>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3">Matches Found</p>
                                {searchResults.map((item) => (
                                    <button 
                                        key={item.id}
                                        onClick={() => handleResultClick(item.path)}
                                        className="w-full p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 text-left shadow-sm active:scale-95 transition-transform"
                                    >
                                        <div className="p-3 bg-[#f3efff] rounded-xl">
                                            <item.icon className="w-6 h-6 text-[#9853eb]" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-800">{item.name}</p>
                                            {item.subtext && <p className="text-xs text-slate-500 font-medium mt-0.5">{item.subtext}</p>}
                                        </div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                            {item.type}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center mt-10">
                                <p className="text-slate-700 font-bold text-lg">No Results</p>
                                <p className="text-slate-500 text-sm mt-1">Nothing found for "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}