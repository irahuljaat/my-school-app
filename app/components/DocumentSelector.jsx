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

const DOC_TYPES = {
    ADMIT_CARD: 'ADMIT_CARD',
    MARKSHEET: 'MARKSHEET',
};

// ADD activeSession HERE as a prop
function DocumentSelector({ activeSession }) {
    const [selectedDocument, setSelectedDocument] = useState(null);

    const handleSelectDocument = (type) => setSelectedDocument(type);
    const handleBack = () => setSelectedDocument(null);

    // Pass the activeSession to the Marksheet Generator
    if (selectedDocument === DOC_TYPES.MARKSHEET) {
        return <MarksheetGenerator onBack={handleBack} activeSession={activeSession} />;
    }

    // Pass the activeSession to the Document (Admit Card) Generator
    if (selectedDocument === DOC_TYPES.ADMIT_CARD) {
        return <DocumentGenerator onBack={handleBack} activeSession={activeSession} />;
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center justify-center">
                    <HiOutlineClipboardList className="w-10 h-10 mr-3 text-indigo-600" /> 
                    Document Center
                </h2>
                {/* Visual feedback to show which session is active */}
                <div className="mt-4 inline-flex items-center px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold border border-indigo-100">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
                    Current Session: {activeSession || 'Loading...'}
                </div>
                <p className="text-slate-500 mt-4 font-medium">
                    Select the report type you wish to process and batch print for this session.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Marksheet Card */}
                <button
                    onClick={() => handleSelectDocument(DOC_TYPES.MARKSHEET)}
                    className="group relative bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-300 text-left overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <HiOutlineDocumentText className="w-32 h-32 -mr-8 -mt-8" />
                    </div>
                    
                    <div className="bg-indigo-50 text-indigo-600 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                        <HiOutlineDocumentText className="w-8 h-8" />
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-800 mb-2">Student Marksheets</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6">
                        Generate final academic reports, calculate grades, ranks, and attendance for class-wide distribution.
                    </p>
                    
                    <div className="flex items-center text-indigo-600 font-bold text-sm">
                        Start Generation <HiOutlineArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
                    </div>
                </button>

                {/* Admit Card Card */}
                <button
                    onClick={() => handleSelectDocument(DOC_TYPES.ADMIT_CARD)}
                    className="group relative bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-100 transition-all duration-300 text-left overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <HiOutlineIdentification className="w-32 h-32 -mr-8 -mt-8" />
                    </div>

                    <div className="bg-emerald-50 text-emerald-600 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                        <HiOutlineIdentification className="w-8 h-8" />
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-800 mb-2">Exam Admit Cards</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6">
                        Create entry permits for examinations including student photos, roll numbers, and time-table schedules.
                    </p>
                    
                    <div className="flex items-center text-emerald-600 font-bold text-sm">
                        Start Generation <HiOutlineArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
                    </div>
                </button>
            </div>

            <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                    Tip: Ensure all marks are entered before generating marksheets for accurate ranking.
                </p>
            </div>
        </div>
    );
}

export default DocumentSelector;