// Configuration for API URLs

// To use Next.js rewrites (proxy), leave these as empty strings. 
// To connect directly to the remote server, use process.env.MAIN_API_BASE
export const API_BASE = '';
export const AUTH_API_BASE = '';

export const API_URL = API_BASE ? `${API_BASE}/api` : '/api';
export const AUTH_API_URL = AUTH_API_BASE ? `${AUTH_API_BASE}/api` : '/api';
