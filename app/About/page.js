"use client";

import React, { useEffect, useState, useRef } from "react";
import { db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { MapPin, Phone } from "lucide-react";
import Image from "next/image";

// Custom hook to trigger scroll reveal animations without heavy libraries
function useReveal() {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}

const DEFAULT_DATA = {
  stats: [
    { label: "Years of Legacy", value: "30+" },
    { label: "Quality Faculty", value: "25+" },
    { label: "Global Alumni", value: "2200+" },
    { label: "Result Record", value: "100%" },
  ],
 
};

export default function AboutPage() {
  const [data, setData] = useState(DEFAULT_DATA);

  // Scroll reveal references
  const [heroRef, heroVisible] = useReveal();
  const [identityRef, identityVisible] = useReveal();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) {
        setData((prev) => ({ ...prev, ...docSnap.data() }));
      }
    });

    return () => unsub();
  }, []);

  return (
    <div className="bg-[#FAF8F4] text-[#52607A] font-sans antialiased selection:bg-[#B8892B] selection:text-white">
      {/* 1. HERO SECTION */}
      <section
        ref={heroRef}
        className="relative min-h-[70vh] flex items-center justify-center bg-[#142440] overflow-hidden px-6 py-20 md:py-28"
      >
        <div className="absolute inset-0">
          <Image
            src="https://res.cloudinary.com/db6ssceun/image/upload/v1766151247/ksc9iyuyyj7k0kibdsum.jpg"
            alt="MVG Academy Campus"
            fill
            priority
            className="object-cover opacity-20 filter contrast-125 brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#142440] via-[#142440]/60 to-transparent" />
        </div>

        <div
          className={`relative z-10 max-w-7xl mx-auto text-center transition-all duration-700 ease-out ${
            heroVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          {/* Eyebrow */}
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#E9DCBD] block mb-4">
            Established 1994
          </span>

          {/* Serif Headline */}
          <h1 className="font-serif italic text-5xl md:text-7xl lg:text-8xl text-white font-normal tracking-tight mb-6">
            Our <span className="text-[#E9DCBD]">Story</span>
          </h1>

          <p className="font-sans text-base md:text-lg text-[#FAF8F4]/80 max-w-2xl mx-auto leading-relaxed">
            Nurturing academic mastery and human integrity across three decades.
          </p>
        </div>
      </section>

      {/* 2. CORE IDENTITY SECTION */}
      <section
        ref={identityRef}
        className="py-20 md:py-28 max-w-7xl mx-auto px-6 md:px-10"
      >
        <div
          className={`grid lg:grid-cols-12 gap-12 lg:gap-16 items-start transition-all duration-700 ease-out ${
            identityVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          {/* Left Column: Narrative */}
          <div className="lg:col-span-7 space-y-6">
            {/* 3-Tier Opening Sequence */}
            <div className="space-y-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#B8892B] block">
                Institutional Profile
              </span>
              <h2 className="font-serif text-3xl md:text-5xl text-[#142440] leading-tight font-normal">
                Where Tradition Meets <span className="italic">Innovation.</span>
              </h2>
            </div>

            <p className="font-sans text-base md:text-lg text-[#52607A] leading-relaxed">
              Established in 1994, MVG Public School has grown from a visionary
              local institution into a cornerstone of academic rigor and character
              formation in Rajasthan.
            </p>

            {/* Icon-in-a-Ring Contact Details */}
            <div className="pt-6 grid sm:grid-cols-2 gap-6 border-t border-[#E4DFD3]">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full border border-[#E4DFD3] flex items-center justify-center shrink-0 text-[#B8892B] bg-white">
                  <MapPin size={18} />
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#52607A] block">
                    Location
                  </span>
                  <p className="font-sans text-sm font-semibold text-[#142440]">
                    Jaipur, India 302033
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full border border-[#E4DFD3] flex items-center justify-center shrink-0 text-[#B8892B] bg-white">
                  <Phone size={18} />
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#52607A] block">
                    Contact
                  </span>
                  <p className="font-sans text-sm font-semibold text-[#142440]">
                    +91 9829018332
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Ledger Stat Row Card */}
          <div className="lg:col-span-5 bg-[#F1ECE1] border border-[#E4DFD3] rounded-[24px] p-8 md:p-10">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#B8892B] block mb-8">
              At A Glance
            </span>

            {/* Ledger Stat Layout */}
            <div className="divide-y divide-[#E4DFD3]">
              {data.stats.map((stat, i) => (
                <div
                  key={i}
                  className="py-5 first:pt-0 last:pb-0 flex items-baseline justify-between gap-4 transition-all duration-500 ease-out"
                  style={{
                    transitionDelay: identityVisible ? `${i * 90}ms` : "0ms",
                  }}
                >
                  <span className="font-serif italic text-4xl md:text-5xl text-[#142440]">
                    {stat.value}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#52607A] text-right">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}