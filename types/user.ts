export type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type UserProfileSettings = {
  [key: string]: unknown;
};

export type AIUsageStats = {
  used?: number;
  limit?: number;
  resetsAt?: string;
};

export type UserProfile = {
  settings: UserProfileSettings;
  aiUsage?: AIUsageStats;
};

export type Session = {
  user: User;
  expires?: string;
};
