import { db } from '../../firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

export async function GET(request) {
    try {
        if (!getApps().length) {
            initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
            });
        }

        // 1. Get active session & custom template settings (Title & Message)
        const cfgDoc = await getDoc(doc(db, "config", "settings"));
        const session = cfgDoc.exists() ? cfgDoc.data().activeSession || "2026-27" : "2026-27";

        const templateDoc = await getDoc(doc(db, "config", "birthdaySettings"));
        const defaultTitle = "🎂 Happy Birthday!";
        const defaultMessage = "Happy Birthday, {name}! 🎉 Wishing you a wonderful year ahead.";
        
        const notificationTitle = templateDoc.exists() && templateDoc.data().title ? templateDoc.data().title : defaultTitle;
        const messageTemplate = templateDoc.exists() && templateDoc.data().message ? templateDoc.data().message : defaultMessage;

        // 2. Get today's date in MM-DD format adjusted precisely for IST (Indian Standard Time)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(now.getTime() + istOffset);
        const currentMonth = String(istDate.getMonth() + 1).padStart(2, '0');
        const currentDay = String(istDate.getDate()).padStart(2, '0');
        const todayMD = `${currentMonth}-${currentDay}`;

        // 3. Fetch students and match birthdays for today
        const studentsSnap = await getDocs(collection(db, "sessions", session, "students"));
        let sentCount = 0;

        for (const studentDoc of studentsSnap.docs) {
            const data = studentDoc.data();
            
            if (data.dob && data.fcmToken) {
                const parts = data.dob.split('-');
                if (parts.length === 3) {
                    const bMonth = parts[1];
                    const bDay = parts[2];
                    const studentMD = `${bMonth}-${bDay}`;

                    // Match today's month and day (e.g., "08-26")
                    if (studentMD === todayMD) {
                        const studentName = data.name || data.fullName || "Student";
                        const personalizedBody = messageTemplate.replace(/{name}/g, studentName);

                        try {
                            await getMessaging().send({
                                token: data.fcmToken,
                                notification: {
                                    title: notificationTitle,
                                    body: personalizedBody,
                                },
                                data: {
                                    type: "birthday",
                                    studentId: studentDoc.id
                                }
                            });
                            sentCount++;
                        } catch (fcmError) {
                            console.error(`Failed to send birthday push to ${studentName}:`, fcmError);
                        }
                    }
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Successfully sent ${sentCount} birthday wish notification(s) for today (${todayMD}).` 
        });

    } catch (error) {
        console.error('Error processing birthdays:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}