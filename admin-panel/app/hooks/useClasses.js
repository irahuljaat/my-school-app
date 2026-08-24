// hooks/useClasses.js

'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

const useClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const classesCollection = collection(db, 'classes');
        const classSnapshot = await getDocs(classesCollection);
        
        // Map documents to an array of class objects { id, name }
        const classList = classSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort classes alphabetically or numerically if names are structured (e.g., Grade 1, Grade 2)
        classList.sort((a, b) => a.name.localeCompare(b.name));
        
        setClasses(classList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching classes: ", err);
        setError("Failed to load class data.");
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  return { classes, loading, error };
};

export default useClasses;