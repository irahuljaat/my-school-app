"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebase/config";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import Image from "next/image";
import { Mail, GraduationCap, ArrowRight, UserCheck } from "lucide-react";

// IntersectionObserver hook for lightweight scroll animations
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
      { threshold: 0.12 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}

// Default Static Fallbacks for Instant Loading (8 Items Default)
const DEFAULT_CONFIG = {
  email: "mvgschooljaipur@gmail.com",
};

const DEFAULT_TEACHERS = [
  {
    id: "f1",
    name: "Dr. Aris Thorne",
    subjectsTaught: "Physics & Astronomy",
    qualification: "Ph.D. Quantum Mechanics",
  },
  {
    id: "f2",
    name: "Elena Rostova",
    subjectsTaught: "Literature & Arts",
    qualification: "M.A. Comparative Literature",
  },
  {
    id: "f3",
    name: "Marcus Sterling",
    subjectsTaught: "Advanced Mathematics",
    qualification: "M.Sc. Pure Mathematics",
  },
  {
    id: "f4",
    name: "Dr. Sarah Chen",
    subjectsTaught: "Computer Science",
    qualification: "Ph.D. Artificial Intelligence",
  },
  {
    id: "f5",
    name: "Robert Vance",
    subjectsTaught: "World History",
    qualification: "M.A. History",
  },
  {
    id: "f6",
    name: "Priya Sharma",
    subjectsTaught: "Chemistry",
    qualification: "M.Sc. Organic Chemistry",
  },
  {
    id: "f7",
    name: "David Miller",
    subjectsTaught: "Physical Education",
    qualification: "B.P.Ed. Sports Science",
  },
  {
    id: "f8",
    name: "Sophia Martinez",
    subjectsTaught: "Biological Sciences",
    qualification: "M.Sc. Biotechnology",
  },
];

