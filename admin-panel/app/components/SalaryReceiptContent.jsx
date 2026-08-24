// components/SalaryReceiptContent.jsx

import React from 'react';

const SalaryReceiptContent = ({ slipData }) => {
    // You can safely assume slipData has been calculated and is available

    return (
        // Add a print break CSS class here to ensure each slip starts on a new page
        <div className="p-6 border border-gray-300 mb-6 break-after-page"> 
            <h3 className="text-xl font-bold mb-4 text-center border-b pb-2">Salary Slip for {slipData.month}</h3>
            
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-6 border-b pb-4">
                <div>
                    <p><strong>Name:</strong> {slipData.name}</p>
                    <p><strong>ID No.:</strong> {slipData.srNo}</p> 
                    
                </div>
                <div className="text-right">
                    <p><strong>Designation:</strong> {slipData.designation}</p>
                    <p><strong>Pay Date:</strong> {slipData.datePaid}</p>
                </div>
                  
                    
                
            </div>

            {/* Earnings and Deductions */}
            <div className="grid grid-cols-2 gap-8 mb-6">
                
                {/* Earnings Column */}
                <div>
                    <h4 className="font-bold text-lg mb-2 text-green-700">Earnings</h4>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between border-b border-gray-200 pb-1">
                            <span>Basic/Gross Salary:</span>
                            <span className="font-semibold">₹{slipData.grossSalary}</span>
                        </div>
                        {/* Add more earning types here if needed (e.g., allowances) */}
                      
                    </div>
                </div>

             
                
            </div>

            {/* Net Pay */}
            <div className="flex justify-between items-center bg-green-100 p-4 rounded-md mt-6 border-t-4 border-green-500 shadow-md">
                <span className="text-l font-bold text-green-800">NET PAYABLE:</span>
                <span className="text-xl font-extrabold text-green-800">₹{slipData.netSalary}</span>
            </div>
            
            {/* === New Addition: Payment Confirmation === */}
            <div className="text-center mt-4 p-2 bg-gray-50 border-t border-b border-dashed border-gray-400 text-sm font-medium italic text-gray-700">
                The amount of ₹{slipData.netSalary} has been successfully **PAID** to the employee.
            </div>

            {/* === New Addition: Signature Block === */}
            <div className="grid grid-cols-2 gap-12 mt-10 pt-4">
                
                <div className="text-center">
                    <div className="border-b border-gray-400 w-3/4 mx-auto mb-1 h-4"></div>
                    <p className="text-sm font-semibold">Teacher Signature</p>
                </div>
                
                <div className="text-center">
                    <div className="border-b border-gray-400 w-3/4 mx-auto mb-1 h-4"></div>
                    <p className="text-sm font-semibold">Principal/Authorized Signatory</p>
                </div>

            </div>
            {/* End of Signature Block */}

        </div>
    );
};

export default SalaryReceiptContent;