// components/Hero.js
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative h-[85vh] w-full flex items-center justify-center">
      {/* priority attribute loads this image FIRST */}
      <Image 
        src="/hero-bg.jpg" 
        alt="School Campus" 
        fill 
        priority 
        className="object-cover"
        sizes="100vw"
        quality={75} // Reduced quality for faster load
      />
      <div className="absolute inset-0 bg-slate-900/40" />
      <div className="relative z-10 text-center text-white px-4">
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">MVG Public School</h1>
        <p className="text-lg font-medium opacity-90 max-w-lg mx-auto">Empowering young minds through excellence, integrity, and innovation.</p>
      </div>
    </section>
  );
}