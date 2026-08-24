// components/RightPanel.jsx
import React from 'react';
import { 
  Lock, 
  Unlock, 
  Copy, 
  Trash2, 
  Link, 
  Layers, 
  MoveUp, 
  MoveDown,
  Sparkles,
  Type,
  Maximize2
} from 'lucide-react';
import { GOOGLE_FONTS } from '../constants';

// 🎨 PRESET TEXT STYLES & REPRESENTATIONS
const TEXT_PRESETS = [
  {
    name: 'Primary Banner',
    style: {
      bgColor: '#2563EB',
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: '800',
      fontFamily: 'Bebas Neue',
      borderRadius: 8,
      padding: 10,
      textAlign: 'center',
      borderWidth: 0,
      letterSpacing: 2,
      shadowBlur: 10,
      shadowColor: 'rgba(37, 99, 235, 0.4)'
    }
  },
  {
    name: 'Red Pill Badge',
    style: {
      bgColor: '#DC2626',
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
      fontFamily: 'Poppins',
      borderRadius: 99,
      padding: 6,
      textAlign: 'center',
      borderWidth: 0,
      letterSpacing: 1
    }
  },
  {
    name: 'Glass Accent',
    style: {
      bgColor: 'rgba(255, 255, 255, 0.1)',
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Poppins',
      borderRadius: 12,
      padding: 8,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      borderWidth: 1,
      borderStyle: 'solid',
      textAlign: 'center'
    }
  },
  {
    name: 'Gold Headline',
    style: {
      bgColor: '#FEF08A',
      color: '#854D0E',
      fontSize: 18,
      fontWeight: '900',
      fontFamily: 'Montserrat',
      borderRadius: 6,
      padding: 8,
      borderColor: '#EAB308',
      borderWidth: 2,
      borderStyle: 'solid',
      textAlign: 'center'
    }
  },
  {
    name: 'Neon Cyber',
    style: {
      bgColor: '#000000',
      color: '#38BDF8',
      fontSize: 15,
      fontWeight: '800',
      fontFamily: 'Poppins',
      borderRadius: 6,
      padding: 8,
      borderColor: '#38BDF8',
      borderWidth: 2,
      borderStyle: 'solid',
      textAlign: 'center',
      shadowBlur: 12,
      shadowColor: '#38BDF8'
    }
  },
  {
    name: 'Clean Subtitle',
    style: {
      bgColor: 'transparent',
      color: '#94A3B8',
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'Roboto',
      borderRadius: 0,
      padding: 4,
      borderWidth: 0,
      textAlign: 'center'
    }
  }
];

