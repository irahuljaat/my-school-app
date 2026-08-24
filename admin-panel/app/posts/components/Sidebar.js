import React from 'react';
import { Settings, Wand2, Layout, Type, Box, Palette, Layers } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'branding', icon: Settings, label: 'Profile' },
    { id: 'ai', icon: Wand2, label: 'AI Studio' },
    { id: 'templates', icon: Layout, label: 'Templates' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'elements', icon: Box, label: 'Elements' },
    { id: 'background', icon: Palette, label: 'Canvas' },
    { id: 'layers', icon: Layers, label: 'Layers' },
  ];

  return (
    <nav className="w-16 border-r border-slate-800 bg-slate-900 flex flex-col items-center py-4 space-y-3 shrink-0 z-20">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
              isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[9px] mt-1 font-semibold">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}