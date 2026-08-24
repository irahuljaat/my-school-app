// components/ExamLineChart.jsx

'use client';
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Sample data mimicking the design's two lines (Teacher/Student Performance)
const data = [
  { name: 'Mon', Students: 50, Teacher: 65 },
  { name: 'Tue', Students: 75, Teacher: 50 },
  { name: 'Wed', Students: 60, Teacher: 70 },
  { name: 'Thu', Students: 85, Teacher: 45 },
  { name: 'Fri', Students: 55, Teacher: 78 },
  { name: 'Sat', Students: 80, Teacher: 60 },
  { name: 'Sun', Students: 40, Teacher: 55 },
];

function ExamLineChart() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg h-96">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">All Exam Results</h3>
        <div className="text-sm space-x-4">
          <span className="text-blue-500">• Teacher</span>
          <span className="text-purple-500">• Students</span>
          <select className="border border-gray-300 rounded-md p-1 text-xs">
            <option>Monthly</option>
            <option>Weekly</option>
          </select>
        </div>
      </div>

      <div style={{ width: '100%', height: '85%' }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="Students" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Teacher" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ExamLineChart;