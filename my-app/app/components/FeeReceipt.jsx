'use client';
import React, { useRef, useState, forwardRef } from 'react';
import Image from 'next/image';
import { HiPrinter, HiX, HiCheck } from 'react-icons/hi';
import { useReactToPrint } from 'react-to-print';

const SCHOOL_LOGO_URL = "https://res.cloudinary.com/db6ssceun/image/upload/v1765522459/LOGO_2_w2spav.png";
const SCHOOL_NAME = "MVG PUBLIC SCHOOL";
const SCHOOL_ADDRESS = "Shyopur, Pratap Nagar, Sanganer, Jaipur";
const SCHOOL_CONTACT = "+0141-3152600, 9829018332 ";

const formatCurrency = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(v || 0);
const formatDate = (ts) => {
    if (!ts) return 'N/A';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN');
};

const numberToWords = (num) => {
    const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const absNum = Math.floor(Math.abs(num));
    if (absNum === 0) return 'Zero Rupees Only.';
    let s = absNum.toString();
    let n = ('000000000' + s).substr(-9);
    const [crore, lakh, thousand, hundred, unit] = [parseInt(n.substr(0, 2)), parseInt(n.substr(2, 2)), parseInt(n.substr(4, 2)), parseInt(n.substr(6, 1)), parseInt(n.substr(7, 2))];
    let str = '';
    const helper = (n) => n < 20 ? a[n] : b[Math.floor(n / 10)] + ' ' + a[n % 10];
    if (crore != 0) str += helper(crore) + ' crore ';
    if (lakh != 0) str += helper(lakh) + ' lakh ';
    if (thousand != 0) str += helper(thousand) + ' thousand ';
    if (hundred != 0) str += helper(hundred) + ' hundred ';
    if (unit != 0) str += ((crore != 0 || lakh != 0 || thousand != 0 || hundred != 0) ? 'and ' : '') + helper(unit);
    return str.trim().charAt(0).toUpperCase() + str.trim().slice(1) + ' Rupees Only.';
};

const ReceiptCopy = ({ student, paymentRecord, feeHistory, copyType, isLastCopy, receiptNumber }) => {
    let cumulativeTotal = 0;
    return (
        <div className={`w-full p-8 bg-white print:h-[49vh] print:p-8 flex flex-col ${!isLastCopy ? 'border-b-2 border-dashed border-gray-400 print:border-black' : ''}`}>
            {/* Header */}
            <header className="flex items-center pb-1 border-b-2 border-black">
                <Image src={SCHOOL_LOGO_URL} alt="Logo" width={44} height={44} className="rounded-full mr-3"/>
                <div className="flex-grow text-center">
                    <h1 className="text-xl font-black">{SCHOOL_NAME}</h1>
                    <p className="text-[10px] font-bold uppercase text-gray-600">{SCHOOL_ADDRESS}</p>
                    <p className="text-[10px] font-bold uppercase text-gray-600">{SCHOOL_CONTACT}</p>
                    <p className="text-xs font-black mt-1">FEE RECEIPT — {copyType.toUpperCase()} COPY</p>
                </div>
            </header>

            {/* Receipt Details */}
            <div className="flex justify-between text-[11px] my-3 font-bold uppercase">
                <p>Receipt: <span className="font-black">#{receiptNumber}</span></p>
                <p>Date: {formatDate(paymentRecord.createdAt)}</p>
                <p>Mode: {paymentRecord.paymentMethod}</p>
            </div>

            <div className="grid grid-cols-2 text-sm mb-4 border-y border-gray-100 py-2">
                <p><strong>Student:</strong> {student?.name || paymentRecord.name}</p>
                <p className="text-right"><strong>Class:</strong> {student?.grade || paymentRecord.grade}</p>
                {paymentRecord.remarks && <p className="col-span-2 text-[10px] mt-1 text-gray-500 font-medium">Note: {paymentRecord.remarks}</p>}
            </div>

            {/* History Table */}
            <table className="w-full text-[10px] border border-black">
                <thead>
                    <tr className="bg-gray-100 border-b border-black text-left uppercase">
                        <th className="p-1.5 border-r border-black">Payment Date</th>
                        <th className="p-1.5 border-r border-black text-right">Amount Paid</th>
                        <th className="p-1.5 text-right">Cumulative Total</th>
                    </tr>
                </thead>
                <tbody>
                    {feeHistory.map((item, i) => {
                        cumulativeTotal += item.amount;
                        const isCurrent = item.id === paymentRecord.id;
                        return (
                            <tr key={i} className={`border-b border-gray-200 ${isCurrent ? 'font-black bg-yellow-50' : ''}`}>
                                <td className="p-1.5 border-r border-gray-200">{formatDate(item.createdAt)}</td>
                                <td className="p-1.5 border-r border-gray-200 text-right">{formatCurrency(item.amount)}</td>
                                <td className="p-1.5 text-right font-bold">{formatCurrency(cumulativeTotal)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Footer */}
            <div className="mt-auto pt-4">
                <p className="text-[11px] italic font-medium"><strong>Amount In Words:</strong> {numberToWords(paymentRecord.amount)}</p>
                <div className="flex justify-between items-end mt-4">
                    <div className="text-[11px] bg-gray-50 p-2 rounded-lg border border-gray-200">
                        <p>Total Annual Fee: {formatCurrency(student?.totalFee)}</p>
                        <p className="font-black text-red-600">Balance Due: {formatCurrency(student?.balanceDue)}</p>
                    </div>
                    <div className="text-center w-40">
                        <div className="border-t-2 border-black pt-1 text-[10px] font-black uppercase">Authorized Signatory</div>
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
                key={type} copyType={type} 
                student={student} paymentRecord={paymentRecord} feeHistory={feeHistory} 
                receiptNumber={receiptNumber} isLastCopy={i === copies.length - 1} 
            />
        ))}
    </div>
));

export default function FeesReceipt({ student, paymentRecord, feeHistory, onClose, receiptNumber }) {
    const componentRef = useRef();
    const [selectedCopies, setSelectedCopies] = useState(['parent', 'school']);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Receipt_${receiptNumber}_${student?.name}`,
    });

    const toggleCopy = (type) => {
        setSelectedCopies(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    };

    return (
        <div className="fixed inset-0 bg-gray-900/90 z-[100] flex justify-center p-4 md:p-10 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-3xl h-fit shadow-2xl overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-20 print:hidden">
                    <div className="flex gap-3">
                        {['parent', 'school'].map(type => (
                            <button 
                                key={type} onClick={() => toggleCopy(type)}
                                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black tracking-widest transition flex items-center gap-2 ${selectedCopies.includes(type) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}
                            >
                                {type.toUpperCase()} COPY {selectedCopies.includes(type) && <HiCheck className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handlePrint()} 
                            disabled={selectedCopies.length === 0}
                            className="bg-black text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition disabled:bg-gray-200"
                        >
                            <HiPrinter className="w-5 h-5" /> Print {selectedCopies.length} Copies
                        </button>
                        <button onClick={onClose} className="p-3 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-2xl transition"><HiX className="w-6 h-6" /></button>
                    </div>
                </div>
                <div className="bg-gray-100 p-6 md:p-12 print:p-0">
                    <div className="bg-white shadow-xl print:shadow-none">
                        <ComponentToPrint ref={componentRef} student={student} paymentRecord={paymentRecord} feeHistory={feeHistory} copies={selectedCopies} receiptNumber={receiptNumber} />
                    </div>
                </div>
            </div>
        </div>
    );
}