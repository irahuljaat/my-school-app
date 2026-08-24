'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { useColors } from '../components/ColorComponent';
import { 
  HiOutlineArrowLeft, HiOutlinePhotograph, HiOutlineCalendar, 
  HiOutlineEye 
} from 'react-icons/hi';

export default function StudentGalleryPage() {
  const colors = useColors();
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);

  // School Amber/Yellow Theme Accent matching Dashboard, Homework, Notices, Marks, Syllabus & Report Cards
  const primaryThemeColor = '#EAB308';

  useEffect(() => {
    const sessionData = localStorage.getItem('studentSession');
    if (!sessionData) {
      router.replace('/studentlogin');
      return;
    }
    setStudent(JSON.parse(sessionData));

    const fetchGallery = async () => {
      try {
        // Fetch all documents from the direct "gallery" collection
        const galleryRef = collection(db, 'gallery');
        const querySnapshot = await getDocs(galleryRef);

        const parsedGallery = [];

        querySnapshot.forEach((docSnap) => {
          const dateKey = docSnap.id; // e.g. "2026-02-22"
          const data = docSnap.data();

          // Extract all fields that start with "image" (image1, image2, image3, etc.)
          Object.keys(data).forEach((key) => {
            if (key.toLowerCase().startsWith('image') && data[key]) {
              parsedGallery.push({
                id: `${dateKey}-${key}`,
                date: dateKey,
                imageUrl: data[key],
                label: key.toUpperCase()
              });
            }
          });
        });

        // Sort by date descending (newest first)
        parsedGallery.sort((a, b) => new Date(b.date) - new Date(a.date));
        setGalleryItems(parsedGallery);

      } catch (err) {
        console.error('Error fetching gallery images:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-white font-bold tracking-widest uppercase">
        Loading Campus Gallery...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden bg-slate-950 text-slate-100 transition-colors duration-500">
      
      {/* Background Glow Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[140px] opacity-10 pointer-events-none -mr-20 -mt-20" style={{ backgroundColor: primaryThemeColor }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[140px] opacity-10 pointer-events-none -ml-20 -mb-20" style={{ backgroundColor: primaryThemeColor }} />

      <div className="max-w-[1200px] mx-auto relative z-10 space-y-6">
        
        {/* HEADER */}
        <header className="rounded-[28px] border border-slate-800 shadow-xl p-5 sm:p-6 bg-slate-900/90 backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] opacity-10 pointer-events-none" style={{ backgroundColor: primaryThemeColor }} />

          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xl transition shadow-sm cursor-pointer border border-slate-700"
            >
              <HiOutlineArrowLeft />
            </button>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500 block">
                MVG Campus Memories
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                School Photo Gallery
              </h1>
            </div>
          </div>

          <div className="px-4 py-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs font-black text-slate-200 uppercase flex items-center gap-2">
            <HiOutlinePhotograph className="text-lg text-yellow-400" />
            {galleryItems.length} Moments Captured
          </div>
        </header>

        {/* GALLERY GRID */}
        {galleryItems.length === 0 ? (
          <div className="bg-slate-900/90 backdrop-blur-md rounded-[32px] p-12 text-center border border-slate-800 space-y-3 shadow-xl">
            <div className="w-16 h-16 bg-yellow-500/10 text-yellow-400 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-inner border border-yellow-500/20">
              <HiOutlinePhotograph />
            </div>
            <h3 className="text-lg font-black text-white uppercase">No Photos Found</h3>
            <p className="text-xs text-slate-400 font-medium">There are no school event photos uploaded in the gallery right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => setSelectedImage(item)}
                className="group bg-slate-900/90 backdrop-blur-md rounded-[32px] p-4 border border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer space-y-4 relative overflow-hidden"
              >
                {/* Accent Top Border */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: primaryThemeColor }}
                />

                <div className="relative rounded-2xl overflow-hidden bg-slate-950 h-64 border border-slate-800">
                  <img 
                    src={item.imageUrl} 
                    alt="School Event" 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-black text-xs uppercase tracking-widest gap-2">
                    <HiOutlineEye className="text-xl text-yellow-400" /> View Fullscreen
                  </div>
                </div>

                <div className="flex items-center justify-between px-2 pb-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <HiOutlineCalendar className="text-yellow-400 text-base" />
                    <span>{item.date}</span>
                  </div>
                  <span className="px-3 py-1 bg-slate-800 text-slate-300 text-[10px] font-black rounded-full uppercase tracking-widest border border-slate-700">
                    {item.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* FULLSCREEN IMAGE PREVIEW MODAL */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-[32px] p-6 border border-slate-800 overflow-hidden shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-200">
                <HiOutlineCalendar className="text-yellow-400 text-base" />
                Event Date: {selectedImage.date}
              </div>
              <button 
                onClick={() => setSelectedImage(null)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-black flex items-center justify-center cursor-pointer border border-slate-700 transition"
              >
                ✕
              </button>
            </div>
            
            <div className="rounded-2xl overflow-hidden bg-slate-950 max-h-[75vh] flex items-center justify-center border border-slate-800 p-2">
              <img src={selectedImage.imageUrl} alt="Zoomed View" className="max-w-full max-h-[72vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}