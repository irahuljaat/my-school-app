"use client"
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config'; 
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { 
  Phone, Mail, MapPin, Facebook, Instagram, Youtube, 
  Calendar, LayoutList, Table as TableIcon, Sparkles, Image as ImageIcon 
} from 'lucide-react';

export default function AcademicCalendarPage() {
  const [configData, setConfigData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // Default set to 'table'
  const [selectedCategory, setSelectedCategory] = useState('All');

  const activeSession = "2026-27"; 

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Fetch site config
        const configSnap = await getDoc(doc(db, "site_data", "config"));
        if (configSnap.exists()) setConfigData(configSnap.data());

        // 2. Fetch events from sessions > {activeSession} > events
        const eventsColRef = collection(db, "sessions", activeSession, "events");
        const eventSnapshot = await getDocs(eventsColRef);
        const fetchedEvents = eventSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching academic calendar events:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [activeSession]);

  const categories = ['All', ...Array.from(new Set(events.map(e => e.eventType || e.category).filter(Boolean)))];

  const filteredEvents = events.filter(item => {
    const cat = item.eventType || item.category || 'Event';
    const matchCategory = selectedCategory === 'All' || cat.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchCategory;
  });

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FAF8F4] italic font-light tracking-widest text-[#52607A] uppercase text-[10px]">
      Loading Session {activeSession} Events...
    </div>
  );

  return (
    <div className="bg-[#FAF8F4] text-[#142440] antialiased selection:bg-[#B8892B] selection:text-white">
      
      {/* --- TOP CONTACT BAR --- */}
      <div className="hidden lg:block bg-[#142440] text-[#E9DCBD] py-3 relative z-[110] border-b border-[#E4DFD3]">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.32em]">
          <div className="flex gap-8">
            <span className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone size={12} className="text-[#B8892B]" /> {configData?.phone || "+91 141 3152600"}
            </span>
            <span className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail size={12} className="text-[#B8892B]" /> {configData?.email || "mvgschooljaipur@gmail.com"}
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
        {/* Background Image & Overlays */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://res.cloudinary.com/db6ssceun/image/upload/v1766231170/DSC_0614_qr56qm.jpg" 
            alt="Campus Background Banner" 
            className="w-full h-full object-cover opacity-35 scale-105 transform" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#142440] via-[#142440]/90 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="max-w-2xl">
            <span className="text-[10px] font-mono uppercase tracking-[0.32em] text-[#B8892B] mb-6 block">
              
            </span>
            <h1 className="text-5xl md:text-[6.5rem] font-serif font-bold tracking-tight text-white leading-[1.05] mb-8">
              Academic <span className="italic font-light text-[#E9DCBD]">Calendar</span> <span className="text-[#B8892B]">{activeSession}.</span>
            </h1>
            <p className="text-[#E9DCBD] text-lg font-light leading-relaxed">
               School schedules fetched securely from session documents. Displayed in an organized master tabular record.
            </p>
          </div>
        </div>
      </section>

      {/* --- CONTROLS & DISPLAY SECTION --- */}
      <section className="py-20 md:py-28 px-8 bg-[#F1ECE1]">
        <div className="max-w-7xl mx-auto">
          
          {/* Filters & View Switcher Toolbar */}
          <div className="bg-[#FAF8F4] p-6 rounded-[28px] border border-[#E4DFD3] mb-12 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-mono uppercase tracking-[0.32em] text-[#52607A] mr-2">Filter Type:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-[16px] text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${
                    selectedCategory === cat 
                      ? 'bg-[#142440] text-[#FAF8F4]' 
                      : 'bg-[#F1ECE1] text-[#52607A] hover:text-[#142440]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-[#F1ECE1] p-1.5 rounded-[20px] border border-[#E4DFD3]">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-[16px] text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-2 transition-all ${
                  viewMode === 'table' ? 'bg-[#142440] text-white' : 'text-[#52607A] hover:text-[#142440]'
                }`}
              >
                <TableIcon size={14} /> Tabular View
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-[16px] text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-2 transition-all ${
                  viewMode === 'grid' ? 'bg-[#142440] text-white' : 'text-[#52607A] hover:text-[#142440]'
                }`}
              >
                <LayoutList size={14} /> Cards View
              </button>
            </div>
          </div>

          {/* EMPTY STATE */}
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-[24px] border border-[#E4DFD3]">
              <p className="text-xs font-mono uppercase tracking-[0.32em] text-[#52607A]">
                No events found in Firestore for session {activeSession}.
              </p>
            </div>
          ) : viewMode === 'table' ? (
            /* --- TABULAR FORMAT VIEW (DEFAULT) --- */
            <div className="bg-white border border-[#E4DFD3] rounded-[24px] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F4] border-b border-[#E4DFD3] text-[10px] font-mono uppercase tracking-[0.32em] text-[#52607A]">
                      <th className="py-5 px-6">Event Title</th>
                      <th className="py-5 px-6">Category</th>
                      <th className="py-5 px-6">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4DFD3] text-xs font-light text-[#142440]">
                    {filteredEvents.map((item) => (
                      <tr key={item.id} className="hover:bg-[#FAF8F4]/50 transition-colors">
                        <td className="py-5 px-6 font-serif font-bold text-sm text-[#142440] flex items-center gap-3">
                          <span>{item.title}</span>
                          {item.img && (
                            <a 
                              href={item.img} 
                              target="_blank" 
                              rel="noreferrer" 
                              title="View Event Banner Image"
                              className="w-7 h-7 rounded-full border border-[#E4DFD3] flex items-center justify-center text-[#B8892B] bg-[#FAF8F4] hover:bg-[#B8892B] hover:text-white transition-all shrink-0"
                            >
                              <ImageIcon size={14} />
                            </a>
                          )}
                        </td>
                        <td className="py-5 px-6 font-mono text-[10px] uppercase tracking-widest text-[#B8892B]">
                          {item.eventType || 'Event'}
                        </td>
                        <td className="py-5 px-6 font-mono text-xs text-[#52607A]">
                          {item.date || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* --- CARDS VIEW --- */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white border border-[#E4DFD3] rounded-[24px] overflow-hidden hover:border-[#B8892B] transition-all flex flex-col justify-between"
                >
                  {item.img && (
                    <div className="relative aspect-video w-full bg-[#FAF8F4] overflow-hidden border-b border-[#E4DFD3]">
                      <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-mono uppercase tracking-[0.32em] text-[#B8892B] px-3 py-1 bg-[#FAF8F4] rounded-full border border-[#E4DFD3]">
                          {item.eventType || 'Event'}
                        </span>
                        <span className="text-xs font-mono text-[#52607A]">
                          {item.date}
                        </span>
                      </div>
                      <h3 className="text-xl font-serif font-bold text-[#142440] mb-2">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

    </div>
  );
}