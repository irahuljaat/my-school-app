"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation'; 
import Sidebar from './Sidebar'; 
import Header from './Header'; 

const MainLayout = ({ children }) => {
    const activePath = usePathname(); 
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const path = activePath ? activePath.toLowerCase() : '';
    
    // Check if the current page is the root/login page
    const isLoginPage = path === '/' || path === '/login';

    // Check if the current page is /posts (or any sub-path like /posts/create)
    const isPostsPage = path.startsWith('/posts');

    useEffect(() => {
        const checkAuth = () => {
            const isLoggedIn = document.cookie.includes("user_session=true");

            if (!isLoginPage && !isLoggedIn) {
                router.replace('/');
            } else {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [activePath, isLoginPage, router]);

    // 1. Loading Gatekeeper
    if (isLoading) {
        return (
            <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-white font-bold tracking-widest uppercase">
                Loading...
            </div>
        );
    }

    // 2. Render Login Page standalone without dashboard sidebar/header
    if (isLoginPage) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                {children}
            </div>
        );
    }

    // 3. Render Dashboard Layout (Header and Sidebar hidden on /posts)
    return (
        <div className="flex h-screen bg-gray-50">
            {!isPostsPage && (
                <Sidebar 
                    activePath={activePath} 
                    isOpen={isSidebarOpen} 
                    onClose={() => setIsSidebarOpen(false)} 
                />
            )}
            <div className="flex flex-col flex-1 overflow-hidden">
                {!isPostsPage && <Header onMenuClick={() => setIsSidebarOpen(true)} />}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;