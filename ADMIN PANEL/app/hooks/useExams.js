// hooks/useExams.js

'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const useExams = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchExams = async () => {
        setLoading(true);
        setError(null);
        try {
            const examsCollection = collection(db, 'exams');
            // Order by start date to show upcoming exams first
            const q = query(examsCollection, orderBy('startDate', 'asc')); 
            
            const examSnapshot = await getDocs(q);
            
            const examList = examSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setExams(examList);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching exams: ", err);
            setError("Failed to load exam data.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExams();
    }, []);

    // Return the fetch function to allow manual refreshing after CRUD operations
    return { exams, loading, error, refreshExams: fetchExams };
};

export default useExams;