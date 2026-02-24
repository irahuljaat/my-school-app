"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from './components/Navbar';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from './firebase/config'; 
import { 
  HiOutlineAcademicCap, HiOutlineCpuChip, HiOutlineCheckBadge, 
  HiOutlineBeaker, HiOutlineGlobeAlt, HiOutlinePhone, 
  HiOutlineMapPin, HiOutlineEnvelope, HiOutlineXMark, 
  HiOutlineMegaphone, HiOutlineArrowRight, HiOutlineStar, 
  HiOutlineUserGroup, HiOutlineLightBulb, HiOutlineShieldCheck,
  HiOutlineSparkles, HiOutlineMicrophone, HiOutlineCommandLine,
  HiOutlineClock, HiOutlineBookOpen, HiOutlineChartBar
} from 'react-icons/hi2';

const db = getFirestore(app);

export default function HomePage() {
  const [siteData, setSiteData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "mainWebsite", "config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setSiteData(docSnap.data());
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-serif italic text-slate-500">Synchronizing Excellence...</p>
      </div>
    </div>
  );

  return (
    <div className="relative flex flex-col w-full bg-white font-sans overflow-x-hidden selection:bg-indigo-600 selection:text-white">
      <Navbar />

      {/* 1. HERO SECTION (ULTRA PREMIUM) */}
      <section className="relative h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src="https://res.cloudinary.com/db6ssceun/image/upload/v1766659018/DSC_0385_aojhyi.jpg" alt="MVG" fill className="object-cover brightness-[0.3] scale-105 animate-slow-zoom" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="animate-fade-in-up space-y-6">
            <h1 className="text-7xl md:text-[10rem] font-black text-white leading-[0.8] tracking-tighter">
              The <span className="text-indigo-500 italic font-serif">MVG</span> <br/>Standard.
            </h1>
            <p className="text-xl text-slate-300 max-w-xl font-medium leading-relaxed">{siteData?.hero?.subtitle}</p>
            <div className="flex flex-wrap gap-6 pt-6">
              <Link href="/Admission/apply" className="px-12 py-6 bg-white text-slate-900 rounded-full font-black uppercase text-xs tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-2xl">Start Admission</Link>
              <Link href="/About" className="px-12 py-6 border border-white/30 text-white rounded-full font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">Explore Campus</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DYNAMIC NEWS MARQUEE */}
      <div className="bg-slate-900 py-6 overflow-hidden whitespace-nowrap border-y border-white/5 relative z-30">
        <div className="flex animate-marquee gap-16 items-center">
          {[1,2,3,4].map(i => (
            <span key={i} className="text-indigo-400 font-black uppercase tracking-[0.4em] text-[11px] flex items-center gap-6">
              <HiOutlineMegaphone className="text-white" /> {siteData?.notice || "Admissions Open for 2026-27"}
            </span>
          ))}
        </div>
      </div>

      {/* 3. CORE STATS GRID */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          {siteData?.stats?.map((s, i) => (
            <div key={i} className="text-center group">
              <h3 className="text-7xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors">{s.value}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 group-hover:tracking-[0.5em] transition-all">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. MISSION PILLARS */}
      <section className="py-24 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-1px bg-slate-200 border border-slate-200 rounded-[3rem] overflow-hidden">
            <FeatureCard title="Academic Rigor" icon={<HiOutlineAcademicCap />} desc="RBSE Excellence with a global perspective." color="bg-white" />
            <FeatureCard title="Innovation Lab" icon={<HiOutlineCommandLine />} desc="Where coding meets physical computing." color="bg-white" />
            <FeatureCard title="Ethics & Values" icon={<HiOutlineShieldCheck />} desc="Building leaders with strong moral fiber." color="bg-white" />
        </div>
      </section>

      {/* 5. ROBOTICS DEEP DIVE */}
      <section className="py-32 bg-white px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
          <div className="relative aspect-square rounded-[4rem] overflow-hidden shadow-2xl">
            <Image src="https://res.cloudinary.com/db6ssceun/image/upload/v1766670728/WhatsApp_Image_2025-12-25_at_19.21.37_rd3idi.jpg" fill className="object-cover" alt="Robotics" />
          </div>
          <div className="space-y-8 text-left">
             <h6 className="text-indigo-600 font-black uppercase tracking-widest text-xs">Innovation Hub</h6>
             <h2 className="text-6xl font-black text-slate-900 leading-none">The Future is <br/>Hands-On.</h2>
             <p className="text-slate-600 text-lg font-medium italic">Our students don't just use technology; they build it.</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {['Drone Research', 'IoT Development', 'AI Modeling', 'Robo-Soccer'].map(t => (
                 <div key={t} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl font-bold border border-slate-100 hover:border-indigo-600 transition-colors">{t}</div>
               ))}
             </div>
          </div>
        </div>
      </section>

      {/* 6. FACULTY SPOTLIGHT (NEW) */}
      <section className="py-24 bg-slate-900 text-white rounded-[5rem] mx-4">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center text-left">
          <div className="space-y-6">
            <h2 className="text-5xl font-black italic font-serif tracking-tighter leading-none">Mentors, Not <br/>Just Teachers.</h2>
            <p className="text-slate-400 text-lg">Our faculty consists of PhD holders and Industry Experts dedicated to student success.</p>
            <Link href="/About" className="inline-block border-b-2 border-indigo-500 pb-2 font-black uppercase text-xs tracking-widest">Meet the Team</Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-64 bg-white/5 rounded-3xl" />
            <div className="h-64 bg-white/5 rounded-3xl mt-12" />
          </div>
        </div>
      </section>

      {/* 7. DAILY SCHEDULE PREVIEW (NEW) */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-left">
          <h4 className="text-4xl font-black mb-12">A Day at MVG.</h4>
          <div className="space-y-4">
            <ScheduleRow time="08:00 AM" activity="Morning Assembly & Ethics Circle" />
            <ScheduleRow time="10:30 AM" activity="Core Academic Modules" />
            <ScheduleRow time="01:30 PM" activity="Innovation & Robotics Hour" />
            <ScheduleRow time="03:00 PM" activity="Sports & Co-Curriculars" />
          </div>
        </div>
      </section>

      {/* 8. DIRECTOR'S VISION */}
      <section className="py-32 bg-indigo-50/50">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-10">
          <HiOutlineSparkles className="mx-auto text-indigo-600" size={48} />
          <h3 className="text-4xl md:text-5xl font-serif italic text-slate-800 leading-tight">"We are committed to providing an environment where every student can achieve their personal best."</h3>
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-600 p-1">
               <Image src="https://res.cloudinary.com/db6ssceun/image/upload/v1766668773/DSC_1002_zazos5.jpg" width={80} height={80} className="rounded-full object-cover aspect-square" alt="Director" />
            </div>
            <p className="font-black uppercase text-xs tracking-[0.3em] text-slate-500">{siteData?.principal?.designation || "Director"}</p>
          </div>
        </div>
      </section>

      {/* 9. ACADEMIC EXCELLENCE BOARD (NEW) */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 text-left">
          <div className="flex justify-between items-end mb-16">
            <h2 className="text-5xl font-black tracking-tighter">Academic <br/>Distinction.</h2>
            <HiOutlineChartBar size={64} className="text-indigo-100" />
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <ResultCard year="2025" title="98% Board Results" />
            <ResultCard year="2024" title="Distinction in Science" />
            <ResultCard year="2023" title="100% Pass Percentage" />
            <ResultCard year="2022" title="State Rank Holders" />
          </div>
        </div>
      </section>

      {/* 10. GALLERY MASONRY */}
      <section className="py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 max-w-[1600px] mx-auto">
          <div className="h-[500px] bg-slate-100 rounded-[3rem] overflow-hidden relative group">
            <Image src="https://res.cloudinary.com/db6ssceun/image/upload/v1766659018/DSC_0385_aojhyi.jpg" fill className="object-cover transition-transform group-hover:scale-110" alt="G1" />
          </div>
          <div className="h-[500px] bg-slate-100 rounded-[3rem] mt-12 overflow-hidden relative group">
            <Image src="https://res.cloudinary.com/db6ssceun/image/upload/v1766670728/WhatsApp_Image_2025-12-25_at_19.21.37_rd3idi.jpg" fill className="object-cover transition-transform group-hover:scale-110" alt="G2" />
          </div>
          <div className="h-[500px] bg-slate-100 rounded-[3rem] overflow-hidden relative group">
            <Image src="https://res.cloudinary.com/db6ssceun/image/upload/v1766670728/WhatsApp_Image_2025-12-25_at_19.21.37_rd3idi.jpg" fill className="object-cover transition-transform group-hover:scale-110" alt="G3" />
          </div>
          <div className="h-[500px] bg-slate-100 rounded-[3rem] mt-12 overflow-hidden relative group">
            <Image src="https://res.cloudinary.com/db6ssceun/image/upload/v1766670728/WhatsApp_Image_2025-12-25_at_19.21.37_rd3idi.jpg" fill className="object-cover transition-transform group-hover:scale-110" alt="G4" />
          </div>
        </div>
      </section>

      {/* 11. BEYOND THE CLASSROOM */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
           <ActivityItem title="Athletics" />
           <ActivityItem title="Coding" />
           <ActivityItem title="Music" />
           <ActivityItem title="Debate" />
        </div>
      </section>

      {/* 12. PARENT TESTIMONIALS */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white p-20 rounded-[4rem] shadow-xl relative text-left">
            <HiOutlineStar size={64} className="text-yellow-400 mb-8" />
            <p className="text-3xl font-medium text-slate-700 italic leading-relaxed">"The blend of RBSE curriculum with such advanced technology is something we couldn't find anywhere else in Jaipur."</p>
            <div className="mt-12">
              <p className="font-black uppercase tracking-widest text-sm">Mr. Rajesh Gupta</p>
              <p className="text-indigo-600 font-bold text-xs uppercase">Entrepreneur & Parent</p>
            </div>
          </div>
        </div>
      </section>

      {/* 13. ADMISSION STEPS (NEW) */}
      <section className="py-24 bg-white text-left">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-black mb-16">Simple Enrollment.</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <Step number="01" title="Inquire Online" />
            <Step number="02" title="Campus Tour" />
            <Step number="03" title="Assessment" />
          </div>
        </div>
      </section>

      {/* 14. TRANSPORT & SAFETY */}
      <section className="py-24 bg-indigo-600 text-white rounded-[4rem] mx-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-left space-y-4">
            <h4 className="text-4xl font-black">Safety First. Always.</h4>
            <p className="text-indigo-100 max-w-md">Our campus is under 24/7 CCTV surveillance with GPS-enabled transport for all students.</p>
          </div>
          <div className="flex gap-6">
             <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-xl border border-white/20 font-black uppercase text-xs tracking-widest">GPS Tracking</div>
             <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-xl border border-white/20 font-black uppercase text-xs tracking-widest">CCTV Guard</div>
          </div>
        </div>
      </section>

      {/* 15. NEWS & BLOG PREVIEW */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center mb-16">
          <h2 className="text-4xl font-black">School News</h2>
          <Link href="/news" className="font-black text-indigo-600 border-b-2 border-indigo-600">View All</Link>
        </div>
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8 text-left">
          <NewsCard title="Inter-School Robotics Winner" date="Feb 2026" />
          <NewsCard title="Annual Sports Meet Success" date="Jan 2026" />
          <NewsCard title="New Science Lab Inauguration" date="Dec 2025" />
        </div>
      </section>

      {/* 16. ALUMNI NETWORK */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-8 italic font-serif text-slate-400">Where our students go...</h2>
          <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale">
            {['IIT DELHI', 'BITS PILANI', 'NIT JAIPUR', 'DU'].map(u => (
              <span key={u} className="text-2xl font-black">{u}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 17. QUICK LINKS HUB */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
           <Link href="/portal" className="p-10 bg-slate-50 rounded-[2rem] hover:bg-indigo-50 transition-colors font-black uppercase text-[10px] tracking-widest text-center">Student Portal</Link>
           <Link href="/calendar" className="p-10 bg-slate-50 rounded-[2rem] hover:bg-indigo-50 transition-colors font-black uppercase text-[10px] tracking-widest text-center">School Calendar</Link>
           <Link href="/careers" className="p-10 bg-slate-50 rounded-[2rem] hover:bg-indigo-50 transition-colors font-black uppercase text-[10px] tracking-widest text-center">Join the Team</Link>
           <Link href="/contact" className="p-10 bg-slate-50 rounded-[2rem] hover:bg-indigo-50 transition-colors font-black uppercase text-[10px] tracking-widest text-center">Global Map</Link>
        </div>
      </section>

      {/* 18. FINAL CTA */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto bg-slate-900 rounded-[5rem] p-24 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/30 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-10">Start Your Story.</h2>
          <Link href="/Admission/apply" className="inline-block bg-indigo-600 text-white px-12 py-6 rounded-full font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl">Apply Online</Link>
        </div>
      </section>

      {/* 19. MEGA FOOTER */}
      <footer className="bg-white pt-24 pb-12 text-left relative z-10 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-20 pb-20 border-b border-slate-100">
          <div className="col-span-2 space-y-8">
            <h2 className="text-3xl font-black tracking-tighter italic">MVG SCHOOL.</h2>
            <p className="text-slate-400 max-w-sm">Jaipur's premier institution for modern education and technical mastery.</p>
          </div>
          <div className="space-y-6">
            <h6 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Quick Links</h6>
            <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-slate-900">
              <li><Link href="/About">Our Mission</Link></li>
              <li><Link href="/Academics">Academic Tracks</Link></li>
              <li><Link href="/Admission">Admission Portal</Link></li>
              <li><Link href="/contact">Campus Tour</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h6 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Connect</h6>
            <p className="text-sm font-medium text-slate-500">{siteData?.contact?.address}</p>
            <p className="text-sm font-bold text-slate-900">{siteData?.contact?.phone}</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-12 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.5em] text-slate-400">
           <span>© 2026 MVG SCHOOL JAIPUR</span>
           <span>Crafting Future Leaders</span>
        </div>
      </footer>
    </div>
  );
}

// Sub-components for better organization
function FeatureCard({ title, icon, desc, color }) {
  return (
    <div className={`${color} p-16 flex flex-col items-start space-y-6 group hover:bg-indigo-600 transition-all duration-700`}>
      <div className="w-12 h-12 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-white/20 group-hover:text-white transition-all">
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <h3 className="text-3xl font-black text-slate-900 group-hover:text-white tracking-tight">{title}</h3>
      <p className="text-slate-500 group-hover:text-indigo-100 font-medium">{desc}</p>
    </div>
  );
}

function ScheduleRow({ time, activity }) {
  return (
    <div className="flex items-center gap-8 py-8 border-b border-slate-100 hover:bg-slate-50 transition-colors px-4 group">
      <span className="text-indigo-600 font-black uppercase tracking-widest text-xs w-24 shrink-0">{time}</span>
      <span className="text-2xl font-black text-slate-900 group-hover:translate-x-4 transition-transform">{activity}</span>
    </div>
  );
}

function ResultCard({ year, title }) {
  return (
    <div className="p-10 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-600 transition-colors">
      <p className="text-indigo-600 font-black text-xs uppercase tracking-widest mb-2">{year}</p>
      <h4 className="text-xl font-black text-slate-900">{title}</h4>
    </div>
  );
}

function NewsCard({ title, date }) {
  return (
    <div className="space-y-4 group cursor-pointer">
      <div className="aspect-video bg-slate-100 rounded-3xl overflow-hidden" />
      <p className="text-indigo-600 font-black uppercase tracking-widest text-[10px]">{date}</p>
      <h5 className="text-xl font-black group-hover:text-indigo-600 transition-colors">{title}</h5>
    </div>
  );
}

function ActivityItem({ title }) {
  return (
    <div className="flex items-center gap-4 py-6 border-b border-slate-200 group cursor-pointer hover:border-indigo-600 transition-all">
       <div className="w-2 h-2 bg-indigo-600 rounded-full scale-0 group-hover:scale-100 transition-transform" />
       <span className="text-xl font-black uppercase tracking-tighter text-slate-800">{title}</span>
    </div>
  );
}

function Step({ number, title }) {
  return (
    <div className="space-y-4">
      <span className="text-5xl font-black text-indigo-100 block">{number}</span>
      <h4 className="text-2xl font-black text-slate-900">{title}</h4>
      <p className="text-slate-400 font-medium text-sm">Follow our streamlined process to secure your child's seat.</p>
    </div>
  );
}