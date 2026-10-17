import { apiRequest } from './auth';

export type MemberRole = 'ADMIN' | 'MANAGER';
export type WeddingMember = {
  membershipId: string;
  user: { id: string; name: string; email: string };
  role: MemberRole;
  joinedAt: string;
};
export type MemberInvitation = {
  id: string;
  email: string;
  role: MemberRole;
  status: 'PENDING';
  expiresAt: string;
};
export type PublicMemberInvitation = {
  email: string;
  role: MemberRole;
  wedding: { brideName: string; groomName: string; weddingDate: string };
  requiresLogin: true;
};

export async function getMembers() {
  return (await apiRequest<{ data: WeddingMember[] }>('/api/members')).data;
}
export async function getMemberInvitations() {
  return (
    await apiRequest<{ data: MemberInvitation[] }>('/api/members/invitations')
  ).data;
}
export async function inviteMember(input: { email: string; role: MemberRole }) {
  return (
    await apiRequest<{ data: MemberInvitation }>('/api/members/invitations', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  ).data;
}
export async function revokeMemberInvitation(id: string) {
  await apiRequest<void>(`/api/members/invitations/${id}`, {
    method: 'DELETE',
  });
}
export async function updateMemberRole(id: string, role: MemberRole) {
  return (
    await apiRequest<{ data: WeddingMember }>(`/api/members/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
  ).data;
}
export async function removeMember(id: string) {
  await apiRequest<void>(`/api/members/${id}`, { method: 'DELETE' });
}
export async function getPublicMemberInvitation(token: string) {
  return (
    await apiRequest<{ data: PublicMemberInvitation }>(
      `/api/public/member-invitations/${token}`,
    )
  ).data;
}
export async function acceptMemberInvitation(token: string) {
  return (
    await apiRequest<{ data: { weddingId: string; role: MemberRole } }>(
      `/api/member-invitations/${token}/accept`,
      { method: 'POST' },
    )
  ).data;
}
