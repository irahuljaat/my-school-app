import { db } from '../../firebase/config';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const now = new Date();

        // 1. Get active session configuration
        const cfgDoc = await getDoc(doc(db, "config", "settings"));
        if (!cfgDoc.exists()) {
            return NextResponse.json({ error: 'Config settings not found' }, { status: 404 });
        }
        const session = cfgDoc.data().activeSession || "2026-27"; // Fallback to current session

        // 2. Fetch all documents in the notices collection for this session
        const noticesCollectionRef = collection(db, "sessions", session, "notices");
        const noticesSnap = await getDocs(noticesCollectionRef);

        if (noticesSnap.empty) {
            return NextResponse.json({ success: true, message: 'No notice documents found' });
        }

        let processedCount = 0;

        // 3. Iterate through each document (e.g., S0000_1_..., WholeSchool, UKG, etc.)
        for (const noticeDoc of noticesSnap.docs) {
            const docData = noticeDoc.data();
            let docUpdated = false;
            const updatedDocData = { ...docData };

            // Each key in the document is a timestamp (e.g., "1787725286540") mapping to the notice object
            for (const timestampKey of Object.keys(updatedDocData)) {
                const notice = updatedDocData[timestampKey];

                // Ensure it's a valid notice object
                if (notice && typeof notice === 'object' && notice.fcmStatus === 'scheduled' && notice.scheduledFor) {
                    const scheduledTime = new Date(notice.scheduledFor); // format: "YYYY-MM-DD HH:mm"

                    // Check if scheduled time has arrived or passed
                    if (now >= scheduledTime) {
                        try {
                            // TODO: Add your actual FCM dispatch logic here 
                            // e.g., sendFcmNotification(notice.targetId, notice.body, notice.targetGroup);

                            // Mark as sent successfully
                            updatedDocData[timestampKey] = {
                                ...notice,
                                fcmStatus: 'sent',
                                successCount: (notice.successCount || 0) + 1,
                                processedAt: now.toISOString()
                            };
                            docUpdated = true;
                            processedCount++;
                        } catch (sendError) {
                            console.error(`Failed to send notice ${timestampKey}:`, sendError);
                            updatedDocData[timestampKey] = {
                                ...notice,
                                fcmStatus: 'failed',
                                failureCount: (notice.failureCount || 0) + 1
                            };
                            docUpdated = true;
                        }
                    }
                }
            }

            // 4. If any notice inside this document was updated, save back to Firestore
            if (docUpdated) {
                await updateDoc(noticeDoc.ref, updatedDocData);
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Processed ${processedCount} scheduled notices successfully.` 
        });

    } catch (error) {
        console.error('Error processing scheduled notices:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}