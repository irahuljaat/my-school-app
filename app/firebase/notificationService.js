import { db } from './config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const sendNotification = async (activeSession, data) => {
  if (!activeSession) throw new Error("Active Session is required");

  try {
    // Correct path: sessions/${activeSession}/notifications
    const notifRef = collection(db, "sessions", activeSession, "notifications");
    
    const docRef = await addDoc(notifRef, {
      ...data,
      createdAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Service Error:", error);
    throw error;
  }
};