async function request(method: string, path: string, params?: unknown) {
  const body = !!params
    ? {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      }
    : {};

  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    ...body,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message ?? 'Request failed');
  }

  return data;
}

export const api = {
  get(path: string) {
    return request('GET', path);
  },
  post(path: string, params?: unknown) {
    return request('POST', path, params);
  },
  patch(path: string, params?: unknown) {
    return request('PATCH', path, params);
  },
};
