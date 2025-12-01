// lib/firebaseClient.ts
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
 
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Microsoft Auth Provider


export const signInWithGoogle = async (): Promise<{ user: User; idToken: string }> => {
  try {
    console.log('Starting Google sign-in...');
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    console.log('Google sign-in successful, getting ID token...');
    const idToken = await user.getIdToken();
    console.log('ID token received:', idToken.substring(0, 20) + '...');
    
    return { user, idToken };
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw error;
  }
};



export const signOut = () => {
  return firebaseSignOut(auth);
};

export const getCurrentUser = () => {
  return auth.currentUser;
};