// hooks/useStudents.js (UPDATED FOR CLASS FILTERING)

'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore'; // Import query and where

// The hook now accepts an optional classId to filter students
const useStudents = (className = null) => { 
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reset state before fetching
    setLoading(true);
    setError(null);

    const fetchStudents = async () => {
      try {
        const studentsCollection = collection(db, 'students');
        let studentsQuery = studentsCollection;
        
        // 1. CONDITIONAL FILTERING LOGIC
        if (className) {
          // If a className is provided, apply a filter (where clause)
          // ASSUMPTION: The student document has a field named 'grade' that holds the class name (e.g., "Grade 10").
          studentsQuery = query(studentsCollection, where('grade', '==', className));
        }
        
        const studentSnapshot = await getDocs(studentsQuery);
        
        const studentList = studentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setStudents(studentList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching students: ", err);
        setError("Failed to load student data.");
        setLoading(false);
      }
    };

    fetchStudents();
    
    // Rerun the effect whenever the className prop changes
  }, [className]); 

  return { students, loading, error };
};

export default useStudents;