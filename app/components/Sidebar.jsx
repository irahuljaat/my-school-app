"use client";

import React, { memo } from 'react';
import Link from 'next/link';
import { 
  HiOutlineAcademicCap, HiOutlineClipboardList, HiOutlineHome, 
  HiOutlineUserGroup, HiOutlineCurrencyDollar, HiX,
  HiOutlineLightningBolt, HiOutlineBell, HiOutlineCog,
  HiBookOpen
} from 'react-icons/hi';

const NAV_CONFIG = [
  { section: 'CORE CENTER', items: [
    { name: 'Dashboard', icon: HiOutlineHome, path: '/dashboard' },
    { name: 'Students', icon: HiOutlineAcademicCap, path: '/students' },
    { name: 'Teachers', icon: HiOutlineUserGroup, path: '/teacher-manage' },
    { name: 'Time Table', icon: HiOutlineUserGroup, path: '/time-table' },
    { name: 'Syllabus', icon: HiOutlineUserGroup, path: '/syllabus-manager' },
    { name: 'Attendance', icon: HiOutlineClipboardList, path: '/attendance' },
    { name: 'Vehicle', icon: HiOutlineClipboardList, path: '/route-management' },
    { name: 'Enquiries', icon: HiOutlineClipboardList, path: '/enquiries' },
    { name: 'Admissions', icon: HiOutlineClipboardList, path: '/Adenquiry' },
  ]},
  { section: 'ACCOUNTANCY', items: [
    { name: 'Fee Collection', icon: HiOutlineCurrencyDollar, path: '/fees-system' },
    { name: 'School Expenses', icon: HiOutlineCurrencyDollar, path: '/school-expenses' },
  ]},
  { section: 'SUPPORT', items: [
    { name: 'Exam Management', icon: HiOutlineClipboardList, path: '/exam-manage' },
    { name: 'Events', icon: HiOutlineLightningBolt, path: '/events' },
    { name: 'Notify', icon: HiOutlineBell, path: '/notify' },
    { name: 'Settings', icon: HiOutlineCog, path: '/settings' },
  ]}
];

const NavItem = memo(({ name, icon: Icon, path, isActive, onClick }) => (
  <Link 
    href={path}
    onClick={onClick}
    className="relative flex items-center px-6 py-1 transition-colors group"
  >
    {/* Floating Vertical Active Indicator */}
    {isActive && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#9853eb] rounded-r-md" />
    )}
    
    {/* Pill Background */}
    <div className={`flex items-center w-full px-4 py-2.5 rounded-[12px] text-sm font-medium transition-all ${
      isActive 
        ? 'bg-[#f3efff] text-[#9853eb] font-bold' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
    }`}>
      <Icon 
        className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-[#9853eb]' : 'text-slate-400 group-hover:text-slate-500'}`} 
        strokeWidth={isActive ? 2 : 1.5} 
      />
      {name}
    </div>
  </Link>
));

NavItem.displayName = 'NavItem';

export default function Sidebar({ activePath, isOpen, onClose }) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar - Light theme */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col transform transition-transform lg:translate-x-0 lg:static ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Logo Area */}
        <div className="flex items-center justify-between px-8 py-8 mb-2">
          <div className="flex items-center gap-2">
            <div className="text-[#9853eb]">
              <HiBookOpen size={28} />
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tight">MVG</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors">
            <HiX size={24} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto pb-6 scrollbar-hide">
          {NAV_CONFIG.map((group) => (
            <div key={group.section} className="mb-6">
              {/* Very subtle section headers to match the clean look */}
              <p className="px-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                {group.section}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItem 
                    key={item.name} 
                    {...item} 
                    isActive={activePath === item.path} 
                    onClick={onClose} 
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Profile Area */}
        <div className="p-4 mt-auto">
          <div className="bg-slate-50 rounded-[16px] p-4 border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-[#9853eb] font-bold">
              SH
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Administrator</p>
              <p className="text-sm font-bold text-slate-800">School Head</p>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
}