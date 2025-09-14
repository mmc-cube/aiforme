'use client';

import { useCacheStats, useCacheAction } from '@/hooks/useCache';

export default function CacheDashboard() {
  const { stats, health, loading, error, refresh } = useCacheStats(5000);
  const { clearCache } = useCacheAction();

  const handleClearCache = async () => {
    if (confirm('确定要清空所有缓存吗？')) {
      try {
        await clearCache();
        refresh();
        alert('缓存已清空');
      } catch (err) {
        alert('清空缓存失败');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-4 border rounded">
        <h3 className="text-lg font-semibold mb-2">缓存状态</h3>
        <div>加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded border-red-200">
        <h3 className="text-lg font-semibold mb-2 text-red-600">缓存状态</h3>
        <div className="text-red-600">错误: {error}</div>
      </div>
    );
  }

  if (!stats || !health) {
    return null;
  }

  const hitRate = ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2);
  const memoryPercentage = (health.memoryUsage.usagePercentage).toFixed(1);

  return (
    <div className="p-4 border rounded space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">缓存状态</h3>
        <button
          onClick={handleClearCache}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          清空缓存
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-medium">性能指标</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>缓存命中率:</span>
              <span className={parseFloat(hitRate) > 80 ? 'text-green-600' : 'text-yellow-600'}>
                {hitRate}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>命中次数:</span>
              <span>{stats.hits}</span>
            </div>
            <div className="flex justify-between">
              <span>未命中次数:</span>
              <span>{stats.misses}</span>
            </div>
            <div className="flex justify-between">
              <span>总请求数:</span>
              <span>{stats.hits + stats.misses}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">内存使用</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>缓存项数量:</span>
              <span>{stats.size} / 50</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${memoryPercentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-600">
              使用率: {memoryPercentage}%
            </div>
            <div className="flex justify-between">
              <span>淘汰次数:</span>
              <span>{stats.evictions}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        最后更新: {new Date(health.timestamp).toLocaleString('zh-CN')}
      </div>
    </div>
  );
}