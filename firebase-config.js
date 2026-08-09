window.RIVERWATCH_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDaGhP0mMYnUkCPo48oRwB7YhcTTJxyjQU",
  authDomain: "bydrrm-riverwatch.firebaseapp.com",
  projectId: "bydrrm-riverwatch",
  storageBucket: "bydrrm-riverwatch.firebasestorage.app",
  messagingSenderId: "365444961445",
  appId: "1:365444961445:web:2f274393e9eb29fdc3a94c",
  measurementId: "G-E973Q4KPJZ"
};

if (!document.querySelector('script[data-riverwatch-awareness]')) {
  const awarenessScript = document.createElement('script');
  awarenessScript.src = './awareness.js';
  awarenessScript.dataset.riverwatchAwareness = '1';
  awarenessScript.defer = true;
  document.head.appendChild(awarenessScript);
}
