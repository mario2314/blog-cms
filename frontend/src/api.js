const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export async function getPosts() {
  const res = await fetch(`${API_URL}/posts`);
  return res.json();
}

export async function getPost(slug) {
  const res = await fetch(`${API_URL}/posts/${slug}`);
  if (!res.ok) throw new Error("Post tidak ditemukan");
  return res.json();
}

export async function getSettings() {
  const res = await fetch(`${API_URL}/settings`);
  if (!res.ok) throw new Error("Gagal memuat pengaturan");
  return res.json();
}

export async function login(username, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Login gagal");
  return res.json();
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export async function getAdminPosts() {
  const res = await fetch(`${API_URL}/admin/posts`, { headers: authHeaders() });
  return res.json();
}

export async function getAdminPost(id) {
  const res = await fetch(`${API_URL}/admin/posts/${id}`, { headers: authHeaders() });
  return res.json();
}

export async function createPost(data) {
  const res = await fetch(`${API_URL}/admin/posts`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updatePost(id, data) {
  const res = await fetch(`${API_URL}/admin/posts/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deletePost(id) {
  await fetch(`${API_URL}/admin/posts/${id}`, { method: "DELETE", headers: authHeaders() });
}

export async function uploadImage(file) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${API_URL}/admin/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error("Upload gagal");
  return res.json();
}

export async function getAdminMe() {
  const res = await fetch(`${API_URL}/admin/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Gagal memuat akun");
  return res.json();
}

export async function updateAdminAccount(data) {
  const res = await fetch(`${API_URL}/admin/account`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Gagal memperbarui akun");
  return json;
}

export async function updateSettings(data) {
  const res = await fetch(`${API_URL}/admin/settings`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Gagal memperbarui pengaturan");
  return json;
}
