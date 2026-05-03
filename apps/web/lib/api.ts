export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export type Category = { id: string; name: string };
export type BlockType = { id: string; name: string; durationMinutes: number; categoryId: string; description?: string; category?: Category };
export type WeeklyPlanItem = { id?: string; blockTypeId: string; targetCount: number };
export type WeeklyPlan = { id?: string; weekStart: string; weekEnd: string; planItems: WeeklyPlanItem[]; message?: string };
export type Progress = {
  totalTargetBlocks: number;
  totalCompletedBlocks: number;
  progressPercentage: number;
  progressByBlockType: Array<{ blockTypeId: string; blockTypeName: string; target: number; completed: number }>;
  progressByCategory: Array<{ categoryId: string; categoryName: string; target: number; completed: number }>;
  weeklyLevel: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getCategories: () => request<Category[]>('/categories'),
  getBlockTypes: () => request<BlockType[]>('/block-types'),
  createBlockType: (body: { name: string; durationMinutes: number; categoryId: string; description?: string }) => request<BlockType>('/block-types', { method: 'POST', body: JSON.stringify(body) }),
  updateBlockType: (id: string, body: Partial<{ name: string; durationMinutes: number; categoryId: string; description?: string }>) => request<BlockType>(`/block-types/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteBlockType: (id: string) => request<{ message: string }>(`/block-types/${id}`, { method: 'DELETE' }),
  getCurrentWeeklyPlan: () => request<WeeklyPlan>('/weekly-plans/current'),
  createWeeklyPlan: (body: { weekStartDate: string; items: WeeklyPlanItem[] }) => request<WeeklyPlan>('/weekly-plans', { method: 'POST', body: JSON.stringify(body) }),
  updateWeeklyPlanItems: (id: string, body: { items: WeeklyPlanItem[] }) => request<WeeklyPlan>(`/weekly-plans/${id}/items`, { method: 'PATCH', body: JSON.stringify(body) }),
  completeBlock: (body: { blockTypeId: string; notes?: string; completedAt?: string }) => request('/block-instances/complete', { method: 'POST', body: JSON.stringify(body) }),
  getCurrentProgress: () => request<Progress>('/progress/current-week')
};
