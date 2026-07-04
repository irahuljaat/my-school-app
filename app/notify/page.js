"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { 
  collection, getDocs, doc, getDoc, query, orderBy, limit, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  HiOutlinePaperAirplane, HiSearch, HiClock, HiOutlineDesktopComputer, 
  HiOutlinePhotograph, HiOutlineBell, HiX, HiOutlineCloudUpload, HiUser, HiIdentification
} from 'react-icons/hi';

export default function NotifyPage() {
  const [target, setTarget] = useState('all'); 
  const [activeSession, setActiveSession] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState([]);
  
  const [teachers, setTeachers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [payload, setPayload] = useState({ 
    title: '', body: '', imageUrl: '', targetId: 'all', targetName: 'Whole School' 
  });

  useEffect(() => {
    const initData = async () => {
      try {
        const sessionDoc = await getDoc(doc(db, "config", "settings"));
        if (sessionDoc.exists()) {
          const session = sessionDoc.data().activeSession;
          setActiveSession(session);
          const studentSnap = await getDocs(collection(db, "sessions", session, "students"));
          setStudents(studentSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          fetchHistory(session);
        }
        const gradesSnap = await getDocs(collection(db, "grades"));
        setGrades(gradesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        const teachersSnap = await getDocs(collection(db, "teachers"));
        setTeachers(teachersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) { console.error(err); }
    };
    initData();
  }, []);

  const fetchHistory = async (session) => {
    try {
      const q = query(collection(db, "sessions", session, "notifications"), orderBy("createdAt", "desc"), limit(6));
      const snap = await getDocs(q);
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.log(e) }
  };

  useEffect(() => {
    const queryStr = searchQuery.toLowerCase().trim();
    if (queryStr === "" || target !== 'single') {
      setFilteredStudents([]);
      return;
    }
    const results = students.filter(s => 
      s.name?.toLowerCase().includes(queryStr) || 
      s.srNo?.toString().includes(queryStr) ||
      s.grade?.toLowerCase().includes(queryStr)
    );
    setFilteredStudents(results.slice(0, 5));
  }, [searchQuery, students, target]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'student_preset');

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/db6ssceun/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if(data.secure_url) setPayload(prev => ({ ...prev, imageUrl: data.secure_url }));
    } catch (err) { alert("Upload Failed"); } 
    finally { setUploading(false); }
  };

  // UPDATED DISPATCH FUNCTION
  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!activeSession) return alert("Session not loaded");
    setLoading(true);
    try {
      const notifRef = collection(db, "sessions", activeSession, "notifications");
      await addDoc(notifRef, {
        ...payload,
        imageUrl: payload.imageUrl || "", 
        targetGroup: target,
        fcmStatus: "pending", // This triggers your Cloud Function to send the notification
        createdAt: serverTimestamp()
      });
      alert("Notification Dispatched!");
      setPayload({ title: '', body: '', imageUrl: '', targetId: 'all', targetName: 'Whole School' });
      setSelectedStudent(null);
      setSearchQuery('');
      fetchHistory(activeSession);
    } catch (err) { alert(err.message); } 
    finally { setLoading(false); }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen font-sans">
      <header className="flex justify-between items-end border-b pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase flex items-center gap-3">
            <HiOutlineBell className="text-indigo-600" /> Dispatch Console
          </h1>
          <p className="text-indigo-600 font-bold text-xs tracking-widest uppercase mt-1">Session: {activeSession}</p>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-10">
        <form onSubmit={handleDispatch} className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Audience Selection</label>
            <div className="grid grid-cols-4 gap-2">
              {['all', 'teachers', 'class', 'single'].map(t => (
                <button 
                  key={t} type="button" 
                  onClick={() => {setTarget(t); setSelectedStudent(null); setSearchQuery('');}}
                  className={`p-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${target === t ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[90px]">
            {target === 'single' && !selectedStudent && (
              <div className="relative animate-in fade-in duration-300">
                <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" placeholder="Search by name, SR, or class..." 
                  className="w-full p-5 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-medium" 
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                />
                {filteredStudents.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden ring-8 ring-slate-100/50">
                    {filteredStudents.map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => { 
                          setSelectedStudent(s); 
                          setPayload({...payload, targetId: s.id, targetName: s.name});
                          setSearchQuery('');
                        }} 
                        className="p-4 hover:bg-indigo-50 cursor-pointer border-b last:border-0 flex justify-between items-center group transition"
                      >
                        <div>
                          <p className="font-bold text-sm text-slate-900 group-hover:text-indigo-600">{s.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">SR: {s.srNo}</p>
                        </div>
                        <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-3 py-1 rounded-lg uppercase group-hover:bg-indigo-600 group-hover:text-white transition">
                          {s.grade}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {target === 'single' && selectedStudent && (
              <div className="bg-indigo-600 rounded-3xl p-6 text-white flex items-center justify-between shadow-xl shadow-indigo-100 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
                    <HiUser />
                  </div>
                  <div>
                    <h3 className="text-xl font-black leading-none">{selectedStudent.name}</h3>
                    <div className="flex gap-3 mt-2">
                       <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                          <HiIdentification /> SR: {selectedStudent.srNo}
                       </span>
                       <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-md uppercase tracking-wider">
                          Class: {selectedStudent.grade}
                       </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 bg-white/10 hover:bg-white/30 rounded-full transition"
                >
                  <HiX className="text-xl" />
                </button>
              </div>
            )}

            {target === 'teachers' && (
              <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" onChange={(e) => setPayload({...payload, targetId: e.target.value, targetName: e.target.options[e.target.selectedIndex].text})}>
                <option value="all">All Teachers</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
            {target === 'class' && (
              <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" onChange={(e) => setPayload({...payload, targetId: e.target.value, targetName: `Class ${e.target.value}`})}>
                <option value="">Select Class...</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.id}</option>)}
              </select>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100">
            <input required placeholder="Notification Headline" value={payload.title} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none focus:border-indigo-600" onChange={(e) => setPayload({...payload, title: e.target.value})} />
            <textarea required rows="4" placeholder="Enter message body content..." value={payload.body} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-600 font-medium" onChange={(e) => setPayload({...payload, body: e.target.value})} />
            
            <div className="relative">
              {!payload.imageUrl ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploading ? <p className="text-xs font-black animate-pulse text-indigo-600 uppercase">Uploading...</p> : 
                    <><HiOutlineCloudUpload className="w-8 h-8 text-slate-300 mb-2" /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attach Image</p></>}
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              ) : (
                <div className="relative h-48 w-full rounded-3xl overflow-hidden border bg-slate-50 flex items-center justify-center p-2">
                  <img src={payload.imageUrl} className="max-h-full rounded-2xl object-contain" alt="Preview" />
                  <button onClick={() => setPayload({...payload, imageUrl: ''})} className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg"><HiX /></button>
                </div>
              )}
            </div>

            <button disabled={loading || uploading} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-600 transition flex items-center justify-center gap-3">
              {loading ? "Transmitting..." : "Dispatch Broadcast"}
            </button>
          </div>
        </form>

        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-900 rounded-[2.5rem] p-6 border-[8px] border-slate-800 shadow-2xl">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <HiOutlineDesktopComputer /> Phone Preview
            </p>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-3xl">
               <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] block mb-3">Today • School App</span>
               {payload.imageUrl && <img src={payload.imageUrl} className="w-full h-32 object-cover rounded-xl mb-3 border border-white/10" />}
               <h4 className="font-bold text-white text-sm">{payload.title || "Headline Text"}</h4>
               <p className="text-[11px] text-slate-400 mt-1 line-clamp-3">{payload.body || "Message body will appear here..."}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 ml-2">Recent Logs</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {history.map(h => (
                <div key={h.id} className="bg-white p-4 rounded-2xl border border-slate-100 border-l-4 border-l-indigo-500 shadow-sm">
                  <div className="flex justify-between items-start">
                     <h5 className="font-bold text-xs text-slate-800 uppercase tracking-tighter pr-4">{h.title}</h5>
                     <span className="text-[8px] font-black text-slate-300">{h.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Target: {h.targetName}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}