'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db, mvgDb } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import { 
  Download, 
  RefreshCw, 
  Sparkles, 
  LayoutGrid, 
  Copy, 
  CheckCheck, 
  ImageIcon, 
  ChevronRight 
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PREVIEW_WIDTH = 540;

// Fetch any remote image through the Next.js server proxy and convert to pure base64
async function urlToBase64(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  if (rawUrl.startsWith('data:') || rawUrl.startsWith('#')) return rawUrl;

  try {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(rawUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(rawUrl);
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {
    console.warn('Proxy fetch failed for URL:', rawUrl, err);
  }

  // Fallback: direct CORS fetch
  try {
    const res = await fetch(rawUrl, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(rawUrl);
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {
    console.warn('Direct fetch failed for URL:', rawUrl, err);
  }

  return rawUrl;
}

export default function PosterStudioPage() {
  const [templates, setTemplates] = useState({});
  const [schoolData, setSchoolData] = useState(null);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [caption, setCaption] = useState('');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [copied, setCopied] = useState(false);

  const postCanvasRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  // ─── Dynamic Google Fonts Loader ──────────────────────────────────────────
  useEffect(() => {
    const activeTemplate = selectedTemplateKey ? templates[selectedTemplateKey] : null;
    if (!activeTemplate || !Array.isArray(activeTemplate.elements)) return;
    const fontFamilies = new Set();
    activeTemplate.elements.forEach((el) => {
      const font = el.font || el.fontFamily;
      if (el.type === 'text' && font) {
        const cleanFont = font.split(',')[0].replace(/['"]+/g, '').trim();
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

  // ─── Dual Firestore Fetch ──────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    setCaption('');
    try {
      const primaryDb = mvgDb || db;
      let profileSnap = await getDoc(doc(primaryDb, 'app_assets', 'profile'));

      if (!profileSnap.exists() && mvgDb) {
        profileSnap = await getDoc(doc(db, 'app_assets', 'profile'));
      }

      const defaultLogo = 'https://res.cloudinary.com/db6ssceun/image/upload/v1771071585/SCHOOL_SENIOR_SECONDARY_LOGO_t88t8l.png';

      if (profileSnap.exists()) {
        const raw = profileSnap.data();
        const p = raw.profile || raw;
        setSchoolData({
          schoolName:    p.schoolName    || p.name        || 'MVG PUBLIC SR. SEC. SCHOOL',
          schoolLogo:    p.logoUrl       || p.schoolLogo  || defaultLogo,
          schoolPhone:   p.schoolPhone   || p.phone       || '',
          schoolAddress: p.schoolAddress || p.address     || 'Sheopur, Pratap Nagar, Sanganer, Jaipur',
          schoolEmail:   p.schoolEmail   || p.email       || p.schoolMail || 'mvgschooljaipur@gmail.com',
          schoolWebsite: p.schoolWebsite || p.website     || 'www.mvgschool.com',
          schoolTagline: p.schoolTagline || p.tagline     || '',
        });
      } else {
        setSchoolData({
          schoolName:    'MVG PUBLIC SR. SEC. SCHOOL',
          schoolLogo:    defaultLogo,
          schoolPhone:   '',
          schoolAddress: 'Sheopur, Pratap Nagar, Sanganer, Jaipur',
          schoolEmail:   'mvgschooljaipur@gmail.com',
          schoolWebsite: 'www.mvgschool.com',
          schoolTagline: '',
        });
      }

      let combinedTemplates = {};

      if (mvgDb) {
        try {
          const mvgTemplatesSnap = await getDoc(doc(mvgDb, 'app_assets', 'templates'));
          if (mvgTemplatesSnap.exists()) {
            combinedTemplates = { ...combinedTemplates, ...mvgTemplatesSnap.data() };
          }
        } catch (mvgErr) {
          console.warn('mvgDb load error:', mvgErr);
        }
      }

      try {
        const centralTemplatesSnap = await getDoc(doc(db, 'app_assets', 'templates'));
        if (centralTemplatesSnap.exists()) {
          combinedTemplates = { ...centralTemplatesSnap.data(), ...combinedTemplates };
        }
      } catch (centralErr) {
        console.warn('Central db load error:', centralErr);
      }

      if (Object.keys(combinedTemplates).length > 0) {
        setTemplates(combinedTemplates);
        setSelectedTemplateKey(Object.keys(combinedTemplates)[0]);
      } else {
        setTemplates({});
        setSelectedTemplateKey(null);
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
      .replace(/\{\{schoolName\}\}/g,    schoolData.schoolName || '')
      .replace(/\{\{schoolLogo\}\}/g,    schoolData.schoolLogo || '')
      .replace(/\{\{schoolPhone\}\}/g,   schoolData.schoolPhone || '')
      .replace(/\{\{schoolAddress\}\}/g, schoolData.schoolAddress || '')
      .replace(/\{\{schoolEmail\}\}/g,   schoolData.schoolEmail || '')
      .replace(/\{\{schoolMail\}\}/g,    schoolData.schoolEmail || '')
      .replace(/\{\{schoolWebsite\}\}/g, schoolData.schoolWebsite || '')
      .replace(/\{\{website\}\}/g,       schoolData.schoolWebsite || '')
      .replace(/\{\{address\}\}/g,       schoolData.schoolAddress || '')
      .replace(/\{\{schoolTagline\}\}/g, schoolData.schoolTagline || '')
      .replace(/\{\{logoUrl\}\}/g,       schoolData.schoolLogo || '');
  };

  // ─── Direct Export Pipeline ───────────────────────────────────────────────
  const handleExportPost = async () => {
    if (!activeTemplate || !postCanvasRef.current) return;
    setIsExporting(true);

    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;

      // 1. Convert Background Image to Base64 via proxy
      let bgBase64 = null;
      if (activeTemplate.bg && !activeTemplate.bg.startsWith('#')) {
        bgBase64 = await urlToBase64(activeTemplate.bg);
      }

      // 2. Clone the container for offscreen rendering
      const exportContainer = document.createElement('div');
      exportContainer.style.cssText = `position:fixed;left:-9999px;top:0;width:${targetWidth}px;height:${targetHeight}px;background:#ffffff;z-index:99999;overflow:hidden;`;
      exportContainer.innerHTML = postCanvasRef.current.innerHTML;

      // 3. Inject the Base64 image directly into the background <img> tag
      const bgImg = exportContainer.querySelector('img[data-bg="true"]');
      if (bgBase64 && bgBase64.startsWith('data:')) {
        if (bgImg) {
          bgImg.removeAttribute('crossorigin');
          bgImg.removeAttribute('referrerpolicy');
          bgImg.src = bgBase64;
        } else {
          const newBg = document.createElement('img');
          newBg.src = bgBase64;
          newBg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;';
          exportContainer.insertBefore(newBg, exportContainer.firstChild);
        }
      }

      // 4. Convert all other images (e.g. school logo) to Base64 as well
      const otherImgs = Array.from(exportContainer.querySelectorAll('img:not([data-bg="true"])'));
      for (const img of otherImgs) {
        if (img.src && !img.src.startsWith('data:')) {
          const imgBase64 = await urlToBase64(img.src);
          if (imgBase64 && imgBase64.startsWith('data:')) {
            img.removeAttribute('crossorigin');
            img.removeAttribute('referrerpolicy');
            img.src = imgBase64;
          }
        }
      }

      // 5. Clear any CSS background-image rules to prevent html2canvas from making background fetches
      exportContainer.querySelectorAll('*').forEach((el) => {
        if (el.style && el.style.backgroundImage && el.style.backgroundImage.includes('http')) {
          el.style.backgroundImage = 'none';
        }
      });

      document.body.appendChild(exportContainer);

      // 6. Explicitly wait for all images to decode in the DOM
      const imgsToDecode = Array.from(exportContainer.querySelectorAll('img'));
      await Promise.all(
        imgsToDecode.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      // 7. Render with allowTaint: false and useCORS: false because all assets are inlined Base64
      const canvas = await html2canvas(exportContainer, {
        scale: 2,
        useCORS: false,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
      });

      document.body.removeChild(exportContainer);

      const link = document.createElement('a');
      link.download = `${selectedTemplateKey || 'school_poster'}_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      console.error('Export Error:', err);
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

  const targetWidth = activeTemplate?.width || 1080;
  const targetHeight = activeTemplate?.height || 1080;
  const previewScale = PREVIEW_WIDTH / targetWidth;
  const scaledHeight = targetHeight * previewScale;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --brand-yellow: #FACC15;
          --brand-yellow-hover: #EAB308;
          --brand-yellow-light: #FEF9C3;
          --brand-yellow-tint: #FFFDEB;
          --brand-dark: #1E1B18;
          --border-color: #ECE8DE;
          --bg-canvas-area: #F7F6F2;
        }

        .ps-root {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--bg-canvas-area);
          color: #1F2937;
          font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
        }

        /* ── Header ── */
        .ps-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 64px;
          background: #FFFFFF;
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 50;
          flex-shrink: 0;
        }
        .ps-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ps-logo-dot {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--brand-yellow);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1E1B18;
          box-shadow: 0 2px 6px rgba(250, 204, 21, 0.35);
        }
        .ps-app-title {
          font-size: 16px;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.3px;
        }
        .ps-school-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #FEF08A;
          color: #713F12;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 9999px;
          letter-spacing: 0.2px;
          border: 1px solid #FDE047;
        }
        .ps-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ps-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 12.5px;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .ps-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
        .ps-btn-ghost {
          background: #FFFFFF;
          color: #4B5563;
          border: 1px solid #D1D5DB;
        }
        .ps-btn-ghost:hover:not(:disabled) {
          background: #F3F4F6;
          color: #111827;
        }
        .ps-btn-export {
          background: var(--brand-yellow);
          color: #1E1B18;
          box-shadow: 0 2px 8px rgba(250, 204, 21, 0.4);
        }
        .ps-btn-export:hover:not(:disabled) {
          background: var(--brand-yellow-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(234, 179, 8, 0.45);
        }

        /* ── Main Layout ── */
        .ps-main {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        /* ── Sidebar ── */
        .ps-sidebar {
          width: 280px;
          background: #FFFFFF;
          border-right: 1px solid var(--border-color);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .ps-sidebar::-webkit-scrollbar { width: 4px; }
        .ps-sidebar::-webkit-scrollbar-track { background: transparent; }
        .ps-sidebar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 4px; }

        .ps-section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 18px 16px 10px;
        }
        .ps-section-label {
          font-size: 11px;
          font-weight: 800;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .ps-section-count {
          margin-left: auto;
          background: #F3F4F6;
          color: #6B7280;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
        }

        /* Template Cards */
        .ps-template-list {
          padding: 0 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ps-template-card {
          padding: 10px 12px;
          border-radius: 14px;
          border: 1.5px solid transparent;
          background: #FAFAFA;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ps-template-card:hover {
          background: #F4F4F5;
          border-color: #E4E4E7;
        }
        .ps-template-card.active {
          background: var(--brand-yellow-tint);
          border-color: #FACC15;
          box-shadow: 0 2px 8px rgba(250, 204, 21, 0.18);
        }
        .ps-template-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #F3F4F6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #9CA3AF;
          transition: all 0.15s ease;
        }
        .ps-template-card.active .ps-template-icon {
          background: var(--brand-yellow);
          color: #1E1B18;
        }
        .ps-template-info { flex: 1; min-width: 0; }
        .ps-template-name {
          font-size: 12.5px;
          font-weight: 700;
          color: #1F2937;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ps-template-card.active .ps-template-name {
          color: #854D0E;
        }
        .ps-template-cat {
          font-size: 10.5px;
          font-weight: 500;
          color: #9CA3AF;
          margin-top: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ps-chevron { color: #D1D5DB; transition: all 0.15s ease; flex-shrink: 0; }
        .ps-template-card.active .ps-chevron { color: #CA8A04; }

        .ps-divider {
          height: 1px;
          background: var(--border-color);
          margin: 10px 16px;
        }

        /* AI Caption Section */
        .ps-caption-panel {
          padding: 0 12px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ps-btn-ai {
          width: 100%;
          justify-content: center;
          padding: 10px 14px;
          background: var(--brand-yellow);
          color: #1E1B18;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.2px;
          box-shadow: 0 2px 8px rgba(250, 204, 21, 0.35);
          transition: all 0.15s ease;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ps-btn-ai:hover:not(:disabled) {
          background: var(--brand-yellow-hover);
          transform: translateY(-1px);
        }
        .ps-btn-ai:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

        .ps-caption-box {
          background: #FAFAFA;
          border: 1.5px solid var(--border-color);
          border-radius: 12px;
          padding: 12px;
          font-size: 12px;
          line-height: 1.6;
          color: #374151;
          white-space: pre-wrap;
        }
        .ps-copy-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          margin-top: 8px;
          padding: 7px;
          background: #FFFFFF;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          color: #4B5563;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ps-copy-btn:hover { background: #F3F4F6; color: #111827; }
        .ps-copy-btn.copied { color: #047857; border-color: #A7F3D0; background: #ECFDF5; }

        /* ── Canvas Central Area ── */
        .ps-canvas-area {
          flex: 1;
          background: var(--bg-canvas-area);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 20px 48px;
        }
        .ps-canvas-area::-webkit-scrollbar { width: 6px; }
        .ps-canvas-area::-webkit-scrollbar-track { background: transparent; }
        .ps-canvas-area::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }

        /* Toolbar */
        .ps-canvas-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: ${PREVIEW_WIDTH}px;
          max-width: 100%;
          margin-bottom: 14px;
        }
        .ps-canvas-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ps-canvas-title {
          font-size: 15px;
          font-weight: 800;
          color: #111827;
        }
        .ps-canvas-dims {
          font-size: 11px;
          font-weight: 600;
          color: #9CA3AF;
        }
        .ps-scale-badge {
          font-size: 11px;
          font-weight: 700;
          color: #6B7280;
          background: #EAE8E1;
          border: 1px solid #DCD8CD;
          padding: 3px 10px;
          border-radius: 8px;
        }

        /* Scaled Card Frame */
        .ps-canvas-card {
          width: ${PREVIEW_WIDTH}px;
          height: ${scaledHeight}px;
          background: #FFFFFF;
          border-radius: 28px;
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          position: relative;
          flex-shrink: 0;
        }

        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="ps-root">

        {/* ── Top Header Bar ── */}
        <header className="ps-header">
          <div className="ps-header-left">
            <div className="ps-logo-dot">
              <Sparkles size={18} />
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
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              Refresh
            </button>
            <button
              className="ps-btn ps-btn-export"
              onClick={handleExportPost}
              disabled={isExporting || !activeTemplate}
            >
              <Download size={14} />
              {isExporting ? 'Exporting…' : 'Export PNG'}
            </button>
          </div>
        </header>

        {/* ── Main Workstation ── */}
        <main className="ps-main">

          {/* ── Sidebar ── */}
          <aside className="ps-sidebar">
            <div className="ps-section-header">
              <LayoutGrid size={14} color="#FACC15" />
              <span className="ps-section-label">Templates</span>
              {!loading && templateCount > 0 && (
                <span className="ps-section-count">{templateCount}</span>
              )}
            </div>

            <div className="ps-template-list">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} style={{ height: '54px', background: '#F3F4F6', borderRadius: '14px', animation: 'pulse 1.5s infinite' }} />
                ))
              ) : templateCount === 0 ? (
                <div style={{ padding: '24px 10px', textAlign: 'center', fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }}>
                  No templates available.
                </div>
              ) : (
                Object.entries(templates).map(([key, tpl]) => (
                  <button
                    key={key}
                    className={`ps-template-card${selectedTemplateKey === key ? ' active' : ''}`}
                    onClick={() => { setSelectedTemplateKey(key); setCaption(''); }}
                  >
                    <div className="ps-template-icon">
                      <ImageIcon size={16} />
                    </div>
                    <div className="ps-template-info">
                      <div className="ps-template-name">{tpl.name || key}</div>
                      {tpl.category && (
                        <div className="ps-template-cat">{tpl.category}</div>
                      )}
                    </div>
                    <ChevronRight size={14} className="ps-chevron" />
                  </button>
                ))
              )}
            </div>

            <div className="ps-divider" />

            {/* AI Caption Generator */}
            <div className="ps-section-header">
              <Sparkles size={14} color="#EAB308" />
              <span className="ps-section-label">AI Caption</span>
            </div>

            <div className="ps-caption-panel">
              <button
                className="ps-btn-ai"
                onClick={handleGenerateCaption}
                disabled={isGeneratingCaption || !activeTemplate || !schoolData}
              >
                {isGeneratingCaption ? (
                  <><RefreshCw size={13} className="spin" /> Drafting caption…</>
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
                      : <><Copy size={12} /> Copy text</>
                    }
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* ── Canvas Viewer ── */}
          <section className="ps-canvas-area">
            {loading ? (
              <div style={{ margin: 'auto', color: '#9CA3AF', fontWeight: 700, fontSize: '13px' }}>
                Loading canvas elements…
              </div>
            ) : !activeTemplate ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: '#9CA3AF', fontWeight: 600 }}>
                Select a template from the sidebar to display the poster.
              </div>
            ) : (
              <>
                {/* Canvas Metadata Toolbar */}
                <div className="ps-canvas-toolbar">
                  <div className="ps-canvas-meta">
                    <span className="ps-canvas-title">{activeTemplate.name || selectedTemplateKey}</span>
                    <span className="ps-canvas-dims">
                      {targetWidth} × {targetHeight} px
                      {activeTemplate.category ? ` · ${activeTemplate.category}` : ''}
                    </span>
                  </div>
                  <span className="ps-scale-badge">{Math.round(previewScale * 100)}% preview</span>
                </div>

                {/* Scaled Canvas Card Container */}
                <div className="ps-canvas-card">
                  <div
                    style={{
                      width: targetWidth,
                      height: targetHeight,
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    {/* Rendered Inner Canvas */}
                    <div
                      ref={postCanvasRef}
                      id="school-post-canvas"
                      style={{
                        position: 'relative',
                        width: targetWidth,
                        height: targetHeight,
                        overflow: 'hidden',
                        backgroundColor: activeTemplate.bg && activeTemplate.bg.startsWith('#') ? activeTemplate.bg : '#ffffff',
                      }}
                    >
                      {/* Background Image: Directly visible in browser */}
                      {activeTemplate.bg && !activeTemplate.bg.startsWith('#') && (
                        <img
                          key={activeTemplate.bg}
                          data-bg="true"
                          src={activeTemplate.bg}
                          alt="background"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            if (!e.target.src.includes('/api/proxy-image')) {
                              e.target.src = `/api/proxy-image?url=${encodeURIComponent(activeTemplate.bg)}`;
                            }
                          }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            zIndex: 0,
                            pointerEvents: 'none',
                          }}
                        />
                      )}

                      {/* Poster Elements */}
                      {Array.isArray(activeTemplate.elements) &&
                        activeTemplate.elements.map((el, idx) => {
                          const key = el.id || `el_${idx}`;

                          // 1. Shapes / Banners
                          if (el.type === 'shape') {
                            return (
                              <div
                                key={key}
                                style={{
                                  position: 'absolute',
                                  left: `${el.x}px`,
                                  top: `${el.y}px`,
                                  width: `${el.width}px`,
                                  height: `${el.height}px`,
                                  backgroundColor: el.bgColor || el.backgroundColor || 'transparent',
                                  borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0,
                                  opacity: el.opacity != null ? el.opacity / 100 : 1,
                                  zIndex: 10,
                                }}
                              />
                            );
                          }

                          // 2. Vector SVG Icons
                          if (el.type === 'icon') {
                            return (
                              <div
                                key={key}
                                style={{
                                  position: 'absolute',
                                  left: `${el.x}px`,
                                  top: `${el.y}px`,
                                  width: `${el.width || 44}px`,
                                  height: `${el.height || 44}px`,
                                  color: el.color || '#EAB308',
                                  opacity: el.opacity != null ? el.opacity / 100 : 1,
                                  zIndex: 15,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '100%', height: '100%' }}>
                                  <path d={el.svgPath} />
                                </svg>
                              </div>
                            );
                          }

                          // 3. Logos / Images
                          if (el.type === 'image') {
                            const isLogoField = el.fieldBinding === 'schoolLogo' || el.fieldBinding === 'logoUrl';
                            const rawSrc = resolveValue(el.src || '', el.fieldBinding);
                            const finalSrc = rawSrc || (isLogoField ? schoolData?.schoolLogo : '');

                            return (
                              <div
                                key={key}
                                style={{
                                  position: 'absolute',
                                  left: `${el.x}px`,
                                  top: `${el.y}px`,
                                  width: `${el.width}px`,
                                  height: `${el.height}px`,
                                  borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0,
                                  overflow: 'hidden',
                                  zIndex: 20,
                                }}
                              >
                                {finalSrc ? (
                                  <img
                                    key={finalSrc}
                                    data-logo={isLogoField ? 'true' : 'false'}
                                    src={finalSrc}
                                    alt={el.id || 'element'}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      if (!e.target.src.includes('/api/proxy-image') && !e.target.src.startsWith('data:')) {
                                        e.target.src = `/api/proxy-image?url=${encodeURIComponent(finalSrc)}`;
                                      }
                                    }}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0,
                                      opacity: el.opacity != null ? el.opacity / 100 : 1,
                                      objectFit: 'cover',
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      backgroundColor: '#FACC15',
                                      color: '#1E1B18',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: '800',
                                      fontSize: '28px',
                                      borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0,
                                    }}
                                  >
                                    {(schoolData?.schoolName || 'M').charAt(0)}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          // 4. Texts
                          if (el.type === 'text') {
                            const displayText = resolveValue(el.text || '', el.fieldBinding);
                            const fontStyle = el.font || el.fontFamily || 'Inter, sans-serif';
                            return (
                              <div
                                key={key}
                                style={{
                                  position: 'absolute',
                                  left: `${el.x}px`,
                                  top: `${el.y}px`,
                                  width: el.width ? `${el.width}px` : 'auto',
                                  color: el.color || '#000000',
                                  fontSize: `${el.fontSize || 16}px`,
                                  fontWeight: el.fontWeight || '400',
                                  fontFamily: fontStyle.includes(',') ? fontStyle : `${fontStyle}, sans-serif`,
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