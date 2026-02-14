"use client";

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { 
  HiOutlineUser, HiOutlineLockClosed, HiOutlineLightningBolt, 
  HiOutlineSave, HiOutlineBell, HiOutlineCake, HiOutlineCash,
  HiOutlineUserRemove, HiOutlineDatabase, HiOutlineChevronRight
} from 'react-icons/hi';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState("");

  // 1. Auth/Profile State
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [passwords, setPasswords] = useState({ current: "", new: "" });

  // 2. Automation State (Session-Based)
  const [automations, setAutomations] = useState({
    attendance: { 
        enabled: true, 
        template: "Dear Parent, your ward {name} was marked ABSENT today, {date}. Please contact office for details." 
    },
    fees: { 
        enabled: true, 
        dayOfMonth: 5, 
        template: "Fee Reminder: The monthly fee for {name} is due. Pending amount: ₹{amount}. Please pay by {date}." 
    },
    birthday: { 
        enabled: true, 
        template: "Happy Birthday {name}! 🎂 Wishing you a day filled with joy and a year of great learning. - NCPS Jaipur" 
    },
    pushEnabled: true
  });

  // Load Data on Mount
  useEffect(() => {
    const init = async () => {
      // Get Global Active Session
      const configSnap = await getDoc(doc(db, "config", "settings"));
      if (configSnap.exists()) {
        const session = configSnap.data().activeSession;
        setActiveSession(session);
        
        // Load Session Specific Automations
        const autoSnap = await getDoc(doc(db, "sessions", session, "automation", "settings"));
        if (autoSnap.exists()) setAutomations(autoSnap.data());
      }
      
      // Load Current User Profile
      if (auth.currentUser) {
        setProfile({ name: auth.currentUser.displayName || "Admin", email: auth.currentUser.email });
      }
    };
    init();
  }, []);

  // --- LOGIC: Update Password ---
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    const user = auth.currentUser;
    try {
      const credential = EmailAuthProvider.credential(user.email, passwords.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwords.new);
      alert("Password updated in Firebase Auth successfully!");
      setPasswords({ current: "", new: "" });
    } catch (err) { alert("Auth Error: " + err.message); }
    finally { setLoading(false); }
  };

  // --- LOGIC: Save Automations to Session ---
  const saveAllSettings = async () => {
    if (!activeSession) return alert("No active session found");
    setLoading(true);
    try {
      // Update the automation document inside the specific session
      await setDoc(doc(db, "sessions", activeSession, "automation", "settings"), {
        ...automations,
        lastModifiedBy: profile.email,
        updatedAt: new Date()
      }, { merge: true });

      alert(`Session ${activeSession} Automations Updated!`);
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase">System Control</h1>
            <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                  Active Session: {activeSession}
                </span>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Global Configuration</span>
            </div>
          </div>
          <button 
            onClick={saveAllSettings}
            disabled={loading}
            className="group bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 shadow-2xl hover:bg-indigo-600 transition-all active:scale-95"
          >
            <HiOutlineSave className="text-lg group-hover:rotate-12 transition-transform" />
            {loading ? "Syncing Data..." : "Apply All Changes"}
          </button>
        </header>

        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* SIDEBAR NAVIGATION */}
          <aside className="lg:col-span-3 space-y-3">
            <NavBtn active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<HiOutlineUser />} label="Profile & Security" />
            <NavBtn active={activeTab === 'auto'} onClick={() => setActiveTab('auto')} icon={<HiOutlineLightningBolt />} label="Automation Engine" />
            <NavBtn active={activeTab === 'session'} onClick={() => setActiveTab('session')} icon={<HiOutlineDatabase />} label="Session Manager" />
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="lg:col-span-9 bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-100 min-h-[60vh]">
            
            {/* TAB: PROFILE & PASSWORD */}
            {activeTab === 'profile' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                <section className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600">Account Credentials</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
                        <input value={profile.email} readOnly className="w-full p-4 bg-slate-50 border-none rounded-2xl text-slate-400 font-bold outline-none" />
                    </div>
                  </div>
                </section>

                <hr className="border-slate-100" />

                <section className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600">Security Update</h3>
                  <form onSubmit={handlePasswordChange} className="grid md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Current Password</label>
                        <input 
                            type="password" 
                            required
                            value={passwords.current}
                            onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-600 transition" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">New Secure Password</label>
                        <input 
                            type="password" 
                            required
                            value={passwords.new}
                            onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-600 transition" 
                        />
                    </div>
                    <button type="submit" className="bg-indigo-50 text-indigo-600 font-black uppercase text-[10px] py-4 rounded-2xl hover:bg-indigo-600 hover:text-white transition">Update Firebase Auth</button>
                  </form>
                </section>
              </div>
            )}

            {/* TAB: AUTOMATION ENGINE */}
            {activeTab === 'auto' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter">FCM Push Gateway</h3>
                        <p className="text-slate-400 text-xs font-medium">Configure how system talks to parents.</p>
                    </div>
                    <button 
                        onClick={() => setAutomations({...automations, pushEnabled: !automations.pushEnabled})}
                        className={`w-16 h-8 rounded-full transition-all flex items-center px-1 ${automations.pushEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-all ${automations.pushEnabled ? 'translate-x-8' : 'translate-x-0'}`} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* ATTENDANCE AUTOMATION */}
                    <AutoBox 
                        icon={<HiOutlineUserRemove />}
                        title="Absentee Alert"
                        desc="Immediate notification when student is marked 'Absent'"
                        template={automations.attendance.template}
                        enabled={automations.attendance.enabled}
                        onToggle={() => setAutomations({...automations, attendance: {...automations.attendance, enabled: !automations.attendance.enabled}})}
                        onChange={(val) => setAutomations({...automations, attendance: {...automations.attendance, template: val}})}
                        tags={['{name}', '{date}']}
                    />

                    {/* FEE AUTOMATION */}
                    <AutoBox 
                        icon={<HiOutlineCash />}
                        title="Fee Due Reminder"
                        desc={`Scheduled for the ${automations.fees.dayOfMonth}th of every month`}
                        template={automations.fees.template}
                        enabled={automations.fees.enabled}
                        onToggle={() => setAutomations({...automations, fees: {...automations.fees, enabled: !automations.fees.enabled}})}
                        onChange={(val) => setAutomations({...automations, fees: {...automations.fees, template: val}})}
                        tags={['{name}', '{amount}', '{date}']}
                    />

                    {/* BIRTHDAY AUTOMATION */}
                    <AutoBox 
                        icon={<HiOutlineCake />}
                        title="Birthday Greeting"
                        desc="Triggers at 08:00 AM on student's registered DOB"
                        template={automations.birthday.template}
                        enabled={automations.birthday.enabled}
                        onToggle={() => setAutomations({...automations, birthday: {...automations.birthday, enabled: !automations.birthday.enabled}})}
                        onChange={(val) => setAutomations({...automations, birthday: {...automations.birthday, template: val}})}
                        tags={['{name}']}
                    />
                </div>
              </div>
            )}

            {/* TAB: SESSION MANAGER */}
            {activeTab === 'session' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Academic Year Control</h3>
                    <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-start gap-4">
                        <div className="text-amber-600 text-2xl">⚠️</div>
                        <p className="text-amber-800 text-sm font-medium leading-relaxed">
                            Changing the **Active Session** will redirect all automations, student data, and fee collection to the selected year's database. Ensure the new session data is ready before switching.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Selected Session</label>
                            <select 
                                value={activeSession}
                                onChange={(e) => setActiveSession(e.target.value)}
                                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-600"
                            >
                                <option value="2024-25">Academic Session 2024-25</option>
                                <option value="2025-26">Academic Session 2025-26</option>
                                <option value="2026-27">Academic Session 2026-27</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}

