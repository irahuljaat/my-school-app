// components/LeftDrawer.jsx
import React, { useState } from 'react';
import { 
  Settings, Save, Loader2, Image as ImageIcon, Upload, Plus, 
  Wand2, Sparkles, ChevronUp, ChevronDown, Sparkle, Search, Layers, 
  Type, Paintbrush, Trash2
} from 'lucide-react';
import { GRADIENT_PRESETS } from '../constants';
import { PRESET_ELEMENTS, ELEMENT_CATEGORIES } from '../constants/presetElements';

export default function LeftDrawer({
  activeTab,
  schoolConfig = {},
  setSchoolConfig,
  saveStatusMsg,
  logoInputRef,
  addElement,
  handleSaveProfileToFirestore,
  isSavingProfile,
  aiTopic = '',
  setAiTopic,
  handleGenerateAi,
  isGeneratingAi,
  aiOutput = {},
  applyAiToCanvas,
  handleSaveAsTemplate,
  isSavingTemplate,
  templates = {},
  applyTemplateWithSchoolData,
  bgType = 'color', // 'color' | 'gradient' | 'image'
  setBgType,
  bgColor = '#ffffff',
  setBgColor,
  bgGradient,
  setBgGradient,
  bgImage = '',
  setBgImage,
  bgImageInputRef,
  elements = [],
  moveLayer,
  selectedId,
  setSelectedId
}) {
  const [elementCategory, setElementCategory] = useState('all');
  const [elementSearch, setElementSearch] = useState('');

  const presetsList = PRESET_ELEMENTS || [];
  const filteredPresets = presetsList.filter(item => {
    const matchesCat = elementCategory === 'all' || item.category === elementCategory;
    const matchesSearch = item.name?.toLowerCase().includes(elementSearch.toLowerCase()) || 
                          (item.text && item.text.toLowerCase().includes(elementSearch.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <aside className="w-80 border-r border-slate-800 bg-slate-900/80 flex flex-col overflow-y-auto shrink-0 z-10 custom-scrollbar">
      <div className="p-4 space-y-4">
        
        {/* =========================================
            1. BRANDING & PROFILE TAB
           ========================================= */}
        {activeTab === 'branding' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Settings className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">School Profile & Data</h3>
              </div>
              {saveStatusMsg && <span className="text-[10px] text-emerald-400 font-bold">{saveStatusMsg}</span>}
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 space-y-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">School Logo</span>
              
              <div className="flex items-center space-x-3">
                {schoolConfig?.logoUrl ? (
                  <img src={schoolConfig.logoUrl} alt="Logo" className="w-14 h-14 rounded-lg object-contain bg-slate-950 p-1 border border-slate-700" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-slate-950 border border-dashed border-slate-700 flex items-center justify-center text-slate-500">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}

                <div className="flex-1 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => logoInputRef?.current?.click()}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Custom Logo</span>
                  </button>

                  {schoolConfig?.logoUrl && (
                    <button
                      type="button"
                      onClick={() => addElement({
                        type: 'image',
                        src: schoolConfig.logoUrl,
                        fieldBinding: 'logoUrl',
                        width: 80,
                        height: 80,
                        x: 210,
                        y: 20,
                        name: 'School Logo'
                      })}
                      className="w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-[11px] rounded-lg flex items-center justify-center space-x-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Place Logo On Canvas</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Logo URL String</label>
                <input
                  type="text"
                  value={schoolConfig?.logoUrl || ''}
                  onChange={(e) => setSchoolConfig({ ...schoolConfig, logoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg p-2 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="space-y-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Master Profile Fields</span>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">School Name</label>
                <input
                  type="text"
                  value={schoolConfig?.schoolName || ''}
                  onChange={(e) => setSchoolConfig({ ...schoolConfig, schoolName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">School Address</label>
                <textarea
                  value={schoolConfig?.schoolAddress || ''}
                  onChange={(e) => setSchoolConfig({ ...schoolConfig, schoolAddress: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg p-2 text-xs text-white h-14 resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Phone Contact</label>
                <input
                  type="text"
                  value={schoolConfig?.phone || ''}
                  onChange={(e) => setSchoolConfig({ ...schoolConfig, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Tagline</label>
                <input
                  type="text"
                  value={schoolConfig?.tagline || ''}
                  onChange={(e) => setSchoolConfig({ ...schoolConfig, tagline: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Website</label>
                <input
                  type="text"
                  value={schoolConfig?.website || ''}
                  onChange={(e) => setSchoolConfig({ ...schoolConfig, website: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg p-2 text-xs text-white"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveProfileToFirestore}
                disabled={isSavingProfile}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Changes to Firestore</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================
            2. AI STUDIO TAB
           ========================================= */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-2">
              <Wand2 className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">AI Poster Generator</h3>
            </div>

            <div className="space-y-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Topic / Event</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Science Fair 2026..."
                  className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg p-2 text-xs text-slate-200"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateAi}
                disabled={isGeneratingAi || !aiTopic.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-2 transition-colors"
              >
                {isGeneratingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Generate Creative Copy</span>
              </button>
            </div>

            {(aiOutput?.headline || aiOutput?.subheadline || aiOutput?.highlights) && (
              <div className="space-y-2 bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs">
                {aiOutput.headline && <p className="font-bold text-slate-100">{aiOutput.headline}</p>}
                {aiOutput.subheadline && <p className="text-slate-400 text-[11px]">{aiOutput.subheadline}</p>}
                {aiOutput.highlights && (
                  <pre className="text-[11px] text-slate-300 font-sans whitespace-pre-wrap">{aiOutput.highlights}</pre>
                )}
                
                <button
                  type="button"
                  onClick={applyAiToCanvas}
                  className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors"
                >
                  Apply AI Layout to Canvas
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================
            3. DYNAMIC TEMPLATES TAB
           ========================================= */}
        {activeTab === 'templates' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase text-slate-400">Presets & Dynamic Templates</h3>
            </div>

            <button
              type="button"
              onClick={handleSaveAsTemplate}
              disabled={isSavingTemplate}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              {isSavingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Canvas as Dynamic Template</span>
            </button>

            <div
              onClick={() => applyTemplateWithSchoolData([
                { type: 'image', src: '{{logoUrl}}', fieldBinding: 'logoUrl', x: 210, y: 25, width: 80, height: 80 },
                { type: 'text', text: '{{schoolName}}', fieldBinding: 'schoolName', x: 25, y: 115, width: 450, height: 45, fontSize: 26, fontWeight: '900', fontFamily: 'Bebas Neue', color: '#FFFFFF' },
                { type: 'text', text: '{{tagline}}', fieldBinding: 'tagline', x: 40, y: 160, width: 420, height: 30, fontSize: 13, fontWeight: '600', color: '#93C5FD' },
                { type: 'badge', text: 'ADMISSIONS OPEN 2026-27', x: 120, y: 200, width: 260, height: 36, bgColor: '#EF4444', color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
                { type: 'box', x: 40, y: 255, width: 420, height: 160, bgColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderRadius: 12 },
                { type: 'text', text: '• Smart Interactive Classrooms\n• Experienced & Dedicated Staff\n• Modern Science & IT Labs\n• Sports & Extracurricular Activities', x: 60, y: 275, width: 380, height: 120, fontSize: 13, fontWeight: '600', color: '#FFFFFF', textAlign: 'left', lineHeight: 1.6 },
                { type: 'badge', text: '📞 {{phone}}', fieldBinding: 'phone', x: 40, y: 430, width: 200, height: 36, bgColor: '#10B981', color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
                { type: 'text', text: '📍 {{schoolAddress}}', fieldBinding: 'schoolAddress', x: 250, y: 432, width: 210, height: 36, fontSize: 11, fontWeight: '600', color: '#E2E8F0', textAlign: 'center' }
              ])}
              className="p-3 bg-indigo-950/50 border border-indigo-700/80 rounded-xl hover:border-indigo-400 cursor-pointer relative transition-colors"
            >
              <div className="flex items-center space-x-1.5 text-indigo-300 font-bold text-xs mb-1">
                <Sparkle className="w-3.5 h-3.5" />
                <span>Auto-School Admission Poster</span>
              </div>
              <p className="text-[10px] text-slate-400">Instantly populates with active school's Firestore details.</p>
            </div>

            {Object.entries(templates || {}).map(([key, tpl]) => (
              <div
                key={key}
                onClick={() => applyTemplateWithSchoolData(tpl?.elements || [])}
                className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl hover:border-indigo-500 cursor-pointer transition-colors"
              >
                <p className="text-xs font-bold text-slate-200">{tpl?.name || key}</p>
                <p className="text-[10px] text-slate-400">{tpl?.elements?.length || 0} Dynamic Elements</p>
              </div>
            ))}
          </div>
        )}

        {/* =========================================
            4. ⚡ EXPANDED 100+ ELEMENTS LIBRARY TAB
           ========================================= */}
        {activeTab === 'elements' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-1.5 text-indigo-400">
                <Layers className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">100+ Design Elements</h3>
              </div>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-800">
                {filteredPresets.length} Items
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search 100+ elements..."
                value={elementSearch}
                onChange={(e) => setElementSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
              {(ELEMENT_CATEGORIES || []).map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setElementCategory(cat.id)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                    elementCategory === cat.id 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 custom-scrollbar">
              {filteredPresets.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    const { id, name, category, ...cleanPreset } = preset;
                    let finalProperties = { ...cleanPreset, name };
                    if (cleanPreset.fieldBinding && schoolConfig[cleanPreset.fieldBinding]) {
                      finalProperties.text = schoolConfig[cleanPreset.fieldBinding];
                    }
                    addElement(finalProperties);
                  }}
                  className="w-full p-2.5 bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700/80 hover:border-indigo-500 rounded-xl text-left transition-all group flex flex-col space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-200 group-hover:text-indigo-300 truncate max-w-[190px]">
                      {preset.name}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {preset.type}
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 flex items-center justify-center min-h-[36px] overflow-hidden">
                    {preset.type === 'badge' && (
                      <div 
                        style={{
                          backgroundColor: preset.bgColor,
                          color: preset.color,
                          borderRadius: `${preset.borderRadius ?? 8}px`,
                          fontSize: '10px',
                          fontWeight: preset.fontWeight || '700'
                        }}
                        className="px-2 py-1 text-center truncate max-w-full"
                      >
                        {preset.text}
                      </div>
                    )}

                    {preset.type === 'text' && (
                      <div 
                        style={{
                          color: preset.color || '#FFFFFF',
                          fontFamily: preset.fontFamily || 'Poppins',
                          fontSize: '10px',
                          fontWeight: preset.fontWeight || '600'
                        }}
                        className="text-center truncate max-w-full"
                      >
                        {preset.text}
                      </div>
                    )}

                    {preset.type === 'box' && (
                      <div 
                        style={{
                          backgroundColor: preset.bgColor,
                          borderColor: preset.borderColor,
                          borderWidth: `${preset.borderWidth || 1}px`,
                          borderRadius: `${preset.borderRadius || 6}px`
                        }}
                        className="w-full h-5 flex items-center justify-center text-[9px] text-slate-400 font-mono"
                      >
                        Shape Frame
                      </div>
                    )}

                    {preset.type === 'image' && (
                      <div className="flex items-center space-x-1 text-slate-400 text-[10px]">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span className="truncate">{preset.name}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}

              {filteredPresets.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500">
                  No design elements found matching your search.
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================
            5. TEXT PRESETS TAB
           ========================================= */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 text-indigo-400 border-b border-slate-800 pb-2">
              <Type className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Add Text</h3>
            </div>

            <button
              type="button"
              onClick={() => addElement({
                type: 'text',
                text: 'HEADING TEXT',
                fontSize: 32,
                fontWeight: '900',
                fontFamily: 'Bebas Neue'
              })}
              className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left font-black text-lg border border-slate-700 transition-colors"
            >
              Heading Text
            </button>

            <button
              type="button"
              onClick={() => addElement({
                type: 'text',
                text: 'Subheading or Category Title',
                fontSize: 18,
                fontWeight: '700',
                fontFamily: 'Poppins'
              })}
              className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left font-bold text-sm border border-slate-700 transition-colors"
            >
              Subheading
            </button>

            <button
              type="button"
              onClick={() => addElement({
                type: 'text',
                text: 'Body paragraph describing school facilities, achievements, or event details.',
                fontSize: 13,
                fontWeight: '500',
                fontFamily: 'Roboto'
              })}
              className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left text-xs border border-slate-700 transition-colors"
            >
              Body Text Paragraph
            </button>
          </div>
        )}

        {/* =========================================
            6. BACKGROUND TAB (COLOR / GRADIENT / IMAGE)
           ========================================= */}
        {activeTab === 'background' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-1.5 text-indigo-400 border-b border-slate-800 pb-2">
              <Paintbrush className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Canvas Background</h3>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-3 gap-2">
              <button 
                type="button"
                onClick={() => setBgType('color')} 
                className={`py-1.5 text-[11px] font-bold rounded-lg transition-colors ${bgType === 'color' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                Color
              </button>
              <button 
                type="button"
                onClick={() => setBgType('gradient')} 
                className={`py-1.5 text-[11px] font-bold rounded-lg transition-colors ${bgType === 'gradient' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                Gradient
              </button>
              <button 
                type="button"
                onClick={() => setBgType('image')} 
                className={`py-1.5 text-[11px] font-bold rounded-lg transition-colors ${bgType === 'image' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                Image
              </button>
            </div>

            {/* Solid Color Mode */}
            {bgType === 'color' && (
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Solid Color</label>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-full h-10 bg-transparent cursor-pointer rounded-lg"
                />
              </div>
            )}

            {/* Gradient Mode */}
            {bgType === 'gradient' && (
              <div className="space-y-2">
                {(GRADIENT_PRESETS || []).map((g, i) => (
                  <div
                    key={i}
                    onClick={() => setBgGradient(g)}
                    className="h-10 rounded-lg cursor-pointer border border-slate-700 hover:border-indigo-400 transition-colors"
                    style={{ background: g }}
                  />
                ))}
              </div>
            )}

            {/* Background Image Mode */}
            {bgType === 'image' && (
              <div className="space-y-3">
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 space-y-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Background Image</span>

                  {bgImage ? (
                    <div className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-950 aspect-video flex items-center justify-center">
                      <img src={bgImage} alt="Canvas Background" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setBgImage?.('')}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg backdrop-blur-xs transition-colors"
                        title="Remove Background Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-24 rounded-lg bg-slate-950 border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 space-y-1">
                      <ImageIcon className="w-6 h-6" />
                      <span className="text-[10px]">No image set as canvas background</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => bgImageInputRef?.current?.click()}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Background File</span>
                    </button>

                    <input
                      ref={bgImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const fileUrl = URL.createObjectURL(file);
                          setBgImage?.(fileUrl);
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Image URL String</label>
                    <input
                      type="text"
                      value={bgImage || ''}
                      onChange={(e) => setBgImage?.(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg p-2 text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================
            7. LAYERS TAB
           ========================================= */}
        {activeTab === 'layers' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-400 border-b border-slate-800 pb-2">Layers Order</h3>

            <div className="space-y-1.5">
              {(elements || []).slice().map((el, originalIndex) => ({ el, originalIndex })).reverse().map(({ el }) => {
                const isSelected = selectedId === el.id;
                return (
                  <div
                    key={el.id}
                    onClick={() => setSelectedId?.(el.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-indigo-950/60 border-indigo-500 text-white font-semibold' 
                        : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:border-indigo-500/50'
                    }`}
                  >
                    <span className="truncate max-w-[120px]">
                      {el.name || (el.type === 'text' ? (el.text || 'Text') : el.type.toUpperCase())}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveLayer(el.id, 'top'); }} 
                        className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveLayer(el.id, 'bottom'); }} 
                        className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {(elements || []).length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500">
                  No elements currently on canvas.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}