'use client';

import React, { useRef, useState, forwardRef } from 'react';
import Image from 'next/image';
import { HiPrinter, HiX, HiCheck } from 'react-icons/hi';
import { useReactToPrint } from 'react-to-print';

const SCHOOL_LOGO_URL = "https://res.cloudinary.com/db6ssceun/image/upload/v1771071585/SCHOOL_SENIOR_SECONDARY_LOGO_t88t8l.png";
const SCHOOL_NAME = "MVG PUBLIC SCHOOL";
const SCHOOL_ADDRESS = "Shyopur, Pratap Nagar, Sanganer, Jaipur";
const SCHOOL_CONTACT = "+0141-3152600, 9829018332";

const formatCurrency = (v) => new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
}).format(Number(v) || 0);

const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    if (dateInput.toDate) return dateInput.toDate().toLocaleDateString('en-IN');
    const cleanStr = String(dateInput).split('(')[0].split('#')[0].trim();
    return cleanStr; // Since your keys are already in DD-MM-YYYY format
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
        <div className={`w-full p-8 bg-white print:h-[50vh] print:p-8 flex flex-col border-black ${!isLastCopy ? 'border-b-2 border-dashed' : ''}`}>
            {/* Header */}
            <header className="flex items-center pb-2 border-b-2 border-black">
                <div className="relative w-14 h-14 mr-4">
                   <Image src={SCHOOL_LOGO_URL} alt="Logo" fill className="rounded-full object-contain"/>
                </div>
                <div className="flex-grow text-center">
                    <h1 className="text-2xl font-black tracking-tight">{SCHOOL_NAME}</h1>
                    <p className="text-[10px] font-bold uppercase text-gray-600 leading-tight">{SCHOOL_ADDRESS}</p>
                    <p className="text-[10px] font-bold uppercase text-gray-600">{SCHOOL_CONTACT}</p>
                    <div className="inline-block px-3 py-0.5 bg-black text-white text-[10px] font-black mt-1 uppercase tracking-widest">
                        {copyType} Copy
                    </div>
                </div>
            </header>

            {/* Meta Info */}
            <div className="flex justify-between text-[11px] my-4 font-bold uppercase border-b border-gray-100 pb-2">
                <p>Receipt: <span className="font-black">#{receiptNumber}</span></p>
                <p>Date: {formatDate(paymentRecord.date)}</p>
                <p>Status: <span className="text-emerald-600">PAID</span></p>
            </div>

            <div className="grid grid-cols-2 text-sm mb-4">
                <p><strong>Student:</strong> <span className="uppercase font-medium">{student?.name || paymentRecord.name}</span></p>
                <p className="text-right"><strong>Class / Grade:</strong> {student?.grade || paymentRecord.grade}</p>
            </div>

            {/* History Table */}
            <div className="flex-grow">
                <table className="w-full text-[11px] border border-black">
                    <thead>
                        <tr className="bg-gray-100 border-b border-black text-left uppercase">
                            <th className="p-2 border-r border-black">Payment Date</th>
                            <th className="p-2 border-r border-black text-right">Amount Paid</th>
                            <th className="p-2 text-right">Cumulative</th>
                        </tr>
                    </thead>
                    <tbody>
                        {feeHistory.map((item, i) => {
                            const amt = Number(item.amount) || 0;
                            cumulativeTotal += amt;
                            // Highlight the current payment being made
                            const isCurrent = item.date === paymentRecord.date;
                            
                            return (
                                <tr key={i} className={`border-b border-gray-300 ${isCurrent ? 'bg-indigo-50 font-black' : ''}`}>
                                    <td className="p-2 border-r border-gray-300">{formatDate(item.date)}</td>
                                    <td className="p-2 border-r border-gray-300 text-right">{formatCurrency(amt)}</td>
                                    <td className="p-2 text-right font-bold">{formatCurrency(cumulativeTotal)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="mt-4">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">In Words</p>
                    <p className="text-xs italic font-black text-slate-700">{numberToWords(paymentRecord.amount)}</p>
                </div>

                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <div className="flex gap-4 text-[11px]">
                            <span className="text-gray-500">Total Annual Fee:</span>
                            <span className="font-bold">{formatCurrency(student?.totalFee)}</span>
                        </div>
                        <div className="flex gap-4 text-[13px]">
                            <span className="text-gray-500 font-bold uppercase">Balance Remaining:</span>
                            <span className="font-black text-rose-600">{formatCurrency(student?.balanceDue)}</span>
                        </div>
                    </div>
                    
                    <div className="text-center w-48">
                        <div className="h-12 flex items-end justify-center">
                            <span className="text-[8px] text-gray-400 mb-1 italic">Electronically Generated</span>
                        </div>
                        <div className="border-t-2 border-black pt-1 text-[10px] font-black uppercase tracking-tighter">
                            Authorized Signatory
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ComponentToPrint = forwardRef(({ student, paymentRecord, feeHistory, copies, receiptNumber }, ref) => (
    <div ref={ref} className="bg-white">
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
        documentTitle: `Receipt_${receiptNumber}_${student?.name}`,
    });

    const toggleCopy = (type) => {
        setSelectedCopies(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/95 z-[100] flex justify-center p-4 md:p-10 overflow-y-auto backdrop-blur-md">
            <div className="bg-white rounded-[2rem] w-full max-w-4xl h-fit shadow-2xl overflow-hidden border border-white/20">
                <div className="p-6 border-b flex flex-wrap justify-between items-center bg-white sticky top-0 z-20 print:hidden gap-4">
                    <div className="flex gap-2">
                        {['parent', 'school', 'office'].map(type => (
                            <button 
                                key={type} onClick={() => toggleCopy(type)}
                                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black tracking-widest transition-all flex items-center gap-2 ${selectedCopies.includes(type) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}
                            >
                                {type.toUpperCase()} {selectedCopies.includes(type) && <HiCheck className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handlePrint()} 
                            disabled={selectedCopies.length === 0}
                            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-black active:scale-95 transition-all disabled:opacity-30"
                        >
                            <HiPrinter className="w-5 h-5" /> Print {selectedCopies.length} Copies
                        </button>
                        <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-colors">
                            <HiX className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="bg-slate-200 p-4 md:p-12 print:p-0">
                    <div className="bg-white shadow-2xl print:shadow-none mx-auto max-w-[210mm]">
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