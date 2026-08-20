'use client';

import React, { useState } from 'react';
import { 
    HiOutlineDocumentText, 
    HiOutlineIdentification, 
    HiOutlineArrowRight,
    HiOutlineClipboardList
} from 'react-icons/hi';
import MarksheetGenerator from './MarksheetGenerator';
import DocumentGenerator from './DocumentGenerator';
import { useColors } from '../components/ColorComponent';

const DOC_TYPES = {
    ADMIT_CARD: 'ADMIT_CARD',
    MARKSHEET: 'MARKSHEET',
};

function DocumentSelector({ activeSession }) {
    const colors = useColors();
    const [selectedDocument, setSelectedDocument] = useState(null);

    const handleSelectDocument = (type) => setSelectedDocument(type);
    const handleBack = () => setSelectedDocument(null);

    if (selectedDocument === DOC_TYPES.MARKSHEET) {
        return <MarksheetGenerator onBack={handleBack} activeSession={activeSession} />;
    }

    if (selectedDocument === DOC_TYPES.ADMIT_CARD) {
        return <DocumentGenerator onBack={handleBack} activeSession={activeSession} />;
    }

    return (
        <div className="max-w-[1440px] mx-auto p-6 lg:p-8 font-sans relative overflow-hidden" style={{ backgroundColor: colors.background }}>
            {/* Soft Background Decorative Blur Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-10 pointer-events-none -mr-20 -mt-20" style={{ backgroundColor: colors.primary }}></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-10 pointer-events-none -ml-20 -mb-20" style={{ backgroundColor: colors.primary }}></div>

            <div className="relative z-10 space-y-8 animate-in fade-in duration-700">
                <div className="bg-white rounded-[28px] shadow-sm border border-slate-100 p-8 md:p-12 text-center relative overflow-hidden">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-3">
                        <div className="p-3 rounded-2xl text-white shadow-md" style={{ backgroundColor: colors.primary }}>
                            <HiOutlineClipboardList className="w-6 h-6" /> 
                        </div>
                        Document Center
                    </h2>
                    <div className="mt-4 inline-flex items-center px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
                        Current Session: {activeSession || 'Loading...'}[cite: 12]
                    </div>
                    <p className="text-slate-500 mt-4 text-xs font-medium max-w-lg mx-auto">
                        Select the report type you wish to process and batch print for this session[cite: 12].
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Marksheet Card */}
                    <button
                        onClick={() => handleSelectDocument(DOC_TYPES.MARKSHEET)}
                        className="group relative bg-white p-6 md:p-8 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 text-left overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                            <HiOutlineDocumentText className="w-32 h-32 -mr-8 -mt-8" />
                        </div>
                        
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-md transition-all duration-300" style={{ backgroundColor: colors.primary }}>
                            <HiOutlineDocumentText className="w-7 h-7" />
                        </div>
                        
                        <h3 className="text-base font-black text-slate-800 uppercase tracking-tight mb-2">Student Marksheets</h3>
                        <p className="text-slate-500 text-xs leading-relaxed font-medium mb-6">
                            Generate final academic reports, calculate grades, ranks, and attendance for class-wide distribution[cite: 12].
                        </p>
                        
                        <div className="flex items-center font-bold text-xs uppercase tracking-widest" style={{ color: colors.primary }}>
                            Start Generation <HiOutlineArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
                        </div>
                    </button>

                    {/* Admit Card Card */}
                    <button
                        onClick={() => handleSelectDocument(DOC_TYPES.ADMIT_CARD)}
                        className="group relative bg-white p-6 md:p-8 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 text-left overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                            <HiOutlineIdentification className="w-32 h-32 -mr-8 -mt-8" />
                        </div>

                        <div className="bg-emerald-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-md transition-all duration-300">
                            <HiOutlineIdentification className="w-7 h-7" />
                        </div>
                        
                        <h3 className="text-base font-black text-slate-800 uppercase tracking-tight mb-2">Exam Admit Cards</h3>
                        <p className="text-slate-500 text-xs leading-relaxed font-medium mb-6">
                            Create entry permits for examinations including student photos, roll numbers, and time-table schedules[cite: 12].
                        </p>
                        
                        <div className="flex items-center text-emerald-600 font-bold text-xs uppercase tracking-widest">
                            Start Generation <HiOutlineArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
                        </div>
                    </button>
                </div>

                <div className="p-6 bg-white rounded-[28px] border border-slate-100 shadow-sm text-center">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        Tip: Ensure all marks are entered before generating marksheets for accurate ranking[cite: 12].
                    </p>
                </div>
            </div>
        </div>
    );
}

export default DocumentSelector;