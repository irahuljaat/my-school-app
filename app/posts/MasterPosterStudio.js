'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import html2canvas from 'html2canvas';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import LeftDrawer from './components/LeftDrawer';

// Constants
import { GOOGLE_FONTS, CANVAS_SIZES, GRADIENT_PRESETS } from './constants';
import { Image as ImageIcon } from 'lucide-react';

let _elementCounter = 1000;
const generateUniqueId = () => `el-${++_elementCounter}-${Date.now()}`;

export default function MasterPosterStudio() {
  const [bgImage, setBgImage] = useState(null);
  const [bgOpacity, setBgOpacity] = useState(1);
  const [frames, setFrames] = useState([]);
  const [posters, setPosters] = useState([]);
  const [templates, setTemplates] = useState({});
  const [schoolConfig, setSchoolConfig] = useState({
    schoolName: '', schoolAddress: '', phone: '', email: '', tagline: '', website: '', logoUrl: ''
  });

  const [loadingAssets, setLoadingAssets] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [saveStatusMsg, setSaveStatusMsg] = useState('');

  const [activeTab, setActiveTab] = useState('branding');
  const [canvasSize, setCanvasSize] = useState('instagram_square');
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [bgType, setBgType] = useState('gradient');
  const [bgColor, setBgColor] = useState('#0F172A');
  const [bgGradient, setBgGradient] = useState(GRADIENT_PRESETS[0]);
  const [selectedPoster, setSelectedPoster] = useState(null);

  const [aiTopic, setAiTopic] = useState('Admissions 2026');
  const [aiOutput, setAiOutput] = useState({
    headline: 'SHAPE A BRIGHTER FUTURE WITH QUALITY EDUCATION',
    subheadline: 'Admissions Open for Academic Session 2026-27',
    highlights: '• Digital Smart Classes\n• Expert & Dedicated Faculty\n• Modern Science & Computer Labs\n• Sports & Holistic Development',
    cta: 'ENROLL TODAY | LIMITED SEATS'
  });
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const canvasRef = useRef(null);
  const draggingRef = useRef(null);
  const resizingRef = useRef(null);
  const logoInputRef = useRef(null);

  const cs = CANVAS_SIZES[canvasSize];

  const pushHistory = useCallback((newElements) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIdx + 1);
      return [...trimmed, newElements].slice(-50);
    });
    setHistoryIdx(prev => Math.min(prev + 1, 49));
  }, [historyIdx]);

  const undo = () => {
    if (historyIdx <= 0) return;
    const nextIdx = historyIdx - 1;
    setElements(history[nextIdx]);
    setHistoryIdx(nextIdx);
    setSelectedId(null);
  };

  const redo = () => {
    if (historyIdx >= history.length - 1) return;
    const nextIdx = historyIdx + 1;
    setElements(history[nextIdx]);
    setHistoryIdx(nextIdx);
  };

  const fetchAllData = async () => {
    setLoadingAssets(true);
    try {
      const profileDocSnap = await getDoc(doc(db, 'app_assets', 'profile'));
      if (profileDocSnap.exists()) {
        const rawData = profileDocSnap.data();
        const pData = rawData.profile || rawData;
        setSchoolConfig({
          schoolName: pData.schoolName || pData.name || '',
          schoolAddress: typeof pData.schoolAddress === 'string' ? pData.schoolAddress : '',
          phone: pData.phone || pData.contact || '',
          email: pData.email || '',
          tagline: pData.tagline || '',
          website: pData.website || '',
          logoUrl: pData.logoUrl || ''
        });
      }

      const fSnap = await getDoc(doc(db, 'app_assets', 'frame'));
      if (fSnap.exists()) setFrames(Object.values(fSnap.data()).filter(Boolean));

      const pSnap = await getDoc(doc(db, 'app_assets', 'poster'));
      if (pSnap.exists()) {
        const list = Object.values(pSnap.data()).filter(Boolean);
        setPosters(list);
        if (list.length > 0) setSelectedPoster(list[0]);
      }

      const tSnap = await getDoc(doc(db, 'app_assets', 'templates'));
      if (tSnap.exists()) {
        setTemplates(tSnap.data());
      }
    } catch (err) {
      console.error("Error fetching Firestore assets:", err);
    } finally {
      setLoadingAssets(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${GOOGLE_FONTS.map(f => `family=${f.replace(/ /g, '+')}:wght@400;600;700;800;900`).join('&')}&display=swap`;
    document.head.appendChild(link);
  }, []);

  const handleSaveProfileToFirestore = async () => {
    setIsSavingProfile(true);
    setSaveStatusMsg('');
    try {
      const docRef = doc(db, 'app_assets', 'profile');
      await setDoc(docRef, {
        profile: { ...schoolConfig, updatedAt: new Date().toISOString() },
        ...schoolConfig,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setSaveStatusMsg('Profile saved to Firestore!');
      setTimeout(() => setSaveStatusMsg(''), 3000);
    } catch (err) {
      alert("Failed to save profile: " + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ⚡ DYNAMIC TEMPLATE SAVING LOGIC
  const handleSaveAsTemplate = async () => {
    if (elements.length === 0) {
      alert("Canvas is empty!");
      return;
    }
    const tName = window.prompt("Enter template name:");
    if (!tName) return;

    setIsSavingTemplate(true);
    try {
      const key = tName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();

      // Convert matching text or logo instances to dynamic placeholders
      const preparedElements = elements.map(({ id, ...el }) => {
        let clone = { ...el };

        if (clone.fieldBinding) return clone;

        if (typeof clone.text === 'string') {
          if (schoolConfig.schoolName && clone.text.includes(schoolConfig.schoolName)) {
            clone.fieldBinding = 'schoolName';
            clone.text = clone.text.replace(schoolConfig.schoolName, '{{schoolName}}');
          } else if (schoolConfig.phone && clone.text.includes(schoolConfig.phone)) {
            clone.fieldBinding = 'phone';
            clone.text = clone.text.replace(schoolConfig.phone, '{{phone}}');
          } else if (schoolConfig.schoolAddress && clone.text.includes(schoolConfig.schoolAddress)) {
            clone.fieldBinding = 'schoolAddress';
            clone.text = clone.text.replace(schoolConfig.schoolAddress, '{{schoolAddress}}');
          } else if (schoolConfig.tagline && clone.text.includes(schoolConfig.tagline)) {
            clone.fieldBinding = 'tagline';
            clone.text = clone.text.replace(schoolConfig.tagline, '{{tagline}}');
          }
        }

        if (clone.type === 'image' && schoolConfig.logoUrl && clone.src === schoolConfig.logoUrl) {
          clone.fieldBinding = 'logoUrl';
          clone.src = '{{logoUrl}}';
        }

        return clone;
      });

      const updated = {
        ...templates,
        [key]: {
          name: tName,
          category: 'Custom',
          elements: preparedElements
        }
      };
      await setDoc(doc(db, 'app_assets', 'templates'), updated);
      setTemplates(updated);
      alert("Template saved with Dynamic School Fields!");
    } catch (err) {
      alert("Save Template Error: " + err.message);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // ⚡ DYNAMIC TEMPLATE APPLY / LOAD LOGIC
  const applyTemplateWithSchoolData = (tplElements) => {
    if (!tplElements) return;

    const loaded = tplElements.map(e => {
      let el = {
        ...e,
        id: generateUniqueId(),
        visible: true,
        locked: false
      };

      // Resolve dynamic bindings from active Firestore schoolConfig
      if (el.fieldBinding && schoolConfig[el.fieldBinding]) {
        if (el.type === 'image') {
          el.src = schoolConfig[el.fieldBinding];
        } else {
          el.text = schoolConfig[el.fieldBinding];
        }
      }

      // Replace placeholder strings
      if (typeof el.text === 'string') {
        el.text = el.text
          .replace(/\{\{schoolName\}\}/g, schoolConfig.schoolName || 'Your School Name')
          .replace(/\{\{phone\}\}/g, schoolConfig.phone || 'Phone Contact')
          .replace(/\{\{schoolAddress\}\}/g, schoolConfig.schoolAddress || 'School Address')
          .replace(/\{\{tagline\}\}/g, schoolConfig.tagline || 'School Tagline')
          .replace(/\{\{website\}\}/g, schoolConfig.website || 'www.school.com');
      }

      if (el.type === 'image' && (el.src === '{{logoUrl}}' || el.fieldBinding === 'logoUrl')) {
        if (schoolConfig.logoUrl) el.src = schoolConfig.logoUrl;
      }

      return el;
    });

    setElements(loaded);
    setSelectedId(null);
    pushHistory(loaded);
  };

  const handleLogoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
    if (dataUrl) {
      setBgType('image'); // Make sure canvas mode switches if needed
      setBgImage(dataUrl); // Set the background image state
    }
  };
  reader.readAsDataURL(file);
};

  const updateEl = useCallback((id, patch) => {
    setElements(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);

  const commitEl = useCallback((id, patch) => {
    setElements(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, ...patch } : e);
      pushHistory(updated);
      return updated;
    });
  }, [pushHistory]);

  const addElement = (newEl) => {
    const elWithId = {
      id: generateUniqueId(),
      x: 50, y: 50, width: 250, height: 60, rotation: 0, opacity: 100,
      visible: true, locked: false, fontSize: 16, fontWeight: '700',
      fontStyle: 'normal', fontFamily: 'Poppins', color: '#FFFFFF',
      bgColor: '#3B82F6', borderColor: '#60A5FA', borderWidth: 0,
      borderRadius: 8, textAlign: 'center', letterSpacing: 0, lineHeight: 1.2,
      ...newEl
    };
    const updated = [...elements, elWithId];
    setElements(updated);
    setSelectedId(elWithId.id);
    pushHistory(updated);
  };

  const deleteEl = (id) => {
    const updated = elements.filter(e => e.id !== id);
    setElements(updated);
    setSelectedId(null);
    pushHistory(updated);
  };

  const duplicateEl = (id) => {
    const target = elements.find(e => e.id === id);
    if (!target) return;
    const cloned = { ...target, id: generateUniqueId(), x: target.x + 20, y: target.y + 20 };
    const updated = [...elements, cloned];
    setElements(updated);
    setSelectedId(cloned.id);
    pushHistory(updated);
  };

  const moveLayer = (id, action) => {
    const index = elements.findIndex(e => e.id === id);
    if (index === -1) return;
    const list = [...elements];

    if (action === 'up' && index < list.length - 1) {
      [list[index], list[index + 1]] = [list[index + 1], list[index]];
    } else if (action === 'down' && index > 0) {
      [list[index], list[index - 1]] = [list[index - 1], list[index]];
    } else if (action === 'top') {
      const [item] = list.splice(index, 1);
      list.push(item);
    } else if (action === 'bottom') {
      const [item] = list.splice(index, 1);
      list.unshift(item);
    }

    setElements(list);
    pushHistory(list);
  };

  const handleGenerateAi = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      setAiOutput({
        headline: 'EXCELLENCE IN EDUCATION & LEADERSHIP',
        subheadline: 'Open Admissions for Session 2026-2027',
        highlights: '• STEM Integrated Curriculum\n• Individual Student Attention\n• State-of-the-Art Sports Complex\n• Experienced Faculty',
        cta: 'ENROLL TODAY | LIMITED SEATS'
      });
      setIsGeneratingAi(false);
    }, 600);
  };

  const applyAiToCanvas = () => {
    const aiLayout = [
      { type: 'badge', text: aiOutput.cta, x: 100, y: 30, width: 300, height: 38, bgColor: '#EF4444', color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
      { type: 'text', text: aiOutput.headline, x: 30, y: 90, width: 440, height: 80, fontSize: 28, fontWeight: '900', fontFamily: 'Bebas Neue', color: '#FFFFFF', textAlign: 'center' },
      { type: 'text', text: aiOutput.subheadline, x: 40, y: 180, width: 420, height: 40, fontSize: 15, fontWeight: '600', color: '#CBD5E1', textAlign: 'center' },
      { type: 'box', x: 40, y: 240, width: 420, height: 170, bgColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderRadius: 16 },
      { type: 'text', text: aiOutput.highlights, x: 60, y: 260, width: 380, height: 130, fontSize: 14, fontWeight: '600', color: '#FFFFFF', textAlign: 'left', lineHeight: 1.6 }
    ];

    if (schoolConfig.logoUrl) {
      aiLayout.unshift({ type: 'image', src: schoolConfig.logoUrl, fieldBinding: 'logoUrl', x: 210, y: 420, width: 80, height: 80, name: 'School Logo' });
    }

    const processed = aiLayout.map(el => ({ ...el, id: generateUniqueId(), visible: true, locked: false, opacity: 100, rotation: 0 }));
    setElements(processed);
    setSelectedId(null);
    pushHistory(processed);
  };

  const onElementMouseDown = (e, id) => {
    const el = elements.find(x => x.id === id);
    if (!el || el.locked) return;
    e.stopPropagation();
    setSelectedId(id);

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleFactor = cs.w / rect.width;

    draggingRef.current = { id, startX: (e.clientX - rect.left) * scaleFactor, startY: (e.clientY - rect.top) * scaleFactor, origX: el.x, origY: el.y };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const onResizeMouseDown = (e, id, handle) => {
    e.stopPropagation();
    e.preventDefault();
    const el = elements.find(x => x.id === id);
    if (!el || el.locked) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleFactor = cs.w / rect.width;

    resizingRef.current = { id, handle, startX: (e.clientX - rect.left) * scaleFactor, startY: (e.clientY - rect.top) * scaleFactor, origW: el.width || 100, origH: el.height || 40, origX: el.x, origY: el.y };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = useCallback((e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleFactor = cs.w / rect.width;
    const cx = (e.clientX - rect.left) * scaleFactor;
    const cy = (e.clientY - rect.top) * scaleFactor;

    if (draggingRef.current) {
      const { id, startX, startY, origX, origY } = draggingRef.current;
      updateEl(id, { x: Math.round(origX + cx - startX), y: Math.round(origY + cy - startY) });
    }

    if (resizingRef.current) {
      const { id, handle, startX, startY, origW, origH, origX, origY } = resizingRef.current;
      const patch = {};
      if (handle.includes('e')) patch.width = Math.max(30, Math.round(origW + (cx - startX)));
      if (handle.includes('s')) patch.height = Math.max(16, Math.round(origH + (cy - startY)));
      if (handle.includes('w')) { patch.width = Math.max(30, Math.round(origW - (cx - startX))); patch.x = Math.round(origX + (cx - startX)); }
      if (handle.includes('n')) { patch.height = Math.max(16, Math.round(origH - (cy - startY))); patch.y = Math.round(origY + (cy - startY)); }
      updateEl(id, patch);
    }
  }, [cs.w, updateEl]);

  const onMouseUp = useCallback(() => {
    if (draggingRef.current || resizingRef.current) pushHistory(elements);
    draggingRef.current = null;
    resizingRef.current = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }, [elements, pushHistory, onMouseMove]);

  const handleExport = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    setSelectedId(null);
    try {
      const canvas = await html2canvas(canvasRef.current, { scale: 3, useCORS: true, allowTaint: true, backgroundColor: null });
      const link = document.createElement('a');
      link.download = `${schoolConfig.schoolName || 'School_Poster'}_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      alert("Export failed: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const canvasBgStyle = () => {
  if (bgType === 'color') return { backgroundColor: bgColor };
  if (bgType === 'gradient') return { background: bgGradient };
  if (bgType === 'image' && bgImage) {
    return {
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    };
  }
  return { backgroundColor: '#ffffff' };
};

  const renderElement = (el, index) => {
    if (!el.visible) return null;
    const isSelected = selectedId === el.id;

    // Detect transparent box/frame overlays so they don't block clicks to elements underneath
    const isFrame = el.type === 'box' && (!el.bgColor || el.bgColor === 'transparent' || el.bgColor.includes('rgba'));

    const wrapperStyle = {
      position: 'absolute', left: el.x, top: el.y, width: el.width || 'auto', height: el.height || 'auto',
      opacity: (el.opacity ?? 100) / 100, transform: `rotate(${el.rotation || 0}deg)`, cursor: el.locked ? 'default' : 'move',
      userSelect: 'none', zIndex: isSelected ? 999 : index + 1, outline: isSelected && !isExporting ? '2px solid #6366F1' : 'none',
      outlineOffset: 2, boxSizing: 'border-box',
      pointerEvents: isFrame && !isSelected ? 'none' : 'auto', // 👈 CLICK-THROUGH FIX FOR TRANSPARENT FRAMES
    };

    let innerContent = null;
    if (el.type === 'text') {
      innerContent = (
        <textarea
          style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', resize: 'none', outline: 'none', overflow: 'hidden', padding: '2px 4px', fontSize: `${el.fontSize || 16}px`, fontWeight: el.fontWeight || '700', color: el.color || '#FFFFFF', textAlign: el.textAlign || 'center', fontStyle: el.fontStyle || 'normal', letterSpacing: `${el.letterSpacing ?? 0}px`, lineHeight: el.lineHeight || 1.2, fontFamily: el.fontFamily || 'Poppins', pointerEvents: isSelected && !el.locked ? 'auto' : 'none' }}
          value={el.text || ''} onChange={(e) => updateEl(el.id, { text: e.target.value })} onBlur={(e) => commitEl(el.id, { text: e.target.value })}
        />
      );
    } else if (el.type === 'badge') {
      innerContent = (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: el.bgColor || '#EF4444', color: el.color || '#FFFFFF', fontSize: `${el.fontSize || 12}px`, fontWeight: el.fontWeight || '800', borderRadius: `${el.borderRadius ?? 99}px`, width: '100%', height: '100%', fontFamily: el.fontFamily || 'Poppins' }}>{el.text}</div>
      );
    } else if (el.type === 'image') {
      innerContent = (
        <div style={{ width: '100%', height: '100%', borderRadius: `${el.borderRadius || 0}px`, overflow: 'hidden' }}>
          {el.src ? <img src={el.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" /> : <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 text-xs"><ImageIcon className="w-6 h-6 mb-1" /><span>Placeholder</span></div>}
        </div>
      );
    } else if (el.type === 'box') {
      innerContent = <div style={{ width: '100%', height: '100%', backgroundColor: el.bgColor || 'rgba(255,255,255,0.1)', border: `${el.borderWidth || 1}px solid ${el.borderColor || 'rgba(255,255,255,0.2)'}`, borderRadius: `${el.borderRadius || 12}px` }} />;
    }

    return (
      <div key={el.id} style={wrapperStyle} onMouseDown={e => onElementMouseDown(e, el.id)} onClick={e => { e.stopPropagation(); setSelectedId(el.id); }}>
        {innerContent}
        {isSelected && !el.locked && !isExporting && (
          <>
            <div onMouseDown={e => onResizeMouseDown(e, el.id, 'nw')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-indigo-500 rounded-sm cursor-nw-resize z-20" />
            <div onMouseDown={e => onResizeMouseDown(e, el.id, 'ne')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-indigo-500 rounded-sm cursor-ne-resize z-20" />
            <div onMouseDown={e => onResizeMouseDown(e, el.id, 'sw')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-indigo-500 rounded-sm cursor-sw-resize z-20" />
            <div onMouseDown={e => onResizeMouseDown(e, el.id, 'se')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-indigo-500 rounded-sm cursor-se-resize z-20" />
          </>
        )}
      </div>
    );
  };

  const selectedEl = elements.find(e => e.id === selectedId) || null;

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      <input type="file" ref={logoInputRef} onChange={handleLogoFileUpload} accept="image/*" className="hidden" />
      
      <Header 
        schoolConfig={schoolConfig} canvasSize={canvasSize} setCanvasSize={setCanvasSize} 
        showGrid={showGrid} setShowGrid={setShowGrid} undo={undo} redo={redo} 
        historyIdx={historyIdx} historyLength={history.length} zoom={zoom} setZoom={setZoom} 
        handleExport={handleExport} isExporting={isExporting} 
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <LeftDrawer 
          activeTab={activeTab}
          schoolConfig={schoolConfig}
          setSchoolConfig={setSchoolConfig}
          saveStatusMsg={saveStatusMsg}
          logoInputRef={logoInputRef}
          addElement={addElement}
          handleSaveProfileToFirestore={handleSaveProfileToFirestore}
          isSavingProfile={isSavingProfile}
          aiTopic={aiTopic}
          setAiTopic={setAiTopic}
          handleGenerateAi={handleGenerateAi}
          isGeneratingAi={isGeneratingAi}
          aiOutput={aiOutput}
          applyAiToCanvas={applyAiToCanvas}
          handleSaveAsTemplate={handleSaveAsTemplate}
          isSavingTemplate={isSavingTemplate}
          templates={templates}
          applyTemplateWithSchoolData={applyTemplateWithSchoolData}
          bgType={bgType}
          setBgType={setBgType}
          bgColor={bgColor}
          setBgColor={setBgColor}
          bgGradient={bgGradient}
          setBgGradient={setBgGradient}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          elements={elements}
          moveLayer={moveLayer}
          bgImage={bgImage}
          setBgImage={setBgImage}
          bgOpacity={bgOpacity}
          setBgOpacity={setBgOpacity}
        />

        <main className="flex-1 bg-slate-950 relative flex items-center justify-center p-8 overflow-auto">
          <div id="canvas-wrapper" className="relative flex items-center justify-center transition-transform" style={{ transform: `scale(${zoom / 100})` }} onClick={(e) => { if (e.target.id === 'canvas-wrapper') setSelectedId(null); }}>
           <div className="canvas-wrapper" style={canvasBgStyle()}>
  {/* Elements rendered here */}
</div>
           
            <div ref={canvasRef} style={{ width: cs.w, height: cs.h, position: 'relative', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.9)', ...canvasBgStyle() }}>
              
              {/* 🖼️ BACKGROUND IMAGE OVERLAY LAYER */}
              {bgImage && (
                <img
                  src={bgImage}
                  alt="Canvas Background Image"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
                  style={{ opacity: bgOpacity }}
                  crossOrigin="anonymous"
                />
              )}

              {showGrid && <div className="absolute inset-0 pointer-events-none z-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />}
              {elements.map((el, idx) => renderElement(el, idx))}
            </div>
          </div>
        </main>

        <RightPanel 
          selectedEl={selectedEl} updateEl={updateEl} 
          commitEl={commitEl} duplicateEl={duplicateEl} deleteEl={deleteEl} 
          schoolConfig={schoolConfig}
        />
      </div>
    </div>
  );
}