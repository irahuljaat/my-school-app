'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Save, Layout, ImageIcon, MessageSquare, 
  Settings, Plus, Trash2, Palette, Bell, Newspaper, 
  UserCheck, Layers, ChevronRight, Star, Trophy, List, Globe, CheckCircle, Quote,
  Cpu , Video
} from 'lucide-react';

export default function MVG_Admin_Panel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_data", "config"), (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      } else {
        const defaultSchema = {
          schoolName: "MVG Academy",
          heroSlider: [],
          stats: [],
          awards: [],
          testimonials: [],
          gallery: [],
          principal: { name: "", designation: "", image: "", quote: "" } // Added to schema
        };
        setData(defaultSchema);
        setDoc(doc(db, "site_data", "config"), defaultSchema);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "site_data", "config"), data);
      setLastSaved(new Date().toLocaleTimeString());
      alert("🚀 Website Updated Successfully!");
    } catch (e) { 
      alert("Error: " + e.message); 
    }
    setSaving(false);
  };

  const updateNested = (path, value) => {
    const newData = { ...data };
    const keys = path.split('.');
    let last = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!last[keys[i]]) last[keys[i]] = {};
      last = last[keys[i]];
    }
    last[keys[keys.length - 1]] = value;
    setData(newData);
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-indigo-600 animate-pulse uppercase tracking-[0.3em]">Loading Database...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      
      {/* --- TOP FIXED ACTION BAR --- */}
      <div className="fixed top-0 right-0 left-72 h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 z-[100] flex items-center justify-between px-12">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Admin Control</h2>
          {lastSaved && <p className="text-[10px] text-green-500 font-bold uppercase">Last Sync: {lastSaved}</p>}
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-[#6366F1] hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-black uppercase text-[11px] tracking-[0.2em] shadow-lg shadow-indigo-200 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={18}/>}
            {saving ? 'Publishing...' : 'Publish Changes'}
          </button>
        </div>
      </div>

      {/* --- SIDEBAR --- */}
      <aside className="w-72 bg-[#0F172A] text-white flex flex-col fixed h-full z-[110]">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3">
             <div className="bg-[#6366F1] p-2 rounded-lg"><Layout size={20}/></div>
             <span className="font-black italic text-xl tracking-tighter uppercase">MVG Portal</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 mt-4">
          <Tab icon={<Settings size={18}/>} label="Site Basics" id="general" active={activeTab} set={setActiveTab} />
          <Tab icon={<ImageIcon size={18}/>} label="Hero Slider" id="hero" active={activeTab} set={setActiveTab} />
          <Tab icon={<UserCheck size={18}/>} label="Principal" id="principal" active={activeTab} set={setActiveTab} />
          <Tab icon={<Trophy size={18}/>} label="Stats & Awards" id="stats" active={activeTab} set={setActiveTab} />
          <Tab icon={<Cpu size={18}/>} label="Robotics" id="robotics" active={activeTab} set={setActiveTab} />
          <Tab icon={<Quote size={18}/>} label="Testimonials" id="testimonials" active={activeTab} set={setActiveTab} />
          <Tab icon={<Layers size={18}/>} label="Gallery" id="gallery" active={activeTab} set={setActiveTab} />
          <Tab icon={<Video size={18}/>} label="Gallery Videos" id="video_gallery" active={activeTab} set={setActiveTab} />
          
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="ml-72 flex-1 p-12 mt-20">
        <div className="max-w-4xl mx-auto pb-20">
          
          {/* TAB: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in">
              <Header title="Site Basics" />
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm">
                <Input label="School Name" value={data.schoolName} onChange={(e)=>updateNested('schoolName', e.target.value)} />
              </div>
            </div>
          )}

          {/* TAB: PRINCIPAL (NEW SECTION) */}
          {activeTab === 'principal' && (
            <div className="space-y-8 animate-in fade-in">
              <Header title="Principal's Message" />
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm space-y-8 border border-slate-100">
                <div className="flex items-center gap-8">
                  <div className="w-32 h-32 rounded-3xl bg-slate-100 overflow-hidden border-2 border-indigo-100 shadow-inner shrink-0">
                    <img src={data.principal?.image || "https://via.placeholder.com/300"} className="w-full h-full object-cover" alt="Principal" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <Input label="Principal Image URL" value={data.principal?.image} onChange={(e)=>updateNested('principal.image', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <Input label="Principal Name" value={data.principal?.name} onChange={(e)=>updateNested('principal.name', e.target.value)} />
                  <Input label="Designation" value={data.principal?.designation} onChange={(e)=>updateNested('principal.designation', e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Principal's Message / Quote</label>
                  <textarea 
                    value={data.principal?.quote} 
                    onChange={(e)=>updateNested('principal.quote', e.target.value)}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-[#6366F1] focus:bg-white outline-none transition-all font-bold text-slate-700 min-h-[150px]"
                    placeholder="Enter the message for the students and parents..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: SLIDER */}
          {activeTab === 'hero' && (
            <div className="space-y-8 animate-in fade-in">
              <Header title="Homepage Slider" />
              <div className="space-y-6">
                {data.heroSlider?.map((slide, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm relative group border border-slate-100">
                    <button onClick={() => {let s = [...data.heroSlider]; s.splice(i, 1); updateNested('heroSlider', s)}} className="absolute top-8 right-8 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
                    <div className="grid gap-6">
                      <Input label="Main Heading (HTML allowed)" value={slide.heading} onChange={(e)=>{let s=[...data.heroSlider]; s[i].heading=e.target.value; updateNested('heroSlider', s)}} />
                      <Input label="Image URL" value={slide.image} onChange={(e)=>{let s=[...data.heroSlider]; s[i].image=e.target.value; updateNested('heroSlider', s)}} />
                      <Input label="Button Text" value={slide.btnText} onChange={(e)=>{let s=[...data.heroSlider]; s[i].btnText=e.target.value; updateNested('heroSlider', s)}} />
                    </div>
                  </div>
                ))}
                <AddBtn label="Add New Slide" onClick={() => updateNested('heroSlider', [...(data.heroSlider||[]), {heading:"", image:"", btnText:"Explore More"}])} />
              </div>
            </div>
          )}

       {/* TAB: TESTIMONIALS EDITOR */}
          {activeTab === 'testimonials' && (
            <div className="space-y-8 animate-in fade-in">
              <Header title="Student Testimonials" />
              <div className="space-y-6">
                {data.testimonials?.map((t, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm relative border border-slate-100 transition-all hover:border-indigo-200">
                    <button 
                      onClick={() => {
                        let list = [...data.testimonials]; 
                        list.splice(i, 1); 
                        updateNested('testimonials', list)
                      }} 
                      className="absolute top-8 right-8 text-slate-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={20}/>
                    </button>
                    
                    <div className="grid gap-6">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden border-2 border-indigo-100 shadow-inner">
                          <img src={t.image || "https://via.placeholder.com/150"} className="w-full h-full object-cover" alt="Student" />
                        </div>
                        <div className="flex-1">
                          <Input 
                            label="Student Image URL" 
                            value={t.image} 
                            onChange={(e)=>{
                              let list=[...data.testimonials]; 
                              list[i].image=e.target.value; 
                              updateNested('testimonials', list)
                            }} 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Name" value={t.name} onChange={(e)=>{let list=[...data.testimonials]; list[i].name=e.target.value; updateNested('testimonials', list)}} />
                        <Input label="Designation / Batch" value={t.designation} onChange={(e)=>{let list=[...data.testimonials]; list[i].designation=e.target.value; updateNested('testimonials', list)}} />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">The Review / Quote</label>
                        <textarea 
                          value={t.quote} 
                          onChange={(e)=>{let list=[...data.testimonials]; list[i].quote=e.target.value; updateNested('testimonials', list)}}
                          className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-[#6366F1] focus:bg-white outline-none transition-all font-bold text-slate-700 min-h-[120px]"
                          placeholder="What did they say about MVG?"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <AddBtn 
                  label="Add New Testimonial" 
                  onClick={() => updateNested('testimonials', [...(data.testimonials||[]), {name:"", quote:"", designation:"", image:""}])} 
                />
              </div>
            </div>
          )}

          {/* TAB 3: STATS & AWARDS */}
          {activeTab === 'stats' && (
            <div className="space-y-12 animate-in fade-in">
              <div className="space-y-6">
                <Header title="Counter Stats" />
                <div className="grid grid-cols-2 gap-4">
                  {data.stats?.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative group">
                      <button onClick={() => {let s = [...data.stats]; s.splice(i, 1); updateNested('stats', s)}} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                      <div className="grid gap-4">
                        <Input label="Number (e.g. 500+)" value={stat.value} onChange={(e)=>{let s=[...data.stats]; s[i].value=e.target.value; updateNested('stats', s)}} />
                        <Input label="Label (e.g. Students)" value={stat.label} onChange={(e)=>{let s=[...data.stats]; s[i].label=e.target.value; updateNested('stats', s)}} />
                      </div>
                    </div>
                  ))}
                </div>
                <AddBtn label="Add New Stat" onClick={() => updateNested('stats', [...(data.stats||[]), {value:"", label:""}])} />
              </div>

              <div className="space-y-6">
                <Header title="Awards & Glory" />
                <div className="space-y-6">
                  {data.awards?.map((award, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative group">
                      <button onClick={() => {let a = [...data.awards]; a.splice(i, 1); updateNested('awards', a)}} className="absolute top-8 right-8 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
                      <div className="flex gap-8">
                        <div className="w-32 h-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden shrink-0">
                          <img src={award.image || null} className="w-full h-full object-cover" alt="Award Preview" />
                        </div>
                        <div className="flex-1 grid gap-4">
                          <Input label="Award Image URL" value={award.image} onChange={(e)=>{let a=[...data.awards]; a[i].image=e.target.value; updateNested('awards', a)}} />
                          <Input label="Award Title" value={award.title} onChange={(e)=>{let a=[...data.awards]; a[i].title=e.target.value; updateNested('awards', a)}} />
                          <Input label="Short Description" value={award.desc} onChange={(e)=>{let a=[...data.awards]; a[i].desc=e.target.value; updateNested('awards', a)}} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <AddBtn label="Add New Award" onClick={() => updateNested('awards', [...(data.awards||[]), {title:"", desc:"", image:""}])} />
                </div>
              </div>
            </div>
          )}




            {/* --- ADMIN TAB: VIDEO GALLERY --- */}
{activeTab === 'video_gallery' && (
  <div className="space-y-8 animate-in fade-in">
    <div className="flex justify-between items-center">
      <Header title="Campus Video Gallery" />
      <p className="text-[10px] font-black uppercase text-slate-400">Max 3 Videos Recommended</p>
    </div>

    <div className="space-y-6">
      {(data.galleryVideos || []).map((vid, i) => (
        <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative group">
          <button 
            onClick={() => {
              let list = [...data.galleryVideos]; 
              list.splice(i, 1); 
              updateNested('galleryVideos', list)
            }} 
            className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors"
          >
            <Trash2 size={18}/>
          </button>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Input 
              label="Video Title (e.g., Annual Day)" 
              value={vid.title} 
              onChange={(e) => {
                let list = [...data.galleryVideos]; 
                list[i].title = e.target.value; 
                updateNested('galleryVideos', list)
              }} 
            />
            <Input 
              label="YouTube URL" 
              placeholder="https://www.youtube.com/watch?v=..."
              value={vid.url} 
              onChange={(e) => {
                let list = [...data.galleryVideos]; 
                list[i].url = e.target.value; 
                updateNested('galleryVideos', list)
              }} 
            />
          </div>
        </div>
      ))}
      
      <AddBtn 
        label="Add New Gallery Video" 
        onClick={() => updateNested('galleryVideos', [...(data.galleryVideos || []), {title: "", url: ""}])} 
      />
    </div>
  </div>
)}
       





          {/* TAB: ROBOTICS SECTION */}
          {activeTab === 'robotics' && (
            <div className="space-y-8 animate-in fade-in">
              <Header title="Robotics Section Editor" />
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm space-y-6">
                <Input 
                  label="Section Title" 
                  value={data.robotics?.title} 
                  onChange={(e) => updateNested('robotics.title', e.target.value)} 
                />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description Text</label>
                  <textarea 
                    value={data.robotics?.desc} 
                    onChange={(e) => updateNested('robotics.desc', e.target.value)}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-[#6366F1] focus:bg-white outline-none transition-all font-bold text-slate-700 min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Main Image URL" 
                    value={data.robotics?.images?.[0]} 
                    onChange={(e) => {
                      let imgs = data.robotics?.images || ["",""];
                      imgs[0] = e.target.value;
                      updateNested('robotics.images', imgs);
                    }} 
                  />
                  <Input 
                    label="Secondary Image URL" 
                    value={data.robotics?.images?.[1]} 
                    onChange={(e) => {
                      let imgs = data.robotics?.images || ["",""];
                      imgs[1] = e.target.value;
                      updateNested('robotics.images', imgs);
                    }} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GALLERY */}
          {activeTab === 'gallery' && (
            <div className="space-y-8 animate-in fade-in">
              <Header title="Life at MVG Gallery" />
              <div className="grid grid-cols-2 gap-4">
                {data.gallery?.map((item, i) => (
                  <div key={i} className="bg-white p-4 rounded-3xl shadow-sm relative group border border-slate-100">
                    <button onClick={() => {let g = [...data.gallery]; g.splice(i, 1); updateNested('gallery', g)}} className="absolute top-2 right-2 p-2 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                    <img 
                      src={item.image || null} 
                      className={`w-full h-32 object-cover rounded-2xl mb-4 bg-slate-100 ${!item.image && 'border-2 border-dashed border-slate-200 flex items-center justify-center'}`} 
                      alt="Gallery Preview"
                    />
                    <Input label="Image URL" value={item.image} onChange={(e)=>{let g=[...data.gallery]; g[i].image=e.target.value; updateNested('gallery', g)}} />
                  </div>
                ))}
              </div>
              <AddBtn label="Add Gallery Image" onClick={() => updateNested('gallery', [...(data.gallery||[]), {image:""}])} />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// UI HELPERS
function Tab({ icon, label, id, active, set }) {
  const isActive = active === id;
  return (
    <button onClick={() => set(id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest ${isActive ? 'bg-[#6366F1] text-white shadow-xl shadow-indigo-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      {icon} {label}
    </button>
  );
}

function Header({ title }) {
  return (
    <div className="flex items-center gap-4 mb-2">
      <div className="w-1.5 h-10 bg-[#6366F1] rounded-full"></div>
      <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900">{title}</h2>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <div className="space-y-1.5 w-full">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
      <input type="text" value={value || ''} onChange={onChange} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-[#6366F1] focus:bg-white outline-none transition-all font-bold text-slate-700" />
    </div>
  );
}

function AddBtn({ label, onClick }) {
  return (
    <button onClick={onClick} className="w-full py-8 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] hover:border-[#6366F1] hover:text-[#6366F1] hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-3">
      <Plus size={20} /> {label}
    </button>
  );
}