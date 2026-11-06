import { apiRequest } from './auth';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type WeddingTask = {
  id: string;
  title: string;
  description?: string;
  assignedMembershipId?: string;
  eventId?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  assignee: {
    membershipId: string;
    name: string;
    role: 'ADMIN' | 'MANAGER';
  } | null;
  event: { id: string; name: string; archivedAt?: string } | null;
};
export type TaskInput = {
  title: string;
  description?: string | null;
  assignedMembershipId?: string | null;
  eventId?: string | null;
  dueDate?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
};
export type TaskFilters = {
  status?: TaskStatus;
  priority?: TaskPriority;
  eventId?: string;
  assignedMembershipId?: string;
  mine?: boolean;
};
export async function getTasks(
  filters: TaskFilters = {},
  page = 1,
  limit = 20,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return apiRequest<{
    data: WeddingTask[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(`/api/tasks?${params}`);
}
export async function getTask(id: string) {
  return (await apiRequest<{ data: WeddingTask }>(`/api/tasks/${id}`)).data;
}
export async function createTask(input: TaskInput) {
  return (
    await apiRequest<{ data: WeddingTask }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  ).data;
}
export async function updateTask(
  id: string,
  input: Partial<TaskInput> & { expectedUpdatedAt: string },
) {
  return (
    await apiRequest<{ data: WeddingTask }>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  ).data;
}
export async function deleteTask(id: string) {
  await apiRequest(`/api/tasks/${id}`, { method: 'DELETE' });
}
