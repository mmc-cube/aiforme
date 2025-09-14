#!/usr/bin/env node

/**
 * 缓存管理工具
 * 用于开发和生产环境中管理 API 缓存
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function fetchWithRetry(url: string, options: any = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function showCacheStats() {
  try {
    console.log('📊 缓存统计信息...\n');
    const data = await fetchWithRetry(`${API_BASE_URL}/api/cache?action=stats`);
    
    console.log('性能指标:');
    console.log(`  命中次数: ${data.stats.hits}`);
    console.log(`  未命中次数: ${data.stats.misses}`);
    console.log(`  设置次数: ${data.stats.sets}`);
    console.log(`  淘汰次数: ${data.stats.evictions}`);
    console.log(`  缓存项数量: ${data.stats.size}`);
    console.log(`  命中率: ${data.hitRate}\n`);
    
    console.log('缓存配置:');
    Object.entries(data.config).forEach(([key, config]: [string, any]) => {
      console.log(`  ${key}: ${config.TTL / 1000}秒`);
    });
    
    return data;
  } catch (error) {
    console.error('❌ 获取缓存统计失败:', error.message);
    process.exit(1);
  }
}

async function showCacheHealth() {
  try {
    console.log('🏥 缓存健康检查...\n');
    const health = await fetchWithRetry(`${API_BASE_URL}/api/cache?action=health`);
    
    console.log(`状态: ${health.status}`);
    console.log(`内存使用: ${health.memoryUsage.size}/${health.memoryUsage.maxSize} (${health.memoryUsage.usagePercentage.toFixed(1)}%)`);
    console.log(`命中率: ${health.performance.hitRate.toFixed(2)}%`);
    console.log(`总请求数: ${health.performance.totalRequests}`);
    console.log(`淘汰次数: ${health.performance.evictions}`);
    
    return health;
  } catch (error) {
    console.error('❌ 获取健康状态失败:', error.message);
    process.exit(1);
  }
}

async function clearCache(namespace?: string, id?: string) {
  try {
    if (namespace && id) {
      console.log(`🗑️  删除缓存项: ${namespace}:${id}`);
      const response = await fetchWithRetry(`${API_BASE_URL}/api/cache?namespace=${namespace}&id=${id}`, {
        method: 'DELETE'
      });
      console.log(`✅ ${response.message}`);
    } else {
      console.log('🗑️  清空所有缓存...');
      const response = await fetchWithRetry(`${API_BASE_URL}/api/cache`, {
        method: 'DELETE'
      });
      console.log(`✅ ${response.message}`);
    }
  } catch (error) {
    console.error('❌ 清空缓存失败:', error.message);
    process.exit(1);
  }
}

async function showCacheDetails() {
  try {
    console.log('🔍 缓存详细信息...\n');
    const data = await fetchWithRetry(`${API_BASE_URL}/api/cache?action=details`);
    
    if (data.details && data.details.length > 0) {
      console.log(`共 ${data.count} 个缓存项:\n`);
      data.details.forEach((item: any, index: number) => {
        console.log(`${index + 1}. ${item.key}`);
        console.log(`   TTL: ${item.ttl / 1000}秒`);
        console.log(`   年龄: ${(item.age / 1000).toFixed(1)}秒`);
        console.log(`   访问次数: ${item.accessCount}`);
        console.log(`   最后访问: ${new Date(item.lastAccessed).toLocaleString()}`);
        console.log(`   状态: ${item.isExpired ? '已过期' : '有效'}\n`);
      });
    } else {
      console.log('缓存为空');
    }
  } catch (error) {
    if (error.message.includes('403')) {
      console.log('❌ 仅在开发环境可用');
    } else {
      console.error('❌ 获取缓存详情失败:', error.message);
      process.exit(1);
    }
  }
}

// CLI 命令处理
const command = process.argv[2];

switch (command) {
  case 'stats':
    showCacheStats();
    break;
    
  case 'health':
    showCacheHealth();
    break;
    
  case 'clear':
    const namespace = process.argv[3];
    const id = process.argv[4];
    clearCache(namespace, id);
    break;
    
  case 'details':
    showCacheDetails();
    break;
    
  case 'watch':
    console.log('👀 监控缓存状态 (按 Ctrl+C 退出)...\n');
    const interval = setInterval(() => {
      console.log(`\n[${new Date().toLocaleTimeString()}]`);
      showCacheHealth();
      console.log('\n------------------------\n');
    }, 5000);
    
    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log('\n👋 监控已停止');
      process.exit(0);
    });
    break;
    
  default:
    console.log(`
缓存管理工具

使用方法:
  npm run cache stats     # 显示缓存统计
  npm run cache health    # 健康检查
  npm run cache clear     # 清空所有缓存
  npm run cache clear <namespace> <id>  # 删除特定缓存项
  npm run cache details   # 显示缓存详情（开发环境）
  npm run cache watch     # 实时监控缓存状态

示例:
  npm run cache clear posts-list all-posts
  npm run cache clear single-post my-post-id
`);
    process.exit(1);
}