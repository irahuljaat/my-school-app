'use client';
import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { db } from '../app/firebase/config'; // Adjust this path if your firebase file is elsewhere
import Link from 'next/link';
import Image from 'next/image';

import {
  doc, onSnapshot, getDocs, collection, query, orderBy, limit,
  getDoc, addDoc, serverTimestamp,
} from 'firebase/firestore';
import {
  ChevronDown, Menu, X, Phone, Mail, MapPin, ArrowRight, CheckCircle, Briefcase, CheckCircle2,
  FileDown, Navigation, Loader2, GraduationCap, Users, BookOpen, Trophy, Calendar, Download,
  ChevronLeft, ChevronRight, Instagram, Facebook, Twitter, Youtube, Beaker, Star, ShieldCheck,
  Smartphone, MessageCircle, FileText, Camera, Globe, Compass,
} from 'lucide-react';

/* ==================================================================== */
/*  DESIGN TOKENS                                                        */
/*  Navy + brass on warm paper — an academic-record palette (crests,     */
/*  ledgers, prospectuses) instead of a SaaS-blue one. Fraunces carries  */
/*  the serif headlines, Inter runs the body, IBM Plex Mono handles      */
/*  small eyebrow labels — the mono touch reads "register", not "app".  */
/*  Everything below is scoped in one <style> block so the file is a    */
/*  drop-in replacement with no tailwind.config changes required.       */
/* ==================================================================== */
const GlobalDesignTokens = () => (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');

    :root {
      --ink: #142440;
      --ink-soft: #52607a;
      --paper: #faf8f4;
      --panel: #f1ece1;
      --gold: #b8892b;
      --gold-soft: #e9dcbd;
      --line: #e4dfd3;
    }
    .font-serif-mvg { font-family: 'Fraunces', ui-serif, Georgia, serif; }
    .font-mono-mvg { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
    body, .font-sans-mvg { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }

    @keyframes mvg-pulse { 0%,100% { transform: scale(1); opacity: .35; } 50% { transform: scale(1.5); opacity: .1; } }
    @keyframes mvg-spin { to { transform: rotate(360deg); } }
    @keyframes mvg-fade-up { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes mvg-sweep { 0% { left: -100%; } 100% { left: 100%; } }
    @keyframes mvg-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes mvg-scale-in { from { opacity: 0; transform: scale(.96) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .animate-mvg-pulse { animation: mvg-pulse 2.2s ease-in-out infinite; }
    .animate-mvg-spin { animation: mvg-spin 3.5s linear infinite; }
    .animate-mvg-fade-up { animation: mvg-fade-up .6s ease-out both; }
    .animate-mvg-sweep { animation: mvg-sweep 1.6s ease-in-out infinite; }
    .animate-mvg-fade { animation: mvg-fade .5s ease-out both; }
    .animate-mvg-scale-in { animation: mvg-scale-in .35s cubic-bezier(.16,1,.3,1) both; }
    @media (prefers-reduced-motion: reduce) {
      .animate-mvg-pulse, .animate-mvg-spin, .animate-mvg-fade-up,
      .animate-mvg-sweep, .animate-mvg-fade, .animate-mvg-scale-in { animation: none !important; }
    }
  `}</style>
);

/* ------------------------------------------------------------------ */
/*  PERFORMANCE CORE — unchanged from the last pass                   */
/*  IntersectionObserver-driven reveal, CSS-only motion, no            */
/*  framer-motion runtime.                                             */
/* ------------------------------------------------------------------ */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -80px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, inView];
}

const revealCls = (inView, extra = '') =>
  `transition-all duration-700 ease-out will-change-transform ${
    inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
  } ${extra}`;

const Eyebrow = ({ children, dark = false }) => (
  <span
    className={`font-mono-mvg text-[10px] font-medium uppercase tracking-[0.32em] mb-3 inline-block ${
      dark ? 'text-[#E9DCBD]' : 'text-[#B8892B]'
    }`}
  >
    {children}
  </span>
);

const SectionWrapper = ({ children, id }) => {
  const [ref, inView] = useReveal();
  return (
    <section id={id} ref={ref} className={`py-14 md:py-20 px-6 overflow-hidden ${revealCls(inView)}`}>
      {children}
    </section>
  );
};

export default function MVGMainPortal() {
  const [sliderImages, setSliderImages] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubSlides = onSnapshot(doc(db, 'mainWebsite', 'sliderImages'), (snap) => {
      if (snap.exists()) setSliderImages(snap.data().urls || {});
    });
    const unsubConfig = onSnapshot(doc(db, 'mainWebsite', 'config'), (snap) => {
      if (snap.exists()) setStats(snap.data().stats || {});
      setLoading(false);
    });
    return () => {
      unsubSlides();
      unsubConfig();
    };
  }, []);

  if (loading) return (
    <>
      <GlobalDesignTokens />
      <LoadingScreen />
    </>
  );

  return (
    <div className="bg-[#FAF8F4] text-[#142440] font-sans-mvg selection:bg-[#142440] selection:text-white antialiased">
      <GlobalDesignTokens />
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

      {/* 11. CONTACT US */}
      <SectionWrapper id="contact">
        <ContactSection />
      </SectionWrapper>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LOADING SCREEN                                                     */
/* ------------------------------------------------------------------ */
const LoadingScreen = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-[#FAF8F4]">
    <div className="relative flex items-center justify-center">
      <div className="absolute w-32 h-32 bg-[#EFE4C8] rounded-full animate-mvg-pulse" />
      <div className="absolute w-20 h-20 border-t-2 border-b-2 border-[#B8892B] rounded-full animate-mvg-spin" />
      <div className="relative z-10 text-[#142440]">
        <GraduationCap size={38} strokeWidth={1.5} />
      </div>
    </div>

    <div className="mt-12 overflow-hidden text-center">
      <p className="font-serif-mvg text-[#142440] text-lg animate-mvg-fade-up">
        MVG <span className="text-[#B8892B] italic">Public School</span>
      </p>
      <div className="mt-4 h-px w-40 mx-auto bg-[#E4DFD3] relative overflow-hidden">
        <div className="absolute top-0 bottom-0 w-1/2 bg-[#B8892B] animate-mvg-sweep" />
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  PROMO POPUP                                                        */
/* ------------------------------------------------------------------ */
const PromoPopup = () => {
  const [config, setConfig] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let timer;
    const fetchPopupSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'popup');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().active) {
          setConfig(docSnap.data());
          timer = setTimeout(() => setIsOpen(true), 2500);
        }
      } catch (err) {
        console.error('Popup Config Error:', err);
      }
    };
    fetchPopupSettings();
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        const leadsRef = collection(db, 'settings', 'popup', 'leads');
        await addDoc(leadsRef, {
          ...formData,
          submittedAt: serverTimestamp(),
          device: window.innerWidth < 768 ? 'Mobile' : 'Desktop',
        });
        setIsSuccess(true);
        setTimeout(() => setIsOpen(false), 3000);
      } catch (err) {
        console.error('Submission Error:', err);
        alert('Submission failed. Please check your connection.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData]
  );

  if (!isOpen || !config) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div onClick={() => setIsOpen(false)} className="absolute inset-0 bg-[#142440]/70 backdrop-blur-sm animate-mvg-fade" />

      <div className="relative bg-white w-full max-w-4xl rounded-[28px] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[440px] animate-mvg-scale-in border border-[#E4DFD3]">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-5 right-5 z-50 w-9 h-9 bg-white rounded-full flex items-center justify-center text-[#142440] shadow-md border border-[#E4DFD3] hover:bg-[#142440] hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {(config.type === 'image' || config.type === 'both') && (
          <div className={`${config.type === 'both' ? 'md:w-1/2' : 'w-full'} h-64 md:h-auto relative overflow-hidden`}>
            <Image src={config.image} alt="School Promotion" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          </div>
        )}

        {(config.type === 'form' || config.type === 'both') && (
          <div className={`${config.type === 'both' ? 'md:w-1/2' : 'w-full'} p-8 md:p-12 flex flex-col justify-center`}>
            {isSuccess ? (
              <div className="text-center animate-mvg-fade">
                <CheckCircle2 size={52} className="text-[#B8892B] mx-auto mb-4" strokeWidth={1.5} />
                <h3 className="font-serif-mvg text-2xl text-[#142440]">Thank You</h3>
                <p className="text-[#52607A] mt-2">Our admissions team will contact you shortly.</p>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <Eyebrow>Exclusive Update</Eyebrow>
                  <h3 className="font-serif-mvg text-3xl text-[#142440] leading-tight">{config.title}</h3>
                  <p className="text-[#52607A] text-sm mt-3">{config.text}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {config.fields?.map((field, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="font-mono-mvg text-[9px] uppercase text-[#8A93A6] ml-1 tracking-widest">{field.label}</label>
                      <input
                        type={field.type || 'text'}
                        required
                        placeholder={field.placeholder}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [field.label]: e.target.value }))}
                        className="w-full p-3.5 bg-transparent border-b-2 border-[#E4DFD3] focus:border-[#B8892B] outline-none font-medium text-[#142440] placeholder:text-[#B7BEC9] transition-colors"
                      />
                    </div>
                  ))}

                  <button
                    disabled={isSubmitting}
                    className="w-full bg-[#142440] text-white p-4 rounded-xl font-medium text-sm hover:bg-[#0D1830] transition-colors flex items-center justify-center gap-3 group disabled:opacity-50 mt-2"
                  >
                    {isSubmitting ? 'Processing…' : 'Submit Inquiry'}
                    {!isSubmitting && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  HERO SLIDER — now carries the school's name and CTAs. Copy is      */
/*  pulled from the existing "About" section wording, not invented.    */
/* ------------------------------------------------------------------ */
const HeroSlider = ({ images }) => {
  const [current, setCurrent] = useState(0);

  const imageUrls = useMemo(
    () =>
      Object.keys(images)
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => images[key]),
    [images]
  );

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));
  }, [imageUrls.length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  }, [imageUrls.length]);

  useEffect(() => {
    if (imageUrls.length <= 1) return;
    const timer = setInterval(nextSlide, 5500);
    return () => clearInterval(timer);
  }, [imageUrls.length, nextSlide]);

  if (imageUrls.length === 0) return <div className="h-[50vh] bg-[#142440]" />;

  return (
    <section className="relative overflow-hidden bg-[#142440] aspect-[4/5] sm:aspect-video md:aspect-auto md:h-[88vh]">
      <div key={current} className="absolute inset-0 w-full h-full animate-mvg-fade">
        <Image
          src={imageUrls[current]}
          alt={`School Slide ${current + 1}`}
          fill
          priority={current === 0}
          quality={85}
          className="object-cover"
          style={{ objectPosition: 'center 15%' }}
          sizes="100vw"
        />
      </div>

      {/* Calm single gradient instead of a double top+bottom wash */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0B1526] via-[#0B1526]/50 to-transparent z-20 pointer-events-none" />

      {/* HERO COPY */}
      <div className="absolute inset-x-0 bottom-0 z-30 px-6 md:px-14 pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto">
          <Eyebrow dark>Sector 11, Pratap Nagar, Sanganer · Jaipur</Eyebrow>
          <h1 className="font-serif-mvg text-white text-4xl sm:text-5xl md:text-6xl leading-[1.05] max-w-2xl">
            MVG Public School
          </h1>
          <p className="text-white/70 italic font-serif-mvg text-lg md:text-xl mt-3 max-w-md">
            "Your Child's Second Home"
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <a
              href="#contact"
              className="bg-[#B8892B] text-white px-7 py-3.5 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-[#9C7422] transition-colors"
            >
              Enquire Now <ArrowRight size={16} />
            </a>
            <Link
              href="/Academics/prospectus"
              className="bg-white/10 backdrop-blur-md border border-white/25 text-white px-7 py-3.5 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-white/20 transition-colors"
            >
              <FileDown size={16} /> View Prospectus
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-30 hidden md:flex items-center justify-between px-6 pointer-events-none">
        <button
          onClick={prevSlide}
          aria-label="Previous slide"
          className="pointer-events-auto w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/25 transition-colors flex items-center justify-center"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={nextSlide}
          aria-label="Next slide"
          className="pointer-events-auto w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/25 transition-colors flex items-center justify-center"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="absolute top-8 right-6 md:right-14 z-30 flex gap-2">
        {imageUrls.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all duration-300 ${current === i ? 'w-8 bg-[#B8892B]' : 'w-3 bg-white/40'}`}
          />
        ))}
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  STATS — a quiet ledger row instead of shouting stat blocks         */
/* ------------------------------------------------------------------ */
const StatItem = memo(({ stat, index, isLast }) => {
  const [ref, inView] = useReveal();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: inView ? `${index * 90}ms` : '0ms' }}
      className={`text-center px-4 ${!isLast ? 'md:border-r md:border-[#E4DFD3]' : ''} ${revealCls(inView)}`}
    >
      <h3 className="font-serif-mvg text-4xl md:text-5xl text-[#142440]">{stat.value}</h3>
      <p className="font-mono-mvg text-[10px] text-[#B8892B] uppercase tracking-[0.25em] mt-3">{stat.label}</p>
    </div>
  );
});
StatItem.displayName = 'StatItem';

