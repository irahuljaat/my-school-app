import { db } from '../../firebase/config';
import { collection, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

export async function GET(request) {
    try {
        const now = new Date();

        // 1. Get active session configuration
        const cfgDoc = await getDoc(doc(db, "config", "settings"));
        if (!cfgDoc.exists()) {
            return NextResponse.json({ error: 'Config settings not found' }, { status: 404 });
        }
        const session = cfgDoc.data().activeSession || "2026-27";

        // 2. Fetch all documents in the notices collection for this session
        const noticesCollectionRef = collection(db, "sessions", session, "notices");
        const noticesSnap = await getDocs(noticesCollectionRef);

        if (noticesSnap.empty) {
            return NextResponse.json({ success: true, message: 'No notice documents found' });
        }

        let processedCount = 0;

        // 3. Iterate through each notice document (WholeSchool, class IDs, student IDs, etc.)
        for (const noticeDoc of noticesSnap.docs) {
            const docData = noticeDoc.data();
            let docUpdated = false;
            const updatedDocData = { ...docData };

            // Scan through all timestamp keys in the document
            for (const timestampKey of Object.keys(updatedDocData)) {
                const notice = updatedDocData[timestampKey];

                if (notice && typeof notice === 'object' && notice.fcmStatus === 'scheduled' && notice.scheduledFor) {
                    const scheduledTime = new Date(notice.scheduledFor); // Format: "YYYY-MM-DD HH:mm"

                    // Check if the scheduled time has arrived or passed
                    if (now >= scheduledTime) {
                        try {
                            let tokens = [];
                            const targetGroup = notice.targetGroup;
                            const targetId = notice.targetId;

                            // 4. Resolve FCM tokens based on audience type
                            if (targetGroup === 'all') {
                                const stuSnap = await getDocs(collection(db, "sessions", session, "students"));
                                tokens = stuSnap.docs.map(d => d.data().fcmToken).filter(Boolean);
                            } else if (targetGroup === 'class') {
                                if (targetId) {
                                    const q = query(
                                        collection(db, "sessions", session, "students"),
                                        where("grade", "==", targetId)
                                    );
                                    const stuSnap = await getDocs(q);
                                    tokens = stuSnap.docs.map(d => d.data().fcmToken).filter(Boolean);
                                }
                            } else if (targetGroup === 'single') {
                                if (targetId) {
                                    // Path: sessions/{sessionId}/students/{targetId}
                                    const studentDocRef = doc(db, "sessions", session, "students", targetId);
                                    const studentDoc = await getDoc(studentDocRef);
                                    if (studentDoc.exists() && studentDoc.data().fcmToken) {
                                        tokens = [studentDoc.data().fcmToken];
                                    }
                                }
                            } else if (targetGroup === 'teachers') {
                                if (targetId === 'all' || !targetId) {
                                    const tchSnap = await getDocs(collection(db, "teachers"));
                                    tokens = tchSnap.docs.map(d => d.data().fcmToken).filter(Boolean);
                                } else {
                                    const tchDoc = await getDoc(doc(db, "teachers", targetId));
                                    if (tchDoc.exists() && tchDoc.data().fcmToken) {
                                        tokens = [tchDoc.data().fcmToken];
                                    }
                                }
                            }

                            // Filter out empty or duplicate tokens
                            tokens = [...new Set(tokens.filter(t => t && t.trim() !== ''))];

                            let successCount = 0;
                            let failureCount = 0;
                            let fcmStatus = 'sent';

                            if (tokens.length > 0) {
                                if (tokens.length === 1) {
                                    // Send single notification
                                    await admin.messaging().send({
                                        token: tokens[0],
                                        notification: {
                                            title: notice.title || "School Notice",
                                            body: notice.body || "",
                                        },
                                        data: {
                                            imageUrl: notice.imageUrl || "",
                                        }
                                    });
                                    successCount = 1;
                                } else {
                                    // Send multicast notification for multiple tokens
                                    const response = await admin.messaging().sendEachForMulticast({
                                        tokens: tokens,
                                        notification: {
                                            title: notice.title || "School Notice",
                                            body: notice.body || "",
                                        },
                                        data: {
                                            imageUrl: notice.imageUrl || "",
                                        }
                                    });
                                    successCount = response.successCount;
                                    failureCount = response.failureCount;
                                    if (successCount === 0 && failureCount > 0) {
                                        fcmStatus = 'failed';
                                    }
                                }
                            } else {
                                fcmStatus = 'sent_no_tokens';
                            }

                            // 5. Update the notice status in the object map
                            updatedDocData[timestampKey] = {
                                ...notice,
                                fcmStatus: fcmStatus,
                                successCount: successCount,
                                failureCount: failureCount,
                                processedAt: now.toISOString()
                            };
                            docUpdated = true;
                            processedCount++;

                        } catch (sendError) {
                            console.error(`Failed to dispatch notice ${timestampKey}:`, sendError);
                            updatedDocData[timestampKey] = {
                                ...notice,
                                fcmStatus: 'failed',
                                failureCount: (notice.failureCount || 0) + 1,
                                errorMsg: sendError.message
                            };
                            docUpdated = true;
                        }
                    }
                }
            }

            // 6. Save changes back to Firestore if any notices in this document were dispatched
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
