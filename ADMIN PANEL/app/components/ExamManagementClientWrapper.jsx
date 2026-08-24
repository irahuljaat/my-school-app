// components/ExamManagementClientWrapper.jsx
'use client';

import React, { useState } from 'react';
import ExamDefinition from './ExamDefinitionAndAssignment';
import TimeTableCreator from './TimeTableCreator';
import MarksEntry from './MarkEntry';
import { HiOutlineCalendar, HiOutlineClock, HiOutlinePencil, HiOutlineTicket, HiOutlineChartBar } from 'react-icons/hi';

// This component handles all state and client-side rendering logic.
export default function ExamManagementClientWrapper() {
    const [isTimeTableModalOpen, setIsTimeTableModalOpen] = useState(false);

    // --- All UI Rendering (copied from the old page.jsx) ---
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            
            <header className="mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
                    <HiOutlineCalendar className="w-10 h-10 mr-3 text-indigo-600" />
                    Exam Management Dashboard
                </h1>
            </header>

            {/* 1. Exam Definition Section */}
            <div className="mb-10">
                <ExamDefinition />
            </div>

            <hr className="my-10" />

            {/* 2. Main Action Buttons for Subsequent Steps */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                
                {/* A. Trigger for TimeTableCreator Modal */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-amber-500 hover:shadow-lg transition">
                    <h2 className="text-xl font-semibold text-gray-700 mb-3 flex items-center"><HiOutlineClock className="w-6 h-6 mr-2 text-amber-500" />Timetable Setup</h2>
                    <p className="text-gray-600 mb-4">Create, view, or update the exam schedule.</p>
                    <button 
                        onClick={() => setIsTimeTableModalOpen(true)}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 transition"
                    >
                        Open Timetable Creator
                    </button>
                </div>
                
                {/* B. Marks Entry Section */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-600 hover:shadow-lg transition">
                    <h2 className="text-xl font-semibold text-gray-700 mb-3 flex items-center"><HiOutlinePencil className="w-6 h-6 mr-2 text-green-600" />Enter Marks</h2>
                    <p className="text-gray-600 mb-4">Input marks for students based on the saved timetable.</p>
                    <button
                        onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition"
                    >
                        Go to Marks Entry Form
                    </button>
                </div>

                {/* C. Marksheet Generation */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-600 hover:shadow-lg transition">
                    <h2 className="text-xl font-semibold text-gray-700 mb-3 flex items-center"><HiOutlineChartBar className="w-6 h-6 mr-2 text-indigo-600" />Generate Marksheet</h2>
                    <p className="text-gray-600 mb-4">View and generate final printable mark sheets and reports.</p>
                    <button className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition">
                        Generate Marksheet
                    </button>
                </div>

                {/* D. Admit Card Generation */}
                 <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500 hover:shadow-lg transition">
                    <h2 className="text-xl font-semibold text-gray-700 mb-3 flex items-center"><HiOutlineTicket className="w-6 h-6 mr-2 text-red-500" />Admit Card</h2>
                    <p className="text-gray-600 mb-4">Generate and print admit cards for the scheduled exams.</p>
                    <button className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition">
                        Generate Admit Cards
                    </button>
                </div>

            </div>
            
            <hr className="my-10" />

            {/* 3. Marks Entry Component (Inline below actions) */}
            <div className="mt-8">
                <MarksEntry />
            </div>

            {/* 4. The TimeTableCreator Modal (Conditional Rendering) */}
            <TimeTableCreator 
                isOpen={isTimeTableModalOpen} 
                onClose={() => setIsTimeTableModalOpen(false)} 
            />

        </div>
    );
}