// --- REUSABLE COMPONENTS ---

function NavBtn({ active, onClick, icon, label }) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${
                active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 translate-x-2' : 'bg-white text-slate-400 hover:bg-slate-100'
            }`}
        >
            <div className="flex items-center gap-4">
                <span className="text-xl">{icon}</span>
                {label}
            </div>
            <HiOutlineChevronRight className={`${active ? 'opacity-100' : 'opacity-0'}`} />
        </button>
    );
}

function AutoBox({ icon, title, desc, template, enabled, onToggle, onChange, tags }) {
    return (
        <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${enabled ? 'bg-slate-50 border-indigo-50 shadow-inner' : 'bg-white border-slate-50 grayscale opacity-60'}`}>
            <div className="flex justify-between items-start mb-6">
                <div className="flex gap-5">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-2xl text-indigo-600">{icon}</div>
                    <div>
                        <h4 className="font-black text-slate-900 uppercase text-sm tracking-tighter">{title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{desc}</p>
                    </div>
                </div>
                <button onClick={onToggle} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${enabled ? 'bg-emerald-100 text-emerald-600 hover:bg-red-100 hover:text-red-600' : 'bg-slate-200 text-slate-500'}`}>
                    {enabled ? 'Active' : 'Disabled'}
                </button>
            </div>
            
            <div className="space-y-3">
                <textarea 
                    value={template}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full p-5 bg-white border border-slate-100 rounded-3xl text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-indigo-100 transition"
                    rows="3"
                />
                <div className="flex gap-2">
                    {tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black text-indigo-500 uppercase">{tag}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}