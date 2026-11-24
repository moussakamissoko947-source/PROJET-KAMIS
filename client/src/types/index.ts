export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt?: string;
  status?: string;
}

export interface StorageUsage {
  user_id: string;
  used_bytes: number;
  quota_bytes: number;
  updated_at: string;
}

export interface FileItem {
  id: string;
  owner_user_id: string;
  original_name: string;
  object_key: string;
  content_type_claimed: string;
  size_bytes: number;
  checksum: string | null;
  state: 'pending' | 'ready' | 'deleting' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface CategoryStats {
  count: number;
  bytes: number;
}

export interface AccountData {
  user: User;
  storage: StorageUsage;
  totalFiles: number;
  breakdown: {
    documents: CategoryStats;
    images: CategoryStats;
    videos: CategoryStats;
    audio: CategoryStats;
    archives: CategoryStats;
    others: CategoryStats;
  };
}

export interface SentEmail {
  id: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  type: 'verification' | 'password_reset' | 'notification';
  actionUrl?: string;
  sentAt: string;
}
