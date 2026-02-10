/**
 * Minimal fetch client for API requests.
 */

export class ApiClientError extends Error {
  public readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/** Execute a JSON request and return parsed data. */
export async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new ApiClientError(
      body || `Request failed with status ${response.status}`,
      response.status,
    )
  }

  return (await response.json()) as T
}
