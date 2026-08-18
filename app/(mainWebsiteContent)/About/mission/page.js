"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { db } from "../../../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import Image from "next/image";
import { Target, Rocket, ShieldCheck, CheckCircle2 } from "lucide-react";

// IntersectionObserver hook for lightweight scroll reveal
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

// Default Fallback Data to prevent blank screens during loading/network issues
const DEFAULT_MISSION_DATA = {
  eyebrow: "Our Purpose",
  title: "The Mission",
  subtitle: "Empowering every student to reach higher and dream bigger.",
  description:
    "Our mission is to provide a nurturing and innovative learning environment that fosters academic excellence, creative expression, and strong moral character.",
  highlights: [
    "Innovation in Learning",
    "Character Development",
    "Community Leadership",
  ],
  statsValue: "100%",
  statsLabel: "Commitment to Success",
};

export default function MissionPage() {
  const [data, setData] = useState(DEFAULT_MISSION_DATA);

  // Animation Refs
  const [heroRef, heroVisible] = useReveal();
  const [missionRef, missionVisible] = useReveal();
  const [valuesRef, valuesVisible] = useReveal();

  const coreValues = useMemo(
    () => [
      {
        title: "Intellectual Growth",
        desc: "Cultivating a thirst for knowledge that goes beyond textbooks and examinations.",
        icon: Target,
      },
      {
        title: "Ethical Integrity",
        desc: "Instilling values of honesty, respect, and responsibility in every student.",
        icon: ShieldCheck,
      },
      {
        title: "Global Citizenship",
        desc: "Preparing students to lead and serve in an increasingly interconnected world.",
        icon: Rocket,
      },
    ],
    []
  );

  useEffect(() => {
    let unsub = () => {};

    try {
      if (db) {
        unsub = onSnapshot(
          doc(db, "site_data", "config"),
          (docSnap) => {
            if (docSnap.exists() && docSnap.data()?.mission) {
              setData((prev) => ({ ...prev, ...docSnap.data().mission }));
            }
          },
          (error) => {
            console.warn("Firestore listener error, using static fallback:", error);
          }
        );
      }
    } catch (e) {
      console.warn("Firebase initialization error, using static fallback:", e);
    }

    return () => unsub();
  }, []);

  return (
    <div className="bg-[#FAF8F4] text-[#52607A] font-sans antialiased selection:bg-[#B8892B] selection:text-white overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section
        ref={heroRef}
        className="relative min-h-[55vh] md:min-h-[60vh] flex items-center justify-center bg-[#142440] overflow-hidden px-6 py-20 md:py-28"
      >
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070"
            alt="Mission Background"
            fill
            priority
            className="object-cover opacity-20 filter contrast-125 brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#142440] via-[#142440]/60 to-transparent" />
        </div>

        <div
          className={`relative z-10 max-w-7xl mx-auto w-full text-center transition-all duration-700 ease-out ${
            heroVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          {/* Eyebrow */}
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#E9DCBD] block mb-4">
            {data.eyebrow}
          </span>

          {/* Serif Headline */}
          <h1 className="font-serif italic text-5xl md:text-7xl lg:text-8xl text-white font-normal tracking-tight">
            The <span className="text-[#E9DCBD]">Mission</span>
          </h1>
        </div>
      </section>

      {/* 2. MISSION STATEMENT */}
      <section
        ref={missionRef}
        className="py-20 md:py-28 max-w-7xl mx-auto px-6 md:px-10"
      >
        <div
          className={`grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center transition-all duration-700 ease-out ${
            missionVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          {/* Left Column: Mission Narrative */}
          <div className="lg:col-span-7 space-y-6">
            {/* 3-Tier Opening Sequence */}
            <div className="space-y-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#B8892B] block">
                Core Directive
              </span>
              <h2 className="font-serif text-3xl md:text-5xl text-[#142440] leading-tight font-normal">
                Empowering every student to{" "}
                <span className="italic">reach higher</span> and dream bigger.
              </h2>
            </div>

            <p className="font-sans text-base md:text-lg text-[#52607A] leading-relaxed border-t border-[#E4DFD3] pt-6">
              {data.description}
            </p>

            {/* List System with Icon-in-a-Ring */}
            <ul className="space-y-4 pt-2">
              {data.highlights.map((item, i) => (
                <li key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full border border-[#E4DFD3] flex items-center justify-center text-[#B8892B] bg-white shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#142440] font-semibold">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Imagery with Embedded Stat Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-square bg-[#F1ECE1] rounded-[24px] overflow-hidden border border-[#E4DFD3]">
              <Image
                src="https://res.cloudinary.com/db6ssceun/image/upload/v1766151252/lywz5x0c1sqx5dmsxs0c.jpg"
                alt="Student Life"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>

            {/* Stat Overlay Badge */}
            <div className="mt-4 md:mt-0 md:absolute md:-bottom-8 md:-left-8 bg-white p-6 md:p-8 rounded-[20px] border border-[#E4DFD3] max-w-xs shadow-sm">
              <span className="font-serif italic text-4xl md:text-5xl text-[#142440] block mb-1">
                {data.statsValue}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#52607A] block">
                {data.statsLabel}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE VALUES SECTION */}
      <section
        ref={valuesRef}
        className="py-20 md:py-28 bg-[#142440] text-white my-12"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div
            className={`text-center max-w-2xl mx-auto mb-16 transition-all duration-700 ease-out ${
              valuesVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#E9DCBD] block mb-3">
              Guiding Principles
            </span>
            <h2 className="font-serif italic text-4xl md:text-6xl font-normal text-white mb-4">
              Core <span className="text-[#E9DCBD]">Values</span>
            </h2>
            <p className="font-sans text-base text-[#FAF8F4]/80">
              The foundational pillars that guide our institutional culture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coreValues.map((value, i) => {
              const IconComponent = value.icon;
              return (
                <div
                  key={i}
                  className={`bg-[#142440] border border-[#E4DFD3]/20 rounded-[24px] p-8 md:p-10 transition-all duration-500 ease-out hover:border-[#B8892B]/50 ${
                    valuesVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                  style={{
                    transitionDelay: valuesVisible ? `${i * 100}ms` : "0ms",
                  }}
                >
                  {/* Icon-in-a-Ring Motif */}
                  <div className="w-12 h-12 rounded-full border border-[#E4DFD3]/30 flex items-center justify-center text-[#E9DCBD] bg-white/5 mb-8">
                    <IconComponent size={22} />
                  </div>

                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#E9DCBD] block mb-2">
                    0{i + 1}
                  </span>

                  <h3 className="font-serif text-2xl text-white font-normal mb-4">
                    {value.title}
                  </h3>

                  <p className="font-sans text-sm text-[#FAF8F4]/70 leading-relaxed">
                    {value.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}