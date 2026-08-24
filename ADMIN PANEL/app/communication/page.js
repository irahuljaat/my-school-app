"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { 
  HiOutlineChatAlt2, HiSearch, HiUpload, HiX, HiPlus, 
  HiUserGroup, HiOutlinePhone, HiDocumentText, HiOutlinePaperAirplane,
  HiPencilAlt, HiTrash
} from 'react-icons/hi';

export default function CommunicationPage() {
  const [target, setTarget] = useState('all'); 
  const [activeSession, setActiveSession] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [teachers, setTeachers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  
  // SMS Specific States
  const [manualContact, setManualContact] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [contactList, setContactList] = useState([]); 
  const [message, setMessage] = useState('');

  // 1. INITIAL DATA LOAD (SESSION BASED)
  useEffect(() => {
    const initData = async () => {
      try {
        const sessionDoc = await getDoc(doc(db, "config", "settings"));
        if (sessionDoc.exists()) {
          const session = sessionDoc.data().activeSession;
          setActiveSession(session);
          
          // Fetch students from the specific session
          const studentSnap = await getDocs(collection(db, "sessions", session, "students"));
          setStudents(studentSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
        
        // Fetch global data
        const gradesSnap = await getDocs(collection(db, "grades"));
        setGrades(gradesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const teachersSnap = await getDocs(collection(db, "teachers"));
        setTeachers(teachersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) { console.error("Load Error:", err); }
    };
    initData();
  }, []);

  // 2. EXCEL PARSER
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      // Look for Phone/Contact/Mobile columns
      const extractedNumbers = data
        .map(row => (row.Phone || row.Contact || row.Mobile || row.phone || row.mobile)?.toString().trim())
        .filter(num => num && num.length >= 10);
      
      setContactList([...new Set([...contactList, ...extractedNumbers])]);
    };
    reader.readAsBinaryString(file);
  };

  // 3. CONTACT MANAGER LOGIC
  const addOrUpdateContact = () => {
    const cleanNum = manualContact.replace(/\D/g, ''); // Remove non-digits
    if (cleanNum.length < 10) return alert("Enter a valid 10-digit number");

    if (editingIndex !== null) {
      const updatedList = [...contactList];
      updatedList[editingIndex] = cleanNum;
      setContactList(updatedList);
      setEditingIndex(null);
    } else {
      setContactList([...new Set([...contactList, cleanNum])]);
    }
    setManualContact('');
  };

  const startEditing = (num, index) => {
    setManualContact(num);
    setEditingIndex(index);
  };

  const removeContact = (index) => {
    setContactList(contactList.filter((_, i) => i !== index));
    if (editingIndex === index) {
        setEditingIndex(null);
        setManualContact('');
    }
  };

  // 4. SMS DISPATCHER
  const handleSendSMS = async (e) => {
    e.preventDefault();
    if (!activeSession) return alert("Session missing");
    setLoading(true);

    let finalNumbers = [...contactList];

    // If no manual contacts, pull from selected target group
    if (finalNumbers.length === 0) {
      if (target === 'teachers') finalNumbers = teachers.map(t => t.phone).filter(n => n);
      if (target === 'all') finalNumbers = students.map(s => s.parentPhone).filter(n => n);
    }

    if (finalNumbers.length === 0) {
        alert("No recipients found for this target.");
        setLoading(false);
        return;
    }

    try {
      // 1. SAVE LOG TO FIREBASE
      const logRef = collection(db, "sessions", activeSession, "sms_logs");
      await addDoc(logRef, {
        message: message,
        recipientCount: finalNumbers.length,
        targetGroup: target,
        recipients: finalNumbers.slice(0, 50), // Store first 50 for record
        createdAt: serverTimestamp()
      });

      // 2. TRIGGER API (Placeholder)
      console.log("API CALL: Sending to ", finalNumbers);
      
      alert(`Success: Message queued for ${finalNumbers.length} recipients.`);
      setMessage('');
      setContactList([]);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen font-sans">
      <header className="flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase flex items-center gap-3">
            <HiOutlineChatAlt2 className="text-emerald-500" /> Comm Center
          </h1>
          <p className="text-emerald-600 font-bold text-[10px] tracking-[0.3em] uppercase mt-1 italic">
            Session Database: {activeSession}
          </p>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* SMS COMPOSER */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSendSMS} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Target Audience</label>
              <div className="grid grid-cols-3 gap-2">
                {['all', 'teachers', 'class'].map(t => (
                  <button 
                    key={t} type="button" onClick={() => {setTarget(t); setContactList([]);}}
                    className={`p-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${target === t ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-white border-slate-200 text-slate-500'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {target === 'class' && (
              <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-emerald-500 shadow-sm animate-in fade-in slide-in-from-top-1">
                <option value="">Choose Grade/Class...</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.id}</option>)}
              </select>
            )}

            <div className="space-y-4 pt-6 border-t border-slate-100">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Message Content</label>
              <textarea 
                required rows="6" 
                placeholder="Write your SMS message here..." 
                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:border-emerald-500 font-medium leading-relaxed"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              
              <div className="flex justify-between items-center px-2">
                <div className="flex gap-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Chars: <span className={message.length > 160 ? 'text-amber-500' : ''}>{message.length}</span></span>
                    <span className="text-[10px] font-black text-emerald-500 uppercase">Parts: {Math.ceil(message.length / 160) || 0}</span>
                </div>
                {contactList.length > 0 && <span className="text-[10px] font-black text-indigo-500 uppercase">Custom Contacts Active</span>}
              </div>

              <button 
                type="submit"
                disabled={loading || !message}
                className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
              >
                {loading ? "Processing..." : <><HiOutlinePaperAirplane className="rotate-90 text-lg"/> Blast SMS</>}
              </button>
            </div>
          </form>
        </div>

        {/* CONTACT MANAGER */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-7 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
            <h3 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2 ml-1 tracking-widest">
              <HiOutlinePhone className="text-emerald-500" /> Contact Manager
            </h3>

            {/* Manual Entry */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input 
                  type="text" placeholder="Add phone number..." 
                  className={`flex-1 p-3 border rounded-xl outline-none font-bold text-sm transition-all ${editingIndex !== null ? 'bg-amber-50 border-amber-400' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'}`}
                  value={manualContact}
                  onChange={(e) => setManualContact(e.target.value)}
                />
                <button type="button" onClick={addOrUpdateContact} className={`p-3 rounded-xl transition shadow-md ${editingIndex !== null ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white hover:bg-emerald-500'}`}>
                  {editingIndex !== null ? "Update" : <HiPlus />}
                </button>
              </div>
            </div>

            {/* Excel Upload */}
            <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 cursor-pointer hover:bg-emerald-50 transition group">
              <div className="flex items-center gap-3">
                <HiUpload className="text-slate-400 group-hover:text-emerald-600" />
                <span className="text-[10px] font-black text-slate-500 group-hover:text-emerald-700 uppercase">Import Excel (.xlsx)</span>
              </div>
              <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
            </label>

            {/* Chips List */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Recipient List ({contactList.length})</p>
                {contactList.length > 0 && (
                  <button onClick={() => setContactList([])} className="text-[9px] font-bold text-red-400 uppercase hover:underline">Clear List</button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-1 custom-scrollbar">
                {contactList.map((num, idx) => (
                  <div key={idx} className={`flex items-center gap-2 pl-3 pr-1 py-1 rounded-full text-[10px] font-bold border transition ${editingIndex === idx ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                    <span>{num}</span>
                    <div className="flex items-center gap-1">
                       <button type="button" onClick={() => startEditing(num, idx)} className="p-1 hover:text-emerald-500"><HiPencilAlt className="w-3 h-3"/></button>
                       <button type="button" onClick={() => removeContact(idx)} className="p-1 hover:text-red-500"><HiX className="w-3 h-3"/></button>
                    </div>
                  </div>
                ))}
                {contactList.length === 0 && (
                  <div className="w-full py-10 text-center border-2 border-dotted border-slate-100 rounded-[2rem]">
                    <HiUserGroup className="mx-auto text-2xl text-slate-200 mb-2" />
                    <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest">No manual contacts</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-emerald-900 rounded-[2.5rem] p-7 text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10">
                <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Blast Summary</h4>
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-2xl font-black">{contactList.length || (target === 'all' ? students.length : teachers.length)}</p>
                        <p className="text-[9px] font-bold text-emerald-300 uppercase">Total Phones</p>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-emerald-400 tracking-tighter uppercase">{target}</p>
                        <p className="text-[9px] font-bold text-emerald-300 uppercase">Targeting</p>
                    </div>
                </div>
             </div>
             <HiOutlineChatAlt2 className="absolute -bottom-4 -right-4 text-8xl text-white/5 rotate-12" />
          </div>
        </div>
      </div>
    </div>
  );
}