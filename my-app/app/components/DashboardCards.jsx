// components/DashboardCards.jsx

import React from 'react';
import { LuGraduationCap, LuUsers, LuWallet, LuBriefcase } from 'react-icons/lu';

const cardsData = [
  { 
    title: 'Students', 
    value: '15.00K', 
    icon: <LuGraduationCap className="text-3xl text-purple-600" />, 
    bgColor: 'bg-purple-100', 
    textColor: 'text-purple-800'
  },
  { 
    title: 'Teachers', 
    value: '2.00K', 
    icon: <LuBriefcase className="text-3xl text-blue-500" />, 
    bgColor: 'bg-blue-100', 
    textColor: 'text-blue-800'
  },
  { 
    title: 'Parents', 
    value: '5.6K', 
    icon: <LuUsers className="text-3xl text-orange-500" />, 
    bgColor: 'bg-orange-100', 
    textColor: 'text-orange-800'
  },
  { 
    title: 'Earnings', 
    value: '$19.3K', 
    icon: <LuWallet className="text-3xl text-green-500" />, 
    bgColor: 'bg-green-100', 
    textColor: 'text-green-800'
  },
];

function DashboardCards() {
  return (
    <div className="grid grid-cols-4 gap-6">
      {cardsData.map((card, index) => (
        <div 
          key={index} 
          className="flex items-center p-6 bg-white rounded-xl shadow-lg transition-shadow duration-300 hover:shadow-xl"
        >
          <div className={`p-4 rounded-full ${card.bgColor} mr-4`}>
            {card.icon}
          </div>
          <div>
            <p className="text-sm text-gray-500">{card.title}</p>
            <h2 className={`text-2xl font-extrabold ${card.textColor}`}>{card.value}</h2>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DashboardCards;