export default function RightPanel({
  selectedEl,
  updateEl,
  commitEl,
  duplicateEl,
  deleteEl,
  schoolConfig
}) {
  if (!selectedEl) {
    return (
      <aside className="w-80 border-l border-slate-800 bg-slate-900/80 flex flex-col overflow-y-auto shrink-0 p-4">
        <div className="text-xs text-slate-400 text-center py-10">
          Select any element on canvas to modify its properties
        </div>
      </aside>
    );
  }

  const isTextLike = selectedEl.type === 'text' || selectedEl.type === 'badge';

  return (
    <aside className="w-80 border-l border-slate-800 bg-slate-900/80 flex flex-col overflow-y-auto shrink-0 p-4">
      <div className="space-y-5">
        
        {/* HEADER & QUICK ACTIONS */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {selectedEl.type} Properties
          </span>
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => updateEl(selectedEl.id, { locked: !selectedEl.locked })} 
              className="p-1 hover:bg-slate-800 rounded text-slate-400"
              title="Lock/Unlock Element"
            >
              {selectedEl.locked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => duplicateEl(selectedEl.id)} 
              className="p-1 hover:bg-slate-800 rounded text-slate-300"
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button 
              onClick={() => deleteEl(selectedEl.id)} 
              className="p-1 hover:bg-slate-800 rounded text-red-400"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ⚡ DYNAMIC FIRESTORE BINDING CONTROL */}
        <div className="bg-indigo-950/40 border border-indigo-800/50 p-3 rounded-xl space-y-2">
          <div className="flex items-center space-x-1.5 text-indigo-400">
            <Link className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Dynamic School Field Link</span>
          </div>
          <select
            value={selectedEl.fieldBinding || 'none'}
            onChange={(e) => {
              const binding = e.target.value;
              if (binding === 'none') {
                commitEl(selectedEl.id, { fieldBinding: undefined });
              } else {
                const fetchedValue = schoolConfig?.[binding] || `{{${binding}}}`;
                if (selectedEl.type === 'image' && binding === 'logoUrl') {
                  commitEl(selectedEl.id, { fieldBinding: binding, src: fetchedValue });
                } else {
                  commitEl(selectedEl.id, { fieldBinding: binding, text: fetchedValue });
                }
              }
            }}
            className="w-full bg-slate-900 border border-indigo-700/60 rounded-lg p-2 text-xs text-indigo-200 font-semibold focus:outline-none"
          >
            <option value="none">Static Content (Unlinked)</option>
            <option value="schoolName">School Name</option>
            <option value="phone">Phone Number</option>
            <option value="schoolAddress">School Address</option>
            <option value="tagline">School Tagline</option>
            <option value="website">Website URL</option>
            <option value="logoUrl">School Logo (Image)</option>
          </select>
          <p className="text-[9px] text-slate-400">
            Linking this element automatically pulls data from the active school's profile.
          </p>
        </div>

        {/* 🎨 PRESET TEXT STYLES GRID */}
        {isTextLike && (
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-1 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <label className="text-[10px] font-bold uppercase tracking-wider">Title Style Presets</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TEXT_PRESETS.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => commitEl(selectedEl.id, preset.style)}
                  className="p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg flex flex-col items-center justify-center transition-all group"
                >
                  <div
                    style={{
                      backgroundColor: preset.style.bgColor,
                      color: preset.style.color,
                      borderRadius: `${preset.style.borderRadius}px`,
                      border: `${preset.style.borderWidth || 0}px ${preset.style.borderStyle || 'solid'} ${preset.style.borderColor || 'transparent'}`,
                      fontFamily: preset.style.fontFamily,
                      fontWeight: preset.style.fontWeight,
                      fontSize: '10px'
                    }}
                    className="w-full py-1 px-1 text-center truncate mb-1 shadow-sm"
                  >
                    Aa Style
                  </div>
                  <span className="text-[9px] text-slate-400 group-hover:text-white truncate w-full text-center">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CONTENT & TYPOGRAPHY */}
        {isTextLike && (
          <div className="space-y-3 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-1 text-slate-300">
              <Type className="w-3.5 h-3.5 text-indigo-400" />
              <label className="text-[10px] font-bold uppercase tracking-wider">Typography</label>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Text String</label>
              <textarea
                value={selectedEl.text || ''}
                onChange={(e) => commitEl(selectedEl.id, { text: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white h-16 resize-none focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Font Family</label>
              <select
                value={selectedEl.fontFamily || 'Poppins'}
                onChange={(e) => commitEl(selectedEl.id, { fontFamily: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Font Size (px)</label>
                <input
                  type="number"
                  value={selectedEl.fontSize || 16}
                  onChange={(e) => commitEl(selectedEl.id, { fontSize: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Font Weight</label>
                <select
                  value={selectedEl.fontWeight || '700'}
                  onChange={(e) => commitEl(selectedEl.id, { fontWeight: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none"
                >
                  {['300', '400', '500', '600', '700', '800', '900'].map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Letter Spacing (px)</label>
                <input
                  type="number"
                  value={selectedEl.letterSpacing || 0}
                  onChange={(e) => commitEl(selectedEl.id, { letterSpacing: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Text Transform</label>
                <select
                  value={selectedEl.textTransform || 'none'}
                  onChange={(e) => commitEl(selectedEl.id, { textTransform: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                >
                  <option value="none">Normal</option>
                  <option value="uppercase">UPPERCASE</option>
                  <option value="lowercase">lowercase</option>
                  <option value="capitalize">Capitalize</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Text Color</label>
                <input
                  type="color"
                  value={selectedEl.color || '#FFFFFF'}
                  onChange={(e) => commitEl(selectedEl.id, { color: e.target.value })}
                  className="w-full h-8 bg-transparent cursor-pointer rounded"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Text Align</label>
                <div className="flex border border-slate-700 rounded-lg overflow-hidden">
                  {['left', 'center', 'right'].map(align => (
                    <button
                      key={align}
                      onClick={() => commitEl(selectedEl.id, { textAlign: align })}
                      className={`flex-1 py-1.5 text-xs uppercase font-bold ${selectedEl.textAlign === align ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                      {align[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* IMAGE SPECIFIC CONTROLS */}
        {selectedEl.type === 'image' && (
          <div className="space-y-3 border-b border-slate-800 pb-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Image Source</span>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Image URL / Base64</label>
              <input
                type="text"
                value={selectedEl.src || ''}
                onChange={(e) => commitEl(selectedEl.id, { src: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Object Fit</label>
              <select
                value={selectedEl.objectFit || 'cover'}
                onChange={(e) => commitEl(selectedEl.id, { objectFit: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="cover">Cover (Crop to fill)</option>
                <option value="contain">Contain (Fit inside)</option>
                <option value="fill">Fill (Stretch)</option>
              </select>
            </div>
          </div>
        )}

        {/* CONTAINER, BOX & BADGE STYLING */}
        <div className="space-y-3 border-b border-slate-800 pb-4">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Container & Appearance</span>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Background Color</label>
              <input
                type="color"
                value={selectedEl.bgColor || '#3B82F6'}
                onChange={(e) => commitEl(selectedEl.id, { bgColor: e.target.value })}
                className="w-full h-8 bg-transparent cursor-pointer rounded"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Border Radius (px)</label>
              <input
                type="number"
                value={selectedEl.borderRadius ?? 8}
                onChange={(e) => commitEl(selectedEl.id, { borderRadius: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Border Width (px)</label>
              <input
                type="number"
                value={selectedEl.borderWidth || 0}
                onChange={(e) => commitEl(selectedEl.id, { borderWidth: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Border Color</label>
              <input
                type="color"
                value={selectedEl.borderColor || '#38BDF8'}
                onChange={(e) => commitEl(selectedEl.id, { borderColor: e.target.value })}
                className="w-full h-8 bg-transparent cursor-pointer rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Border Style</label>
              <select
                value={selectedEl.borderStyle || 'solid'}
                onChange={(e) => commitEl(selectedEl.id, { borderStyle: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Padding (px)</label>
              <input
                type="number"
                value={selectedEl.padding || 0}
                onChange={(e) => commitEl(selectedEl.id, { padding: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>
          </div>

          {/* SHADOW CONTROLS */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Glow / Shadow Blur</label>
              <input
                type="number"
                value={selectedEl.shadowBlur || 0}
                onChange={(e) => commitEl(selectedEl.id, { shadowBlur: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Shadow Color</label>
              <input
                type="color"
                value={selectedEl.shadowColor || '#000000'}
                onChange={(e) => commitEl(selectedEl.id, { shadowColor: e.target.value })}
                className="w-full h-8 bg-transparent cursor-pointer rounded"
              />
            </div>
          </div>
        </div>

        {/* TRANSFORM, POSITION & GEOMETRY */}
        <div className="space-y-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-1 text-slate-300">
            <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Transform & Geometry</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">X Pos</label>
              <input
                type="number"
                value={selectedEl.x}
                onChange={(e) => commitEl(selectedEl.id, { x: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Y Pos</label>
              <input
                type="number"
                value={selectedEl.y}
                onChange={(e) => commitEl(selectedEl.id, { y: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Width</label>
              <input
                type="number"
                value={selectedEl.width || 100}
                onChange={(e) => commitEl(selectedEl.id, { width: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Height</label>
              <input
                type="number"
                value={selectedEl.height || 40}
                onChange={(e) => commitEl(selectedEl.id, { height: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Opacity</span>
              <span>{selectedEl.opacity ?? 100}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={selectedEl.opacity ?? 100}
              onChange={(e) => commitEl(selectedEl.id, { opacity: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Rotation</span>
              <span>{selectedEl.rotation || 0}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={selectedEl.rotation || 0}
              onChange={(e) => commitEl(selectedEl.id, { rotation: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        {/* LAYERS & Z-INDEX ORDERING */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1 text-slate-300">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Layer Depth (Z-Index)</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => commitEl(selectedEl.id, { zIndex: (selectedEl.zIndex || 1) + 1 })}
              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center justify-center gap-1"
            >
              <MoveUp className="w-3 h-3" /> Bring Forward
            </button>
            <button
              onClick={() => commitEl(selectedEl.id, { zIndex: Math.max(0, (selectedEl.zIndex || 1) - 1) })}
              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center justify-center gap-1"
            >
              <MoveDown className="w-3 h-3" /> Send Backward
            </button>
          </div>
        </div>

      </div>
    </aside>
  );
}