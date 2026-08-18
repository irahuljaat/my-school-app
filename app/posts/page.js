'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import { Download, RefreshCw, Sparkles, LayoutGrid, Copy, CheckCheck, ImageIcon, ChevronRight } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function Page() {
  const [templates, setTemplates] = useState({});
  const [schoolData, setSchoolData] = useState(null);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [caption, setCaption] = useState('');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [copied, setCopied] = useState(false);
  const postCanvasRef = useRef(null);

  useEffect(() => { fetchData(); }, []);

  // ─── Dynamic Google Fonts Loader ──────────────────────────────────────────
  useEffect(() => {
    const activeTemplate = selectedTemplateKey ? templates[selectedTemplateKey] : null;
    if (!activeTemplate || !Array.isArray(activeTemplate.elements)) return;
    const fontFamilies = new Set();
    activeTemplate.elements.forEach((el) => {
      if (el.type === 'text' && el.fontFamily) {
        const cleanFont = el.fontFamily.split(',')[0].replace(/['"]+/g, '').trim();
        if (cleanFont && !['sans-serif', 'serif', 'monospace', 'Arial', 'Helvetica'].includes(cleanFont)) {
          fontFamilies.add(cleanFont);
        }
      }
    });
    fontFamilies.forEach((font) => {
      const fontId = `gfont-${font.toLowerCase().replace(/\s+/g, '-')}`;
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600;700;800&display=swap`;
        document.head.appendChild(link);
      }
    });
  }, [selectedTemplateKey, templates]);

  // ─── Firestore Fetch ───────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    setCaption('');
    try {
      const profileSnap = await getDoc(doc(db, 'app_assets', 'profile'));
      if (profileSnap.exists()) {
        const raw = profileSnap.data();
        const p = raw.profile || raw;
        setSchoolData({
          schoolName:    p.schoolName    || p.name        || '',
          schoolLogo:    p.logoUrl       || p.schoolLogo  || '',
          schoolPhone:   p.schoolPhone   || p.phone       || '',
          schoolAddress: p.schoolAddress || p.address     || '',
          schoolEmail:   p.schoolEmail   || p.email       || '',
          schoolWebsite: p.schoolWebsite || p.website     || '',
          schoolTagline: p.schoolTagline || p.tagline     || '',
        });
      }
      const templatesSnap = await getDoc(doc(db, 'app_assets', 'templates'));
      if (templatesSnap.exists()) {
        const data = templatesSnap.data();
        if (Object.keys(data).length > 0) {
          setTemplates(data);
          setSelectedTemplateKey(Object.keys(data)[0]);
        }
      }
    } catch (err) {
      console.error('Firestore fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Value Resolver ────────────────────────────────────────────────────────
  const resolveValue = (textStr, fieldBinding) => {
    if (!schoolData) return textStr;
    if (fieldBinding && schoolData[fieldBinding] !== undefined) return schoolData[fieldBinding];
    if (typeof textStr !== 'string') return textStr;
    return textStr
      .replace(/\{\{schoolName\}\}/g,    schoolData.schoolName)
      .replace(/\{\{schoolLogo\}\}/g,    schoolData.schoolLogo)
      .replace(/\{\{schoolPhone\}\}/g,   schoolData.schoolPhone)
      .replace(/\{\{schoolAddress\}\}/g, schoolData.schoolAddress)
      .replace(/\{\{schoolEmail\}\}/g,   schoolData.schoolEmail)
      .replace(/\{\{schoolWebsite\}\}/g, schoolData.schoolWebsite)
      .replace(/\{\{schoolTagline\}\}/g, schoolData.schoolTagline)
      .replace(/\{\{logoUrl\}\}/g,       schoolData.schoolLogo);
  };

  // ─── Export ────────────────────────────────────────────────────────────────
  const handleExportPost = async () => {
    if (!activeTemplate) return;
    setIsExporting(true);
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const exportContainer = document.createElement('div');
      exportContainer.style.cssText = `position:fixed;left:-9999px;top:0;width:${activeTemplate.width||1080}px;height:${activeTemplate.height||1080}px;background:#fff;z-index:99999;`;
      if (postCanvasRef.current) exportContainer.innerHTML = postCanvasRef.current.innerHTML;
      document.body.appendChild(exportContainer);
      const canvas = await html2canvas(exportContainer, {
        scale: 1, useCORS: true, allowTaint: false, backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            if (el.style) {
              Array.from(el.style).forEach((prop) => {
                const val = el.style.getPropertyValue(prop);
                if (val && val.includes('oklch')) el.style.setProperty(prop, 'transparent');
              });
            }
          });
        },
      });
      document.body.removeChild(exportContainer);
      const link = document.createElement('a');
      link.download = `${selectedTemplateKey||'school_post'}_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      console.error(err);
      alert('Export failed: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // ─── AI Caption ────────────────────────────────────────────────────────────
  const handleGenerateCaption = async () => {
    if (!activeTemplate || !schoolData) return;
    setIsGeneratingCaption(true);
    setCaption('');
    setCopied(false);
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
      const prompt = `Write a warm, engaging social media caption (2–3 sentences) for a school post.\nPoster title: "${activeTemplate.name}"\nCategory: "${activeTemplate.category}"\nSchool name: "${schoolData.schoolName}"\n${schoolData.schoolTagline ? `School tagline: "${schoolData.schoolTagline}"` : ''}\nEnd the caption with 8–10 relevant hashtags on a new line.\nReturn plain text only — no markdown, no asterisks, no bullet points.`;
      const result = await model.generateContent(prompt);
      setCaption(result.response.text().trim());
    } catch (err) {
      console.error('Caption generation failed:', err);
      setCaption('Could not generate caption. Please try again.');
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleCopyCaption = () => {
    if (!caption) return;
    navigator.clipboard.writeText(caption).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const activeTemplate = selectedTemplateKey ? templates[selectedTemplateKey] : null;
  const templateCount = Object.keys(templates).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ps-root {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: #F5F4F1;
          color: #1A1D27;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* ── Header ── */
        .ps-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          height: 60px;
          background: #FFFFFF;
          border-bottom: 1px solid #E8E5DF;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          position: sticky;
          top: 0;
          z-index: 100;
          flex-shrink: 0;
        }
        .ps-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ps-logo-dot {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #4F6EF7 0%, #7C3AED 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ps-logo-dot svg { color: #fff; }
        .ps-app-title {
          font-size: 15px;
          font-weight: 700;
          color: #1A1D27;
          letter-spacing: -0.2px;
        }
        .ps-school-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #EEF0FD;
          color: #4F6EF7;
          font-size: 11.5px;
          font-weight: 500;
          padding: 3px 10px;
          border-radius: 20px;
          margin-left: 4px;
        }
        .ps-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ps-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          padding: 7px 14px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
          white-space: nowrap;
        }
        .ps-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .ps-btn-ghost {
          background: transparent;
          color: #4A5068;
          border: 1px solid #DDD9D1;
        }
        .ps-btn-ghost:hover:not(:disabled) { background: #F0EEE9; color: #1A1D27; border-color: #C8C3BA; }
        .ps-btn-primary {
          background: #1A1D27;
          color: #FFFFFF;
        }
        .ps-btn-primary:hover:not(:disabled) { background: #2E3347; }
        .ps-btn-export {
          background: linear-gradient(135deg, #4F6EF7 0%, #7C3AED 100%);
          color: #FFFFFF;
          box-shadow: 0 2px 8px rgba(79,110,247,0.3);
        }
        .ps-btn-export:hover:not(:disabled) { box-shadow: 0 4px 14px rgba(79,110,247,0.4); transform: translateY(-1px); }

        /* ── Layout ── */
        .ps-main { display: flex; flex: 1; overflow: hidden; }

        /* ── Sidebar ── */
        .ps-sidebar {
          width: 264px;
          background: #FFFFFF;
          border-right: 1px solid #E8E5DF;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .ps-sidebar::-webkit-scrollbar { width: 4px; }
        .ps-sidebar::-webkit-scrollbar-track { background: transparent; }
        .ps-sidebar::-webkit-scrollbar-thumb { background: #DDD9D1; border-radius: 4px; }

        .ps-section-header {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 18px 18px 10px;
        }
        .ps-section-label {
          font-size: 10.5px;
          font-weight: 600;
          color: #8A8EA8;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .ps-section-count {
          margin-left: auto;
          background: #F0EEE9;
          color: #8A8EA8;
          font-size: 10px;
          font-weight: 600;
          padding: 1px 7px;
          border-radius: 10px;
        }

        /* Template Cards */
        .ps-template-list { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 6px; }
        .ps-template-card {
          padding: 11px 13px;
          border-radius: 10px;
          border: 1.5px solid transparent;
          background: #FAFAF8;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
          width: 100%;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ps-template-card:hover { background: #F5F4F1; border-color: #DDD9D1; }
        .ps-template-card.active {
          background: #EEF0FD;
          border-color: #4F6EF7;
        }
        .ps-template-icon {
          width: 34px;
          height: 34px;
          border-radius: 7px;
          background: #E8E5DF;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #8A8EA8;
          transition: all 0.15s ease;
        }
        .ps-template-card.active .ps-template-icon {
          background: #4F6EF7;
          color: #FFFFFF;
        }
        .ps-template-info { flex: 1; min-width: 0; }
        .ps-template-name {
          font-size: 13px;
          font-weight: 600;
          color: #1A1D27;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ps-template-card.active .ps-template-name { color: #2E4FD4; }
        .ps-template-cat {
          font-size: 11px;
          color: #9A9EB8;
          margin-top: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ps-chevron { color: #C8C3BA; transition: all 0.15s ease; flex-shrink: 0; }
        .ps-template-card.active .ps-chevron { color: #4F6EF7; }

        /* Skeleton */
        .ps-skeleton {
          height: 58px;
          border-radius: 10px;
          background: linear-gradient(90deg, #F0EEE9 25%, #E8E5DF 50%, #F0EEE9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* Divider */
        .ps-divider { height: 1px; background: #E8E5DF; margin: 10px 0; }

        /* Caption Panel */
        .ps-caption-panel { padding: 0 12px 20px; display: flex; flex-direction: column; gap: 10px; }
        .ps-btn-ai {
          width: 100%;
          justify-content: center;
          padding: 9px 14px;
          background: linear-gradient(135deg, #7C3AED 0%, #4F6EF7 100%);
          color: #FFFFFF;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(124,58,237,0.25);
          transition: all 0.15s ease;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: inherit;
        }
        .ps-btn-ai:hover:not(:disabled) { box-shadow: 0 4px 14px rgba(124,58,237,0.35); transform: translateY(-1px); }
        .ps-btn-ai:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

        .ps-caption-box {
          background: #FAFAF8;
          border: 1.5px solid #E8E5DF;
          border-radius: 10px;
          padding: 13px;
          font-size: 12px;
          line-height: 1.65;
          color: #3A3E52;
          white-space: pre-wrap;
        }
        .ps-copy-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          width: 100%;
          margin-top: 8px;
          padding: 6px;
          background: transparent;
          border: 1px solid #DDD9D1;
          border-radius: 7px;
          font-size: 11.5px;
          font-weight: 500;
          color: #6B6F88;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }
        .ps-copy-btn:hover { background: #F0EEE9; color: #1A1D27; border-color: #C8C3BA; }
        .ps-copy-btn.copied { color: #059669; border-color: #A7F3D0; background: #ECFDF5; }

        /* ── Canvas ── */
        .ps-canvas-area {
          flex: 1;
          background: #F5F4F1;
          overflow: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px;
        }
        .ps-canvas-area::-webkit-scrollbar { width: 6px; height: 6px; }
        .ps-canvas-area::-webkit-scrollbar-track { background: #ECEAE5; }
        .ps-canvas-area::-webkit-scrollbar-thumb { background: #C8C3BA; border-radius: 4px; }

        /* Toolbar above canvas */
        .ps-canvas-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 600px;
          margin-bottom: 20px;
        }
        .ps-canvas-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ps-canvas-title {
          font-size: 15px;
          font-weight: 700;
          color: #1A1D27;
        }
        .ps-canvas-dims {
          font-size: 11.5px;
          color: #9A9EB8;
        }
        .ps-scale-badge {
          font-size: 11px;
          font-weight: 500;
          color: #8A8EA8;
          background: #ECEAE5;
          border: 1px solid #DDD9D1;
          padding: 3px 9px;
          border-radius: 6px;
        }

        /* Canvas wrapper */
        .ps-canvas-wrapper {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid #E0DDD7;
          background: #fff;
          flex-shrink: 0;
        }

        /* Empty states */
        .ps-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #9A9EB8;
          padding: 60px 20px;
          text-align: center;
        }
        .ps-empty-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: #ECEAE5;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #C8C3BA;
        }
        .ps-empty-title { font-size: 14px; font-weight: 600; color: #6B6F88; }
        .ps-empty-sub { font-size: 12.5px; color: #B0B4CC; max-width: 220px; }

        .ps-loading-pulse {
          font-size: 13px;
          color: #9A9EB8;
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="ps-root">

        {/* ── Header ── */}
        <header className="ps-header">
          <div className="ps-header-left">
            <div className="ps-logo-dot">
              <Sparkles size={15} />
            </div>
            <span className="ps-app-title">Poster Studio</span>
            {schoolData?.schoolName && (
              <span className="ps-school-badge">
                {schoolData.schoolName}
              </span>
            )}
          </div>

          <div className="ps-header-actions">
            <button
              className="ps-btn ps-btn-ghost"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              Refresh
            </button>
            <button
              className="ps-btn ps-btn-export"
              onClick={handleExportPost}
              disabled={isExporting || !activeTemplate}
            >
              <Download size={13} />
              {isExporting ? 'Exporting…' : 'Export PNG'}
            </button>
          </div>
        </header>

        {/* ── Main ── */}
        <main className="ps-main">

          {/* ── Sidebar ── */}
          <aside className="ps-sidebar">

            {/* Templates section */}
            <div className="ps-section-header">
              <LayoutGrid size={13} color="#8A8EA8" />
              <span className="ps-section-label">Templates</span>
              {!loading && templateCount > 0 && (
                <span className="ps-section-count">{templateCount}</span>
              )}
            </div>

            <div className="ps-template-list">
              {loading ? (
                [1, 2, 3].map((i) => <div key={i} className="ps-skeleton" />)
              ) : templateCount === 0 ? (
                <div className="ps-empty" style={{ padding: '20px 8px' }}>
                  <div className="ps-empty-title">No templates found</div>
                  <div className="ps-empty-sub">Add templates in Firestore to get started.</div>
                </div>
              ) : (
                Object.entries(templates).map(([key, tpl]) => (
                  <button
                    key={key}
                    className={`ps-template-card${selectedTemplateKey === key ? ' active' : ''}`}
                    onClick={() => { setSelectedTemplateKey(key); setCaption(''); }}
                  >
                    <div className="ps-template-icon">
                      <ImageIcon size={14} />
                    </div>
                    <div className="ps-template-info">
                      <div className="ps-template-name">{tpl.name || key}</div>
                      {tpl.category && (
                        <div className="ps-template-cat">{tpl.category}</div>
                      )}
                    </div>
                    <ChevronRight size={13} className="ps-chevron" />
                  </button>
                ))
              )}
            </div>

            {/* Divider */}
            <div className="ps-divider" />

            {/* AI Caption */}
            <div className="ps-section-header">
              <Sparkles size={13} color="#7C3AED" />
              <span className="ps-section-label">AI Caption</span>
            </div>

            <div className="ps-caption-panel">
              <button
                className="ps-btn-ai"
                onClick={handleGenerateCaption}
                disabled={isGeneratingCaption || !activeTemplate || !schoolData}
              >
                {isGeneratingCaption ? (
                  <><RefreshCw size={13} className="spin" /> Writing caption…</>
                ) : (
                  <><Sparkles size={13} /> Generate Caption &amp; Hashtags</>
                )}
              </button>

              {caption && (
                <div className="ps-caption-box">
                  {caption}
                  <button
                    className={`ps-copy-btn${copied ? ' copied' : ''}`}
                    onClick={handleCopyCaption}
                  >
                    {copied
                      ? <><CheckCheck size={12} /> Copied to clipboard</>
                      : <><Copy size={12} /> Copy caption</>
                    }
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* ── Canvas Area ── */}
          <section className="ps-canvas-area">
            {loading ? (
              <div className="ps-loading-pulse">Loading templates from Firestore…</div>
            ) : !activeTemplate ? (
              <div className="ps-empty">
                <div className="ps-empty-icon">
                  <ImageIcon size={22} />
                </div>
                <div className="ps-empty-title">No template selected</div>
                <div className="ps-empty-sub">Choose a template from the sidebar to preview it here.</div>
              </div>
            ) : (
              <>
                {/* Toolbar */}
                <div className="ps-canvas-toolbar">
                  <div className="ps-canvas-meta">
                    <span className="ps-canvas-title">{activeTemplate.name || selectedTemplateKey}</span>
                    <span className="ps-canvas-dims">
                      {activeTemplate.width || 1080} × {activeTemplate.height || 1080} px
                      {activeTemplate.category ? ` · ${activeTemplate.category}` : ''}
                    </span>
                  </div>
                  <span className="ps-scale-badge">52% preview</span>
                </div>

                {/* Canvas wrapper */}
                <div className="ps-canvas-wrapper">
                  <div
                    style={{
                      width: activeTemplate.width || 1080,
                      height: activeTemplate.height || 1080,
                      transform: 'scale(0.52)',
                      transformOrigin: 'top left',
                    }}
                  >
                    {/* Exportable inner canvas */}
                    <div
                      ref={postCanvasRef}
                      id="school-post-canvas"
                      style={{
                        position: 'relative',
                        width: activeTemplate.width || 1080,
                        height: activeTemplate.height || 1080,
                        overflow: 'hidden',
                        background: '#ffffff',
                      }}
                    >
                      {/* Background image */}
                      {activeTemplate.bg && (
                        <img
                          crossOrigin="anonymous"
                          src={activeTemplate.bg}
                          alt="background"
                          style={{
                            position: 'absolute', top: 0, left: 0,
                            width: '100%', height: '100%',
                            objectFit: 'cover', zIndex: 0,
                          }}
                        />
                      )}

                      {/* Template elements */}
                      {Array.isArray(activeTemplate.elements) &&
                        activeTemplate.elements.map((el, idx) => {
                          const key = el.id || `el_${idx}`;

                          if (el.type === 'shape') {
                            return (
                              <div
                                key={key}
                                style={{
                                  position: 'absolute',
                                  left: `${el.x}px`, top: `${el.y}px`,
                                  width: `${el.width}px`, height: `${el.height}px`,
                                  backgroundColor: el.bgColor || el.backgroundColor || 'transparent',
                                  borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0,
                                  opacity: el.opacity != null ? el.opacity / 100 : 1,
                                  zIndex: 10,
                                }}
                              />
                            );
                          }

                          if (el.type === 'image') {
                            const src = resolveValue(el.src || '', el.fieldBinding);
                            if (!src) return null;
                            return (
                              <img
                                key={key}
                                crossOrigin="anonymous"
                                src={src}
                                alt={el.id || 'element'}
                                style={{
                                  position: 'absolute',
                                  left: `${el.x}px`, top: `${el.y}px`,
                                  width: `${el.width}px`, height: `${el.height}px`,
                                  borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0,
                                  opacity: el.opacity != null ? el.opacity / 100 : 1,
                                  objectFit: 'cover', zIndex: 20,
                                }}
                              />
                            );
                          }

                          if (el.type === 'text') {
                            const displayText = resolveValue(el.text || '', el.fieldBinding);
                            return (
                              <div
                                key={key}
                                style={{
                                  position: 'absolute',
                                  left: `${el.x}px`, top: `${el.y}px`,
                                  width: el.width ? `${el.width}px` : 'auto',
                                  color: el.color || '#000000',
                                  fontSize: `${el.fontSize || 16}px`,
                                  fontWeight: el.fontWeight || '400',
                                  fontFamily: el.fontFamily ? `${el.fontFamily}, sans-serif` : 'sans-serif',
                                  textAlign: el.textAlign || 'left',
                                  letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : 'normal',
                                  lineHeight: el.lineHeight ? `${el.lineHeight}` : 'normal',
                                  opacity: el.opacity != null ? el.opacity / 100 : 1,
                                  zIndex: 30,
                                  whiteSpace: 'pre-wrap',
                                }}
                              >
                                {displayText}
                              </div>
                            );
                          }

                          return null;
                        })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
