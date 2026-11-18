const API_BASE_URL = (
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://college-circular.onrender.com'
    : 'http://localhost:5000')
).replace(/\/$/, '');

export default API_BASE_URL;