const StatsSection = ({ statsData }) => {
  const statsArray = useMemo(
    () =>
      Object.keys(statsData)
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => statsData[key]),
    [statsData]
  );

  return (
    <div className="bg-white py-16 px-6 border-y border-[#E4DFD3]">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-y-10">
        {statsArray.map((stat, index) => (
          <StatItem key={index} stat={stat} index={index} isLast={index === statsArray.length - 1} />
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  ABOUT                                                               */
/* ------------------------------------------------------------------ */
const AboutSection = () => (
  <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
    <div>
      <Eyebrow>About the School</Eyebrow>
      <h2 className="font-serif-mvg text-4xl md:text-5xl leading-tight mb-6 text-[#142440]">
        Welcome to <span className="italic text-[#B8892B]">MVG Public School</span>
      </h2>
      <p className="text-lg text-[#52607A] font-serif-mvg italic leading-relaxed mb-6">"Your Child's Second Home"</p>
      <p className="text-[#52607A] leading-relaxed mb-10">
        At MVG Public School, every morning begins with a smile and a new opportunity to grow. We believe in
        nurturing not just students, but the leaders of tomorrow. Our vibrant campus is a place where creativity
        is celebrated, and every child is given the tools to shine. We welcome you to join our growing family!
      </p>
      <button className="flex items-center gap-2 text-sm font-medium text-[#142440] border-b-2 border-[#B8892B] pb-1 hover:gap-3.5 transition-all w-fit">
        Read Welcome Message <ArrowRight size={16} />
      </button>
    </div>

    <div className="rounded-[28px] overflow-hidden shadow-xl border border-[#E4DFD3] relative aspect-[4/5] lg:aspect-square">
      <Image
        src="https://res.cloudinary.com/db6ssceun/image/upload/v1772107780/12_tz2xx7.png"
        alt="Welcome to MVG Public School"
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
        quality={90}
      />
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  VISION & MISSION                                                    */
/* ------------------------------------------------------------------ */
const VisionProspectus = () => (
  <div className="max-w-7xl mx-auto">
    <div className="grid md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white p-12 md:p-14 rounded-[28px] border border-[#E4DFD3]">
        <Eyebrow>Vision</Eyebrow>
        <h3 className="font-serif-mvg text-3xl mb-5 text-[#142440]">Where We're Headed</h3>
        <p className="text-[#52607A] leading-relaxed">
          At MVG Public School, we envision becoming a premier center of educational excellence where innovation
          and character go hand in hand. As a forward-thinking digital school, our goal is to redefine the
          traditional classroom by creating a future-ready environment that empowers every student with
          high-level digital literacy and critical thinking skills. We see a future where our graduates are not
          just tech-savvy individuals, but empathetic leaders and moral pioneers who are equipped to navigate and
          shape a rapidly evolving global landscape.
        </p>
      </div>
      <div className="bg-[#142440] text-white p-12 md:p-14 rounded-[28px]">
        <Eyebrow dark>Mission</Eyebrow>
        <h3 className="font-serif-mvg text-3xl mb-5">How We Get There</h3>
        <p className="text-white/70 leading-relaxed">
          Our mission is to deliver a holistic, tech-integrated education that bridges the gap between
          traditional values and the demands of the 21st century. We are dedicated to maintaining an environment
          of academic rigor where high expectations drive students to reach their full intellectual potential.
          Beyond academics, we focus deeply on character building — integrity, resilience, and social
          responsibility — so every student's journey from our campus to the wider world is paved with
          confidence and purpose.
        </p>
      </div>
    </div>
    <div className="bg-[#F1ECE1] rounded-[28px] p-12 text-center border border-[#E4DFD3]">
      <h4 className="font-serif-mvg text-2xl text-[#142440] mb-6">Want to know more about our legacy?</h4>
      <Link href="/Academics/prospectus" className="w-fit mx-auto block">
        <button className="bg-[#142440] text-white px-8 py-4 rounded-xl font-medium text-sm flex items-center gap-3 hover:bg-[#0D1830] transition-colors mx-auto">
          <Download size={18} /> View Prospectus
        </button>
      </Link>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  ACADEMICS                                                           */
/* ------------------------------------------------------------------ */
const ACADEMIC_CARDS = [
  { t: 'Curriculum', d: 'RBSE based English Medium structure for holistic growth.', i: <BookOpen size={22} /> },
  { t: 'Activities', d: 'Monthly cultural and sports events across all wings.', i: <Star size={22} /> },
  { t: 'Calendar', d: 'Full year 2026-27 schedule of exams and holidays.', i: <Calendar size={22} /> },
];

const AcademicsCalendar = () => (
  <div className="max-w-7xl mx-auto">
    <div className="text-center mb-14">
      <Eyebrow>Curriculum & Calendar</Eyebrow>
      <h2 className="font-serif-mvg text-4xl text-[#142440]">Academic Excellence</h2>
    </div>
    <div className="grid md:grid-cols-3 gap-6">
      {ACADEMIC_CARDS.map((card) => (
        <div key={card.t} className="p-10 bg-white rounded-[28px] border border-[#E4DFD3] text-center hover:border-[#B8892B] transition-colors">
          <div className="w-14 h-14 border border-[#E4DFD3] text-[#B8892B] rounded-full mx-auto mb-6 flex items-center justify-center">
            {card.i}
          </div>
          <h4 className="font-serif-mvg text-xl mb-3 text-[#142440]">{card.t}</h4>
          <p className="text-sm text-[#52607A] leading-relaxed">{card.d}</p>
        </div>
      ))}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  DIRECTOR MESSAGE                                                    */
/* ------------------------------------------------------------------ */
const DirectorMessage = () => (
  <div className="max-w-6xl mx-auto bg-white border border-[#E4DFD3] p-10 md:p-16 rounded-[28px] flex flex-col md:flex-row items-center gap-14">
    <div className="w-56 h-64 bg-[#F1ECE1] rounded-[20px] overflow-hidden shrink-0 relative">
      <Image
        src="https://res.cloudinary.com/db6ssceun/image/upload/v1772172686/1772172574607_mv0amq.png"
        alt="Director"
        fill
        className="object-cover"
        sizes="300px"
      />
    </div>
    <div>
      <Eyebrow>Message from the Director</Eyebrow>
      <h3 className="font-serif-mvg italic text-2xl md:text-3xl text-[#142440] mb-7 leading-snug">
        "Education is not just about grades, but about the fire it ignites in a young mind."
      </h3>
      <p className="text-[#52607A] leading-relaxed mb-8">
        "At the heart of MVG Public Senior Secondary School lies a commitment to innovation and excellence. This
        past year has been one of transformative growth, not just in our numbers, but in the impact we've made
        within our industry. Our success is built on a foundation of collaboration and a shared vision for the
        future. I am incredibly proud of our team's resilience and grateful to our partners for their continued
        trust. Together, we are not just navigating the future; we are shaping it."
      </p>
      <div className="w-10 h-px bg-[#B8892B] mb-4" />
      <h4 className="font-serif-mvg text-lg text-[#142440]">Kedar Mal Jat</h4>
      <p className="font-mono-mvg text-[10px] text-[#B8892B] uppercase tracking-[0.25em] mt-1">Director</p>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  STREAMS                                                             */
/* ------------------------------------------------------------------ */
const STREAMS = [
  {
    title: 'Science',
    id: 'science-stream',
    seoKeyword: 'Best Senior Secondary School Science Stream',
    icon: <Beaker size={24} />,
    intro:
      'A powerhouse for future innovators. We offer an integrated approach to Science stream subjects after 10th, focusing on both Board excellence and competitive success.',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Sc.'],
    careers: ['IIT-JEE / Engineering', 'NEET / Medical', 'Biotechnology', 'Data Science'],
    points: ['Modern STEM Laboratories', 'Diverse Career Opportunities', 'Practical Research Expo'],
    scope:
      'The Science stream at our school prepares students for high-stakes careers in technology, medicine, and research, ensuring they stay ahead in a global landscape.',
  },
  {
    title: 'Humanities',
    id: 'humanities-stream',
    seoKeyword: 'Humanities Career Options after 10th',
    icon: <Globe size={24} />,
    intro:
      'Fostering critical thinkers and social architects. We offer diverse Humanities career options, focusing on analytical skills and societal impact.',
    subjects: ['History', 'Political Science', 'Psychology', 'Sociology', 'Geography', 'Drawing', 'English Literature', 'Hindi Literature', 'Home Science'],
    careers: ['Civil Services (UPSC)', 'Journalism & Media', 'International Relations', 'Clinical Psychology'],
    points: ['Model United Nations (MUN)', 'Understanding Society and Culture', 'Excellent for Government & Civil Services Preparation', 'Debate'],
    scope:
      "Humanities is no longer 'just arts.' It is the foundation for future policy makers, lawyers, and creative directors in the 21st-century liberal arts world.",
  },
];

const StreamCard = memo(({ stream, index }) => {
  const [ref, inView] = useReveal();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: inView ? `${index * 100}ms` : '0ms' }}
      className={`group relative flex flex-col p-9 rounded-[28px] border border-[#E4DFD3] bg-white hover:border-[#B8892B] transition-colors ${revealCls(inView)}`}
    >
      <div className="flex items-center gap-4 mb-7">
        <div className="w-12 h-12 rounded-full border border-[#E4DFD3] text-[#B8892B] flex items-center justify-center shrink-0">
          {stream.icon}
        </div>
        <h3 className="font-serif-mvg text-2xl text-[#142440]">{stream.title}</h3>
      </div>

      <p className="text-[#52607A] text-sm leading-relaxed mb-6">{stream.intro}</p>

      <div className="mb-7">
        <div className="flex flex-wrap gap-2">
          {stream.subjects.map((subject) => (
            <span key={subject} className="px-3 py-1 bg-[#F1ECE1] text-[10px] font-mono-mvg uppercase text-[#52607A] rounded-full">
              {subject}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-7 flex-grow">
        <h4 className="font-mono-mvg text-[10px] uppercase text-[#B8892B] tracking-[0.25em] mb-4">Why Choose {stream.title}?</h4>
        <ul className="space-y-2.5">
          {stream.points.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-sm text-[#142440]">
              <CheckCircle2 size={15} className="text-[#B8892B] mt-0.5 shrink-0" />
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-8 p-5 bg-[#FAF8F4] rounded-2xl border border-[#E4DFD3]">
        <h4 className="font-mono-mvg text-[9px] uppercase text-[#8A93A6] tracking-[0.2em] mb-2">Future Scope</h4>
        <p className="text-xs text-[#52607A] leading-relaxed">{stream.scope}</p>
      </div>

      <div className="space-y-2.5">
        <button className="w-full bg-[#142440] text-white py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#0D1830] transition-colors">
          Apply for Admission
          <ArrowRight size={14} />
        </button>
        <Link href="/Academics/prospectus" className="w-full block">
          <button className="w-full bg-white border border-[#E4DFD3] text-[#142440] py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:border-[#B8892B] transition-colors">
            <FileDown size={14} />
            View Prospectus
          </button>
        </Link>
      </div>

      <span className="sr-only">{stream.seoKeyword}</span>
    </div>
  );
});
StreamCard.displayName = 'StreamCard';

const StreamsSection = () => (
  <section id="academic-streams" className="py-20 md:py-28 bg-[#F1ECE1] px-6 -mx-6 overflow-hidden">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-14">
        <Eyebrow>Top School in Rajasthan</Eyebrow>
        <h2 className="font-serif-mvg text-4xl md:text-5xl text-[#142440]">Higher Secondary Streams</h2>
        <p className="mt-4 text-[#52607A] max-w-2xl mx-auto">
          Discover a curriculum designed for the ambitious. Our senior secondary programs are recognized for
          academic rigour and holistic career preparation.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {STREAMS.map((stream, index) => (
          <StreamCard key={stream.title} stream={stream} index={index} />
        ))}
      </div>

      <div className="mt-16 pt-8 border-t border-[#E4DFD3] text-center">
        <p className="text-[11px] text-[#8A93A6] max-w-3xl mx-auto leading-relaxed">
          As the best senior secondary school, we provide expert guidance for arts stream subjects after 10th,
          commerce stream with maths, and humanities career options. Secure your admission at the top school in
          Rajasthan today.
        </p>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  GALLERY                                                             */
/* ------------------------------------------------------------------ */
const GallerySection = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllGalleryData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'gallery'));
        const allDocs = querySnapshot.docs.sort((a, b) => b.id.localeCompare(a.id));

        let combinedImages = [];
        allDocs.forEach((docSnap) => {
          const data = docSnap.data();
          const docImages = [data.image1, data.image2, data.image3, data.image4].filter(Boolean);
          combinedImages = [...combinedImages, ...docImages];
        });

        setImages(combinedImages);
      } catch (error) {
        console.error('Error fetching all gallery docs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllGalleryData();
  }, []);

  if (loading || images.length === 0) return null;

  return (
    <section className="py-20 md:py-28 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <Eyebrow>Visual Journey</Eyebrow>
            <h2 className="font-serif-mvg text-4xl md:text-5xl text-[#142440]">Campus Life</h2>
          </div>

          <Link
            href="/gallery"
            className="group flex items-center gap-2 text-xs font-medium text-[#142440] border-b-2 border-[#B8892B] pb-1 hover:gap-3.5 transition-all"
          >
            View All Photos
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[500px] md:h-[600px]">
          <div className="col-span-2 row-span-2 rounded-[24px] overflow-hidden bg-[#F1ECE1] relative group border border-[#E4DFD3]">
            <Image
              src={images[0]}
              alt="Recent Campus Activity"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>

          {images[1] && (
            <div className="rounded-[20px] overflow-hidden bg-[#F1ECE1] relative group border border-[#E4DFD3]">
              <Image src={images[1]} alt="Campus 2" fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 50vw, 25vw" />
            </div>
          )}

          {images[2] && (
            <div className="rounded-[20px] overflow-hidden bg-[#F1ECE1] relative group border border-[#E4DFD3]">
              <Image src={images[2]} alt="Campus 3" fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 50vw, 25vw" />
            </div>
          )}

          {images[3] && (
            <div className="col-span-2 rounded-[20px] overflow-hidden bg-[#F1ECE1] relative group border border-[#E4DFD3]">
              <Image src={images[3]} alt="Campus 4" fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  BLOG                                                                */
/* ------------------------------------------------------------------ */
const BlogCard = memo(({ post }) => (
  <div className="bg-white rounded-[24px] overflow-hidden border border-[#E4DFD3] hover:border-[#B8892B] transition-colors group">
    <div className="h-56 overflow-hidden relative">
      <Image
        src={post.coverImage}
        alt={post.title}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-700"
        sizes="(max-width: 768px) 100vw, 33vw"
      />
      <div className="absolute top-5 left-5 bg-white px-3.5 py-1 rounded-full font-mono-mvg text-[9px] uppercase tracking-widest text-[#142440]">
        {post.category}
      </div>
    </div>

    <div className="p-7">
      <div className="flex items-center gap-3 font-mono-mvg text-[9px] text-[#8A93A6] uppercase tracking-widest mb-4">
        <span>{post.author}</span>
        <span className="w-1 h-1 bg-[#E4DFD3] rounded-full" />
        <span>{post.readTime}</span>
      </div>
      <h3 className="font-serif-mvg text-xl text-[#142440] leading-snug mb-3 group-hover:text-[#B8892B] transition-colors">{post.title}</h3>
      <p className="text-[#52607A] text-sm leading-relaxed mb-5 line-clamp-2">{post.excerpt}</p>
      <a href={`/blog/${post.id}`} className="flex items-center gap-2 text-xs font-medium text-[#142440] group-hover:gap-3.5 transition-all">
        Read Article <ArrowRight size={14} className="text-[#B8892B]" />
      </a>
    </div>
  </div>
));
BlogCard.displayName = 'BlogCard';

const BlogSection = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const q = query(collection(db, 'blogs'), orderBy('date', 'desc'), limit(3));
        const querySnapshot = await getDocs(q);
        setPosts(querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error('Blog Fetch Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  if (loading || posts.length === 0) return null;

  return (
    <section className="py-20 md:py-28 px-6 bg-[#F1ECE1] -mx-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <Eyebrow>Latest Updates</Eyebrow>
            <h2 className="font-serif-mvg text-4xl md:text-5xl text-[#142440]">School Journal</h2>
          </div>
          <a href="/blog" className="text-xs font-medium text-[#142440] border-b-2 border-[#B8892B] pb-1">
            Read All News
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  CONTACT                                                             */
/* ------------------------------------------------------------------ */
const ContactSection = () => {
  const mapSource =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3560.9806997465485!2d75.81411117588428!3d26.80874316455012!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396dc9f258d6df6b%3A0x8972ac082c7833!2sMVG%20Public%20Sr.%20Sec.%20School!5e0!3m2!1sen!2sin!4v1777779961272!5m2!1sen!2sin';
  const directionsUrl = 'https://maps.app.goo.gl/moUQmATKTDDdUbS16';

  const socialLinks = [
    { name: 'Instagram', url: 'https://www.instagram.com/mvgpublicschool/', icon: <Instagram size={18} /> },
    { name: 'Facebook', url: 'https://www.facebook.com/mvgpublicschool/', icon: <Facebook size={18} /> },
    { name: 'YouTube', url: 'https://www.youtube.com/@mvgpublicschool', icon: <Youtube size={18} /> },
  ];

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    studentName: '',
    parentContact: '',
    email: '',
    applyingClass: '',
    message: '',
  });

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        await addDoc(collection(db, 'inquiries'), {
          ...formData,
          status: 'new',
          createdAt: serverTimestamp(),
        });
        setSubmitted(true);
      } catch (error) {
        console.error('Error saving inquiry:', error);
        alert('Submission failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [formData]
  );

  const updateField = (field) => (e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const fieldCls =
    'w-full py-3.5 bg-transparent border-b-2 border-[#E4DFD3] focus:border-[#B8892B] outline-none font-medium text-[#142440] placeholder:text-[#B7BEC9] transition-colors';

  return (
    <section className="py-20 md:py-28 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <Eyebrow>Admission & Support</Eyebrow>
          <h2 className="font-serif-mvg text-4xl md:text-6xl text-[#142440]">Connect With Us</h2>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* LEFT: INFO & SOCIALS */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#FAF8F4] p-9 rounded-[24px] border border-[#E4DFD3]">
              <h3 className="font-serif-mvg text-lg text-[#142440] mb-7 pb-4 border-b border-[#E4DFD3]">Contact Details</h3>

              <div className="space-y-7">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full border border-[#E4DFD3] text-[#B8892B] flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h4 className="font-mono-mvg text-[9px] uppercase text-[#8A93A6] tracking-widest mb-1">Campus Address</h4>
                    <p className="text-[#142440] text-sm leading-relaxed">Sector 11, Pratap Nagar, Sanganer, Jaipur, RJ</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full border border-[#E4DFD3] text-[#B8892B] flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h4 className="font-mono-mvg text-[9px] uppercase text-[#8A93A6] tracking-widest mb-1">Admission Helpline</h4>
                    <p className="text-[#142440] text-sm">+91 141-3152600, 9829018332, 8875646366</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full border border-[#E4DFD3] text-[#B8892B] flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h4 className="font-mono-mvg text-[9px] uppercase text-[#8A93A6] tracking-widest mb-1">Email Inquiry</h4>
                    <p className="text-[#142440] text-sm break-all">contact@mvgpublicschool.com</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-7 border-t border-[#E4DFD3]">
                <h4 className="font-mono-mvg text-[9px] uppercase text-[#8A93A6] tracking-widest mb-5">Digital Presence</h4>
                <div className="flex gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      className="w-10 h-10 rounded-full bg-white border border-[#E4DFD3] text-[#142440] flex items-center justify-center hover:bg-[#142440] hover:text-white hover:border-[#142440] transition-colors"
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative h-[280px] rounded-[24px] overflow-hidden border border-[#E4DFD3] group">
              <iframe
                src={mapSource}
                className="w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                title="MVG Public School location"
              />
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-5 left-5 right-5 bg-white text-[#142440] py-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 shadow-md hover:bg-[#142440] hover:text-white transition-colors"
              >
                <Navigation size={14} /> Get Directions
              </a>
            </div>
          </div>

          {/* RIGHT: FORM OR SUCCESS MESSAGE */}
          <div className="lg:col-span-8">
            {submitted ? (
              <div className="bg-[#FAF8F4] p-12 rounded-[28px] border border-[#E4DFD3] flex flex-col items-center justify-center text-center space-y-4 min-h-[520px] animate-mvg-fade">
                <CheckCircle2 size={48} className="text-[#B8892B]" strokeWidth={1.5} />
                <h3 className="font-serif-mvg text-3xl text-[#142440]">Inquiry Received</h3>
                <p className="text-[#52607A]">Our counselor will call you shortly on {formData.parentContact}.</p>
                <button onClick={() => setSubmitted(false)} className="text-[#B8892B] font-medium text-xs pt-4 hover:underline">
                  Send another inquiry
                </button>
              </div>
            ) : (
              <div className="bg-[#FAF8F4] p-8 md:p-12 rounded-[28px] border border-[#E4DFD3]">
                <div className="mb-10">
                  <h3 className="font-serif-mvg text-2xl text-[#142440]">Inquiry Form</h3>
                  <p className="text-[#8A93A6] text-xs mt-2">Fill this form and our counselor will call you back</p>
                </div>

                <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-x-8 gap-y-7">
                  <div className="space-y-1.5">
                    <label className="font-mono-mvg text-[9px] uppercase text-[#8A93A6] tracking-widest">Student Name</label>
                    <input required type="text" placeholder="Enter Full Name" value={formData.studentName} onChange={updateField('studentName')} className={fieldCls} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono-mvg text-[9px] uppercase text-[#8A93A6] tracking-widest">Parent Contact</label>
                    <input required type="tel" placeholder="+91 00000 00000" value={formData.parentContact} onChange={updateField('parentContact')} className={fieldCls} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono-mvg text-[9px] uppercase text-[#8A93A6] tracking-widest">Email Address</label>
                    <input required type="email" placeholder="example@mail.com" value={formData.email} onChange={updateField('email')} className={fieldCls} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono-mvg text-[9px] uppercase text-[#8A93A6] tracking-widest">Applying for Class</label>
                    <select required value={formData.applyingClass} onChange={updateField('applyingClass')} className={`${fieldCls} appearance-none`}>
                      <option value="">Select Class</option>
                      <option>Grade 11 - Science</option>
                      <option>Grade 11 - Commerce</option>
                      <option>Grade 11 - Arts</option>
                      <option>Other Grades</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="font-mono-mvg text-[9px] uppercase text-[#8A93A6] tracking-widest">Your Message</label>
                    <textarea rows="3" placeholder="How can we help you?" value={formData.message} onChange={updateField('message')} className={`${fieldCls} resize-none`} />
                  </div>

                  <div className="md:col-span-2 mt-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#142440] text-white p-4 rounded-xl font-medium text-sm hover:bg-[#0D1830] transition-colors flex items-center justify-center gap-3 group disabled:opacity-70"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <>
                          Submit Application <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                        </>
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