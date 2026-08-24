'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config'; 
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function SiblingIdentifier() {
  const [siblingGroups, setSiblingGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const q = collection(db, 'sessions', '2026-27', 'students');
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const clean = (str) => (str ? str.trim().toLowerCase() : "");

      // Group students by a unique parent key combination (fatherName + motherName)
      const groupsMap = {};

      data.forEach((student) => {
        const father = clean(student.fatherName);
        const mother = clean(student.motherName);

        // Skip records with empty parent data
        if (!father || !mother) return;

        const parentKey = `${father}_${mother}`;

        if (!groupsMap[parentKey]) {
          groupsMap[parentKey] = {
            fatherName: student.fatherName,
            motherName: student.motherName,
            students: []
          };
        }

        groupsMap[parentKey].students.push(student);
      });

      // Filter to only keep groups that have 2 or more siblings
      const multiChildFamilies = Object.values(groupsMap).filter(
        (group) => group.students.length > 1
      );

      setSiblingGroups(multiChildFamilies);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveFamilyGroup = async (groupStudents, assignedId) => {
    try {
      // Update all students in this group with the automatic parentId
      const updatePromises = groupStudents.map((student) =>
        updateDoc(doc(db, 'sessions', '2026-27', 'students', student.id), {
          parentId: assignedId,
        })
      );

      await Promise.all(updatePromises);
      alert(`Successfully saved! Family ID ${assignedId} assigned to ${groupStudents.length} siblings.`);
      fetchStudents(); // Refresh data
    } catch (e) {
      console.error(e);
      alert("Error updating database.");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans bg-[#FAF8F4] min-h-screen">
      <h1 className="text-2xl font-black mb-2 uppercase tracking-widest text-[#142440]">Sibling Identifier</h1>
      <p className="text-[10px] text-[#52607A] mb-8 uppercase tracking-widest">Automatic Family Grouping & ID Generator</p>
      
      {loading ? (
        <p className="font-mono text-[10px] uppercase text-[#52607A]">Analyzing student records...</p>
      ) : siblingGroups.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-[#E4DFD3] rounded-[24px] text-center text-[#52607A]">
          <p className="font-mono text-[13px] uppercase">No multi-child family groups found.</p>
          <p className="text-[11px] mt-2 italic">Ensure students share identical Father and Mother names.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {siblingGroups.map((group, idx) => {
            // Automatically suggest sequential IDs starting from 001, 002, etc.
            const suggestedId = String(idx + 1).padStart(3, '0');

            return (
              <div key={idx} className="p-6 border border-[#E4DFD3] rounded-[24px] bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex gap-4 mb-2">
                    <span className="bg-[#142440] text-white text-[10px] font-mono px-3 py-1 rounded-full">
                      Family Group ({group.students.length} Siblings)
                    </span>
                    <span className="text-[10px] font-mono uppercase text-[#B8892B] self-center">
                      Father: {group.fatherName} | Mother: {group.motherName}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {group.students.map((stu) => (
                      <div key={stu.id} className="bg-[#FAF8F4] border border-[#E4DFD3] px-3 py-1.5 rounded-[12px] text-xs font-medium text-[#142440]">
                        {stu.name || "Unnamed"} <span className="text-[10px] text-slate-400">({stu.parentId ? `ID: ${stu.parentId}` : 'No ID'})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => {
                    const finalId = prompt("Confirm or edit Parent ID:", suggestedId);
                    if (finalId) saveFamilyGroup(group.students, finalId);
                  }}
                  className="whitespace-nowrap bg-[#52607A] text-white px-6 py-2.5 rounded-[20px] text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-[#142440] transition-colors"
                >
                  Save ID ({suggestedId})
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}