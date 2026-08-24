import React from 'react';
import { Download, Loader2, Grid, RotateCcw, RotateCw, ZoomOut, ZoomIn } from 'lucide-react';
import { CANVAS_SIZES } from '../constants';

export default function Header({
  schoolConfig,
  canvasSize,
  setCanvasSize,
  showGrid,
  setShowGrid,
  undo,
  redo,
  historyIdx,
  historyLength,
  zoom,
  setZoom,
  handleExport,
  isExporting
}) {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between z-30 shrink-0">
      <div className="flex items-center space-x-3">
        {schoolConfig.logoUrl ? (
          <img src={schoolConfig.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white/10 p-0.5 border border-slate-700" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-lg">
            S
          </div>
        )}
        <div>
          <h1 className="font-bold text-xs tracking-wide text-white">
            {schoolConfig.schoolName || 'School Poster Studio'}
          </h1>
          <p className="text-[10px] text-slate-400">Master Design & Profile Editor</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <select
          value={canvasSize}
          onChange={(e) => setCanvasSize(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none text-slate-200"
        >
          {Object.entries(CANVAS_SIZES).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>

        <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded-lg border ${showGrid ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
          <Grid className="w-4 h-4" />
        </button>

        <button onClick={undo} disabled={historyIdx <= 0} className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 text-slate-300">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button onClick={redo} disabled={historyIdx >= historyLength - 1} className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 text-slate-300">
          <RotateCw className="w-4 h-4" />
        </button>

        <button onClick={() => setZoom(z => Math.max(40, z - 10))} className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300">
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono w-10 text-center text-slate-300">{zoom}%</span>
        <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300">
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={handleExport}
        disabled={isExporting}
        className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-lg"
      >
        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        <span>Export High-Res</span>
      </button>
    </header>
  );
}