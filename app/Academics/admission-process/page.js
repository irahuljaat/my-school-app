"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config'; 
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { 
  Phone, Mail, MapPin, Facebook, Instagram, Youtube ,
  FileText, CheckCircle2, UserCheck, Calendar, ArrowRight, Sparkles 
} from 'lucide-react';

export default function AdmissionProcedurePage() {
  const [configData, setConfigData] = useState(null);
  const [loading, setLoading] = useState(true);

  const activeSession = "2026-27";

  useEffect(() => {
    async function fetchData() {
      try {
        const configSnap = await getDoc(doc(db, "site_data", "config"));
        if (configSnap.exists()) setConfigData(configSnap.data());
      } catch (error) {
        console.error("Error fetching config data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const admissionSteps = [
    {
      step: "01",
      title: "Online Inquiry & Registration",
      desc: "Fill out the preliminary registration form online or visit the campus admission office to register student details for session " + activeSession + ".",
      timeline: "Starts March 2026"
    },
    {
      step: "02",
      title: "Document Submission",
      desc: "Submit previous academic transcripts, birth certificate, transfer certificate (TC), and passport-size photographs of the student and parents.",
      timeline: "Within 5 days of registration"
    },
    {
      step: "03",
      title: "Interaction & Assessment",
      desc: "An informal interaction session for primary classes or a baseline assessment test for middle and senior classes with the academic panel.",
      timeline: "Scheduled via Email/SMS"
    },
    {
      step: "04",
      title: "Admission Offer & Fee Payment",
      desc: "Upon successful clearance of the assessment, an admission offer letter is issued. Secure the seat by paying the requisite admission and tuition fees.",
      timeline: "Within 3 days of offer"
    }
  ];

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FAF8F4] italic font-light tracking-widest text-[#52607A] uppercase text-[10px]">
      Loading Admission Guidelines...
    </div>
  );

  return (
    <div className="bg-[#FAF8F4] text-[#142440] antialiased selection:bg-[#B8892B] selection:text-white">
      
      {/* --- TOP CONTACT BAR --- */}
            <div className="hidden lg:block bg-[#142440] text-[#E9DCBD] py-3 relative z-[110] border-b border-[#E4DFD3]">
              <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.32em]">
                <div className="flex gap-8">
                  <span className="flex items-center gap-2 hover:text-white transition-colors">
                    <Phone size={12} className="text-[#B8892B]" /> { "+91 141 3152600"}
                  </span>
                  <span className="flex items-center gap-2 hover:text-white transition-colors">
                    <Mail size={12} className="text-[#B8892B]" /> {"mvgschooljaipur@gmail.com"}
                  </span>
                </div>
                <div className="flex gap-6 items-center">
                  <span className="flex items-center gap-2">
                    <MapPin size={12} className="text-[#B8892B]" /> Jaipur, Rajasthan
                  </span>
                 <div className="flex gap-4 border-l border-[#E4DFD3]/20 pl-6">
        <a href="https://www.facebook.com/mvgpublicschool" target="_blank" rel="noopener noreferrer">
          <Facebook size={14} className="hover:text-[#B8892B] cursor-pointer transition-colors" />
        </a>
        <a href="https://www.instagram.com/mvgpublicschool/" target="_blank" rel="noopener noreferrer">
          <Instagram size={14} className="hover:text-[#B8892B] cursor-pointer transition-colors" />
        </a>
        <a href="https://www.youtube.com/mvgschool" target="_blank" rel="noopener noreferrer">
          <Youtube size={14} className="hover:text-[#B8892B] cursor-pointer transition-colors" />
        </a>
      </div>
                </div>
              </div>
            </div>

      {/* --- HERO SECTION WITH FULL BACKGROUND IMAGE --- */}
      <section className="relative py-28 md:py-36 px-8 overflow-hidden bg-[#142440]">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://res.cloudinary.com/db6ssceun/image/upload/v1786808153/rwf0gslfmd3vza0esjsr.jpg" 
            alt="Admission Background" 
            className="w-full h-full object-cover opacity-35 scale-105 transform" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#142440] via-[#142440]/90 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="max-w-2xl">
            <span className="text-[10px] font-mono uppercase tracking-[0.32em] text-[#B8892B] mb-6 block">
              Session {activeSession} Admissions Open
            </span>
            <h1 className="text-5xl md:text-[6.5rem] font-serif font-bold tracking-tight text-white leading-[1.05] mb-8">
              Admission <span className="italic font-light text-[#E9DCBD]">Procedure</span>
            </h1>
            <p className="text-[#E9DCBD] text-lg font-light leading-relaxed">
              We welcome inquisitive minds and future leaders. Follow our structured, transparent enrollment process for the academic session {activeSession}.
            </p>
          </div>
        </div>
      </section>

      {/* --- STEP-BY-STEP WORKFLOW SECTION --- */}
      <section className="py-20 md:py-28 px-8 bg-[#F1ECE1]">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[10px] font-mono uppercase tracking-[0.32em] text-[#B8892B] mb-3 block">
              Enrollment Workflow
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#142440]">
              How to <span className="italic font-light text-[#52607A]">Apply</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {admissionSteps.map((item, index) => (
              <div 
                key={index} 
                className="bg-white border border-[#E4DFD3] rounded-[24px] p-8 flex flex-col justify-between hover:border-[#B8892B] transition-all shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-2xl font-serif font-bold text-[#B8892B]">{item.step}</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 bg-[#FAF8F4] rounded-full border border-[#E4DFD3] text-[#52607A]">
                      {item.timeline}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#142440] mb-3">
                    {item.title}
                  </h3>
                  <p className="text-[#52607A] text-xs font-light leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-[#E4DFD3] flex items-center justify-between text-[10px] font-mono text-[#B8892B] uppercase tracking-widest">
                  <span>Step {item.step} of 04</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>

          {/* --- TABULAR OVERVIEW SECTION --- */}
          <div className="bg-white border border-[#E4DFD3] rounded-[24px] overflow-hidden shadow-sm">
            <div className="p-8 bg-[#FAF8F4] border-b border-[#E4DFD3] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#142440]">Admission Checklist & Guidelines</h3>
                <p className="text-[#52607A] text-xs font-light mt-1">Summary table of eligibility requirements and mandatory documents.</p>
              </div>
              <span className="px-4 py-2 bg-[#142440] text-white rounded-[16px] text-[10px] font-mono uppercase tracking-[0.2em]">
                Session {activeSession}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F4]/50 border-b border-[#E4DFD3] text-[10px] font-mono uppercase tracking-[0.32em] text-[#52607A]">
                    <th className="py-5 px-6">Class Group</th>
                    <th className="py-5 px-6">Age Criteria (As of March 31)</th>
                    <th className="py-5 px-6">Evaluation Mode</th>
                    <th className="py-5 px-6">Required Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4DFD3] text-xs font-light text-[#142440]">
                  <tr className="hover:bg-[#FAF8F4]/50 transition-colors">
                    <td className="py-5 px-6 font-serif font-bold text-sm text-[#142440]">Kindergarten (Pre-Primary)</td>
                    <td className="py-5 px-6 font-mono text-xs text-[#52607A]">3+ to 5+ Years</td>
                    <td className="py-5 px-6 font-mono text-[10px] uppercase tracking-widest text-[#B8892B]">Observation Session</td>
                    <td className="py-5 px-6 text-[#52607A]">Birth Certificate, Passport Photos</td>
                  </tr>
                  <tr className="hover:bg-[#FAF8F4]/50 transition-colors">
                    <td className="py-5 px-6 font-serif font-bold text-sm text-[#142440]">Primary (Classes I - V)</td>
                    <td className="py-5 px-6 font-mono text-xs text-[#52607A]">6+ to 10+ Years</td>
                    <td className="py-5 px-6 font-mono text-[10px] uppercase tracking-widest text-[#B8892B]">Interaction & Basic Test</td>
                    <td className="py-5 px-6 text-[#52607A]">Previous Report Card, Birth Certificate, T.C , Passport Size Photo</td>
                  </tr>
                  <tr className="hover:bg-[#FAF8F4]/50 transition-colors">
                    <td className="py-5 px-6 font-serif font-bold text-sm text-[#142440]">Middle & Senior (Classes VI - XII)</td>
                    <td className="py-5 px-6 font-mono text-xs text-[#52607A]">11+ to 17+ Years</td>
                    <td className="py-5 px-6 font-mono text-[10px] uppercase tracking-widest text-[#B8892B]">Entrance Examination</td>
                    <td className="py-5 px-6 text-[#52607A]">Original TC, Report Cards (Last 2 Years)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}