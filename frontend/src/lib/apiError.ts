import axios from "axios";

// Backend errors: { error: "Already in their list." } and, for validation failures,
// { error: "Validation failed", details: [{ message: "Use the format: ..." }] }.
// Prefer the specific field message over the generic "Validation failed".
export function apiErrorMessage(err: unknown, fallback = "Something went wrong, try again.") {
  if (!axios.isAxiosError(err)) return fallback;
  if (!err.response) return "Can't reach the server. Check your connection.";
  const data = err.response.data as
    { error?: string; details?: { message?: string }[] } | undefined;
  return data?.details?.[0]?.message || data?.error || fallback;
}

export const apiErrorStatus = (err: unknown) =>
  axios.isAxiosError(err) ? err.response?.status : undefined;
