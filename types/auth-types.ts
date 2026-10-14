export type UserRole = "client" | "legal_pro";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  displayName?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  authUser: (email: string, password: string) => Promise<void>;
  createUser: (userData: {
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
}) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
}
