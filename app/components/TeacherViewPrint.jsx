'use client';

import React, { useState, useEffect } from 'react';
import { HiPrinter, HiX, HiAcademicCap } from 'react-icons/hi';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export default function TeacherViewPrint({ teacherData = {}, onClose }) {
    // 1. Dynamic state for institution details fetched from Firestore
    const [schoolDetails, setSchoolDetails] = useState({
        schoolName: 'Loading...',
        logoUrl: '',
        schoolAddress: '',
        schoolAffiliation: ''
    });
    const [loadingDetails, setLoadingDetails] = useState(true);

    // 2. Fetch config > schoolDetails from Firestore
    useEffect(() => {
        const fetchSchoolDetails = async () => {
            try {
                const docRef = doc(db, 'config', 'schoolDetails');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setSchoolDetails(docSnap.data());
                } else {
                    console.warn("schoolDetails document does not exist in config collection.");
                }
            } catch (error) {
                console.error("Error fetching school details from Firestore:", error);
            } finally {
                setLoadingDetails(false);
            }
        };

        fetchSchoolDetails();
    }, []);

    // Direct native print call
    const handlePrint = () => {
        window.print();
    };

    // Safe teacher property resolution with fallbacks
    const name = teacherData.name || teacherData.teacherName || 'N/A';
    const employeeId = teacherData.srNo || teacherData.employeeId || teacherData.id || '0000';
    const designation = teacherData.designation || 'Faculty Member';
    const joiningDate = teacherData.joiningDate || teacherData.dateOfJoining || 'N/A';
    const status = teacherData.status || 'Active';
    const phone = teacherData.phone || teacherData.mobile || 'N/A';
    const email = teacherData.email || 'N/A';
    const address = teacherData.address || 'N/A';
    const qualification = teacherData.qualification || 'N/A';
    const subjects = teacherData.subjectsTaught || teacherData.subjects || 'N/A';
    const salary = parseFloat(teacherData.salary || teacherData.grossSalary || 0);
    const imageUrl = teacherData.imageUrl || teacherData.photoUrl;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex justify-center items-start sm:items-center p-2 sm:p-4 overflow-y-auto print:p-0 print:static print:bg-transparent print:backdrop-blur-none">
            
            {/* CSS Print Overrides */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-teacher-profile, #printable-teacher-profile * {
                        visibility: visible;
                    }
                    #printable-teacher-profile {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        box-shadow: none !important;
                        border: none !important;
                        background: white !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 12mm;
                    }
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
            `}</style>

            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-auto overflow-hidden border border-slate-100 print:shadow-none print:border-none print:rounded-none">
                
                {/* On-Screen Action Bar */}
                <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                            <HiAcademicCap size={22} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black tracking-tight">Printable Staff Record</h3>
                            <p className="text-[11px] text-slate-400">A4 Document Format Preview</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            disabled={loadingDetails}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition shadow-lg shadow-indigo-600/30 active:scale-95"
                        >
                            <HiPrinter size={18} />
                            Print / Download PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                            title="Close"
                        >
                            <HiX size={20} />
                        </button>
                    </div>
                </div>

                {/* Printable Document Sheet Container */}
                <div id="printable-teacher-profile" className="p-8 md:p-12 bg-white text-slate-800 font-sans">
                    
                    {/* Header / Letterhead with Dynamic Firestore Data */}
                    <div className="border-b-2 border-slate-900 pb-6 mb-8">
                        <div className="flex justify-between items-start gap-6">
                            <div className="flex items-center gap-4">
                                {/* Dynamic Logo or Initials Fallback */}
                                {schoolDetails.logoUrl ? (
                                    <img 
                                        src={schoolDetails.logoUrl} 
                                        alt={schoolDetails.schoolName || 'School Logo'} 
                                        className="w-16 h-16 object-contain shrink-0" 
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-[#0B3B82] text-white rounded-2xl flex items-center justify-center font-black text-xl shrink-0 print:border print:border-slate-800">
                                        {(schoolDetails.schoolName || 'SCH').substring(0, 3).toUpperCase()}
                                    </div>
                                )}

                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-[#0B3B82] uppercase">
                                        {schoolDetails.schoolName || 'School Name'}
                                    </h1>
                                    {schoolDetails.schoolAddress && (
                                        <p className="text-xs text-slate-500 font-bold mt-0.5">{schoolDetails.schoolAddress}</p>
                                    )}
                                    {schoolDetails.schoolAffiliation && (
                                        <p className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider mt-1">{schoolDetails.schoolAffiliation}</p>
                                    )}
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-black tracking-widest uppercase rounded-lg">
                                    Official Dossier
                                </span>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                                    Ref: EMP-{employeeId}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Profile Summary Card */}
                    <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        
                        {/* Photo Frame */}
                        <div className="w-32 h-36 rounded-xl border-2 border-white shadow-sm overflow-hidden bg-slate-200 shrink-0 relative flex items-center justify-center text-slate-400">
                            {imageUrl ? (
                                <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-2">
                                    <HiAcademicCap size={36} className="mx-auto text-slate-400 mb-1" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider block">No Photo</span>
                                </div>
                            )}
                        </div>

                        {/* Primary Details */}
                        <div className="flex-1 text-center sm:text-left space-y-2">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                <h2 className="text-2xl font-black text-[#0B3B82]">{name}</h2>
                                <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full border ${
                                    status === 'Active' 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                    {status}
                                </span>
                            </div>
                            <p className="text-xs font-extrabold text-indigo-700 uppercase tracking-wide">{designation}</p>
                            
                            <div className="grid grid-cols-2 gap-4 pt-3 text-xs border-t border-slate-200">
                                <div>
                                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Employee ID</span>
                                    <span className="font-black text-slate-800">#{employeeId}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Date of Joining</span>
                                    <span className="font-black text-slate-800">{joiningDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Information Sections Grid */}
                    <div className="space-y-6">
                        
                        {/* Academic & Departmental Info */}
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 pb-2 mb-3 border-b border-slate-200">
                                Academic & Departmental Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Highest Qualification</span>
                                    <span className="font-extrabold text-slate-800 text-sm">{qualification}</span>
                                </div>
                                <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Assigned Subject(s)</span>
                                    <span className="font-extrabold text-slate-800 text-sm">{subjects}</span>
                                </div>
                            </div>
                        </div>

                        {/* Contact & Payroll Info */}
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 pb-2 mb-3 border-b border-slate-200">
                                Contact & Payroll Records
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Contact Number</span>
                                    <span className="font-bold text-slate-800">{phone}</span>
                                </div>
                                <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Email Address</span>
                                    <span className="font-bold text-slate-800 break-all">{email}</span>
                                </div>
                                <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Monthly Basic Pay</span>
                                    <span className="font-extrabold text-[#0B3B82] text-sm">₹{salary.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                            <div className="mt-3 p-3 bg-slate-50/60 rounded-xl border border-slate-100 text-xs">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Residential Address</span>
                                <span className="font-semibold text-slate-800">{address}</span>
                            </div>
                        </div>

                    </div>

                    {/* Declaration Note */}
                    <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed italic">
                        <strong>Official Declaration:</strong> The particulars stated above are verified against official institutional records. Any unauthorized alteration renders this document null and void.
                    </div>

                    {/* Signature & Seal Block */}
                    <div className="mt-16 pt-8 border-t border-slate-300 flex justify-between items-end text-xs">
                        <div className="text-center w-48">
                            <div className="border-b border-slate-800 pb-1 mb-2"></div>
                            <p className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Employee Signature</p>
                            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Date: ______________</p>
                        </div>

                        <div className="text-center w-36">
                            <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-full mx-auto mb-2 flex items-center justify-center text-[9px] font-black text-slate-300 uppercase">
                                School Seal
                            </div>
                        </div>

                        <div className="text-center w-48">
                            <div className="border-b border-slate-800 pb-1 mb-2"></div>
                            <p className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Authorized Signatory</p>
                            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Principal / Director</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}