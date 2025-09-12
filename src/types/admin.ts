export interface PostData {
  id: number;
  slug: string;
  title: string;
  excerpt?: string;
  author?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  is_published: boolean;
  sort_order: number;
  view_count: number;
  content?: string;
}

export interface TagData {
  id: number;
  name: string;
  description?: string;
  color: string;
  post_count: number;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsData {
  totalViews: number;
  totalPosts: number;
  totalTags: number;
  recentViews: Array<{
    date: string;
    views: number;
  }>;
  topPosts: Array<{
    id: number;
    title: string;
    views: number;
  }>;
}

export interface AdminUser {
  id: number;
  username: string;
  role: string;
  created_at: string;
}