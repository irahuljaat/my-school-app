import Image from 'next/image';
import Link from 'next/link';
import { 
  HiOutlineRocketLaunch, 
  HiOutlineAcademicCap, 
  HiOutlineCpuChip, 
  HiOutlineArrowRight,
  HiOutlineShieldCheck,
  HiOutlineBeaker
} from 'react-icons/hi2';

export default function HomePage() {
  return (
    <div className="flex flex-col w-full">
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[85vh] flex items-center pt-20 overflow-hidden bg-slate-900">
        {/* Background Optimized Image */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://res.cloudinary.com/db6ssceun/image/upload/v1766670728/WhatsApp_Image_2025-12-25_at_19.21.37_rd3idi.jpg" // Replace with your school campus image link
            alt="MVG School Jaipur Campus"
            fill
            priority
            className="object-cover opacity-30 grayscale-[50%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-900" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-400/30 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-indigo-100 text-[10px] font-black uppercase tracking-widest">RBSE English Medium • Admissions 2026-27</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tighter">
              Empowering <span className="text-indigo-400">Jaipur's</span> Next Generation
            </h1>
            
            <p className="text-lg text-slate-300 max-w-lg leading-relaxed font-medium">
              Join MVG School, the premier Sr. Sec. institution where traditional RBSE values meet modern Robotics and STEM education.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/Admission/apply" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20">
                Apply Now
              </Link>
              <Link href="/About/why-us" className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-2xl font-bold transition-all">
                Why Choose Us?
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- ROBOTICS & CORE FEATURES --- */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-indigo-600 font-black uppercase tracking-[0.3em] text-xs">Innovation in Education</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              A Future-Ready Curriculum
            </h3>
            <p className="text-slate-500 font-medium">Focused on practical learning and academic excellence in Jaipur.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<HiOutlineCpuChip className="w-8 h-8" />}
              title="Robotics & AI"
              desc="Hands-on coding and hardware building starting from middle school to prepare for the tech future."
            />
            <FeatureCard 
              icon={<HiOutlineBeaker className="w-8 h-8" />}
              title="Modern Labs"
              desc="Advanced Science and STEM labs designed for practical experimentation under RBSE guidelines."
            />
            <FeatureCard 
              icon={<HiOutlineAcademicCap className="w-8 h-8" />}
              title="Sr. Sec. Success"
              desc="Exceptional results in Science, Commerce, and Arts streams with dedicated faculty support."
            />
          </div>
        </div>
      </section>

      {/* --- QUICK INFO CTA --- */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-indigo-600 rounded-[3rem] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl shadow-indigo-200">
            <div className="text-center md:text-left space-y-4">
              <h4 className="text-3xl font-black text-white tracking-tight">Visit Our Jaipur Campus</h4>
              <p className="text-indigo-100 font-medium opacity-90 max-w-md">
                Experience the best English Medium school environment for your child's growth.
              </p>
            </div>
            <Link 
              href="/contact" 
              className="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-900 hover:text-white transition-all whitespace-nowrap"
            >
              Get Directions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// Reusable Lite Card Component
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-8 rounded-[2rem] border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-2xl transition-all duration-300 group">
      <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors mb-6">
        {icon}
      </div>
      <h4 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{title}</h4>
      <p className="text-slate-500 font-medium leading-relaxed text-sm">{desc}</p>
    </div>
  );
}