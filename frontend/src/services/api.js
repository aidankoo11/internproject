const BASE_URL = '/api';

export async function fetchRequests(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value) params.append(key, value); });
  const res = await fetch(`${BASE_URL}/requests${params.toString() ? '?' + params : ''}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchRequest(id) { return (await fetch(`${BASE_URL}/requests/${id}`)).json(); }

export async function createRequest(data) {
  const res = await fetch(`${BASE_URL}/requests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return res.json();
}

export async function updateRequest(id, data) {
  const res = await fetch(`${BASE_URL}/requests/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return res.json();
}

export async function deleteRequest(id) { await fetch(`${BASE_URL}/requests/${id}`, { method: 'DELETE' }); }

export async function addComment(requestId, data) {
  const res = await fetch(`${BASE_URL}/requests/${requestId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return res.json();
}

export async function uploadFile(requestId, file, uploadedBy) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('uploaded_by', uploadedBy);
  const res = await fetch(`${BASE_URL}/requests/${requestId}/files`, { method: 'POST', body: formData });
  return res.json();
}

export async function fetchGroups() { const res = await fetch(`${BASE_URL}/groups`); if (!res.ok) return []; return res.json(); }
export async function fetchGroup(id) { return (await fetch(`${BASE_URL}/groups/${id}`)).json(); }
export async function createGroup(data) { const res = await fetch(`${BASE_URL}/groups`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); return res.json(); }
export async function deleteGroup(id) { await fetch(`${BASE_URL}/groups/${id}`, { method: 'DELETE' }); }

export async function searchRequests(query) { const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`); if (!res.ok) return []; return res.json(); }
export async function fetchActivities() { const res = await fetch(`${BASE_URL}/activities`); if (!res.ok) return []; return res.json(); }
export async function deleteFile(requestId, fileId) { await fetch(`${BASE_URL}/requests/${requestId}/files/${fileId}`, { method: 'DELETE' }); }
