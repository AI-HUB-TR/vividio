import { apiRequest } from "./queryClient";
import { auth, signInWithProvider } from "./firebase";
import { User } from "@shared/schema";

// Register with email and password
export async function registerWithEmail(email: string, password: string, username: string, displayName?: string) {
  try {
    const res = await apiRequest("POST", "/api/auth/register", {
      email,
      password,
      username,
      displayName: displayName || username
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

// Login with email and password
export async function loginWithEmail(email: string, password: string) {
  try {
    const res = await apiRequest("POST", "/api/auth/login", {
      email,
      password
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

// Social login
export async function socialLogin(providerName: string) {
  try {
    // First sign in with Firebase
    const result = await signInWithProvider(providerName as any);
    
    if (!result || !result.user) {
      throw new Error("Sosyal giriş başarısız oldu");
    }
    
    const { user } = result;
    
    // Then register/login with our backend
    const res = await apiRequest("POST", "/api/auth/social-login", {
      email: user.email,
      displayName: user.displayName,
      username: user.email?.split('@')[0],
      authProvider: providerName,
      providerId: user.uid,
      profileImageUrl: user.photoURL
    });
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Social login error:", error);
    throw error;
  }
}

// Logout
export async function logout() {
  try {
    // Sign out from Firebase
    await auth.signOut();
    
    // Logout from our backend
    const res = await apiRequest("POST", "/api/auth/logout", {});
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

// Get current user
export async function getCurrentUser() {
  try {
    const res = await fetch("/api/auth/me", {
      credentials: "include"
    });
    
    if (res.status === 401) {
      return null;
    }
    
    if (!res.ok) {
      throw new Error("Kullanıcı bilgileri alınamadı");
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

// Check if user is admin
export function isAdmin(user: User | null) {
  return user?.role === "admin";
}