// Helper to extract initials for fallback display when no image exists in DB
function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function FacultyAndCareersPage() {
  const [data, setData] = useState(DEFAULT_CONFIG);
  const [teachers, setTeachers] = useState(DEFAULT_TEACHERS);

  // Animation Refs
  const [heroRef, heroVisible] = useReveal();
  const [facultyRef, facultyVisible] = useReveal();
  const [careersRef, careersVisible] = useReveal();

  useEffect(() => {
    let unsubConfig = () => {};
    let unsubTeachers = () => {};

    try {
      if (db) {
        unsubConfig = onSnapshot(
          doc(db, "site_data", "config"),
          (docSnap) => {
            if (docSnap.exists()) {
              setData((prev) => ({ ...prev, ...docSnap.data() }));
            }
          },
          (err) => console.warn("Config listener fallback:", err)
        );

        const teachersQuery = query(
          collection(db, "teachers"),
          where("status", "==", "Active")
        );

        unsubTeachers = onSnapshot(
          teachersQuery,
          (snapshot) => {
            if (!snapshot.empty) {
              const teachersList = snapshot.docs.map((docItem) => ({
                id: docItem.id,
                ...docItem.data(),
              }));

              const sortedTeachers = teachersList.sort(
                (a, b) => Number(a.srNo || 0) - Number(b.srNo || 0)
              );
              // Set all teachers from DB without limiting
              setTeachers(sortedTeachers);
            }
          },
          (err) => console.warn("Teachers listener fallback:", err)
        );
      }
    } catch (e) {
      console.warn("Firebase connection error, showing default personnel:", e);
    }

    return () => {
      unsubConfig();
      unsubTeachers();
    };
  }, []);

  return (
    <div className="bg-[#FAF8F4] text-[#52607A] font-sans antialiased selection:bg-[#B8892B] selection:text-white overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section
        ref={heroRef}
        className="relative min-h-[45vh] md:min-h-[50vh] flex items-center justify-center bg-[#142440] overflow-hidden px-6 py-20"
      >
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#142440]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#142440] via-[#142440]/60 to-transparent" />
        </div>

        <div
          className={`relative z-10 max-w-7xl mx-auto w-full text-center transition-all duration-700 ease-out ${
            heroVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#E9DCBD] block mb-4">
            Academic Excellence & Mentorship
          </span>

          <h1 className="font-serif italic text-5xl md:text-7xl lg:text-8xl text-white font-normal tracking-tight">
            Our <span className="text-[#E9DCBD]">People</span>
          </h1>
        </div>
      </section>

      {/* 2. FACULTY GRID SECTION */}
      <section
        ref={facultyRef}
        className="py-20 md:py-28 max-w-7xl mx-auto px-6 md:px-10"
      >
        <div
          className={`mb-16 transition-all duration-700 ease-out ${
            facultyVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#B8892B] block mb-2">
            Pedagogical Leadership
          </span>
          <h2 className="font-serif text-3xl md:text-5xl text-[#142440] font-normal">
            Core Academic Team
          </h2>
          <div className="h-[1px] w-24 bg-[#E4DFD3] mt-6" />
        </div>

        {/* Dynamic Grid - Renders all personnel dynamically */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {teachers.map((member, i) => (
            <div
              key={member.id}
              className={`group transition-all duration-700 ease-out ${
                facultyVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{
                transitionDelay: facultyVisible ? `${(i % 8) * 75}ms` : "0ms",
              }}
            >
              {/* Image Container or Initial Monogram Avatar */}
              <div className="relative aspect-[3/4] overflow-hidden rounded-[24px] bg-[#F1ECE1] mb-5 border border-[#E4DFD3] shadow-sm flex items-center justify-center">
                {member.imageUrl ? (
                  <>
                    <Image
                      src={member.imageUrl}
                      alt={member.name || "Faculty Member"}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#142440]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 rounded-full border border-[#E4DFD3] flex items-center justify-center text-[#B8892B] bg-white mb-3 shadow-xs font-serif text-xl italic">
                      {getInitials(member.name)}
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#52607A]">
                      MVG Faculty
                    </span>
                  </div>
                )}
              </div>

              {/* Text Card Metadata */}
              <div className="space-y-1">
                <h3 className="font-serif text-xl text-[#142440] font-normal leading-snug group-hover:text-[#B8892B] transition-colors duration-300">
                  {member.name}
                </h3>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#B8892B] font-semibold">
                  {member.subjectsTaught || "Faculty"}
                </p>
                {member.qualification && (
                  <p className="font-sans text-xs text-[#52607A] pt-1">
                    {member.qualification}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CAREERS SECTION */}
      <section
        id="careers"
        ref={careersRef}
        className="py-20 md:py-28 bg-[#142440] text-white border-t border-[#E4DFD3]/20 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
          <div
            className={`grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center transition-all duration-700 ease-out ${
              careersVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#E9DCBD] block">
                Join The Legacy
              </span>

              <h2 className="font-serif text-4xl md:text-6xl font-normal leading-tight">
                Careers at <br />
                <span className="italic text-[#E9DCBD]">MVG Public School</span>
              </h2>

              <p className="font-sans text-base md:text-lg text-[#FAF8F4]/80 leading-relaxed max-w-xl">
                We are constantly looking for visionaries, educators, and leaders
                who want to shape the next generation of global citizens in an
                environment that values academic integrity and character.
              </p>

              {/* Key Highlights */}
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#E4DFD3]/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-[#E4DFD3]/30 flex items-center justify-center text-[#E9DCBD] bg-white/5 shrink-0">
                    <GraduationCap size={16} />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#FAF8F4]">
                    Academic Mentorship
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-[#E4DFD3]/30 flex items-center justify-center text-[#E9DCBD] bg-white/5 shrink-0">
                    <UserCheck size={16} />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#FAF8F4]">
                    Collaborative Culture
                  </span>
                </div>
              </div>
            </div>

            {/* Right Contact Card */}
            <div className="lg:col-span-5">
              <div className="bg-[#FAF8F4] text-[#142440] p-8 md:p-10 rounded-[28px] border border-[#E4DFD3] shadow-lg space-y-6">
                <div className="w-12 h-12 rounded-full border border-[#E4DFD3] flex items-center justify-center text-[#B8892B] bg-white">
                  <Mail size={20} />
                </div>

                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#B8892B] block mb-2 font-semibold">
                    General Recruitment Inquiry
                  </span>
                  <h3 className="font-serif text-2xl font-normal mb-3 text-[#142440]">
                    Submit Your Dossier
                  </h3>
                  <p className="font-sans text-sm text-[#52607A] leading-relaxed">
                    Send your CV and a statement of educational philosophy directly
                    to our administration office.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E4DFD3]">
                  <a
                    href={`mailto:${data.email}`}
                    className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] font-semibold text-[#142440] hover:text-[#B8892B] transition-colors group"
                  >
                    <span>{data.email}</span>
                    <ArrowRight
                      size={14}
                      className="transition-transform duration-300 group-hover:translate-x-1 text-[#B8892B]"
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}