export const ENABLE_LOG = [true, 1, 'true'].includes(process.env.ENABLE_LOG ?? true);
export const HTTP_PORT = process.env.HTTP_PORT ?? 8080;
export const INACTIVITY_PERIOD = process.env.INACTIVITY_PERIOD ?? 15;
