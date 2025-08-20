// Minimal helper to provide a unified BACKEND_URL for frontend code.
// Prefer Vite env var VITE_BACKEND_URL, then BACKEND_URL, then window.BACKEND_URL, then default localhost.
export const BACKEND_URL = import.meta?.env?.VITE_BACKEND_URL || import.meta?.env?.BACKEND_URL || window.BACKEND_URL || 'http://localhost:3000';

export default BACKEND_URL;
