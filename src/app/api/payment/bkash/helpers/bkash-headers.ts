export const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  "x-app-key": process.env.BKASH_APP_KEY!,
});

export const getTokenHeaders = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  username: process.env.BKASH_USERNAME!,
  password: process.env.BKASH_PASSWORD!,
});
