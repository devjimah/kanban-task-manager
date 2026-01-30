import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "kanban-auth";

// Mock user for demo purposes
const MOCK_USER: User = {
  id: "1",
  name: "Demo User",
  email: "demo@example.com",
};

// Mock credentials
const MOCK_CREDENTIALS = {
  email: "demo@example.com",
  password: "password123",
};

// Helper to load auth state from localStorage
function loadAuthState(): { isLoggedIn: boolean; user: User | null } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.isLoggedIn && data.user) {
        return { isLoggedIn: true, user: data.user };
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return { isLoggedIn: false, user: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize state directly from localStorage (no effect needed)
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => loadAuthState().isLoggedIn,
  );
  const [user, setUser] = useState<User | null>(() => loadAuthState().user);

  // Persist auth state to localStorage when it changes
  useEffect(() => {
    if (isLoggedIn && user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ isLoggedIn, user }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isLoggedIn, user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock validation
    if (
      email === MOCK_CREDENTIALS.email &&
      password === MOCK_CREDENTIALS.password
    ) {
      setIsLoggedIn(true);
      setUser(MOCK_USER);
      return true;
    }

    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
