'use client';

import React, { useRef, useState, forwardRef } from 'react';
import Image from 'next/image';

import { HiPrinter, HiX, HiCheck, HiBadgeCheck } from 'react-icons/hi';
import { useReactToPrint } from 'react-to-print';

const SCHOOL_LOGO_URL = "https://res.cloudinary.com/db6ssceun/image/upload/v1771071585/SCHOOL_SENIOR_SECONDARY_LOGO_t88t8l.png";
const SCHOOL_NAME = "MVG PUBLIC SENIOR SECONDARY SCHOOL";
const SCHOOL_ADDRESS = "Shyopur, Pratap Nagar, Sanganer, Jaipur";
const SCHOOL_CONTACT = "+0141-3152600, 9829018332";

const formatCurrency = (v) => new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
}).format(Number(v) || 0);

const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    if (dateInput.toDate) return dateInput.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return String(dateInput).split('(')[0].trim();
};

const numberToWords = (num) => {
    const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const absNum = Math.floor(Math.abs(Number(num)));
    if (absNum === 0) return 'Zero Rupees Only.';
    
    let s = absNum.toString();
    let n = ('000000000' + s).substr(-9);
    const [crore, lakh, thousand, hundred, unit] = [
        parseInt(n.substr(0, 2)), parseInt(n.substr(2, 2)), 
        parseInt(n.substr(4, 2)), parseInt(n.substr(6, 1)), 
        parseInt(n.substr(7, 2))
    ];
    
    let str = '';
    const helper = (n) => n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    
    if (crore !== 0) str += helper(crore) + ' crore ';
    if (lakh !== 0) str += helper(lakh) + ' lakh ';
    if (thousand !== 0) str += helper(thousand) + ' thousand ';
    if (hundred !== 0) str += helper(hundred) + ' hundred ';
    if (unit !== 0) str += ((crore !== 0 || lakh !== 0 || thousand !== 0 || hundred !== 0) ? 'and ' : '') + helper(unit);
    
    return str.trim().charAt(0).toUpperCase() + str.trim().slice(1) + ' Rupees Only.';
};

