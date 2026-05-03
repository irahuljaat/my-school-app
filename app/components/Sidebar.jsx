"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { 
    HiChevronDown, HiOutlineAcademicCap, 
    HiOutlineClipboardList, HiOutlineHome, 
    HiOutlineUserGroup, HiOutlineCurrencyDollar, 
    HiOutlineChartBar, HiOutlineLightningBolt,
    HiOutlineIdentification, HiOutlineGlobeAlt, 
    HiOutlineBell, HiOutlineCog, HiOutlineX,
    HiOutlineMinusSm, HiOutlinePlusSm, HiOutlineSparkles
} from 'react-icons/hi';

const Sidebar = ({ activePath, isOpen, onClose }) => {
    // 1. Primary Navigation Items
    const primaryNav = [
        { name: 'Dashboard', icon: HiOutlineHome, path: '/dashboard' },
        { name: 'Students', icon: HiOutlineAcademicCap, path: '/students' },
        { name: 'Teachers', icon: HiOutlineUserGroup, path: '/teacher-manage' },
        { name: 'Attendance', icon: HiOutlineClipboardList, path: '/attendance' },
        { name: 'Enquiries', icon: HiOutlineClipboardList, path: '/enquiries' },
        { name: 'Admissions', icon: HiOutlineClipboardList, path: '/Adenquiry' },
    ];

    // 2. Dropdown Menus
    const reportsNav = [
        { name: 'Attendance Report', path: '/reports/attendance' },
    ];

    const financeNav = [
        { name: 'Fee Collection', path: '/fees-system' },
        { name: 'School Expenses', path: '/school-expenses' },
    ];

    // 3. Other Utilities
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
            } else {
                if (onClose) onClose();
            }
        };

        return (
            <div className="mb-2">
                <Link 
                    href={hasSubItems ? '#' : path}
                    onClick={handleClick}
                    className={`flex items-center px-4 py-2.5 rounded-full transition-all duration-300 group relative ${
                        isActive && !hasSubItems 
                        ? 'bg-black text-white shadow-xl' 
                        : isSubOpen && hasSubItems 
                        ? 'bg-black text-white'
                        : 'text-zinc-500 hover:text-black hover:bg-zinc-100/50'
                    }`}
                >
                    <Icon className={`w-5 h-5 mr-3 ${isActive || isSubOpen ? 'text-current' : 'text-zinc-400'}`} />
                    <span className="flex-1 font-semibold text-[13px] tracking-tight">{name}</span>
                    
                    {hasSubItems && (
                        <div className="ml-2">
                            {isSubOpen ? <HiOutlineMinusSm className="w-4 h-4" /> : <HiOutlinePlusSm className="w-4 h-4" />}
                        </div>
                    )}
                </Link>

                {/* Sub-menu with Vertical Thread Line - from image_0dae3b.png */}
                {hasSubItems && isSubOpen && (
                    <div className="ml-6 mt-1 relative">
                        <div className="absolute left-0 top-0 bottom-2 w-[1.5px] bg-zinc-200" />
                        <div className="space-y-1 pt-1">
                            {subItems.map(item => (
                                <Link 
                                    key={item.name} 
                                    href={item.path}
                                    onClick={() => onClose && onClose()}
                                    className={`flex items-center ml-4 px-4 py-2 rounded-full text-[12px] font-bold transition-all ${
                                        activePath === item.path 
                                        ? 'bg-white text-black shadow-sm ring-1 ring-zinc-100' 
                                        : 'text-zinc-400 hover:text-black'
                                    }`}
                                >
                                    <div className="w-1 h-1 rounded-full bg-current mr-2 opacity-40" />
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
            {/* Mobile Backdrop */}
            {isOpen && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-[60] lg:hidden" onClick={onClose} />
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-[70] w-72 bg-[#F6F6F6] border-r border-zinc-200/50 h-screen 
                flex flex-col transition-transform duration-500 ease-in-out lg:translate-x-0 lg:static lg:block shrink-0
                ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Brand Header */}
                <div className="p-8 mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 relative shrink-0 overflow-hidden rounded-xl bg-white shadow-sm border border-zinc-100 p-1">
                            <Image 
                                src="https://res.cloudinary.com/db6ssceun/image/upload/v1771071585/SCHOOL_SENIOR_SECONDARY_LOGO_t88t8l.png" 
                                alt="MVG School Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <span className="text-sm font-black text-black tracking-widest uppercase">MVG SCHOOL</span>
                    </div>
                    
                    <button onClick={onClose} className="lg:hidden p-2 text-zinc-400 hover:bg-white rounded-full">
                        <HiOutlineX size={20} />
                    </button>
                </div>

                {/* Navigation Sections */}
                <div className="flex-1 px-6 space-y-8 pb-10 overflow-y-auto custom-scrollbar">
                    {/* Core Section */}
                    <div>
                        <h3 className="px-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Core Management</h3>
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
                        <h3 className="px-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Financials</h3>
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
                        <h3 className="px-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Operations</h3>
                        <div className="space-y-1">
                            {otherNav.map(item => (
                                <NavItem key={item.name} {...item} activePath={activePath} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Profile Brief Footer */}
                <div className="p-6">
                    <div className="bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-white flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-white font-bold text-[10px] shadow-lg">
                            AD
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-black truncate uppercase">Administrator</p>
                            <p className="text-[9px] text-zinc-400 font-bold italic">Super Admin</p>
                        </div>
                    </div>
                </div>
            </aside>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e4e4e7;
                    border-radius: 10px;
                }
            `}</style>
        </>
    );
};

export default Sidebar;