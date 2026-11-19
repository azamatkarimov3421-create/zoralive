// Capacitor configuration for wrapping ZoraLive PWA into native Android APK / iOS App
// Run: npm install @capacitor/core @capacitor/cli @capacitor/android && npx cap add android && npx cap sync
const config = {
  appId: 'uz.zoralive.social',
  appName: 'ZoraLive',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#090b16',
  },
};

export default config;
