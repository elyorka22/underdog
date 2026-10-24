const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:4000";

export type CommunityType = "channel" | "group" | "bot";

export type Community = {
  id: string;
  username: string;
  title: string;
  description: string;
  type: CommunityType;
  categoryId: string;
  categoryTitle: string;
  language: string;
  membersCount: number;
  tags: string[];
  verified: boolean;
  telegramUrl: string;
};

export type Category = {
  id: string;
  title: string;
  description: string;
  appliesTo?: CommunityType[];
  count: number;
};

export type SearchResult = {
  total: number;
  limit: number;
  offset: number;
  items: Community[];
};

export type Stats = {
  total: number;
  channels: number;
  groups: number;
  bots: number;
  categories: number;
};

export function getApiBase() {
  return API_URL;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`API ${path} failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getStats() {
  return apiFetch<Stats>("/api/stats");
}

export function getCategories(type?: string) {
  const suffix =
    type && type !== "all" ? `?type=${encodeURIComponent(type)}` : "";
  return apiFetch<{ items: Category[] }>(`/api/categories${suffix}`);
}

export function getPopular(limit = 8) {
  return apiFetch<SearchResult>(`/api/popular?limit=${limit}`);
}

export function getCommunity(id: string) {
  return apiFetch<Community>(`/api/communities/${encodeURIComponent(id)}`);
}

export function searchCommunities(params: {
  q?: string;
  type?: string;
  category?: string;
  language?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.type) query.set("type", params.type);
  if (params.category) query.set("category", params.category);
  if (params.language) query.set("language", params.language);
  if (params.sort) query.set("sort", params.sort);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<SearchResult>(`/api/search${suffix}`);
}

export function formatMembers(count: number) {
  return new Intl.NumberFormat("ru-RU").format(count);
}

export function typeLabel(type: string) {
  if (type === "channel") return "Kanal";
  if (type === "group") return "Chat";
  if (type === "bot") return "Bot";
  return type;
}
