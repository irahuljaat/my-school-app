"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation'; 
import Sidebar from './Sidebar'; 
import Header from './Header'; 

const MainLayout = ({ children }) => {
    const activePath = usePathname(); 
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    // 1. Identify Website Pages vs Admin Pages
    // This includes your landing page, login, and any page in your About/Website folder
    const isWebsitePage = 
        activePath === '/' || 
        activePath === '/login' || 
        activePath.startsWith('/About') || 
        activePath.startsWith('/Academics') || 
        activePath.startsWith('/gallery') || 
        activePath.startsWith('/contact') || 
        activePath.startsWith('/Admission'); // Add other website routes here

    useEffect(() => {
        // 2. THE SECURITY CHECK
        const checkAuth = () => {
            const isLoggedIn = document.cookie.includes("user_session=true");

            // Only enforce login if it's NOT a website page
            if (!isWebsitePage && !isLoggedIn) {
                router.replace('/login');
            } else {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [activePath, isWebsitePage, router]);

    // 3. Render Website Pages immediately (NO SIDEBAR / NO HEADER)
    if (isWebsitePage) {
        return <div className="min-h-screen bg-white">{children}</div>;
    }

    // 4. While checking auth for Admin pages
    if (isLoading) {
        return (
            <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-white font-bold tracking-widest uppercase">
                Verifying Session...
            </div>
        );
    }

    // 5. DASHBOARD LAYOUT (Only for Admin Panel)
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar activePath={activePath} /> 
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;