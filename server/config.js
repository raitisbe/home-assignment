export const ENABLE_LOG = [true, 1, "true"].includes(
  process.env.ENABLE_LOG ?? true
);
export const LOG_MESSAGES = [true, 1, "true"].includes(
    process.env.LOG_MESSAGES ?? false
  );
export const HTTP_PORT = process.env.HTTP_PORT ?? 8080;
export const INACTIVITY_PERIOD = process.env.INACTIVITY_PERIOD ?? 25;
export const INACTIVITY_POLL_PERIOD = process.env.INACTIVITY_POLL_PERIOD ?? 5;
export const serverUrl = process.env.SERVER_URL; //Full url which is used for CORS for example 'http://localhost:3001'
