// components/SalaryBatchPrint.jsx

import React, { useRef, useEffect } from 'react';
import { HiX, HiPrinter } from 'react-icons/hi';
// 🛑 Import the new content component
import SalaryReceiptContent from './SalaryReceiptContent'; 

const SCHOOL_NAME = "MVG PUBLIC SENIOR SECONDARY SCHOOL"; // Should match the main header
const SCHOOL_ADDRESS = "Sheopur, Pratap Nagar, Sanganer, Jaipur "; 

function SalaryBatchPrint({ slipDataList, onClose }) {
    const contentRef = useRef(null);

    // Automatic printing attempt upon component load
    useEffect(() => {
        const timer = setTimeout(() => {
            if (contentRef.current) {
                // This triggers the browser's print dialog
                window.print();
            }
        }, 500); 

        return () => clearTimeout(timer);
    }, []);

    return (
        // FIX: Changed the background from bg-gray-600 bg-opacity-75 
        // to bg-gray-200 bg-opacity-90 for a lighter print preview background.
         <div className="fixed inset-1 bg-white overflow-y-auto h-full w-full z-50 p-4">
   
            
            {/* Modal Content Card */}
            <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white print:shadow-none print:w-full print:top-0">
                
                {/* Header (Hidden when printing) */}
                <div className="flex justify-between items-center mb-4 print:hidden">
                    <h3 className="text-2xl font-bold">Batch Print Preview ({slipDataList.length} Slips)</h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-500 hover:text-gray-900"
                    >
                        <HiX className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Print Button (Hidden when printing) */}
                <div className="mb-4 text-center print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center mx-auto"
                    >
                        <HiPrinter className="w-5 h-5 mr-2" /> Confirm & Print All
                    </button>
           
                </div>


                {/* Batch Content Area (Ref for printing) */}

                {/* HEADER - Remains outside contentRef but inside the white box */}
                <div className="text-center mb-4 border-b pb-2 border-gray-00">
                    <h3 className="text-lg font-bold text-gray-800">{SCHOOL_NAME}</h3>
                    <p className="text-gray-600">{SCHOOL_ADDRESS}</p>
                </div>
                
                <div ref={contentRef} className="p-2">
                    {slipDataList.map((slipData) => (
                        // Render the content component for each slip
                        <SalaryReceiptContent key={slipData.id} slipData={slipData} />
                    ))}
                </div>

            </div>
        </div>
    );
}

export default SalaryBatchPrint;