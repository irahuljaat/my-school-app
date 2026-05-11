"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { 
    HiOutlineAcademicCap, HiOutlineClipboardList, HiOutlineHome, 
    HiOutlineUserGroup, HiOutlineCurrencyDollar, HiOutlineChartBar, 
    HiOutlineLightningBolt, HiOutlineIdentification, HiOutlineGlobeAlt, 
    HiOutlineBell, HiOutlineCog, HiOutlineX, HiOutlineMinusSm, 
    HiOutlinePlusSm, HiOutlineSparkles
} from 'react-icons/hi';

const Sidebar = ({ activePath, isOpen, onClose }) => {
    // Navigation Data (Same as original)
    const primaryNav = [
        { name: 'Dashboard', icon: HiOutlineHome, path: '/dashboard' },
        { name: 'Students', icon: HiOutlineAcademicCap, path: '/students' },
        { name: 'Teachers', icon: HiOutlineUserGroup, path: '/teacher-manage' },
        { name: 'Attendance', icon: HiOutlineClipboardList, path: '/attendance' },
        { name: 'Enquiries', icon: HiOutlineClipboardList, path: '/enquiries' },
        { name: 'Admissions', icon: HiOutlineClipboardList, path: '/Adenquiry' },
    ];

    const reportsNav = [{ name: 'Attendance Report', path: '/reports/attendance' }];
    const financeNav = [
        { name: 'Fee Collection', path: '/fees-system' },
        { name: 'School Expenses', path: '/school-expenses' },
    ];

    const otherNav = [
        { name: 'Exam Management', icon: HiOutlineClipboardList, path: '/exam-manage' },
        { name: 'Event and Activity', icon: HiOutlineLightningBolt, path: '/events' },
        { name: 'Communication', icon: HiOutlineIdentification, path: '/communication' },
        { name: 'Website', icon: HiOutlineGlobeAlt, path: '/website' },
        { name: 'Notify', icon: HiOutlineBell, path: '/notify' },
        { name: 'Settings', icon: HiOutlineCog, path: '/settings' },
    ];

    const NavItem = ({ name, icon: Icon, path, subItems = [], activePath }) => {
        const hasSubItems = subItems.length > 0;
        const isActive = activePath === path || subItems.some(item => activePath === item.path);
        const [isSubOpen, setIsSubOpen] = useState(isActive);

        const handleClick = (e) => {
            if (hasSubItems) {
                e.preventDefault();
                setIsSubOpen(!isSubOpen);
            } else if (onClose) {
                onClose();
            }
        };

        return (
            <div className="mb-2">
                <Link 
                    href={hasSubItems ? '#' : path}
                    onClick={handleClick}
                    className={`flex items-center px-5 py-3 rounded-2xl transition-all duration-300 group relative ${
                        isActive 
                        ? 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white text-indigo-600' 
                        : 'text-slate-500 hover:bg-white/50 hover:text-slate-900'
                    }`}
                >
                    <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-900'}`} />
                    <span className="flex-1 font-black text-[11px] uppercase tracking-wider italic">{name}</span>
                    
                    {hasSubItems && (
                        <div className="ml-2">
                            {isSubOpen ? <HiOutlineMinusSm className="w-4 h-4" /> : <HiOutlinePlusSm className="w-4 h-4" />}
                        </div>
                    )}
                </Link>

                {hasSubItems && isSubOpen && (
                    <div className="ml-8 mt-2 relative">
                        {/* Vertical Thread Line */}
                        <div className="absolute left-0 top-0 bottom-3 w-[2px] bg-gradient-to-b from-indigo-200 to-transparent" />
                        <div className="space-y-1 pt-1">
                            {subItems.map(item => (
                                <Link 
                                    key={item.name} 
                                    href={item.path}
                                    onClick={() => onClose && onClose()}
                                    className={`flex items-center ml-4 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activePath === item.path 
                                        ? 'text-indigo-600 bg-indigo-50/50' 
                                        : 'text-slate-400 hover:text-indigo-500'
                                    }`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${activePath === item.path ? 'bg-indigo-600 animate-pulse' : 'bg-slate-200'}`} />
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {/* Glassmorphism Backdrop */}
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60] lg:hidden" onClick={onClose} />
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-[70] w-72 
                bg-[#F8FAFC]/80 backdrop-blur-xl border-r border-white/50 h-screen 
                flex flex-col transition-transform duration-500 ease-in-out lg:translate-x-0 lg:static lg:block shrink-0
                ${isOpen ? 'translate-x-0 shadow-2xl shadow-indigo-100' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Brand Header - Clean Glass Card */}
                <div className="p-8 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 relative shrink-0 overflow-hidden rounded-[1.25rem] bg-white shadow-xl shadow-slate-200/50 border border-white p-1.5">
                            <Image 
                                src="https://res.cloudinary.com/db6ssceun/image/upload/v1771071585/SCHOOL_SENIOR_SECONDARY_LOGO_t88t8l.png" 
                                alt="MVG School Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <div>
                            <span className="text-[12px] font-black text-slate-900 tracking-tighter uppercase italic block leading-none">MVG School</span>
                            <span className="text-[8px] font-bold text-indigo-500 tracking-widest uppercase block mt-1">Admin Panel</span>
                        </div>
                    </div>
                    
                    <button onClick={onClose} className="lg:hidden p-2 bg-white rounded-xl shadow-sm text-slate-400">
                        <HiOutlineX size={18} />
                    </button>
                </div>

                {/* Navigation Sections */}
                <div className="flex-1 px-6 space-y-8 pb-10 overflow-y-auto custom-scrollbar">
                    {/* Management Section */}
                    <div>
                        <h3 className="px-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">Core Center</h3>
                        <div className="space-y-1">
                            {primaryNav.map(item => (
                                <NavItem key={item.name} {...item} activePath={activePath} />
                            ))}
                            <NavItem 
                                name="Reports" 
                                icon={HiOutlineChartBar} 
                                path="/reports" 
                                subItems={reportsNav} 
                                activePath={activePath} 
                            />
                        </div>
                    </div>

                    {/* Financial Section */}
                    <div>
                        <h3 className="px-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">Accountancy</h3>
                        <NavItem 
                            name="Finance" 
                            icon={HiOutlineCurrencyDollar} 
                            path="/finance" 
                            subItems={financeNav} 
                            activePath={activePath} 
                        />
                    </div>

                    {/* Operations Section */}
                    <div>
                        <h3 className="px-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">Support & Tools</h3>
                        <div className="space-y-1">
                            {otherNav.map(item => (
                                <NavItem key={item.name} {...item} activePath={activePath} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Neumorphic Profile Footer */}
                <div className="p-6">
                    <div className="bg-white/40 backdrop-blur-md p-4 rounded-[2rem] border border-white shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-[10px] shadow-lg shadow-slate-300">
                            AD
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-slate-900 truncate uppercase italic tracking-tight">Administrator</p>
                            <p className="text-[9px] text-indigo-500 font-black uppercase tracking-tighter">School Head</p>
                        </div>
                    </div>
                </div>
            </aside>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2E8F0;
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #CBD5E1;
                }
            `}</style>
        </>
    );
};

export default Sidebar;