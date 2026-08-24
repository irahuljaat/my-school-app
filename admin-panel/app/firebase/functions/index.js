const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendPushNotification = functions.firestore
    .document('sessions/{sessionId}/notifications/{notifId}')
    .onCreate(async (snap, context) => {
        const data = snap.data();
        
        // This payload is sent to your Flutter app
        const message = {
            notification: {
                title: data.title,
                body: data.body,
            },
            data: {
                // You can pass extra data here to handle navigation in Flutter
                imageUrl: data.imageUrl || "",
                targetGroup: data.targetGroup || "all"
            },
            topic: 'all_users' // The Flutter app must subscribe to this topic
        };

        return admin.messaging().send(message);
    });