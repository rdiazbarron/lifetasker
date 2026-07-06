export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export type Category = {
  id: string;
  name: string;
  key?: string;
  // Importance bonus as a percent (0..100); color is a #rrggbb hex.
  weightPercent: number;
  color: string;
};

export type BlockType = {
  id: string;
  name: string;
  durationMinutes: number;
  categoryId: string;
  description?: string;
  category?: Category;
};

export type WeeklyPlanItem = {
  id?: string;
  blockTypeId: string;
  targetCount: number;
};

export type WeeklyPlan = {
  id: string;
  weekStart: string;
  weekEnd: string;
  planItems: WeeklyPlanItem[];
};

export type BlockInstance = {
  id: string;
  blockTypeId: string;
  completedAt: string;
};

export type Progress = {
  totalTargetBlocks: number;
  totalCompletedBlocks: number;
  pointsThisWeek: number;
  progressPercentage: number;
  progressByBlockType: Array<{
    blockTypeId: string;
    blockTypeName: string;
    target: number;
    completed: number;
  }>;
  progressByCategory: Array<{
    categoryId: string;
    categoryName: string;
    target: number;
    completed: number;
  }>;
  weeklyLevel: number;
  lifetime: LifetimeProgress;
};

export type LifetimeProgress = {
  level: number;
  totalPoints: number;
  pointsIntoLevel: number;
  pointsForNextLevel: number;
  pointsToNextLevel: number;
  progressPercent: number;
};

export type Overview = {
  categories: Array<{ id: string; name: string; color: string }>;
  // Newest week first. counts is keyed by category id, zero-filled.
  weeks: Array<{
    weekStart: string;
    weekEnd: string;
    counts: Record<string, number>;
  }>;
};

export type Emblem = {
  key: string;
  group: "category" | "streak" | "level" | "perfect-week";
  name: string;
  description: string;
  target: number;
  current: number;
  earned: boolean;
};

export type Emblems = {
  emblems: Emblem[];
  earnedCount: number;
  total: number;
};

export type Heatmap = {
  start: string;
  end: string;
  // Only non-zero days; the calendar fills the rest with zeros.
  days: Array<{ date: string; count: number }>;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    // Send the Better Auth session cookie on cross-origin API calls.
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    // An expired/missing session surfaces as 401 — bounce to login rather than
    // showing a broken page. (Full app-wide route protection lands in #21.)
    if (res.status === 401 && typeof window !== "undefined") {
      const next = encodeURIComponent(window.location.pathname);
      window.location.href = `/login?next=${next}`;
    }
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getCategories: () => request<Category[]>("/categories"),
  createCategory: (body: {
    name: string;
    weightPercent?: number;
    color?: string;
  }) =>
    request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateCategory: (
    id: string,
    body: Partial<{ name: string; weightPercent: number; color: string }>,
  ) =>
    request<Category>(`/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  getBlockTypes: () => request<BlockType[]>("/block-types"),
  createBlockType: (body: {
    name: string;
    durationMinutes: number;
    categoryId: string;
    description?: string;
  }) =>
    request<BlockType>("/block-types", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateBlockType: (
    id: string,
    body: Partial<{
      name: string;
      durationMinutes: number;
      categoryId: string;
      description?: string;
    }>,
  ) =>
    request<BlockType>(`/block-types/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteBlockType: (id: string) =>
    request<{ message: string }>(`/block-types/${id}`, { method: "DELETE" }),
  getCurrentWeeklyPlan: () => request<WeeklyPlan>("/weekly-plans/current"),
  createWeeklyPlan: (body: {
    weekStartDate: string;
    items: WeeklyPlanItem[];
  }) =>
    request<WeeklyPlan>("/weekly-plans", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateWeeklyPlanItems: (id: string, body: { items: WeeklyPlanItem[] }) =>
    request<WeeklyPlan>(`/weekly-plans/${id}/items`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  completeBlock: (body: {
    blockTypeId: string;
    notes?: string;
    completedAt?: string;
  }) =>
    request("/block-instances/complete", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  undoLastCompletedBlock: (blockTypeId: string) =>
    request<BlockInstance>(`/block-instances/complete/${blockTypeId}`, { method: "DELETE" }),
  getCurrentWeekCompletions: () => request<BlockInstance[]>("/block-instances/current-week"),
  getCurrentProgress: () => request<Progress>("/progress/current-week"),
  getEmblems: () => request<Emblems>("/emblems"),
  getOverview: () => request<Overview>("/progress/overview"),
  getHeatmap: (categoryId?: string) =>
    request<Heatmap>(
      categoryId && categoryId !== "all"
        ? `/progress/heatmap?categoryId=${encodeURIComponent(categoryId)}`
        : "/progress/heatmap",
    ),
};

export const CATEGORY_STYLES = [
  "bg-sky-500/20 text-sky-300 border-sky-500/30",
  "bg-violet-500/20 text-violet-300 border-violet-500/30",
  "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "bg-amber-500/20 text-amber-300 border-amber-500/30",
];

// Turn a #rrggbb category color into an rgba() string at the given opacity, so
// the overview grid and heatmap can shade cells by intensity in one hue.
export function hexWithAlpha(hex: string, alpha: number): string {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) return hex;
  const int = parseInt(match[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function formatWeekRange(weekStart: string, weekEnd: string) {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}
