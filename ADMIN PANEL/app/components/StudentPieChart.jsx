// components/StudentPieChart.jsx

'use client';
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Male', value: 7500, color: '#8B5CF6' }, // Purple
  { name: 'Female', value: 7500, color: '#EC4899' }, // Pink
];

const totalStudents = data[0].value + data[1].value;

function StudentPieChart() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg h-96">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Students</h3>
      
      <div style={{ width: '100%', height: '70%' }} className="relative flex justify-center items-center">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              innerRadius={80}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              startAngle={90}
              endAngle={450}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center Text */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-800">{totalStudents.toLocaleString()}</p>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex justify-center space-x-6">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center text-sm">
            <span style={{ backgroundColor: entry.color }} className="w-2 h-2 rounded-full mr-2"></span>
            <span className="text-gray-600">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentPieChart;