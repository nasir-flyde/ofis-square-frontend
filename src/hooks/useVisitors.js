import { useState, useCallback } from 'react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api');

const useVisitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [todaysVisitors, setTodaysVisitors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    // Align with useApi token storage key
    const token = localStorage.getItem('ofis_admin_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Helper function to handle API responses
  const handleResponse = async (response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  };

  // Fetch all visitors with filters
  const fetchVisitors = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`${API_BASE_URL}/visitors?${queryParams}`, {
        headers: getAuthHeaders()
      });

      const data = await handleResponse(response);
      setVisitors(data.data || []);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch today's visitors
  const fetchTodaysVisitors = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      if (date) {
        queryParams.append('date', date);
      }

      const response = await fetch(`${API_BASE_URL}/visitors/today?${queryParams}`, {
        headers: getAuthHeaders()
      });

      const data = await handleResponse(response);
      setTodaysVisitors(data.data || []);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch visitor statistics
  const fetchStats = useCallback(async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`${API_BASE_URL}/visitors/stats?${queryParams}`, {
        headers: getAuthHeaders()
      });

      const data = await handleResponse(response);
      setStats(data.data);
      return data;
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      // Don't set error state for stats as it's not critical
      return { data: null };
    }
  }, []);

  // Create new visitor
  const createVisitor = useCallback(async (visitorData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/visitors`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(visitorData)
      });

      return await handleResponse(response);
    } catch (err) {
      throw err;
    }
  }, []);

  // Check in visitor
  const checkInVisitor = useCallback(async (visitorId, checkInData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/visitors/${visitorId}/checkin`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(checkInData)
      });

      return await handleResponse(response);
    } catch (err) {
      throw err;
    }
  }, []);

  // Check out visitor
  const checkOutVisitor = useCallback(async (visitorId, checkOutData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/visitors/${visitorId}/checkout`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(checkOutData)
      });

      return await handleResponse(response);
    } catch (err) {
      throw err;
    }
  }, []);

  // Scan QR code
  const scanQRCode = useCallback(async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/visitors/scan`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ token })
      });

      return await handleResponse(response);
    } catch (err) {
      throw err;
    }
  }, []);

  // Cancel visitor
  const cancelVisitor = useCallback(async (visitorId, cancelData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/visitors/${visitorId}/cancel`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(cancelData)
      });

      return await handleResponse(response);
    } catch (err) {
      throw err;
    }
  }, []);

  // Get visitor by ID
  const getVisitorById = useCallback(async (visitorId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/visitors/${visitorId}`, {
        headers: getAuthHeaders()
      });

      return await handleResponse(response);
    } catch (err) {
      throw err;
    }
  }, []);

  // Fetch pending check-in requests
  const fetchPendingRequests = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`${API_BASE_URL}/visitors/pending-checkin?${queryParams}`, {
        headers: getAuthHeaders()
      });

      const data = await handleResponse(response);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Approve check-in request
  const approveCheckinRequest = useCallback(async (visitorId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/visitors/${visitorId}/approve-checkin`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      return await handleResponse(response);
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    visitors,
    todaysVisitors,
    stats,
    loading,
    error,
    fetchVisitors,
    fetchTodaysVisitors,
    fetchStats,
    createVisitor,
    checkInVisitor,
    checkOutVisitor,
    scanQRCode,
    cancelVisitor,
    getVisitorById,
    fetchPendingRequests,
    approveCheckinRequest
  };
};

export { useVisitors };
