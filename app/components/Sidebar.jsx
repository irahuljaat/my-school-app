"use client";

import React, { memo, useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  HiOutlineAcademicCap, HiOutlineClipboardList, HiOutlineHome, 
  HiOutlineUserGroup, HiOutlineCurrencyDollar, HiX,
  HiOutlineBell, HiOutlineCog, HiOutlineBookOpen, HiChevronRight,
  HiOutlineCalendar, HiOutlineDocumentText, HiOutlineTruck, HiOutlineChatAlt2, HiOutlineIdentification,
  HiOutlinePrinter, HiOutlineOfficeBuilding, HiOutlineShieldCheck, HiOutlineSparkles
} from 'react-icons/hi';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useColors } from '../components/ColorComponent';

const NAV_CONFIG = [
  { section: 'CORE CENTER', items: [
    { name: 'Dashboard', icon: HiOutlineHome, path: '/dashboard' },
    { name: 'Students', icon: HiOutlineUserGroup, path: '/students' },
    { name: 'Teachers', icon: HiOutlineAcademicCap, path: '/teacher-manage' },
    { name: 'Time Table', icon: HiOutlineCalendar, path: '/time-table' },
    { name: 'Syllabus', icon: HiOutlineDocumentText, path: '/syllabus-manager' },
    { name: 'Attendance', icon: HiOutlineClipboardList, path: '/attendance' },
    { name: 'Behavioral Records', icon: HiOutlineShieldCheck, path: '/behaviour' },
    { name: 'Vehicle', icon: HiOutlineTruck, path: '/route-management' },
    { name: 'Enquiries', icon: HiOutlineChatAlt2, path: '/enquiries' },
    { name: 'Admissions', icon: HiOutlineDocumentText, path: '/Adenquiry' },
    { name: 'Post Maker', icon: HiOutlineSparkles, path: '/posts' },
    { 
      name: 'Library', 
      icon: HiOutlineBookOpen, 
      path: '/library',
      subMenus: [
        { name: 'Books List', path: '/library' },
        { name: 'Issued Books', path: '/library/issue' },
      ]
    },
    { name: "ID Cards Export", path: "/id-cards", icon: HiOutlineIdentification},
    { name: 'Paper Maker', icon: HiOutlinePrinter, path: '/papers' },
    { name: 'Hostel', icon: HiOutlineOfficeBuilding, path: '/hostel' },
    { name: 'Fee Collection', icon: HiOutlineCurrencyDollar, path: '/fees-system' },
    { name: 'School Expenses', icon: HiOutlineCurrencyDollar, path: '/school-expenses' },
    { name: 'Exam Management', icon: HiOutlineClipboardList, path: '/exam-manage' },
    { name: 'Notify', icon: HiOutlineBell, path: '/notify' },
    { name: 'Settings', icon: HiOutlineCog, path: '/settings' },
  ]},
];

const NavItem = memo(({ name, icon: Icon, path, isActive, onClick, subMenus, activePath }) => {
  const colors = useColors();
  const primaryColor = colors.primary || '#ffc107';
  
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubMenus = subMenus && subMenus.length > 0;
  const isSubActive = hasSubMenus && subMenus.some(sub => sub.path === activePath);

  return (
    <div className="relative">
      <Link 
    href={hasSubMenus ? '#' : (path || '#')}  // Added (path || '#') fallback
    onClick={(e) => {
        if (hasSubMenus) {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          } else {
            onClick();
          }
        }}
        className="relative flex items-center px-4 py-1 transition-colors group"
      >
        {/* Active Vertical Indicator */}
        {(isActive || isSubActive) && (
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md" 
            style={{ backgroundColor: primaryColor }}
          />
        )}
        
        {/* Pill Background with Distinct Active State */}
        <div className={`flex items-center justify-between w-full px-4 py-3 rounded-[16px] text-sm font-medium transition-all ${
          (isActive || isSubActive) 
            ? 'bg-slate-900 text-white font-bold shadow-md' 
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}>
          <div className="flex items-center">
            <Icon 
              className={`w-5 h-5 mr-3 transition-colors`}
              style={{ color: (isActive || isSubActive) ? primaryColor : undefined }}
              strokeWidth={2} 
            />
            <span className={!(isActive || isSubActive) ? 'text-slate-500 group-hover:text-slate-900' : ''}>{name}</span>
          </div>
          {hasSubMenus && (
            <HiChevronRight 
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : 'text-slate-400'}`} 
              style={{ color: isExpanded ? primaryColor : undefined }}
            />
          )}
        </div>
      </Link>

      {/* Sub Menus */}
      {hasSubMenus && isExpanded && (
        <div className="pl-12 pr-4 py-1 space-y-1">
          {subMenus.map((sub) => {
            const isSubItemActive = activePath === sub.path;
            return (
              <Link
                key={sub.name}
                href={sub.path}
                onClick={onClick}
                className={`block py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                  isSubItemActive 
                    ? 'text-slate-900 font-bold' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                style={{ backgroundColor: isSubItemActive ? primaryColor : undefined }}
              >
                {sub.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
});

NavItem.displayName = 'NavItem';

export default function Sidebar({ activePath, isOpen, onClose }) {
  const colors = useColors();
  const primaryColor = colors.primary || '#ffc107';

  const [schoolDetails, setSchoolDetails] = useState({
    schoolName: 'EDMIRO',
    schoolAddress: 'Smarter Schools. Better Future.',
    logoUrl: ''
  });

  useEffect(() => {
    async function fetchSchoolDetails() {
      try {
        const db = getFirestore();
        const docRef = doc(db, 'config', 'schoolDetails');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSchoolDetails({
            schoolName: data.schoolName || 'EDMIRO',
            schoolAddress: data.schoolAddress || 'Smarter Schools. Better Future.',
            logoUrl: data.logoUrl || ''
          });
        }
      } catch (error) {
        console.error("Error fetching school details from Firestore:", error);
      }
    }
    fetchSchoolDetails();
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/80 flex flex-col transform transition-transform lg:translate-x-0 lg:static ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Logo Area fetched from Firestore */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {schoolDetails.logoUrl ? (
              <img src={schoolDetails.logoUrl} alt="School Logo" className="w-10 h-10 rounded-xl object-cover shadow-md" />
            ) : (
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-900 shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                <HiOutlineBookOpen size={22} />
              </div>
            )}
            <div>
              <span className="text-xl font-black text-slate-900 tracking-wider block leading-tight">{schoolDetails.schoolName}</span>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight truncate max-w-[140px]">{schoolDetails.schoolAddress}</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors">
            <HiX size={24} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-hide">
          {NAV_CONFIG.map((group) => (
            <div key={group.section} className="mb-4">
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItem 
                    key={item.name} 
                    {...item} 
                    activePath={activePath}
                    isActive={activePath === item.path} 
                    onClick={onClose} 
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Session Area */}
        <div className="p-4 mt-auto border-t border-slate-100">
          <div className="bg-amber-50/50 rounded-[20px] p-4 border border-amber-200/50 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-amber-700/70 uppercase tracking-wider">Current Session</p>
              <p className="text-sm font-bold text-slate-900">2025 - 2026</p>
            </div>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-900 shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <HiOutlineClipboardList size={16} />
            </div>
          </div>
        </div>

      </aside>
    </>
  );
}