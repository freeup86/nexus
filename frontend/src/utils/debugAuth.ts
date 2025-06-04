export const debugAuth = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('=== Authentication Debug ===');
  console.log('Token exists:', !!token);
  console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
  console.log('User:', user);
  
  if (token) {
    // Decode token without verification to see payload
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('Token payload:', payload);
        console.log('Token expires:', new Date(payload.exp * 1000).toLocaleString());
        console.log('Token expired:', new Date(payload.exp * 1000) < new Date());
      }
    } catch (e) {
      console.error('Failed to decode token:', e);
    }
  }
  console.log('=========================');
};