'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { 
    HiOutlinePhotograph, HiOutlineCalendar, HiOutlinePlus, 
    HiOutlineX, HiOutlineViewGrid, HiOutlineDocumentText,
    HiChevronLeft, HiChevronRight, HiOutlineSparkles, HiOutlineTrash
} from 'react-icons/hi';
import * as XLSX from 'xlsx';

const CLOUD_NAME = "db6ssceun"; // Replace with your Cloudinary Cloud Name
const UPLOAD_PRESET = "student_preset"; // Replace with your "Unsigned" Upload Preset

export default function EventsPlanner() {
    const [mounted, setMounted] = useState(false);
    const [activeSession, setActiveSession] = useState(null);
    const [gallery, setGallery] = useState([]);
    const [sessionEvents, setSessionEvents] = useState([]);
    
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(null); 
    
    const [functionName, setFunctionName] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    // Hydration & Session Init
    useEffect(() => {
        setMounted(true);
        const unsub = onSnapshot(doc(db, 'config', 'settings'), (docSnap) => {
            if (docSnap.exists()) setActiveSession(docSnap.data().activeSession);
        });
        return () => unsub();
    }, []);

    // Optimized Fetching
    useEffect(() => {
        if (!activeSession || !mounted) return;
        const qGallery = query(collection(db, 'sessions', activeSession, 'gallery'), orderBy('createdAt', 'desc'));
        const unsubGallery = onSnapshot(qGallery, (snap) => setGallery(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        const qEvents = query(collection(db, 'sessions', activeSession, 'calendar'), orderBy('date', 'asc'));
        const unsubEvents = onSnapshot(qEvents, (snap) => {
            setSessionEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => { unsubGallery(); unsubEvents(); };
    }, [activeSession, mounted]);

    // Fast Navigation Logic
    const handleNext = useCallback((e) => {
        e?.stopPropagation();
        setSelectedIndex((prev) => (prev + 1) % gallery.length);
    }, [gallery.length]);

    const handlePrev = useCallback((e) => {
        e?.stopPropagation();
        setSelectedIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
    }, [gallery.length]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (selectedIndex === null) return;
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') setSelectedIndex(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex, handleNext, handlePrev]);

    const handleExcelUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeSession) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const data = XLSX.utils.sheet_to_json(XLSX.read(evt.target.result, { type: 'binary' }).Sheets[XLSX.read(evt.target.result, { type: 'binary' }).SheetNames[0]]);
            for (const item of data) {
                await addDoc(collection(db, 'sessions', activeSession, 'calendar'), {
                    date: String(item.date || item.Date),
                    event: String(item.event || item.Event),
                    uploadedAt: new Date().toISOString()
                });
            }
            alert("Calendar data imported!");
        };
        reader.readAsBinaryString(file);
    };

    const handleBulkUpload = async (e) => {
        e.preventDefault();
        if (selectedFiles.length === 0 || !functionName || !activeSession) return;
        setIsUploading(true);
        try {
            for (const file of selectedFiles) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', UPLOAD_PRESET);
                formData.append('folder', `gallery/${activeSession}`);
                const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
                const data = await resp.json();
                if (data.secure_url) {
                    await addDoc(collection(db, 'sessions', activeSession, 'gallery'), {
                        functionName, imageUrl: data.secure_url, createdAt: new Date().toISOString()
                    });
                }
            }
            setSelectedFiles([]); setFunctionName(''); setIsAdminOpen(false);
            alert("Album Published!");
        } catch (err) { alert("Upload Failed"); }
        finally { setIsUploading(false); }
    };

    const deleteItem = async (col, id) => {
        if(window.confirm("Are you sure you want to delete this?")) {
            await deleteDoc(doc(db, 'sessions', activeSession, col, id));
        }
    }

    // Helper: Fixed Optimization (Shows complete image)
    const getOptimizedUrl = (url, type) => {
        if (!url) return "";
        // Changed c_thumb,g_face to c_limit to avoid facial zooming
        if (type === 'thumb') return url.replace('/upload/', '/upload/c_limit,w_600,f_auto,q_auto/');
        if (type === 'full') return url.replace('/upload/', '/upload/f_auto,q_auto,w_1600/');
        return url;
    };

    const festivals = [
        { name: "Christmas", date: "Dec 25", icon: "🎄" },
        { name: "New Year", date: "Jan 01", icon: "🎆" },
        { name: "Republic Day", date: "Jan 26", icon: "🇮🇳" },
        { name: "Holi", date: "Mar 14", icon: "🎨" }
    ];

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#FDFDFF] text-slate-900 pb-20 font-sans selection:bg-indigo-100">
            
            {/* LIGHTBOX */}
            {selectedIndex !== null && (
                <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-2xl flex items-center justify-center animate-in fade-in zoom-in duration-200" onClick={() => setSelectedIndex(null)}>
                    <button className="absolute top-8 right-8 text-slate-900 hover:rotate-90 transition-transform duration-300 z-[110]"><HiOutlineX className="w-10 h-10" /></button>
                    <button onClick={handlePrev} className="absolute left-4 md:left-8 p-4 rounded-full bg-slate-100 hover:bg-indigo-600 hover:text-white transition-all z-[110]"><HiChevronLeft className="w-8 h-8" /></button>
                    
                    <div className="w-full h-full flex flex-col items-center justify-center p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="relative group max-h-[75vh]">
                            <img 
                                src={getOptimizedUrl(gallery[selectedIndex]?.imageUrl, 'full')} 
                                className="max-h-[75vh] w-auto object-contain rounded-3xl shadow-2xl" 
                                alt=""
                            />
                            {gallery[selectedIndex + 1] && <link rel="prefetch" href={getOptimizedUrl(gallery[selectedIndex + 1].imageUrl, 'full')} />}
                        </div>
                        <div className="mt-8 text-center">
                            <h4 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{gallery[selectedIndex]?.functionName}</h4>
                            <p className="text-indigo-500 font-bold text-xs uppercase tracking-widest mt-2">Memory {selectedIndex + 1} of {gallery.length}</p>
                        </div>
                    </div>

                    <button onClick={handleNext} className="absolute right-4 md:right-8 p-4 rounded-full bg-slate-100 hover:bg-indigo-600 hover:text-white transition-all z-[110]"><HiChevronRight className="w-8 h-8" /></button>
                </div>
            )}

            <div className="max-w-[1400px] mx-auto px-6 py-12">
                <header className="mb-16">
                    <h1 className="text-7xl font-black tracking-tighter text-slate-900 leading-none">Journal.</h1>
                    <div className="flex items-center gap-3 mt-4">
                        <span className="h-0.5 w-12 bg-indigo-600"></span>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px]">Active Session {activeSession}</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* LEFT SIDE: TIMELINE & FESTIVALS */}
                    <aside className="lg:col-span-3 space-y-8">
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200">
                            <div className="flex items-center gap-2 mb-6 opacity-80">
                                <HiOutlineSparkles className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Upcoming Festivals</span>
                            </div>
                            <div className="space-y-5">
                                {festivals.map((f, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{f.icon}</span>
                                            <span className="text-sm font-bold">{f.name}</span>
                                        </div>
                                        <span className="text-[10px] font-black opacity-60">{f.date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2"><HiOutlineCalendar className="text-indigo-500" /> Session Plan</h3>
                            <div className="space-y-8 max-h-[400px] overflow-y-auto no-scrollbar">
                                {sessionEvents.map((ev, i) => (
                                    <div key={i} className="relative pl-6 border-l border-slate-100 group flex justify-between items-start">
                                        <div>
                                            <p className="text-[9px] font-black text-indigo-400 uppercase">{ev.date}</p>
                                            <h4 className="font-bold text-slate-700 text-xs leading-tight mt-1">{ev.event}</h4>
                                        </div>
                                        {isAdminOpen && (
                                            <button onClick={() => deleteItem('calendar', ev.id)} className="text-slate-300 hover:text-red-500 transition"><HiOutlineTrash/></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* RIGHT SIDE: PHOTO GRID */}
                    <main className="lg:col-span-9">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><HiOutlineViewGrid className="text-indigo-500" /> Experience Hub</h3>
                        </div>
                        <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
                            {gallery.map((img, index) => (
                                <div key={img.id} className="relative break-inside-avoid rounded-3xl overflow-hidden group shadow-sm hover:shadow-2xl transition-all duration-500">
                                    <img 
                                        src={getOptimizedUrl(img.imageUrl, 'thumb')} 
                                        className="w-full h-auto object-cover cursor-pointer" 
                                        onClick={() => setSelectedIndex(index)}
                                        loading="lazy"
                                    />
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {isAdminOpen && (
                                            <button onClick={() => deleteItem('gallery', img.id)} className="bg-white/90 p-2 rounded-full text-red-500 hover:bg-red-500 hover:text-white transition shadow-lg"><HiOutlineTrash/></button>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900/60 via-transparent p-6 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white font-black text-[10px] uppercase tracking-widest">{img.functionName}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </main>
                </div>
            </div>

            {/* ADMIN FAB */}
            <button onClick={() => setIsAdminOpen(true)} className="fixed bottom-10 right-10 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition z-[110]"><HiOutlinePlus className="w-6 h-6" /></button>

            {/* ADMIN STUDIO */}
            {isAdminOpen && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-xl z-[120] flex justify-end animate-in slide-in-from-right duration-500">
                    <div className="w-full max-w-lg bg-white h-full shadow-2xl p-12 overflow-y-auto">
                        <div className="flex justify-between items-center mb-16">
                            <h2 className="text-4xl font-black tracking-tighter">Studio.</h2>
                            <button onClick={() => setIsAdminOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition"><HiOutlineX className="w-8 h-8"/></button>
                        </div>
                        <div className="space-y-12">
                            <div className="bg-slate-50 p-8 rounded-[2rem]">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><HiOutlineDocumentText/> 01. Sync Planner</p>
                                <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} className="text-xs font-bold text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-indigo-600 file:text-white file:uppercase cursor-pointer" />
                            </div>
                            <div className="space-y-6">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><HiOutlinePhotograph/> 02. Upload Memories</p>
                                <input type="text" placeholder="Title of Event" className="w-full pb-4 bg-transparent border-b-2 border-slate-100 font-bold text-xl outline-none focus:border-indigo-600 transition" value={functionName} onChange={e => setFunctionName(e.target.value)} />
                                <input type="file" multiple className="w-full p-8 border-2 border-dashed border-slate-100 rounded-[2rem] text-xs font-bold cursor-pointer hover:bg-slate-50 transition" onChange={e => setSelectedFiles(Array.from(e.target.files))} />
                                <button onClick={handleBulkUpload} disabled={isUploading || !functionName || selectedFiles.length === 0} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 disabled:opacity-50 hover:bg-indigo-700 transition">
                                    {isUploading ? "Syncing..." : "Publish Album"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}