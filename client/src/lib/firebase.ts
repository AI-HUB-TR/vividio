import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  GithubAuthProvider, 
  TwitterAuthProvider, 
  OAuthProvider, 
  signInWithPopup,
  getRedirectResult
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Configure providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const githubProvider = new GithubAuthProvider();
const twitterProvider = new TwitterAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// Provider map for easier access
export const providers = {
  google: googleProvider,
  facebook: facebookProvider,
  github: githubProvider,
  twitter: twitterProvider,
  apple: appleProvider
};

// Social sign in function
export async function signInWithProvider(providerName: keyof typeof providers) {
  const provider = providers[providerName];
  try {
    const result = await signInWithPopup(auth, provider);
    return result;
  } catch (error) {
    console.error("Social login error:", error);
    throw error;
  }
}

// Sign out function
export async function signOut() {
  return auth.signOut();
}

// Handle redirect result
export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    return result;
  } catch (error) {
    console.error("Error handling redirect result:", error);
    throw error;
  }
}

export { auth };
