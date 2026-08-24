"use client";

import React from 'react';
import { usePathname } from 'next/navigation'; 
import Navbar from './Navbar'; 
import Footer from './Footer'; 

const MainLayout = ({ children }) => {
    const activePath = usePathname(); 
    const path = activePath ? activePath.toLowerCase() : '';
    
    // List of page paths where both Navbar and Footer should NOT be visible
    const hideNavbarFooterPaths = [
        '/login',
        '/dashboard',
        '/feedback',
        '/hmwrk',
        '/leave',
        '/marks',
        '/notices',
        '/results',
        '/stattendance',
        '/stgallery',
        '/syllabus'
    ];

    // Check if current path matches or starts with any of the restricted paths
    const shouldHideLayout = hideNavbarFooterPaths.some(p => 
        path === p || path.startsWith(`${p}/`)
    );

    // If it's one of the portal/student pages, render content standalone without Navbar or Footer
    if (shouldHideLayout) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                {children}
            </div>
        );
    }

    // Otherwise, render normal public website pages with both Navbar and Footer
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar /> 
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;