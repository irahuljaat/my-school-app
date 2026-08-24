"use client";
import React, { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Download, X, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const HTMLFlipBook = dynamic(() => import('react-pageflip'), { 
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-blue-500 font-bold tracking-widest text-[10px] uppercase">Optimizing for your device...</p>
    </div>
  )
});

export default function MobileResponsiveProspectus() {
  const [isMobile, setIsMobile] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const pages = useMemo(() => {
    const totalPages = 14; 
    return Array.from({ length: totalPages }, (_, i) => {
      const ext = i === 0 ? 'jpeg' : 'png';
      return `/prospectus/${i}.${ext}`;
    });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const bookWidth = isMobile ? windowSize.width * 0.9 : 550;
  const bookHeight = isMobile ? (windowSize.width * 0.9) * 1.4 : 780;

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col overflow-hidden touch-none">
      
      {/* --- HEADER CONTROLS --- */}
      <div className="absolute top-0 left-0 w-full z-[110] p-4 md:p-6 flex justify-between items-start pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-3 md:p-5 rounded-2xl md:rounded-3xl pointer-events-auto shadow-2xl max-w-[60%] md:max-w-none">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <BookOpen className="text-white w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div>
              <h1 className="text-white font-black uppercase tracking-tighter text-sm md:text-xl leading-none">
                MVG <span className="text-blue-500">Prospectus</span>
              </h1>
              <p className="text-[7px] md:text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mt-1 truncate">
                Session 2026-27
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 pointer-events-auto">
          

          <Link 
            href="/" 
            className="bg-white/5 backdrop-blur-md text-white p-3 md:p-4 rounded-xl md:rounded-2xl hover:bg-red-500 transition-all border border-white/10"
          >
            {/* FIXED: Removed md:size and used className for responsiveness */}
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </Link>
        </div>
      </div>

      {/* --- RESPONSIVE FLIPBOOK --- */}
      <div className="flex-1 flex items-center justify-center p-2 md:p-12 relative mt-16 md:mt-0">
        <div className="absolute inset-0 bg-blue-600/5 blur-[100px] pointer-events-none" />

        <div className="w-full h-full flex items-center justify-center">
          {/* @ts-ignore */}
          {windowSize.width > 0 && (
            <HTMLFlipBook 
              width={bookWidth} 
              height={bookHeight}
              size="fixed"
              minWidth={280}
              maxWidth={1000}
              minHeight={400}
              maxHeight={1400}
              showCover={true}
              usePortrait={isMobile}
              startPage={0}
              flippingTime={600}
              useMouseEvents={true}
              className="prospectus-flipbook"
            >
              {pages.map((src, index) => (
                <div key={index} className="relative bg-white flex items-center justify-center overflow-hidden">
                  <Image 
                    src={src} 
                    alt={`Page ${index}`}
                    fill
                    priority={index < 2}
                    className="object-contain"
                    unoptimized 
                  />
                  <div className={`absolute inset-y-0 ${index % 2 === 0 ? 'right-0 bg-gradient-to-l' : 'left-0 bg-gradient-to-r'} from-black/10 to-transparent w-8 md:w-16 pointer-events-none`} />
                </div>
              ))}
            </HTMLFlipBook>
          )}
        </div>
      </div>

      <div className="absolute bottom-6 left-0 w-full flex justify-center pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/5">
           <p className="text-white/40 text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
             <ChevronLeft size={12} /> {isMobile ? "Swipe to flip" : "Drag corners to flip"} <ChevronRight size={12} />
           </p>
        </div>
      </div>

      <style jsx global>{`
        .prospectus-flipbook {
          box-shadow: 0 30px 60px -12px rgba(0,0,0,0.5);
        }
        body {
          overscroll-behavior-y: contain;
        }
      `}</style>
    </div>
  );
}