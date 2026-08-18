"use client";

import React, { useEffect, useState, useRef } from "react";
import { db } from "../../../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { Quote, Award, ChevronDown, ArrowRight } from "lucide-react";

// Native reveal hook without external dependencies
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

// 1. DEFAULT DATA FALLBACK - Ensures page renders immediately even if Firebase fails
const DEFAULT_DIRECTOR_DATA = {
  directorName: "Kedar Mal Jat",
  role: "Director & Founder",
  qualifications: ["B.A, B.Ed", "25+ Years Experience"],
  quote: "Empowering students through innovation and integrity.",
  messageHeading: "Message from the Director",
  messageParagraphs: [
    "Education is the foundation upon which strong individuals and responsible societies are built. Our school was established with a deep commitment to nurturing young minds with knowledge, values, and discipline.",
    "A significant milestone in our journey came in 2010, when we transformed our institution into a complete English-medium school. This decision was driven by a clear vision—to prepare our students for a rapidly changing world while preserving the moral and cultural values that define us.",
    "Since then, we have continuously worked towards improving academic standards, modernizing infrastructure, and adopting innovative teaching methodologies. Our focus has always been on holistic development—academic excellence, character building, confidence, and lifelong learning.",
    "I firmly believe that every child has unique potential. We strive to provide a nurturing environment where students can grow into capable, confident, and responsible citizens.",
    "I welcome you to be a part of our journey as we continue to shape the future through quality education.",
  ],
  image: "https://res.cloudinary.com/db6ssceun/image/upload/v1772172686/1772172574607_mv0amq.png",
};

export default function DirectorDesk() {
  // Initialize with fallback data to prevent blank screen
  const [directorData, setDirectorData] = useState(DEFAULT_DIRECTOR_DATA);

  // Animation Refs
  const [heroRef, heroVisible] = useReveal();
  const [contentRef, contentVisible] = useReveal();

  useEffect(() => {
    let unsub = () => {};

    try {
      if (db) {
        unsub = onSnapshot(
          doc(db, "site_data", "config"),
          (docSnap) => {
            if (docSnap.exists() && docSnap.data()?.director) {
              setDirectorData((prev) => ({ ...prev, ...docSnap.data().director }));
            }
          },
          (error) => {
            console.warn("Firestore error, using default fallback data:", error);
          }
        );
      }
    } catch (e) {
      console.warn("Firebase configuration error, using default fallback data:", e);
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
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069"
            className="w-full h-full object-cover opacity-15 filter contrast-125 brightness-90"
            alt="Director Desk Background"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#142440] via-[#142440]/70 to-transparent" />
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
            Leadership & Vision
          </span>

          {/* Serif Headline */}
          <h1 className="font-serif italic text-5xl md:text-7xl lg:text-8xl text-white font-normal tracking-tight">
            Director's <span className="text-[#E9DCBD]">Desk</span>
          </h1>
        </div>
      </section>

      {/* 2. MAIN MESSAGE CONTENT */}
      <section
        ref={contentRef}
        className="py-20 md:py-28 max-w-7xl mx-auto px-6 md:px-10"
      >
        <div
          className={`grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start transition-all duration-700 ease-out ${
            contentVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          {/* Left Column: Image & Floating Quote */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
            <div className="relative">
              <div className="aspect-[4/5] bg-[#F1ECE1] rounded-[24px] overflow-hidden border border-[#E4DFD3] relative">
                <img
                  src={directorData.image}
                  className="w-full h-full object-cover filter contrast-[1.03]"
                  alt={directorData.directorName}
                />
              </div>

              {/* Floating Quote Card */}
              <div className="mt-4 md:mt-0 md:absolute md:-bottom-8 md:-right-6 bg-white p-6 md:p-8 rounded-[20px] border border-[#E4DFD3] max-w-xs shadow-sm">
                <div className="w-9 h-9 rounded-full border border-[#E4DFD3] flex items-center justify-center text-[#B8892B] bg-[#FAF8F4] mb-3">
                  <Quote size={18} />
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#52607A] leading-relaxed">
                  {directorData.quote}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Narrative Message */}
          <div className="lg:col-span-7 space-y-10">
            {/* 3-Tier Opening Rhythm */}
            <div className="space-y-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#B8892B] block">
                Official Statement
              </span>
              <h2 className="font-serif text-3xl md:text-5xl text-[#142440] leading-tight font-normal">
                Message from the <span className="italic">Director</span>
              </h2>
            </div>

            {/* Paragraph Content */}
            <div className="space-y-6 text-[#52607A] text-base md:text-lg leading-relaxed font-sans border-t border-[#E4DFD3] pt-8">
              {directorData.messageParagraphs.map((para, index) => (
                <p
                  key={index}
                  className={
                    index === 0
                      ? "font-serif italic text-xl md:text-2xl text-[#142440] leading-snug"
                      : ""
                  }
                >
                  {index === 0 ? `"${para}"` : para}
                </p>
              ))}
            </div>

            {/* Director Bio Box */}
            <div className="bg-[#F1ECE1] p-8 md:p-10 rounded-[24px] border border-[#E4DFD3] space-y-4">
              <div>
                <h3 className="font-serif text-2xl md:text-3xl text-[#142440] font-normal">
                  {directorData.directorName}
                </h3>
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#B8892B] mt-1">
                  {directorData.role}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E4DFD3] flex flex-wrap gap-6">
                {directorData.qualifications.map((qual, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-[#E4DFD3] flex items-center justify-center text-[#B8892B] bg-white">
                      <Award size={15} />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#52607A]">
                      {qual}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}