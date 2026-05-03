"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation'; 
import Sidebar from './Sidebar'; 
import Header from './Header'; 
import Navbar from './Navbar'; 
import Footer from './Footer'; // 1. Import your new Footer

const MainLayout = ({ children }) => {
    const activePath = usePathname(); 
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const path = activePath.toLowerCase();
    const isWebsitePage = 
        activePath === '/' || 
        path === '/login' || 
        path.startsWith('/about') || 
        path.startsWith('/academics') || 
        path.startsWith('/gallery') || 
        path.startsWith('/contact') || 
        path.startsWith('/admission') ||
        path.startsWith('/achievements') ||
        path.startsWith('/facilities') ||
        path.startsWith('/blog');

    useEffect(() => {
        const checkAuth = () => {
            const isLoggedIn = document.cookie.includes("user_session=true");

            if (!isWebsitePage && !isLoggedIn) {
                router.replace('/login');
            } else {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [activePath, isWebsitePage, router]);

    // 2. THE GATEKEEPER (Loading check MUST be first)
    // This prevents the Navbar from showing while "Loading..." is active
    if (isLoading) {
        return (
            <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-white font-bold tracking-widest uppercase">
                Loading...
            </div>
        );
    }

    // 3. Render Website Pages (Includes Navbar AND Footer)
    if (isWebsitePage) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar /> 
                <main className="flex-grow">
                    {children}
                </main>
                <Footer /> {/* 4. Footer only appears on website pages */}
            </div>
        );
    }

    // 5. DASHBOARD LAYOUT (Admin Panel - No Navbar, No Footer)
    return (
        <div className="flex h-screen bg-gray-50">
           <Sidebar 
                activePath={activePath} 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
            />
            <div className="flex flex-col flex-1 overflow-hidden">
               <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;