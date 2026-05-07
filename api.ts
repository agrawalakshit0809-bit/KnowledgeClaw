export const API_BASE_URL = "https://leonardo-trypanosomic-keaton.ngrok-free.dev";

export async function apiGet(path: string) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "ngrok-skip-browser-warning": "true" },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}