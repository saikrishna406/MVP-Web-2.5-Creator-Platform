export type UserRole = 'fan' | 'creator';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  email?: string;
  avatar_url: string | null;
  banner_url: string | null;
  category: string | null;
  social_links: Record<string, string>;
  role: UserRole;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  token_balance: number;
  points_balance: number;
  created_at: string;
  updated_at: string;
}

export interface TokenPackage {
  id: string;
  name: string;
  description: string;
  token_amount: number;
  price_cents: number;
  stripe_price_id: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'purchase' | 'spend' | 'refund';
  description: string;
  reference_id: string | null;
  stripe_session_id: string | null;
  created_at: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'earn' | 'spend';
  action: string;
  description: string;
  reference_id: string | null;
  created_at: string;
}

export type PostAccessType = 'public' | 'token_gated' | 'threshold_gated';

export interface Post {
  id: string;
  creator_id: string;
  title: string;
  content: string;
  image_url: string | null;
  access_type: PostAccessType;
  token_cost: number | null;
  threshold_amount: number | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  creator?: Profile;
  is_unlocked?: boolean;
  is_liked?: boolean;
}

export interface PostUnlock {
  id: string;
  user_id: string;
  post_id: string;
  tokens_spent: number;
  created_at: string;
}

export interface PostLike {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  // Joined
  profile?: Profile;
}

export interface RedemptionItem {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  image_url: string | null;
  point_cost: number;
  quantity_available: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  creator?: Profile;
}

export interface RedemptionOrder {
  id: string;
  user_id: string;
  item_id: string;
  points_spent: number;
  status: 'pending' | 'fulfilled' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Joined
  item?: RedemptionItem;
  profile?: Profile;
}

export interface DailyReward {
  id: string;
  user_id: string;
  action: string;
  points_earned: number;
  date: string;
  created_at: string;
}

// API response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// Gamification config
export interface PointAction {
  action: string;
  points: number;
  daily_limit: number;
  description: string;
}

export interface CreatorPackage {
  id: string;
  creator_id: string;
  name: string;
  token_price: number;
  post_limit: number;
  description: string | null;
  badge_name: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
