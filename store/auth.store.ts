import { create } from "zustand";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import type { AuthState, User, UserRole } from "@/types/auth-types";

// Initialize Firebase (make sure to add your config)
// const app = initializeApp({
//   // Your Firebase config here
// });

// const auth = getAuth(app);

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      // const userCredential = await signInWithEmailAndPassword(
      //   auth,
      //   email,
      //   password
      // );
      // const user: User = {
      //   id: userCredential.user.uid,
      //   email: userCredential.user.email ?? "",
      //   role: "client", // You might want to fetch this from Firestore
      //   createdAt: new Date(
      //     userCredential.user.metadata.creationTime ?? Date.now()
      //   ),
      //   displayName: userCredential.user.displayName ?? undefined,
      // };
      // set({ user, isLoading: false });
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error("Authentication error:", errorMessage);
      set({ error: errorMessage, isLoading: false });
    }
  },

  signUp: async (email: string, password: string, role: UserRole) => {
    try {
      set({ isLoading: true, error: null });
      // const userCredential = await createUserWithEmailAndPassword(
      //   auth,
      //   email,
      //   password
      // );
      // const user: User = {
      //   id: userCredential.user.uid,
      //   email: userCredential.user.email ?? "",
      //   role,
      //   createdAt: new Date(
      //     userCredential.user.metadata.creationTime ?? Date.now()
      //   ),
      // };
      // set({ user, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  signOut: async () => {
    try {
      // await firebaseSignOut(auth);
      set({ user: null });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  isLoggedIn: () => {
    return true;
  },

  // Method to create a user
  createUser: async (userData: {
    firstName: string,
    lastName: string,
    userName: string,
    email: string,
    password: string,
    dayOfBirth: number,
    monthOfBirth: number,
    yearOfBirth: number,
    address: string,
    townCity: string,
    country: string,
    postcode: string
  }) => {
    try {
      set({ isLoading: true });
      // Assuming you have a function to call your backend API
      const response = await fetch('/create_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create user');
      set({ user: data.user, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // Method to authenticate a user
  authUser: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch('/auth_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Authentication failed');
      set({ user: data.user, isLoading: false });
    } catch (error) {
      const errorMessage = (error as Error).message || 'Authentication failed';
      console.error("Authentication error:", errorMessage);
      set({ error: errorMessage, isLoading: false });
      throw error; // Re-throw so the component can also handle it
    }
  },
}));
