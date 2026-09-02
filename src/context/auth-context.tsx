import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type CareerProfile = {
  name: string;
  email: string;
  city: string;
  field: string;
  path: string;
  skillLevel: string;
  goal: string;
  /** FINAL BOSS character data. Legacy fields remain above for existing pages. */
  specialization?: string;
  skills?: string[];
  programmingLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | string;
  target?: string;
  className?: string;
  avatar?: AvatarId;
};

export type AvatarId = 'coder' | 'cyber' | 'data' | 'cloud' | 'game' | 'designer';

type AuthContextValue = {
  user: CareerProfile | null;
  login: (email: string) => Promise<void>;
  register: (profile: CareerProfile) => Promise<void>;
  updateProfile: (profile: Partial<CareerProfile>) => void;
  logout: () => void;
};

const STORAGE_KEY = 'career-os-demo-profile';
const defaultProfile: CareerProfile = {
  name: 'Alex Morgan',
  email: 'alex.morgan@email.com',
  city: 'Bengaluru, India',
  field: 'Technology',
  path: 'Product',
  skillLevel: 'Early career',
  goal: 'Find my next role',
  specialization: 'Full-stack development',
  skills: ['JavaScript', 'React'],
  programmingLevel: 'Intermediate',
  target: 'Land my first technical role',
  className: 'SYSTEM ARCHITECT',
  avatar: 'coder',
};

function normalizeProfile(profile: CareerProfile): CareerProfile {
  const specialization = profile.specialization ?? profile.path ?? profile.field;
  const programmingLevel = profile.programmingLevel ?? profile.skillLevel;
  const target = profile.target ?? profile.goal;
  return {
    ...defaultProfile,
    ...profile,
    specialization,
    programmingLevel,
    target,
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    avatar: profile.avatar ?? 'coder',
    className: mapClass({ ...profile, specialization, programmingLevel, target }),
  };
}

function mapClass(profile: CareerProfile) {
  const specialization = profile.specialization?.toLowerCase() ?? '';
  if (specialization.includes('software')) return 'CODE WARRIOR';
  if (specialization.includes('ai') || specialization.includes('machine')) return 'AI EXPLORER';
  if (specialization.includes('data')) return 'DATA ANALYST';
  if (specialization.includes('cyber')) return 'CYBER GUARDIAN';
  if (specialization.includes('web')) return 'WEB ARCHITECT';
  if (specialization.includes('cloud') || specialization.includes('devops')) return 'CLOUD ENGINEER';
  if (specialization.includes('mobile')) return 'APP BUILDER';
  if (specialization.includes('game')) return 'GAME DEVELOPER';
  if (specialization.includes('ui') || specialization.includes('frontend')) return 'DIGITAL DESIGNER';
  if (specialization.includes('exploring')) return 'CODE APPRENTICE';
  return profile.programmingLevel === 'Advanced' || profile.skillLevel === 'Experienced builder' ? 'CODE WARRIOR' : 'CODE APPRENTICE';
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredProfile(): CareerProfile | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeProfile(JSON.parse(stored) as CareerProfile) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CareerProfile | null>(readStoredProfile);

  const persist = (profile: CareerProfile | null) => {
    const normalized = profile ? normalizeProfile(profile) : null;
    setUser(normalized);
    if (normalized) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    else window.localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    login: async (email) => {
      const existing = readStoredProfile();
       persist(existing ?? { ...defaultProfile, email, name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()) });
    },
    register: async (profile) => persist(profile),
    updateProfile: (updates) => {
      if (user) persist({ ...user, ...updates });
    },
    logout: () => persist(null),
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}