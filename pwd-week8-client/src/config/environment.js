const apiUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");
const clientUrl = window.location.origin;
export { apiUrl, clientUrl };
export default { apiUrl, clientUrl };
