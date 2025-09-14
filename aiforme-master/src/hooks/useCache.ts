'use client';

import { useState, useEffect } from 'react';

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
  size: number;
}

interface CacheHealth {
  status: string;
  memoryUsage: {
    size: number;
    maxSize: number;
    usagePercentage: number;
  };
  performance: {
    hitRate: number;
    totalRequests: number;
    evictions: number;
  };
  timestamp: string;
}

export function useCacheStats(refreshInterval: number = 30000) {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [health, setHealth] = useState<CacheHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/cache?action=stats');
      if (!response.ok) throw new Error('Failed to fetch cache stats');
      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/cache?action=health');
      if (!response.ok) throw new Error('Failed to fetch cache health');
      const data = await response.json();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchStats(), fetchHealth()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
    
    if (refreshInterval > 0) {
      const interval = setInterval(refreshData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  return {
    stats,
    health,
    loading,
    error,
    refresh: refreshData
  };
}

export function useCacheAction() {
  const clearCache = async () => {
    try {
      const response = await fetch('/api/cache', {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to clear cache');
      return await response.json();
    } catch (err) {
      throw err;
    }
  };

  const clearCacheItem = async (namespace: string, id: string) => {
    try {
      const params = new URLSearchParams({ namespace, id });
      const response = await fetch(`/api/cache?${params}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to clear cache item');
      return await response.json();
    } catch (err) {
      throw err;
    }
  };

  return {
    clearCache,
    clearCacheItem
  };
}