const ReceiptCopy = ({ student, paymentRecord, feeHistory, copyType, isLastCopy, receiptNumber }) => {
    let cumulativeTotal = 0;
    
    return (
        /* Fixed height to exactly half an A4 page (148.5mm) to guarantee 2 slips per page */
        <div className={`relative w-full p-6 bg-white h-[148.5mm] flex flex-col border-black overflow-hidden box-border ${!isLastCopy ? 'border-b-2 border-dashed' : ''}`}>
            
            {/* Header: Fixed Height */}
            <header className="shrink-0 pb-2 border-b-2 border-slate-900">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="relative w-10 h-10">
                            <Image src={SCHOOL_LOGO_URL} alt="Logo" fill className="object-contain"/>
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-900">{SCHOOL_NAME}</h1>
                            <p className="text-[9px] font-bold text-slate-500 uppercase">{SCHOOL_ADDRESS}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="bg-slate-900 text-white px-3 py-0.5 text-[8px] font-black uppercase rounded mb-1 inline-block">
                            {copyType} Copy
                        </div>
                        <h2 className="text-lg font-black text-slate-900 block">FEES RECEIPT</h2>
                    </div>
                </div>
            </header>

            {/* Meta & Student Info: Updated with exact database fields (srNo & fatherName) */}
            <div className="shrink-0">
                <div className="flex justify-between py-2 text-[10px] font-bold border-b border-slate-100">
                    <p>RECEIPT: <span className="font-black text-indigo-600">#{receiptNumber}</span></p>
                    <p>DATE: {formatDate(paymentRecord.date)}</p>
                    <p className="text-emerald-600 font-black">STATUS: PAID</p>
                </div>
                
                {/* 2x2 Grid for Student Information */}
                <div className="bg-slate-50 p-2 my-2 rounded-lg border border-slate-100 grid grid-cols-2 gap-y-1">
                    <p className="text-[10px] font-black uppercase">
                        <span className="text-slate-500 mr-1">SR No:</span> 
                        {student?.srNo || paymentRecord?.srNo || 'N/A'}
                    </p>
                    <p className="text-[10px] font-black uppercase text-right">
                        <span className="text-slate-500 mr-1">Class:</span> 
                        {student?.grade || paymentRecord?.grade || 'N/A'}
                    </p>
                    <p className="text-[10px] font-black uppercase">
                        <span className="text-slate-500 mr-1">Student:</span> 
                        {student?.name || paymentRecord?.name || 'N/A'}
                    </p>
                    <p className="text-[10px] font-black uppercase text-right">
                        <span className="text-slate-500 mr-1">Father:</span> 
                        {student?.fatherName || paymentRecord?.fatherName || 'N/A'}
                    </p>
                </div>
            </div>

            {/* Table: Grows to fill available space */}
            <div className="flex-grow overflow-hidden pt-1">
                <table className="w-full text-[10px]">
                    <thead className="border-b border-slate-200">
                        <tr className="text-slate-400 font-black uppercase tracking-widest">
                            <th className="py-1 text-left">Date</th>
                            <th className="py-1 text-right">Amount</th>
                            <th className="py-1 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {feeHistory.map((item, i) => {
                            const amt = Number(item.amount) || 0;
                            cumulativeTotal += amt;
                            return (
                                <tr key={i} className={item.date === paymentRecord.date ? 'bg-indigo-50/50 font-bold' : ''}>
                                    <td className="py-1 text-slate-600">{formatDate(item.date)}</td>
                                    <td className="py-1 text-right text-slate-600">{formatCurrency(amt)}</td>
                                    <td className="py-1 text-right font-bold text-slate-900">{formatCurrency(cumulativeTotal)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer: Pinned at the bottom */}
            <footer className="shrink-0 mt-auto pt-3 border-t border-slate-900">
                <div className="flex justify-between items-end">
                    <div className="max-w-xs">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Words</p>
                        <p className="text-[9px] font-bold text-slate-700 italic uppercase line-clamp-1">
                            {numberToWords(paymentRecord.amount)}
                        </p>
                        <div className="flex gap-4 mt-2 text-[10px]">
                            <p><span className="text-slate-400 font-bold uppercase">Balance:</span> <span className="font-black text-rose-600">{formatCurrency(student?.balanceDue)}</span></p>
                        </div>
                    </div>
                    <div className="text-center w-32">
                        <div className="border-b border-slate-900 mb-1"></div>
                        <p className="text-[8px] font-black uppercase text-slate-900">Signatory</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const ComponentToPrint = forwardRef(({ student, paymentRecord, feeHistory, copies, receiptNumber }, ref) => (
    <div ref={ref} className="bg-white print-container">
        {/* CSS to force strictly 1 page (A4 size) with no overflows */}
        <style dangerouslySetInnerHTML={{ __html: `
            @media print {
                @page { 
                    size: A4 portrait; 
                    margin: 0; 
                }
                body { 
                    -webkit-print-color-adjust: exact; 
                    margin: 0;
                }
                .print-container {
                    width: 210mm;
                    height: 297mm;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    background: white;
                }
            }
        `}} />
        {copies.map((type, i) => (
            <ReceiptCopy 
                key={type} 
                copyType={type} 
                student={student} 
                paymentRecord={paymentRecord} 
                feeHistory={feeHistory} 
                receiptNumber={receiptNumber} 
                isLastCopy={i === copies.length - 1} 
            />
        ))}
    </div>
));

ComponentToPrint.displayName = 'ComponentToPrint';

export default function FeesReceipt({ student, paymentRecord, feeHistory, onClose, receiptNumber }) {
    const componentRef = useRef(null);
    const [selectedCopies, setSelectedCopies] = useState(['parent', 'school']);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Receipt_${receiptNumber}`,
    });

    const toggleCopy = (type) => {
        const current = [...selectedCopies];
        if (current.includes(type)) {
            setSelectedCopies(current.filter(t => t !== type));
        } else if (current.length < 2) {
            setSelectedCopies([...current, type]);
        } else {
            alert("To maintain 2 slips per page, please select only 2 types.");
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/40 z-[100] flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-5xl h-[95vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
                
                {/* Toolbar */}
                <div className="px-8 py-4 border-b bg-white flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-base font-black text-slate-900 tracking-tight">Print Layout</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Exactly 2 copies per page</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                            {['parent', 'school', 'office'].map(type => (
                                <button 
                                    key={type} onClick={() => toggleCopy(type)}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all uppercase ${selectedCopies.includes(type) ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        
                        <button 
                            onClick={() => handlePrint()} 
                            disabled={selectedCopies.length === 0}
                            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                        >
                            <HiPrinter className="w-4 h-4" /> Print
                        </button>
                        <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 rounded-xl transition-all">
                            <HiX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-grow bg-slate-100 overflow-y-auto p-4 flex justify-center">
                    <div className="shadow-2xl bg-white w-[210mm] min-h-[297mm]">
                        <ComponentToPrint 
                            ref={componentRef} 
                            student={student} 
                            paymentRecord={paymentRecord} 
                            feeHistory={feeHistory} 
                            copies={selectedCopies} 
                            receiptNumber={receiptNumber} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}