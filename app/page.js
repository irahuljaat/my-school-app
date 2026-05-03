'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../app/firebase/config'; // Adjust this path if your firebase file is elsewhere
import Link from 'next/link';
import Image from 'next/image';

import { doc, onSnapshot , getDocs, collection, query, orderBy, limit, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, Menu, X, Phone, Mail, MapPin, ArrowRight, CheckCircle, Briefcase,CheckCircle2, FileDown, Navigation, Loader2,
  GraduationCap, Users, BookOpen, Trophy, Calendar, Download, ChevronLeft, ChevronRight, Instagram, Facebook, Twitter, Youtube,
  Beaker, Star, ShieldCheck, Smartphone, MessageCircle, FileText, Camera, Globe , Compass
} from 'lucide-react';

// --- PERFORMANCE WRAPPER ---
const SectionWrapper = ({ children, id }) => (
  <motion.section
    id={id}
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.7, ease: "easeOut" }}
    className="py-12 px-6 overflow-hidden"
  >
    {children}
  </motion.section>
);

export default function MVGMainPortal() {

  

  const [sliderImages, setSliderImages] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  

  useEffect(() => {
    // 1. Fetch Slider Images
    const unsubSlides = onSnapshot(doc(db, "mainWebsite", "sliderImages"), (snap) => {
      if (snap.exists()) {
        setSliderImages(snap.data().urls || {});
      }
    });

    // 2. Fetch Stats from Config
    const unsubConfig = onSnapshot(doc(db, "mainWebsite", "config"), (snap) => {
      if (snap.exists()) {
        setStats(snap.data().stats || {});
      }
      setLoading(false);
    });

    return () => {
      unsubSlides();
      unsubConfig();
    };
  }, []);

  if (loading) {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
      <div className="relative flex items-center justify-center">
        {/* Outer Pulsing Ring */}
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-32 h-32 bg-blue-100 rounded-full"
        />
        
        {/* Middle Rotating Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute w-20 h-20 border-t-2 border-b-2 border-blue-600 rounded-full"
        />

        {/* Central Book Icon */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: [0.8, 1.1, 0.8] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative z-10 text-blue-600"
        >
          <GraduationCap size={40} strokeWidth={1.5} />
        </motion.div>
      </div>

      {/* Loading Text with "Typing" effect */}
      <div className="mt-12 overflow-hidden">
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="font-black text-slate-900 tracking-[0.4em] uppercase text-[10px]"
        >
          MVG <span className="text-blue-600">Public School</span>
        </motion.p>
        <div className="mt-2 h-[2px] w-full bg-slate-100 relative">
          <motion.div 
            initial={{ left: "-100%" }}
            animate={{ left: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 bottom-0 w-1/2 bg-blue-600"
          />
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="bg-[#F8FAFC] text-slate-900 selection:bg-blue-600 selection:text-white antialiased">
      <PromoPopup />
     
      
      {/* 1. SLIDES / HERO (Dynamic from Firebase) */}
      <HeroSlider images={sliderImages} /> 

      {/* 2. ABOUT SCHOOL + WELCOME */}
      <SectionWrapper id="about">
        <AboutSection />
      </SectionWrapper>



      {/* 3. VISION & MISSION + PROSPECTUS */}
      <SectionWrapper id="vision">
        <VisionProspectus />
      </SectionWrapper>

      {/* 4. ACADEMICS + CALENDAR */}
      <SectionWrapper id="academics">
        <AcademicsCalendar />
      </SectionWrapper>

      {/* 5. MESSAGE FROM DIRECTOR */}
      <SectionWrapper id="director">
        <DirectorMessage />
      </SectionWrapper>

      {/* 6. STATS (Dynamic from Firebase) */}
      <StatsSection statsData={stats} />

      {/* 7. COURSES / STREAMS */}
      <SectionWrapper id="streams">
        <StreamsSection />
      </SectionWrapper>

      {/* 8. GALLERY */}
      <SectionWrapper id="gallery">
        <GallerySection />
      </SectionWrapper>

      {/* 9. BLOG */}
      <SectionWrapper id="blog">
        <BlogSection />
      </SectionWrapper>

      {/* 10. DOWNLOAD APP 
      <SectionWrapper id="app">
        <DownloadAppSection />
      </SectionWrapper> */}

      {/* 11. CONTACT US */}
      <SectionWrapper id="contact">
        <ContactSection />
      </SectionWrapper>

      
    </div>
  );
}


const PromoPopup = () => {
  const [config, setConfig] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 1. Fetch Config from Firebase
  useEffect(() => {
    const fetchPopupSettings = async () => {
      try {
        const docRef = doc(db, "settings", "popup");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().active) {
          setConfig(docSnap.data());
          // Show popup after 2.5 seconds
          setTimeout(() => setIsOpen(true), 2500);
        }
      } catch (err) {
        console.error("Popup Config Error:", err);
      }
    };
    fetchPopupSettings();
  }, []);

  // 2. Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // PATH: settings (collection) -> popup (doc) -> leads (sub-collection)
      const leadsRef = collection(db, "settings", "popup", "leads");
      
      await addDoc(leadsRef, {
        ...formData,
        submittedAt: serverTimestamp(),
        device: window.innerWidth < 768 ? 'Mobile' : 'Desktop'
      });

      setIsSuccess(true);
      setTimeout(() => setIsOpen(false), 3000);
    } catch (err) {
      console.error("Submission Error:", err);
      alert("Submission failed. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !config) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Overlay */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" 
      />

      {/* Main Container */}
      <motion.div 
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        className="relative bg-white w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[450px]"
      >
        {/* Close Button */}
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-5 right-5 z-50 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-900 shadow-xl hover:bg-blue-600 hover:text-white transition-all"
        >
          <X size={20} />
        </button>

        {/* LEFT: IMAGE (Dynamic) */}
        {(config.type === 'image' || config.type === 'both') && (
          <div className={`${config.type === 'both' ? 'md:w-1/2' : 'w-full'} h-64 md:h-auto overflow-hidden`}>
            <img src={config.image} className="w-full h-full object-cover" alt="School Promotion" />
          </div>
        )}

        {/* RIGHT: CONTENT & FORM */}
        {(config.type === 'form' || config.type === 'both') && (
          <div className={`${config.type === 'both' ? 'md:w-1/2' : 'w-full'} p-8 md:p-12 flex flex-col justify-center`}>
            {isSuccess ? (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-slate-900 uppercase italic">Thank You!</h3>
                <p className="text-slate-500 font-medium mt-2">Our admissions team will contact you shortly.</p>
              </motion.div>
            ) : (
              <>
                <div className="mb-8">
                  <span className="text-blue-600 font-black uppercase tracking-[0.3em] text-[10px] mb-2 block">Exclusive Update</span>
                  <h3 className="text-3xl font-black text-slate-900 uppercase italic leading-tight">{config.title}</h3>
                  <p className="text-slate-500 text-sm mt-3 font-medium">{config.text}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {config.fields?.map((field, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-2 tracking-widest italic">{field.label}</label>
                      <input 
                        type={field.type || "text"}
                        required
                        placeholder={field.placeholder}
                        onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 ring-blue-600 font-bold text-slate-700 placeholder:text-slate-300"
                      />
                    </div>
                  ))}
                  
                  <button 
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                  >
                    {isSubmitting ? "Processing..." : "Submit Inquiry"}
                    {!isSubmitting && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};



// --- 1. HERO SLIDER (Optimized for Millisecond Loading) ---
const HeroSlider = ({ images }) => {
  const [current, setCurrent] = useState(0);

  // Memoize URLs to prevent unnecessary recalculations
  const imageUrls = useMemo(() => 
    Object.keys(images)
      .sort((a, b) => Number(a) - Number(b))
      .map(key => images[key]),
    [images]
  );

  const nextSlide = () => {
    setCurrent((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  };

  // Automatic transition logic
  useEffect(() => {
    if (imageUrls.length <= 1) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [imageUrls.length]);

  if (imageUrls.length === 0) return <div className="h-[50vh] bg-slate-900" />;

  return (
    <section className="relative overflow-hidden bg-slate-950 aspect-video md:aspect-auto md:h-[85vh] lg:h-[90vh] mt-[30px] md:mt-0">
      
      {/* 1. TOP GRADIENT (Visual Depth) */}
      <div className="hidden md:block absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/80 via-black/20 to-transparent z-20 pointer-events-none" />

      {/* 2. OPTIMIZED SLIDER IMAGES */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={imageUrls[current]}
            alt={`School Slide ${current}`}
            fill
            /* 
               CRITICAL: 'priority' on index 0 ensures immediate LCP loading. 
               Lazy loading is handled automatically for other slides. 
            */
            priority={current === 0}
            quality={85}
            className="object-cover"
            style={{ objectPosition: 'center 15%' }}
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>
      
      {/* 3. BOTTOM GRADIENT */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-20 pointer-events-none" />
      
      {/* 4. NAVIGATION BUTTONS */}
      <div className="absolute inset-0 z-30 flex items-center justify-between px-3 md:px-10 pointer-events-none">
        <button 
          onClick={prevSlide}
          className="pointer-events-auto p-2 md:p-4 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-blue-600 transition-all shadow-xl"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button 
          onClick={nextSlide}
          className="pointer-events-auto p-2 md:p-4 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-blue-600 transition-all shadow-xl"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>

      {/* 5. INDICATOR DOTS */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {imageUrls.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              current === i ? 'w-10 bg-blue-600' : 'w-2.5 bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

// --- 6. STATS SECTION (No changes needed, kept for your reference) ---
const StatsSection = ({ statsData }) => {
  const statsArray = Object.keys(statsData)
    .sort((a, b) => Number(a) - Number(b))
    .map(key => statsData[key]);

  return (
    <div className="bg-white py-20 px-6 border-y border-slate-100">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
        {statsArray.map((stat, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <h3 className="text-6xl font-black tracking-tighter italic text-slate-900">{stat.value}</h3>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// --- REMAINING UI SECTIONS (KEEPING YOUR EXACT UI) ---
const AboutSection = () => (
  <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center px-6">
    <div>
      <h2 className="text-5xl font-black tracking-tighter mb-8 leading-tight text-slate-900">
        Welcome to <br/> <span className="text-blue-600">MVG Public School</span>
      </h2>
      <p className="text-lg text-slate-500 font-medium leading-relaxed mb-6 italic">
        "Your Child’s Second Home"
      </p>
      <p className="text-slate-500 font-medium leading-relaxed mb-10">
        At MVG Public School, every morning begins with a smile and a new opportunity to grow. We believe in nurturing not just students, but the leaders of tomorrow. Our vibrant campus is a place where creativity is celebrated, and every child is given the tools to shine. We welcome you to join our growing family!
      </p>
      <button className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-blue-600 hover:text-slate-900">
        Read Welcome Message <ArrowRight size={16}/>
      </button>
    </div>

    {/* OPTIMIZED IMAGE CONTAINER */}
    <div className="rounded-[60px] overflow-hidden shadow-2xl border-[15px] border-white relative aspect-[4/5] lg:aspect-square">
      <Image 
        src="https://res.cloudinary.com/db6ssceun/image/upload/v1772107780/12_tz2xx7.png" 
        alt="Welcome to MVG Public School"
        fill
        className="object-cover"
        /* 
          Using 'sizes' tells the browser that on mobile it's 100% width,
          but on desktop, it only takes up about 50% of the screen.
        */
        sizes="(max-width: 768px) 100vw, 50vw"
        quality={90}
      />
    </div>
  </div>
);

const VisionProspectus = () => (
  <div className="max-w-7xl mx-auto">
    <div className="grid md:grid-cols-2 gap-8 mb-12">
      <div className="bg-white p-16 rounded-[60px] border border-slate-100 shadow-xl">
        <h3 className="text-3xl font-black italic mb-6 text-slate-900">Our Vision</h3>
        <p className="text-slate-500 font-medium leading-relaxed">At MVG Public School, we envision becoming a premier center of educational excellence where innovation and character go hand in hand. As a forward-thinking digital school, our goal is to redefine the traditional classroom by creating a future-ready environment that empowers every student with high-level digital literacy and critical thinking skills. We see a future where our graduates are not just tech-savvy individuals, but empathetic leaders and moral pioneers who are equipped to navigate and shape a rapidly evolving global landscape. By removing the barriers to modern resources, we strive to inspire a lifelong passion for discovery and a commitment to excellence in every child who walks through our doors.

        </p>
      </div>
      <div className="bg-blue-600 text-white p-16 rounded-[60px] shadow-2xl">
        <h3 className="text-3xl font-black italic mb-6 text-blue-200">Our Mission</h3>
        <p className="text-blue-50 font-medium leading-relaxed">
          Our mission is to deliver a holistic, tech-integrated education that bridges the gap between traditional values and the demands of the 21st century. 
          We are dedicated to maintaining an environment of academic rigor where high expectations drive students to reach their 
          full intellectual potential through interactive and accessible digital tools. Beyond academics, we focus deeply on character 
          building, instilling the core values of integrity, resilience, and social responsibility to ensure our students grow into compassionate 
          citizens. By fostering a safe, inclusive, and nurturing community, we ensure that every student's journey from our campus to the wider 
          world is paved with the confidence, skills, and purpose necessary to succeed and lead.

        </p>
      </div>
    </div>
    <div className="bg-slate-900 rounded-[50px] p-12 text-center text-white relative overflow-hidden">
      <h4 className="text-2xl font-black mb-6">Want to know more about our legacy?</h4>
      <Link href="/Academics/prospectus" className="w-fit mx-auto block">
  <button className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-blue-500 hover:text-white transition-all shadow-xl">
    <Download size={18}/> View Prospectus 
  </button>
</Link>
    </div>
  </div>
);

const AcademicsCalendar = () => (
  <div className="max-w-7xl mx-auto">
    <div className="text-center mb-16">
      <h2 className="text-4xl font-black tracking-tighter text-slate-900">Academic Excellence</h2>
      <p className="text-blue-600 font-bold uppercase text-xs tracking-widest mt-2">Activity Calendar & Curriculum</p>
    </div>
    <div className="grid md:grid-cols-3 gap-8">
      {[
        { t: 'Curriculum', d: 'RBSE based English Medium structure for holistic growth.', i: <BookOpen/> },
        { t: 'Activities', d: 'Monthly cultural and sports events across all wings.', i: <Star/> },
        { t: 'Calendar', d: 'Full year 2026-27 schedule of exams and holidays.', i: <Calendar/> }
      ].map(card => (
        <div key={card.t} className="p-10 bg-white rounded-[45px] border border-slate-100 shadow-lg text-center group hover:-translate-y-2 transition-all">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mx-auto mb-8 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">{card.i}</div>
          <h4 className="text-xl font-black mb-4">{card.t}</h4>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">{card.d}</p>
        </div>
      ))}
    </div>
  </div>
);

const DirectorMessage = () => (
  <div className="max-w-6xl mx-auto bg-blue-50/50 p-16 rounded-[60px] flex flex-col md:flex-row items-center gap-16">
    <div className="w-74 h-80 bg-white rounded-[50px] overflow-hidden shadow-2xl shrink-0 border-8 border-white rotate-2">
      <img src="https://res.cloudinary.com/db6ssceun/image/upload/v1772172686/1772172574607_mv0amq.png" className="w-full h-full object-cover" alt="Director" />
    </div>
    <div>
      <h3 className="text-3xl font-black italic text-slate-900 mb-8 leading-snug">"Education is not just about grades, but about the fire it ignites in a young mind."</h3>
      <p className="text-slate-500 text-lg font-medium leading-relaxed mb-8"> "At the heart of MVG Public Senior Secondary School lies a commitment to innovation and excellence. This past year has been one of transformative growth, not just in our numbers, but in the impact we’ve made within our industry.

Our success is built on a foundation of collaboration and a shared vision for the future. As we look ahead, our focus remains clear: to deliver sustainable value while staying true to our core principles. I am incredibly proud of our team’s resilience and am grateful to our partners for their continued trust. Together, we are not just navigating the future; we are shaping it." </p>
      <h4 className="text-xl font-black text-slate-900">KEDAR MAL JAT</h4>
      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Director</p>
    </div>
  </div>
);

const StreamsSection = () => {
  const streams = [
    {
      title: "Science",
      id: "science-stream",
      seoKeyword: "Best Senior Secondary School Science Stream",
      icon: <Beaker className="text-blue-600" size={28} />,
      bg: "bg-blue-50/50",
      accent: "bg-blue-600",
      intro: "A powerhouse for future innovators. We offer an integrated approach to Science stream subjects after 10th, focusing on both Board excellence and competitive success.",
      subjects: ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Sc."],
      careers: ["IIT-JEE / Engineering", "NEET / Medical", "Biotechnology", "Data Science"],
      points: ["Modern STEM Laboratories",  "Diverse Career Opportunities", "Practical Research Expo"],
      scope: "The Science stream at our school prepares students for high-stakes careers in technology, medicine, and research, ensuring they stay ahead in a global landscape."
    },
    
    {
      title: "Humanities",
      id: "humanities-stream",
      seoKeyword: "Humanities Career Options after 10th",
      icon: <Globe className="text-purple-600" size={28} />,
      bg: "bg-purple-50/50",
      accent: "bg-purple-600",
      intro: "Fostering critical thinkers and social architects. We offer diverse Humanities career options, focusing on analytical skills and societal impact.",
      subjects: ["History", "Political Science", "Psychology", "Sociology", "Geography" , "Drawing", "English Literature", "Hindi Literature", "Home Science"],
      careers: ["Civil Services (UPSC)", "Journalism & Media", "International Relations", "Clinical Psychology"],
      points: ["Model United Nations (MUN)", "Understanding Society and Culture", "Excellent for Government & Civil Services Preparation", "Debate "],
      scope: "Humanities is no longer 'just arts.' It is the foundation for future policy makers, lawyers, and creative directors in the 21st-century liberal arts world."
    }
  ];

  return (
    <section id="academic-streams" className="py-24 bg-white px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* SECTION HEADER - SEO Optimized */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-widest mb-4"
          >
            <Trophy size={14} /> Top School in Rajasthan
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic">
            Higher Secondary <span className="text-blue-600">Streams</span>
          </h2>
          <p className="mt-4 text-slate-500 max-w-2xl mx-auto font-medium">
            Discover a curriculum designed for the ambitious. Our senior secondary programs are recognized for academic rigour and holistic career preparation.
          </p>
        </div>

        {/* CARDS GRID */}
        <div className="grid lg:grid-cols-3 gap-8">
          {streams.map((stream, index) => (
            <motion.div
              key={stream.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`group relative flex flex-col p-8 rounded-[45px] border border-slate-100 ${stream.bg} hover:bg-white hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500`}
            >
              {/* Icon & Title */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:rotate-12 transition-transform">
                    {stream.icon}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">{stream.title}</h3>
                </div>
              </div>

              {/* Intro text */}
              <p className="text-slate-600 text-sm font-semibold leading-relaxed mb-6">
                {stream.intro}
              </p>

              {/* Subject Tags */}
              <div className="mb-8">
                <div className="flex flex-wrap gap-2">
                  {stream.subjects.map(subject => (
                    <span key={subject} className="px-3 py-1 bg-white text-[10px] font-black uppercase text-slate-500 rounded-lg border border-slate-100">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              {/* Why Choose Points */}
              <div className="mb-8 flex-grow">
                <h4 className="text-[11px] font-black uppercase text-blue-600 tracking-widest mb-4">Why Choose {stream.title}?</h4>
                <ul className="space-y-3">
                  {stream.points.map(point => (
                    <li key={point} className="flex items-start gap-2 text-xs font-bold text-slate-700">
                      <CheckCircle2 size={14} className="text-blue-500 mt-0.5" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Future Scope Box */}
              <div className="mb-8 p-5 bg-white/60 rounded-3xl border border-white">
                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Future Scope</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{stream.scope}</p>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <button className={`w-full ${stream.accent} text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:opacity-90 transition-all`}>
                  Apply for Admission
                  <ArrowRight size={14} />
                </button>
                <Link href="/Academics/prospectus" className="w-full block">
  <button className="w-full bg-white border-2 border-slate-100 text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
    <FileDown size={14} />
    View Prospectus
  </button>
</Link>
              </div>

              {/* Hidden SEO Data */}
              <span className="sr-only">{stream.seoKeyword}</span>
            </motion.div>
          ))}
        </div>

        {/* SEO Footer Text */}
        <div className="mt-20 pt-10 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] max-w-3xl mx-auto leading-relaxed">
            As the best senior secondary school, we provide expert guidance for arts stream subjects after 10th, commerce stream with maths, and humanities career options. secure your admission at the top school in rajasthan today.
          </p>
        </div>

      </div>
    </section>
  );
};


const GallerySection = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllGalleryData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "gallery"));
        const allDocs = querySnapshot.docs.sort((a, b) => b.id.localeCompare(a.id));

        let combinedImages = [];
        allDocs.forEach((doc) => {
          const data = doc.data();
          const docImages = [
            data.image1,
            data.image2,
            data.image3,
            data.image4
          ].filter(link => link);
          combinedImages = [...combinedImages, ...docImages];
        });

        setImages(combinedImages);
      } catch (error) {
        console.error("Error fetching all gallery docs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllGalleryData();
  }, []);

  if (loading || images.length === 0) return null;

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-blue-600 font-black uppercase tracking-[0.3em] text-[10px] mb-2 block">Visual Journey</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter italic text-slate-900 leading-none uppercase">CAMPUS LIFE</h2>
          </div>
          
          <Link 
            href="/gallery" 
            className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 border-b-2 border-blue-600 pb-1 hover:text-slate-900 hover:border-slate-900 transition-all"
          >
            View All Photos
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Bento Grid - Optimized with Next.js Image */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[500px] md:h-[600px]">
          
          {/* image1 - Large Feature */}
          <div className="col-span-2 row-span-2 rounded-[40px] overflow-hidden shadow-2xl bg-slate-100 relative group">
            <Image 
              src={images[0]} 
              alt="Recent Campus Activity" 
              fill
              className="object-cover group-hover:scale-105 transition-all duration-1000"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority // Priority loading for the largest image
            />
          </div>

          {/* image2 */}
          <div className="rounded-[30px] overflow-hidden shadow-lg bg-slate-100 relative group">
            <Image 
              src={images[1]} 
              alt="Campus 2" 
              fill
              className="object-cover group-hover:scale-105 transition-all duration-1000"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>

          {/* image3 */}
          <div className="rounded-[30px] overflow-hidden shadow-lg bg-slate-100 relative group">
            <Image 
              src={images[2]} 
              alt="Campus 3" 
              fill
              className="object-cover group-hover:scale-105 transition-all duration-1000"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>

          {/* image4 - Horizontal Wide */}
          <div className="col-span-2 rounded-[30px] overflow-hidden shadow-lg bg-slate-100 relative group">
            <Image 
              src={images[3]} 
              alt="Campus 4" 
              fill
              className="object-cover group-hover:scale-105 transition-all duration-1000"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
};


const BlogSection = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        // Fetching latest 3 blogs sorted by date
        const q = query(
          collection(db, "blogs"), 
          orderBy("date", "desc"), 
          limit(3)
        );
        const querySnapshot = await getDocs(q);
        const blogData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPosts(blogData);
      } catch (error) {
        console.error("Blog Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  if (loading || posts.length === 0) return null;

  return (
    <section className="py-24 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-blue-600 font-black uppercase tracking-[0.3em] text-[10px] mb-2 block">Latest Updates</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter italic text-slate-900 uppercase">School Journal</h2>
          </div>
          <a href="/blog" className="text-[10px] font-black uppercase tracking-widest text-blue-600 border-b-2 border-blue-600 pb-1">Read All News</a>
        </div>

        {/* Blog Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <motion.div 
              key={post.id}
              whileHover={{ y: -10 }}
              className="bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 group"
            >
              {/* Image Container */}
              <div className="h-64 overflow-hidden relative">
                <img 
                  src={post.coverImage} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" 
                  alt={post.title} 
                />
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                  {post.category}
                </div>
              </div>

              {/* Text Content */}
              <div className="p-8">
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase mb-4">
                  <span>{post.author}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span>{post.readTime}</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 leading-tight mb-4 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2">
                  {post.excerpt}
                </p>
                <a href={`/blog/${post.id}`} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 group-hover:gap-4 transition-all">
                  Read Article <ArrowRight size={14} className="text-blue-600" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* const DownloadAppSection = () => (
  <div className="max-w-7xl mx-auto bg-blue-600 rounded-[60px] p-16 text-white flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px]" />
    <div className="relative z-10 max-w-xl">
      <h2 className="text-5xl font-black tracking-tighter mb-6">Stay Connected <br/> with our Mobile App.</h2>
      <p className="text-blue-100 text-lg font-medium mb-10">Parents and students can track attendance, fees, and examination results directly from their smartphones.</p>
      <div className="flex gap-4">
        <button className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all"><Smartphone size={20}/> Play Store</button>
        <button className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all"><Globe size={20}/> App Store</button>
      </div>
    </div>
    <div className="relative z-10 w-64 h-[450px] bg-slate-900 rounded-[40px] border-8 border-slate-800 shadow-2xl flex items-center justify-center">
       <div className="text-blue-600"><Smartphone size={80}/></div>
    </div>
  </div>
); */

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Saves to 'inquiries' collection in Firestore
      await addDoc(collection(db, "enquiries"), {
        ...formData,
        status: 'new',
        createdAt: serverTimestamp(),
      });
      
      setSubmitted(true);
      setFormData({ studentName: '', parentContact: '', email: '', applyingClass: '', message: '' });
    } catch (error) {
      console.error("Error saving inquiry:", error);
      alert("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };



const ContactSection = () => {
  // CONFIGURATION
  const mapSource = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3560.9806997465485!2d75.81411117588428!3d26.80874316455012!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396dc9f258d6df6b%3A0x8972ac082c7833!2sMVG%20Public%20Sr.%20Sec.%20School!5e0!3m2!1sen!2sin!4v1777779961272!5m2!1sen!2sin";
  const directionsUrl = "https://maps.app.goo.gl/moUQmATKTDDdUbS16";

  const socialLinks = [
    { name: 'Instagram', url: 'https://www.instagram.com/mvgpublicschool/', icon: <Instagram size={20} />, color: 'hover:bg-pink-600' },
    { name: 'Facebook', url: 'https://www.facebook.com/mvgpublicschool/', icon: <Facebook size={20} />, color: 'hover:bg-blue-700' },
    { name: 'YouTube', url: 'https://www.youtube.com/@mvgpublicschool', icon: <Youtube size={20} />, color: 'hover:bg-red-600' }
  ];

  // STATE
  const [loading, setLoading] = useState(false); 
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    studentName: '',
    parentContact: '',
    email: '',
    applyingClass: '',
    message: ''
  });

  // HANDLER
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "inquiries"), {
        ...formData,
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Error saving inquiry:", error);
      alert("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="text-center mb-16">
          <span className="text-blue-600 font-black uppercase tracking-[0.3em] text-[10px] mb-2 block">Admission & Support</span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 uppercase italic">
            Connect <span className="text-blue-600">With Us</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT: INFO & SOCIALS (4 Cols) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
              <h3 className="text-xl font-black text-slate-900 uppercase italic mb-8 border-b border-slate-100 pb-4">Contact Details</h3>
              
              <div className="space-y-8">
                <div className="flex gap-5">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0"><MapPin size={22}/></div>
                  <div>
                    <h4 className="font-black text-slate-400 uppercase text-[9px] tracking-widest mb-1">Campus Address</h4>
                    <p className="text-slate-700 font-bold text-sm leading-relaxed">Sector 11, Pratap Nagar, Sanganer, Jaipur, RJ</p>
                  </div>
                </div>

                <div className="flex gap-5">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0"><Phone size={22}/></div>
                  <div>
                    <h4 className="font-black text-slate-400 uppercase text-[9px] tracking-widest mb-1">Admission Helpline</h4>
                    <p className="text-slate-700 font-bold text-sm">+91 141-3152600, 9829018332, 8875646366</p>
                  </div>
                </div>

                <div className="flex gap-5">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0"><Mail size={22}/></div>
                  <div>
                    <h4 className="font-black text-slate-400 uppercase text-[9px] tracking-widest mb-1">Email Inquiry</h4>
                    <p className="text-slate-700 font-bold text-sm break-all">contact@mvgpublicschool.com</p>
                  </div>
                </div>
              </div>

              {/* SOCIAL HANDLES */}
              <div className="mt-12 pt-8 border-t border-slate-50">
                <h4 className="font-black text-slate-400 uppercase text-[9px] tracking-widest mb-6">Digital Presence</h4>
                <div className="flex gap-3">
                  {socialLinks.map((social) => (
                    <a key={social.name} href={social.url} className={`w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center transition-all duration-300 ${social.color} hover:text-white hover:scale-110`}>
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* MAP CARD */}
            <div className="relative h-[300px] rounded-[40px] overflow-hidden shadow-sm group border-4 border-white">
              <iframe src={mapSource} className="w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700" style={{ border: 0 }} allowFullScreen="" loading="lazy" />
              <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-all" />
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="absolute bottom-6 left-6 right-6 bg-white text-slate-900 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-blue-600 hover:text-white transition-all">
                <Navigation size={14} /> Get Directions
              </a>
            </div>
          </div>

          {/* RIGHT: FORM OR SUCCESS MESSAGE (8 Cols) */}
          <div className="lg:col-span-8">
            {submitted ? (
              <div className="bg-white p-12 rounded-[50px] shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-4 min-h-[550px]">
                <CheckCircle2 size={60} className="text-green-500 animate-bounce" />
                <h3 className="text-3xl font-black text-slate-900 uppercase italic">Inquiry <span className="text-blue-600">Received!</span></h3>
                <p className="text-slate-500 font-medium">Our counselor will call you shortly on {formData.parentContact}.</p>
                <button 
                  onClick={() => setSubmitted(false)} 
                  className="text-blue-600 font-black uppercase text-[10px] tracking-widest pt-4 hover:underline"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-xl shadow-blue-900/5 border border-white">
                <div className="mb-10">
                  <h3 className="text-2xl font-black text-slate-900 uppercase italic">Inquiry <span className="text-blue-600">Form</span></h3>
                  <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-wider">Fill this form and our counselor will call you back</p>
                </div>

                <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Student Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Enter Full Name" 
                      value={formData.studentName}
                      onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                      className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-600 font-bold text-slate-700 transition-all border border-transparent focus:bg-white" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Parent Contact</label>
                    <input 
                      required
                      type="tel" 
                      placeholder="+91 00000 00000" 
                      value={formData.parentContact}
                      onChange={(e) => setFormData({...formData, parentContact: e.target.value})}
                      className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-600 font-bold text-slate-700 transition-all border border-transparent focus:bg-white" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Email Address</label>
                    <input 
                      required
                      type="email" 
                      placeholder="example@mail.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-600 font-bold text-slate-700 transition-all border border-transparent focus:bg-white" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Applying for Class</label>
                    <select 
                      required
                      value={formData.applyingClass}
                      onChange={(e) => setFormData({...formData, applyingClass: e.target.value})}
                      className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-600 font-bold text-slate-700 transition-all border border-transparent focus:bg-white appearance-none"
                    >
                      <option value="">Select Class</option>
                      <option>Grade 11 - Science</option>
                      <option>Grade 11 - Commerce</option>
                      <option>Grade 11 - Arts</option>
                      <option>Other Grades</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Your Message</label>
                    <textarea 
                      rows="4" 
                      placeholder="How can we help you?" 
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full p-5 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-600 font-bold text-slate-700 transition-all border border-transparent focus:bg-white resize-none" 
                    />
                  </div>

                  <div className="md:col-span-2 mt-4">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white p-5 rounded-[20px] font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-blue-600/30 hover:bg-slate-900 transition-all flex items-center justify-center gap-3 group disabled:opacity-70"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <>Submit Application <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform"/></>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};




