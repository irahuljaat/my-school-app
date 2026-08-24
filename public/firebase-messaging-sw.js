// public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// Replace these with your actual Firebase config keys from your web app setup
firebase.initializeApp({
  apiKey:process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
});

const messaging = firebase.messaging();

// Handle background notifications when the browser/app is closed
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "New Notice from School";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new update.",
    icon: '/favicon.ico' // Or your school logo path
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});