#!/usr/bin/env node

/**
 * 性能分析和构建优化脚本
 * 用于分析构建产物大小和加载性能
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const gzipSize = require('gzip-size');

// 项目根目录
const ROOT_DIR = process.cwd();
const BUILD_DIR = path.join(ROOT_DIR, '.next');

// 分析结果
const analysis = {
  buildTime: 0,
  bundleSize: {},
  pages: [],
  assets: [],
  recommendations: []
};

console.log('🚀 开始性能分析...\n');

// 1. 分析构建时间
console.log('📦 开始构建...');
const buildStart = Date.now();
try {
  execSync('npm run build', { stdio: 'inherit' });
  analysis.buildTime = Date.now() - buildStart;
  console.log(`✅ 构建完成，耗时: ${analysis.buildTime}ms\n`);
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}

// 2. 分析页面大小
console.log('📊 分析页面大小...');
if (fs.existsSync(path.join(BUILD_DIR, 'analyze'))) {
  const analyzeDir = path.join(BUILD_DIR, 'analyze');
  const pages = fs.readdirSync(analyzeDir);
  
  pages.forEach(page => {
    if (page.endsWith('.html')) {
      const pagePath = path.join(analyzeDir, page);
      const stats = fs.statSync(pagePath);
      const content = fs.readFileSync(pagePath);
      
      analysis.pages.push({
        name: page,
        size: stats.size,
        gzipSize: gzipSize.sync(content),
        path: pagePath
      });
    }
  });
}

// 3. 分析资源大小
console.log('📈 分析资源大小...');
const staticDir = path.join(BUILD_DIR, 'static');
if (fs.existsSync(staticDir)) {
  const analyzeAsset = (dir, prefix = '') => {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        analyzeAsset(itemPath, `${prefix}${item}/`);
      } else {
        const content = fs.readFileSync(itemPath);
        analysis.assets.push({
          name: `${prefix}${item}`,
          size: stats.size,
          gzipSize: gzipSize.sync(content),
          path: itemPath
        });
      }
    });
  };
  
  analyzeAsset(staticDir);
}

// 4. 生成优化建议
console.log('\n💡 优化建议:');

// 页面大小建议
analysis.pages.forEach(page => {
  if (page.size > 500 * 1024) { // 500KB
    analysis.recommendations.push({
      type: 'page',
      target: page.name,
      issue: `页面大小过大: ${(page.size / 1024).toFixed(2)}KB`,
      solution: '考虑代码分割、懒加载或优化第三方库'
    });
  }
});

// 资源大小建议
const jsAssets = analysis.assets.filter(a => a.name.endsWith('.js'));
const totalJsSize = jsAssets.reduce((sum, a) => sum + a.size, 0);

if (totalJsSize > 500 * 1024) { // 500KB
  analysis.recommendations.push({
    type: 'bundle',
    target: 'JavaScript',
    issue: `JS总大小过大: ${(totalJsSize / 1024).toFixed(2)}KB`,
    solution: '启用Tree Shaking、按需加载或使用更轻量的替代库'
  });
}

// 检查重复依赖
const packageJson = require(path.join(ROOT_DIR, 'package.json'));
const dependencies = Object.keys(packageJson.dependencies || {});
const devDependencies = Object.keys(packageJson.devDependencies || {});

const heavyDeps = dependencies.filter(dep => {
  const heavyLibs = ['lodash', 'moment', 'antd', 'material-ui', 'react-d3'];
  return heavyLibs.some(lib => dep.toLowerCase().includes(lib));
});

if (heavyDeps.length > 0) {
  analysis.recommendations.push({
    type: 'dependencies',
    target: heavyDeps.join(', '),
    issue: '使用了较重的第三方库',
    solution: '考虑使用轻量级替代方案或按需导入'
  });
}

// 5. 输出报告
console.log('\n📋 性能分析报告:');
console.log('='.repeat(50));
console.log(`构建时间: ${analysis.buildTime}ms`);
console.log(`页面数量: ${analysis.pages.length}`);
console.log(`资源数量: ${analysis.assets.length}`);
console.log(`JS总大小: ${(totalJsSize / 1024).toFixed(2)}KB`);
console.log('\n页面详情:');
analysis.pages.forEach(page => {
  console.log(`  ${page.name}: ${(page.size / 1024).toFixed(2)}KB (gzip: ${(page.gzipSize / 1024).toFixed(2)}KB)`);
});

console.log('\n最大资源:');
const largestAssets = [...analysis.assets]
  .sort((a, b) => b.size - a.size)
  .slice(0, 5);
largestAssets.forEach(asset => {
  console.log(`  ${asset.name}: ${(asset.size / 1024).toFixed(2)}KB`);
});

console.log('\n优化建议:');
analysis.recommendations.forEach((rec, index) => {
  console.log(`\n${index + 1}. ${rec.type.toUpperCase()} - ${rec.target}`);
  console.log(`   问题: ${rec.issue}`);
  console.log(`   建议: ${rec.solution}`);
});

// 6. 生成性能报告文件
const reportPath = path.join(ROOT_DIR, 'performance-report.json');
fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
console.log(`\n📄 详细报告已保存到: ${reportPath}`);

// 7. 生成 Lighthouse 配置
const lighthouseConfig = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};

const lighthousePath = path.join(ROOT_DIR, 'lighthouse.config.js');
fs.writeFileSync(lighthousePath, `module.exports = ${JSON.stringify(lighthouseConfig, null, 2)}`);
console.log(`📊 Lighthouse 配置已保存到: ${lighthousePath}`);

console.log('\n✅ 性能分析完成！');
console.log('\n下一步建议:');
console.log('1. 运行 npm run start 在本地测试性能');
console.log('2. 使用 Chrome DevTools 的 Lighthouse 进行性能评估');
console.log('3. 使用 Webpack Bundle Analyzer 分析打包结果');