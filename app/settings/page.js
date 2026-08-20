"use client";

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useColors } from '../components/ColorComponent';
import { 
  HiOutlineUser, HiOutlineLightningBolt, 
  HiOutlineSave, HiOutlineCake, HiOutlineCash,
  HiOutlineUserRemove, HiOutlineDatabase, HiOutlineChevronRight,
  HiOutlineOfficeBuilding, HiOutlineBell
} from 'react-icons/hi';

export default function SettingsPage() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState("");

  // School Details State (loaded from config/schoolDetails)
  const [schoolDetails, setSchoolDetails] = useState({
    schoolName: "",
    logoUrl: "",
    schoolAddress: "",
    schoolAffiliation: ""
  });

  // 1. Auth/Profile State
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [passwords, setPasswords] = useState({ current: "", new: "" });

  // 2. Notification Templates State (loaded from notifications/presenttemplate, absenttemplate, feetemplate)
  const [templates, setTemplates] = useState({
    present: { title: "", Description: "", keys: [] },
    absent: { title: "", Description: "", keys: [] },
    fee: { title: "", Description: "", keys: [] }
  });

  const [pushEnabled, setPushEnabled] = useState(true);

  // Load Data on Mount
  useEffect(() => {
    const init = async () => {
      // Get Global Config (Active Session)
      const configSnap = await getDoc(doc(db, "config", "settings"));
      if (configSnap.exists()) {
        const data = configSnap.data();
        setActiveSession(data.activeSession || "");
      }

      // Get School Details from config/schoolDetails
      const schoolSnap = await getDoc(doc(db, "config", "schoolDetails"));
      if (schoolSnap.exists()) {
        setSchoolDetails(schoolSnap.data());
      }

      // Get Notification Templates from notifications collection
      const presentSnap = await getDoc(doc(db, "notifications", "presenttemplate"));
      const absentSnap = await getDoc(doc(db, "notifications", "absenttemplate"));
      const feeSnap = await getDoc(doc(db, "notifications", "feetemplate"));

      setTemplates({
        present: presentSnap.exists() ? presentSnap.data() : { title: "", Description: "", keys: [] },
        absent: absentSnap.exists() ? absentSnap.data() : { title: "", Description: "", keys: [] },
        fee: feeSnap.exists() ? feeSnap.data() : { title: "", Description: "", keys: [] }
      });
      
      // Load Current User Profile
      if (auth.currentUser) {
        setProfile({ name: auth.currentUser.displayName || "Admin", email: auth.currentUser.email || "" });
      }
    };
    init();
  }, []);

  // --- LOGIC: Update Password ---
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!auth.currentUser || !auth.currentUser.email) return;
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

  // --- LOGIC: Save All Settings ---
  const saveAllSettings = async () => {
    setLoading(true);
    try {
      // 1. Save School Details to config/schoolDetails
      await setDoc(doc(db, "config", "schoolDetails"), {
        ...schoolDetails,
        updatedAt: new Date()
      }, { merge: true });

      // 2. Save Active Session to config/settings
      await setDoc(doc(db, "config", "settings"), {
        activeSession,
        updatedAt: new Date()
      }, { merge: true });

      // 3. Save Notification Templates to notifications collection
      await setDoc(doc(db, "notifications", "presenttemplate"), templates.present, { merge: true });
      await setDoc(doc(db, "notifications", "absenttemplate"), templates.absent, { merge: true });
      await setDoc(doc(db, "notifications", "feetemplate"), templates.fee, { merge: true });

      alert("All System Settings & Templates Updated Successfully!");
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen p-6 lg:p-8 font-sans relative overflow-hidden transition-colors duration-300" style={{ backgroundColor: colors.background }}>
      
      {/* Soft Background Decorative Blur Elements */}
      <div 
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-10 pointer-events-none -mr-32 -mt-32"
        style={{ backgroundColor: colors.primary }}
      />
      <div 
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-10 pointer-events-none -ml-32 -mb-32"
        style={{ backgroundColor: colors.primary }}
      />

      <div className="max-w-[1440px] mx-auto relative z-10 space-y-8">
        
        {/* HEADER */}
        <header className="rounded-[28px] border border-slate-100 shadow-sm p-6 md:p-8 bg-white/85 backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            {schoolDetails.logoUrl ? (
              <img src={schoolDetails.logoUrl} alt="School Logo" className="w-16 h-16 object-contain rounded-2xl border border-slate-100 p-1 bg-white shadow-sm" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-2xl">
                <HiOutlineOfficeBuilding />
              </div>
            )}
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                {schoolDetails.schoolName || "Loading Institution..."}
              </span>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 uppercase">System Control</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span 
                    className="px-3 py-1 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm"
                    style={{ backgroundColor: colors.primary }}
                  >
                    Active Session: {activeSession}
                  </span>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Global Configuration</span>
              </div>
            </div>
          </div>

          <button 
            onClick={saveAllSettings}
            disabled={loading}
            className="group text-white px-8 py-4 rounded-full font-black uppercase text-xs tracking-widest flex items-center gap-3 shadow-lg transition-all active:scale-[0.99]"
            style={{ backgroundColor: colors.primary }}
          >
            <HiOutlineSave className="text-lg group-hover:rotate-12 transition-transform" />
            {loading ? "Syncing Data..." : "Apply All Changes"}
          </button>
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* SIDEBAR NAVIGATION */}
          <aside className="lg:col-span-3 space-y-3">
            <div className="rounded-[28px] border border-slate-100 shadow-sm p-4 bg-white/85 backdrop-blur-md space-y-2">
              <NavBtn active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<HiOutlineUser />} label="Profile & Security" primaryColor={colors.primary} />
              <NavBtn active={activeTab === 'auto'} onClick={() => setActiveTab('auto')} icon={<HiOutlineLightningBolt />} label="FCM Templates" primaryColor={colors.primary} />
              <NavBtn active={activeTab === 'session'} onClick={() => setActiveTab('session')} icon={<HiOutlineDatabase />} label="Session & School" primaryColor={colors.primary} />
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="lg:col-span-9 bg-white rounded-[28px] p-6 md:p-10 shadow-sm border border-slate-100 min-h-[60vh]">
            
            {/* TAB: PROFILE & PASSWORD */}
            {activeTab === 'profile' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                <section className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Credentials</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
                        <input value={profile.email} readOnly className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-full text-slate-400 font-bold outline-none" />
                    </div>
                  </div>
                </section>

                <hr className="border-slate-100" />

                <section className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Update</h3>
                  <form onSubmit={handlePasswordChange} className="grid md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Current Password</label>
                        <input 
                            type="password" 
                            required
                            value={passwords.current}
                            onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                            className="w-full px-5 py-3 bg-white border border-slate-200 rounded-full font-bold outline-none focus:ring-2 transition" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">New Secure Password</label>
                        <input 
                            type="password" 
                            required
                            value={passwords.new}
                            onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                            className="w-full px-5 py-3 bg-white border border-slate-200 rounded-full font-bold outline-none focus:ring-2 transition" 
                        />
                    </div>
                    <button 
                      type="submit" 
                      className="px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest transition shadow-sm hover:opacity-90 text-white"
                      style={{ backgroundColor: colors.primary }}
                    >
                      Update Firebase Auth
                    </button>
                  </form>
                </section>
              </div>
            )}

            {/* TAB: NOTIFICATION TEMPLATES ENGINE */}
            {activeTab === 'auto' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-6 flex-wrap gap-4">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">FCM Notification Templates</h3>
                        <p className="text-slate-400 text-xs font-medium">Manage titles, bodies, and dynamic keys for parent gateway notifications.</p>
                    </div>
                    <button 
                        onClick={() => setPushEnabled(!pushEnabled)}
                        className={`w-16 h-8 rounded-full transition-all flex items-center px-1 ${pushEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-all ${pushEnabled ? 'translate-x-8' : 'translate-x-0'}`} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* PRESENT TEMPLATE */}
                    <TemplateBox 
                        icon={<HiOutlineUser />}
                        title="Present Template (presenttemplate)"
                        templateData={templates.present}
                        onChange={(updated) => setTemplates({...templates, present: updated})}
                    />

                    {/* ABSENT TEMPLATE */}
                    <TemplateBox 
                        icon={<HiOutlineUserRemove />}
                        title="Absent Template (absenttemplate)"
                        templateData={templates.absent}
                        onChange={(updated) => setTemplates({...templates, absent: updated})}
                    />

                    {/* FEE TEMPLATE */}
                    <TemplateBox 
                        icon={<HiOutlineCash />}
                        title="Fee Template (feetemplate)"
                        templateData={templates.fee}
                        onChange={(updated) => setTemplates({...templates, fee: updated})}
                    />
                </div>
              </div>
            )}

            {/* TAB: SESSION MANAGER & SCHOOL DETAILS */}
            {activeTab === 'session' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Academic Year & Institution Settings</h3>
                      <p className="text-slate-400 text-xs font-medium mt-1">Manage global configuration stored in config collections.</p>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">School Details Configuration</h4>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">School Name</label>
                                <input 
                                    type="text"
                                    value={schoolDetails.schoolName}
                                    onChange={(e) => setSchoolDetails({...schoolDetails, schoolName: e.target.value})}
                                    placeholder="e.g., MVG Public Sr. Sec. School"
                                    className="w-full px-5 py-3 bg-white border border-slate-200 rounded-full font-bold outline-none focus:ring-2 transition text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Logo URL</label>
                                <input 
                                    type="text"
                                    value={schoolDetails.logoUrl}
                                    onChange={(e) => setSchoolDetails({...schoolDetails, logoUrl: e.target.value})}
                                    placeholder="https://..."
                                    className="w-full px-5 py-3 bg-white border border-slate-200 rounded-full font-bold outline-none focus:ring-2 transition text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">School Affiliation</label>
                                <input 
                                    type="text"
                                    value={schoolDetails.schoolAffiliation}
                                    onChange={(e) => setSchoolDetails({...schoolDetails, schoolAffiliation: e.target.value})}
                                    placeholder="e.g., Affiliated to RBSE"
                                    className="w-full px-5 py-3 bg-white border border-slate-200 rounded-full font-bold outline-none focus:ring-2 transition text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">School Address</label>
                                <input 
                                    type="text"
                                    value={schoolDetails.schoolAddress}
                                    onChange={(e) => setSchoolDetails({...schoolDetails, schoolAddress: e.target.value})}
                                    placeholder="Full institutional address..."
                                    className="w-full px-5 py-3 bg-white border border-slate-200 rounded-full font-bold outline-none focus:ring-2 transition text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-[24px] border border-amber-100 bg-amber-50/50 flex items-start gap-4">
                        <div className="text-amber-600 text-xl font-bold">⚠️</div>
                        <p className="text-amber-900 text-xs font-medium leading-relaxed">
                            Changing the **Active Session** will redirect all automations, student data, and fee collection to the selected year's database. Ensure the new session data is ready before switching.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Selected Academic Session</label>
                            <select 
                                value={activeSession}
                                onChange={(e) => setActiveSession(e.target.value)}
                                className="w-full px-5 py-3 bg-white border border-slate-200 rounded-full font-bold outline-none focus:ring-2 transition text-sm"
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

function NavBtn({ active, onClick, icon, label, primaryColor }) {
    return (
        <button 
            onClick={onClick}
            style={active ? { backgroundColor: primaryColor } : undefined}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-full font-black uppercase text-[10px] tracking-widest transition-all ${
                active ? 'text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-50'
            }`}
        >
            <div className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                {label}
            </div>
            <HiOutlineChevronRight className={`${active ? 'opacity-100' : 'opacity-40'}`} />
        </button>
    );
}

function TemplateBox({ icon, title, templateData, onChange }) {
    const handleKeyChange = (index, value) => {
        const newKeys = [...(templateData.keys || [])];
        newKeys[index] = value;
        onChange({ ...templateData, keys: newKeys });
    };

    const addKey = () => {
        const newKeys = [...(templateData.keys || []), 'new_key'];
        onChange({ ...templateData, keys: newKeys });
    };

    const removeKey = (index) => {
        const newKeys = templateData.keys.filter((_, i) => i !== index);
        onChange({ ...templateData, keys: newKeys });
    };

    return (
        <div className="p-6 md:p-8 rounded-[24px] border border-slate-200 bg-slate-50/50 shadow-sm space-y-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-xl text-slate-700">{icon}</div>
                <div>
                    <h4 className="font-black text-slate-900 uppercase text-xs tracking-tight">{title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Edit FCM title, description, and keys array</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Title Input */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Notification Title</label>
                    <input 
                        type="text"
                        value={templateData.Title || templateData.title || ""}
                        onChange={(e) => onChange({ ...templateData, Title: e.target.value, title: e.target.value })}
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-full font-bold outline-none focus:ring-2 transition text-sm text-slate-800"
                    />
                </div>

                {/* Description Input */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Notification Description / Body</label>
                    <textarea 
                        value={templateData.Description || templateData.description || ""}
                        onChange={(e) => onChange({ ...templateData, Description: e.target.value, description: e.target.value })}
                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:ring-2 transition"
                        rows={3}
                    />
                </div>

                {/* Keys Array Editor */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Dynamic Keys Array</label>
                        <button 
                            type="button"
                            onClick={addKey}
                            className="px-3 py-1 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-wider hover:bg-slate-800 transition"
                        >
                            + Add Key
                        </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {(templateData.keys || []).map((keyVal, idx) => (
                            <div key={idx} className="flex items-center gap-1 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-sm">
                                <input 
                                    type="text"
                                    value={keyVal}
                                    onChange={(e) => handleKeyChange(idx, e.target.value)}
                                    className="text-[10px] font-black text-slate-700 uppercase outline-none bg-transparent w-24"
                                />
                                <button 
                                    type="button"
                                    onClick={() => removeKey(idx)}
                                    className="text-rose-500 font-bold hover:text-rose-700 text-xs ml-1"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}