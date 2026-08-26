import { db } from '../../firebase/config';
import { collection, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

export async function GET(request) {
    try {
        // Safely resolve the admin app instance and check apps length
        const firebaseAdmin = admin.default || admin;
        
        if (!firebaseAdmin.apps || firebaseAdmin.apps.length === 0) {
            firebaseAdmin.initializeApp({
                credential: firebaseAdmin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
            });
        }

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

            // Loop through date keys (e.g., "26-08-2026")
            for (const dateKey of Object.keys(updatedDocData)) {
                const dateGroup = updatedDocData[dateKey];
                if (!dateGroup || typeof dateGroup !== 'object') continue;

                let dateGroupUpdated = false;
                const updatedDateGroup = { ...dateGroup };

                // Loop through timestamp keys inside the date group
                for (const timestampKey of Object.keys(updatedDateGroup)) {
                    const notice = updatedDateGroup[timestampKey];

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

                                tokens = [...new Set(tokens.filter(t => t && t.trim() !== ''))];

                                let successCount = 0;
                                let failureCount = 0;
                                let fcmStatus = 'sent';

                                if (tokens.length > 0) {
                                    if (tokens.length === 1) {
                                        await firebaseAdmin.messaging().send({
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
                                        const response = await firebaseAdmin.messaging().sendEachForMulticast({
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

                                // 5. Update the notice status in the date group map
                                updatedDateGroup[timestampKey] = {
                                    ...notice,
                                    fcmStatus: fcmStatus,
                                    successCount: successCount,
                                    failureCount: failureCount,
                                    processedAt: now.toISOString()
                                };
                                dateGroupUpdated = true;
                                processedCount++;

                            } catch (sendError) {
                                console.error(`Failed to dispatch notice ${timestampKey}:`, sendError);
                                updatedDateGroup[timestampKey] = {
                                    ...notice,
                                    fcmStatus: 'failed',
                                    failureCount: (notice.failureCount || 0) + 1,
                                    errorMsg: sendError.message
                                };
                                dateGroupUpdated = true;
                            }
                        }
                    }
                }

                if (dateGroupUpdated) {
                    updatedDocData[dateKey] = updatedDateGroup;
                    docUpdated = true;
                }
            }

            // 6. Save changes back to Firestore if any notices were updated
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
