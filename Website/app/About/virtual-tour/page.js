"use client";
import React from 'react';
import { Compass, X } from 'lucide-react';
import Link from 'next/link';

export default function VirtualTour() {
  const googleMapsEmbedUrl = "https://www.google.com/maps/embed?pb=!4v1777737418882!6m8!1m7!1sCAoSF0NJSE0wb2dLRUlDQWdJQ0VxTHV6MGdF!2m2!1d26.80873871043621!2d75.8166760337685!3f80!4f20!5f0.7820865974627469";

  return (
    /* fixed inset-0 ensures the container covers the entire screen from top to bottom */
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
      
      {/* --- FLOATING HEADER --- */}
      <div className="absolute top-0 left-0 w-full z-[110] p-4 md:p-6 flex justify-between items-start pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-4 rounded-3xl pointer-events-auto shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Compass size={20} className="text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-white font-black uppercase tracking-tighter text-lg md:text-xl leading-none">
                Campus <span className="text-blue-500">360° View</span>
              </h1>
              <p className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">
                MVG Public School
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 pointer-events-auto">
          <Link 
            href="/" 
            className="bg-white/5 backdrop-blur-md text-white p-4 rounded-2xl hover:bg-red-500 transition-all border border-white/10"
          >
            <X className="w-6 h-6" />
          </Link>
        </div>
      </div>

      {/* --- FULL SCREEN IFRAME --- */}
      <div className="w-full h-full">
        <iframe
          src={googleMapsEmbedUrl}
          /* Using 100vw and 100vh ensures the iframe pushes to the edges */
          className="w-screen h-screen border-0"
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="School 360 View"
        />
      </div>

      {/* --- INTERACTION TIP --- */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
           <p className="text-white/50 text-[9px] font-black uppercase tracking-[0.2em]">
             Drag to explore campus
           </p>
        </div>
      </div>
    </div>
  );
}