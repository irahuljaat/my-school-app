"use client";
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Download, X } from 'lucide-react';
import Link from 'next/link';

const HTMLFlipBook = dynamic(() => import('react-pageflip'), { 
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex items-center justify-center bg-slate-900">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
});

export default function FullScreenCalender() {
  const pages = useMemo(() => {
    const totalPages = 14; 
    return Array.from({ length: totalPages }, (_, i) => {
      const ext = i === 0 ? 'jpeg' : 'png';
      return `/calender/${i}.${ext}`;
    });
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col overflow-hidden">
      
      {/* --- FLOATING HEADER CONTROLS --- */}
      <div className="absolute top-0 left-0 w-full z-[110] p-6 flex justify-between items-center pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl pointer-events-auto">
          <h1 className="text-white font-black uppercase italic tracking-tighter text-xl">
            Academic <span className="text-indigo-400">Planner</span>
          </h1>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em]">Session 2026-27</p>
        </div>
        
        <div className="flex gap-3 pointer-events-auto">
         
          <Link 
            href="/" 
            className="bg-white/10 backdrop-blur-md text-white p-4 rounded-2xl hover:bg-red-500 transition-all border border-white/10"
          >
            <X size={20} />
          </Link>
        </div>
      </div>

      {/* --- FULL SCREEN FLIPBOOK --- */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-10">
        <div className="w-full h-full max-w-7xl mx-auto flex items-center justify-center">
          {/* @ts-ignore */}
          <HTMLFlipBook 
            width={600} 
            height={850}
            size="stretch"
            minWidth={315}
            maxWidth={1200}
            minHeight={400}
            maxHeight={1600}
            showCover={true}
            usePortrait={true} // Switches to single page on mobile automatically
            className="shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]"
          >
            {pages.map((src, index) => (
              <div key={index} className="relative bg-white flex items-center justify-center overflow-hidden">
                <Image 
                  src={src} 
                  alt={`Page ${index}`}
                  fill
                  priority={index < 2}
                  className="object-contain"
                  quality={100} // Highest quality for full-screen
                />
                {/* Real-time spine shadow for depth */}
                <div className={`absolute inset-y-0 ${index % 2 === 0 ? 'right-0 bg-gradient-to-l' : 'left-0 bg-gradient-to-r'} from-black/10 to-transparent w-16 pointer-events-none`} />
              </div>
            ))}
          </HTMLFlipBook>
        </div>
      </div>

      {/* --- NAVIGATION FOOTER --- */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/30 font-black uppercase tracking-[0.5em] text-[10px]">
        Drag corners or use arrow keys to flip
      </div>
    </div>
  );
}