export type FetchError = {
  statusCode: number;
  message: string;
  url: string;
};

export async function fetchWithStatus(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(url, init);

  if (!res.ok || (res.status >= 300 && res.status < 400)) {
    const error: FetchError = {
      statusCode: res.status,
      message: res.statusText,
      url,
    };
    throw error;
  }

  return res;
}
