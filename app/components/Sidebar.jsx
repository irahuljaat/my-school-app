"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
    HiChevronDown, HiOutlineUsers, HiOutlineAcademicCap, 
    HiOutlineClipboardList, HiOutlineCalendar, HiOutlineMail, 
    HiOutlineUserGroup, HiOutlineHome, HiOutlineLibrary, 
    HiOutlineCurrencyDollar, HiOutlineChartBar, HiOutlineLightningBolt,
    HiOutlineIdentification, HiOutlineGlobeAlt, HiOutlineBell, HiOutlineCog
} from 'react-icons/hi';

const Sidebar = ({ activePath }) => {
    // 1. Primary Navigation Items
    const primaryNav = [
        { name: 'Dashboard', icon: HiOutlineHome, path: '/dashboard' },
        { name: 'Students', icon: HiOutlineAcademicCap, path: '/students' },
        { name: 'Teachers', icon: HiOutlineUserGroup, path: '/teacher-manage' },
        { name: 'Attendance', icon: HiOutlineClipboardList, path: '/attendance' },
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
        const [isOpen, setIsOpen] = useState(
            activePath && subItems.some(item => activePath.startsWith(item.path))
        );

        const hasSubItems = subItems.length > 0;
        const isActive = activePath === path || subItems.some(item => activePath === item.path);

        const handleClick = (e) => {
            if (hasSubItems) {
                e.preventDefault();
                setIsOpen(!isOpen);
            }
        };

        return (
            <div className="mb-1">
                <Link 
                    href={hasSubItems ? '#' : path}
                    onClick={handleClick}
                    className={`flex items-center px-4 py-3 rounded-2xl transition-all duration-200 group ${
                        isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                    }`}
                >
                    <div className={`p-2 rounded-xl mr-3 transition-colors ${
                        isActive ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                    }`}>
                        {Icon && <Icon className="w-5 h-5" />}
                    </div>
                    <span className="flex-1 font-bold text-sm tracking-tight">{name}</span>
                    {hasSubItems && (
                        <HiChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    )}
                </Link>

                {hasSubItems && isOpen && (
                    <div className="ml-12 mt-2 space-y-1 border-l-2 border-slate-100 pl-4 animate-in slide-in-from-top-2 duration-300">
                        {subItems.map(item => (
                            <Link 
                                key={item.name} 
                                href={item.path}
                                className={`block py-2 text-sm font-semibold transition-colors ${
                                    activePath === item.path 
                                    ? 'text-indigo-600' 
                                    : 'text-slate-400 hover:text-indigo-500'
                                }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className="w-72 flex-shrink-0 bg-white border-r border-slate-100 h-screen overflow-y-auto hidden md:flex flex-col sticky top-0">
            {/* Logo Section */}
            <div className="p-8 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200">
                        <HiOutlineAcademicCap className="text-white w-6 h-6" />
                    </div>
                    <span className="text-xl font-black text-slate-800 tracking-tighter uppercase">EduFlow</span>
                </div>
            </div>

            {/* Navigation Sections */}
            <div className="flex-1 px-6 space-y-8 pb-10">
                {/* Main Menu */}
                <div>
                    <h3 className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Core Management</h3>
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

                {/* Finance Section */}
                <div>
                    <h3 className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Financials</h3>
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
                    <h3 className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Operations</h3>
                    <div className="space-y-1">
                        {otherNav.map(item => (
                            <NavItem key={item.name} {...item} activePath={activePath} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer / User Profile Brief */}
            <div className="p-6 border-t border-slate-50 bg-slate-50/50">
                <div className="flex items-center gap-3 p-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        AD
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-black text-slate-700 truncate">Administrator</p>
                        <p className="text-[10px] text-slate-400 font-bold italic">Super Admin</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;