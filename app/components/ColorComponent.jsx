'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

const ColorContext = createContext();

export const ColorComponent = ({ children }) => {
    const [colors, setColors] = useState({
        primary: '#9853eb',
        background: '#f8fafc',
        cardBackground: '#ffffff',
        text: '#0f172a'
    });

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'config', 'schoolDetails'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.siteColors) {
                    setColors({
                        primary: data.siteColors.primary || '#9853eb',
                        background: data.siteColors.background || '#f8fafc',
                        cardBackground: data.siteColors.cardBackground || '#ffffff',
                        text: data.siteColors.text || '#0f172a'
                    });
                }
            }
        });
        return () => unsub();
    }, []);

    return (
        <ColorContext.Provider value={colors}>
            {children}
        </ColorContext.Provider>
    );
};

// Safe hook with a fallback structure to prevent undefined errors
export const useColors = () => {
    const context = useContext(ColorContext);
    return context || {
        primary: '#ffc107',
        background: '#f8fafc',
        cardBackground: '#ffffff',
        text: '#0f172a'
    };
};