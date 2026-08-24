"use client"
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Type, Image as ImageIcon, Phone, Mail, Globe, Download, 
  Paintbrush, Calendar, Upload, Sparkles, Layers,
  Layout, CheckSquare, Square, Palette, MousePointer2
} from 'lucide-react';

// --- TEMPLATES CONFIGURATION ---
const templates = {
  modernEditorial: {
    name: "Modern Editorial",
    bg: "#ffffff",
    accent: "#6366F1",
    dark: "#0f172a",
    components: { header: true, headline: true, badge: true, image: true, footer: true }
  },
  minimalistClassic: {
    name: "Minimalist Classic",
    bg: "#fefdf9",
    accent: "#b54d24",
    dark: "#4a2c3a",
    components: { header: false, headline: true, badge: false, image: true, footer: true }
  }
};

export default function SocialMediaDesigner() {
  const [selectedTemplate, setSelectedTemplate] = useState('modernEditorial');
  const [mainText, setMainText] = useState("ADMISSIONS OPEN");
  const [subText, setSubText] = useState("Igniting Curiosity, Shaping Futures");
  const [academicYear, setAcademicYear] = useState("2025 - 2026");
  const [centralImage, setCentralImage] = useState("https://images.unsplash.com/photo-1543269664-76bc3997d9ea?q=80&w=2070");
  const [accentColor, setAccentColor] = useState(templates.modernEditorial.accent);
  const [bgColor, setBgColor] = useState(templates.modernEditorial.bg);
  const [visibleComponents, setVisibleComponents] = useState(templates.modernEditorial.components);

  const postRef = useRef(null);

  // Sync state when template changes
  const changeTemplate = (key) => {
    setSelectedTemplate(key);
    setAccentColor(templates[key].accent);
    setBgColor(templates[key].bg);
    setVisibleComponents(templates[key].components);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setCentralImage(URL.createObjectURL(file));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row">
      
      {/* --- SIDEBAR --- */}
      <div className="w-full lg:w-[400px] bg-[#0c0c0c] border-r border-white/5 p-6 overflow-y-auto h-screen">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#6366F1] rounded-xl flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <h1 className="font-bold tracking-tight">Post Studio</h1>
        </div>

        <div className="space-y-6">
          {/* Template Picker */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 block">Templates</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(templates).map(key => (
                <button 
                  key={key}
                  onClick={() => changeTemplate(key)}
                  className={`py-2 text-[10px] font-bold rounded-lg border ${selectedTemplate === key ? 'bg-white text-black' : 'border-white/10 text-gray-400'}`}
                >
                  {templates[key].name}
                </button>
              ))}
            </div>
          </div>

          {/* Text Inputs */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block">Content</label>
            <input value={mainText} onChange={(e) => setMainText(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm" placeholder="Headline" />
            <input value={subText} onChange={(e) => setSubText(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm" placeholder="Tagline" />
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Media</label>
            <div className="relative border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors">
              <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Upload size={20} className="mx-auto mb-2 text-gray-500" />
              <span className="text-[10px] font-bold uppercase">Change Image</span>
            </div>
          </div>

          {/* Component Toggles */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Toggle Parts</label>
            <div className="space-y-2">
              {Object.keys(visibleComponents).map(comp => (
                <button 
                  key={comp}
                  onClick={() => setVisibleComponents(prev => ({...prev, [comp]: !prev[comp]}))}
                  className="w-full flex justify-between items-center bg-white/5 p-3 rounded-lg text-[10px] font-bold uppercase tracking-widest"
                >
                  {comp} {visibleComponents[comp] ? <CheckSquare size={14} className="text-indigo-500" /> : <Square size={14} />}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="flex gap-4">
             <div className="flex-1">
               <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Accent</label>
               <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-full h-10 rounded bg-transparent border-none cursor-pointer" />
             </div>
             <div className="flex-1">
               <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Canvas</label>
               <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full h-10 rounded bg-transparent border-none cursor-pointer" />
             </div>
          </div>

          <button className="w-full bg-indigo-600 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 mt-4">
            <Download size={18} /> Download PNG
          </button>
        </div>
      </div>

      {/* --- PREVIEW --- */}
      <main className="flex-1 flex items-center justify-center p-4 lg:p-12">
        <div 
          ref={postRef}
          style={{ backgroundColor: bgColor }}
          className="relative w-full max-w-[500px] aspect-square shadow-[0_50px_100px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col"
        >
          {/* Editorial Header */}
          {visibleComponents.header && (
            <div className="absolute top-0 right-0 w-2/3 h-20 bg-white rounded-bl-[3rem] z-20 flex items-center justify-end px-8 shadow-sm">
               <span className="text-black font-black italic tracking-tighter text-lg uppercase">MVG ACADEMY</span>
            </div>
          )}

          {/* Image Area */}
          {visibleComponents.image && (
            <div className="relative h-[60%] w-full overflow-hidden">
               <img src={centralImage} className="w-full h-full object-cover" alt="preview" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
               
               {visibleComponents.badge && (
                  <div className="absolute bottom-4 left-6 px-4 py-1 rounded-full text-[10px] font-bold text-white border border-white/30 backdrop-blur-md" style={{ backgroundColor: accentColor }}>
                    SESSION {academicYear}
                  </div>
               )}
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 bg-white p-8 flex flex-col justify-center relative z-10 -mt-8 rounded-tr-[4rem] shadow-[-10px_-10px_30px_rgba(0,0,0,0.05)]">
            {visibleComponents.headline && (
              <h2 className="text-4xl font-black leading-none tracking-tighter text-slate-900 uppercase mb-3">
                {mainText}
              </h2>
            )}
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l-2 pl-3" style={{ borderLeftColor: accentColor }}>
              {subText}
            </p>
          </div>

          {/* Footer Bar */}
          {visibleComponents.footer && (
            <div className="h-14 w-full bg-[#0f172a] flex items-center justify-between px-8">
              <div className="flex items-center gap-2 text-[10px] font-bold">
                <Phone size={12} style={{ color: accentColor }} /> +91 141 2345678
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter">
                <Globe size={12} style={{ color: accentColor }} /> mvgacademy.com
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}