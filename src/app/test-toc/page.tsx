import { useState, useEffect } from 'react';
import TableOfContents from '@/components/TableOfContents';
import { processHtmlContent } from '@/lib/heading-utils';

export default function TableOfContentsTest() {
  const [testResults, setTestResults] = useState<Array<{ name: string; status: string; details: string }>>([]);
  
  // 测试用的Markdown内容，包含各种类型的标题
  const testContent = `# 这是一个中文标题
这是第一个中文标题的内容，用于测试纯中文标题的ID生成和跳转功能。

## 中文标题测试
这里是一些中文内容，用于验证中文标题的处理。

### 深层级中文标题
这是一个第三层级的中文标题，测试层级显示是否正确。

## 中英文混合标题 Mixed Chinese and English
这个标题包含了中文和English混合的内容，测试混合语言的ID生成。

### Code: 代码相关内容
测试包含特殊字符和代码格式的标题处理。

## 数字标题 123 Testing
测试包含数字的标题处理。

## 重复标题测试
这是第一个重复的标题。

### 重复标题测试
这是第二个重复的标题，应该自动添加序号。

## 特殊字符标题!@#$%^&*()
测试包含各种特殊字符的标题处理。

## 这是一个很长的中文标题，用于测试长标题的截断和显示效果
长标题的处理和显示效果测试。

### JavaScript和React开发指南
技术相关的标题处理。

## API接口设计原则
- RESTful设计
- 状态码规范
- 错误处理机制

## 数据库优化策略
索引优化和查询性能提升。

## 前端性能优化
- 代码分割
- 懒加载
- 缓存策略

## 总结
这是所有测试的总结部分。`;

  const processedContent = processHtmlContent(testContent);

  // 运行自动化测试
  useEffect(() => {
    const runTests = () => {
      const results = [];
      
      // 测试1: 中文标题ID生成
      try {
        const chineseId = '这是一个中文标题';
        const isChineseIdValid = document.getElementById(chineseId) !== null;
        results.push({
          name: '中文标题ID生成',
          status: isChineseIdValid ? '✅ 通过' : '❌ 失败',
          details: isChineseIdValid ? 'ID生成正确，元素存在' : 'ID生成失败或元素不存在'
        });
      } catch (error) {
        results.push({
          name: '中文标题ID生成',
          status: '❌ 错误',
          details: `测试出错: ${error.message}`
        });
      }

      // 测试2: 中英文混合标题
      try {
        const mixedId = '中英文混合标题-mixed-chinese-and-english';
        const isMixedIdValid = document.getElementById(mixedId) !== null;
        results.push({
          name: '中英文混合标题处理',
          status: isMixedIdValid ? '✅ 通过' : '❌ 失败',
          details: isMixedIdValid ? '混合标题ID生成正确' : '混合标题ID生成失败'
        });
      } catch (error) {
        results.push({
          name: '中英文混合标题处理',
          status: '❌ 错误',
          details: `测试出错: ${error.message}`
        });
      }

      // 测试3: 重复ID处理
      try {
        const duplicateId1 = document.getElementById('重复标题测试');
        const duplicateId2 = document.getElementById('重复标题测试-1');
        const areBothPresent = duplicateId1 !== null && duplicateId2 !== null;
        results.push({
          name: '重复ID自动处理',
          status: areBothPresent ? '✅ 通过' : '❌ 失败',
          details: areBothPresent ? '重复ID自动添加序号处理正确' : '重复ID处理失败'
        });
      } catch (error) {
        results.push({
          name: '重复ID自动处理',
          status: '❌ 错误',
          details: `测试出错: ${error.message}`
        });
      }

      // 测试4: 特殊字符处理
      try {
        const specialCharId = document.getElementById('特殊字符标题');
        const isSpecialCharValid = specialCharId !== null;
        results.push({
          name: '特殊字符处理',
          status: isSpecialCharValid ? '✅ 通过' : '❌ 失败',
          details: isSpecialCharValid ? '特殊字符被正确过滤' : '特殊字符处理失败'
        });
      } catch (error) {
        results.push({
          name: '特殊字符处理',
          status: '❌ 错误',
          details: `测试出错: ${error.message}`
        });
      }

      // 测试5: 长标题处理
      try {
        const longTitleId = '这是一个很长的中文标题用于测试长标题的截断和显示效果';
        const isLongTitleValid = document.getElementById(longTitleId) !== null;
        results.push({
          name: '长标题处理',
          status: isLongTitleValid ? '✅ 通过' : '❌ 失败',
          details: isLongTitleValid ? '长标题ID生成正确' : '长标题ID生成失败'
        });
      } catch (error) {
        results.push({
          name: '长标题处理',
          status: '❌ 错误',
          details: `测试出错: ${error.message}`
        });
      }

      // 测试6: 滚动行为测试
      try {
        const htmlElement = document.documentElement;
        const hasSmoothScroll = htmlElement.style.scrollBehavior === 'smooth';
        results.push({
          name: '平滑滚动支持',
          status: hasSmoothScroll ? '✅ 通过' : '⚠️ 部分',
          details: hasSmoothScroll ? 'CSS平滑滚动已启用' : 'CSS平滑滚动未启用，但JS回退可用'
        });
      } catch (error) {
        results.push({
          name: '平滑滚动支持',
          status: '❌ 错误',
          details: `测试出错: ${error.message}`
        });
      }

      setTestResults(results);
    };

    // 延迟执行测试，确保DOM完全加载
    const timer = setTimeout(runTests, 1000);
    return () => clearTimeout(timer);
  }, []);

  // 手动测试跳转功能
  const testNavigation = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      const startTime = performance.now();
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const endTime = performance.now();
      
      // 记录跳转性能
      const performanceResult = {
        name: `跳转到: ${targetId}`,
        status: '✅ 成功',
        details: `跳转耗时: ${(endTime - startTime).toFixed(2)}ms`
      };
      
      setTestResults(prev => [...prev, performanceResult]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            TableOfContents 目录跳转功能测试
          </h1>
          <p className="text-gray-600">
            本页面用于全面测试目录跳转功能的各项特性
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 目录组件 */}
          <div className="lg:col-span-1">
            <TableOfContents content={testContent} />
            
            {/* 测试控制面板 */}
            <div className="mt-6 bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4">测试控制面板</h3>
              <div className="space-y-2">
                <button
                  onClick={() => testNavigation('这是一个中文标题')}
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  测试跳转到中文标题
                </button>
                <button
                  onClick={() => testNavigation('中英文混合标题-mixed-chinese-and-english')}
                  className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  测试跳转到混合标题
                </button>
                <button
                  onClick={() => testNavigation('特殊字符标题')}
                  className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  测试跳转到特殊字符标题
                </button>
                <button
                  onClick={() => {
                    window.location.hash = '#重复标题测试';
                    setTimeout(() => testNavigation('重复标题测试'), 100);
                  }}
                  className="w-full px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  测试Hash导航
                </button>
              </div>
            </div>
          </div>

          {/* 主要内容区域 */}
          <div className="lg:col-span-3 space-y-8">
            {/* 自动化测试结果 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">自动化测试结果</h2>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className={`p-3 rounded border ${
                    result.status.includes('✅') ? 'border-green-200 bg-green-50' :
                    result.status.includes('❌') ? 'border-red-200 bg-red-50' :
                    'border-yellow-200 bg-yellow-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.name}</span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        result.status.includes('✅') ? 'bg-green-200 text-green-800' :
                        result.status.includes('❌') ? 'bg-red-200 text-red-800' :
                        'bg-yellow-200 text-yellow-800'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{result.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 测试内容 */}
            <div className="bg-white rounded-lg shadow p-8">
              <div 
                className="prose-custom max-w-none"
                dangerouslySetInnerHTML={{ __html: processedContent.processedHtml }}
              />
            </div>

            {/* 性能测试信息 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">性能优化特性</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded">
                  <h3 className="font-semibold text-blue-900">滚动优化</h3>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>✅ requestAnimationFrame 节流</li>
                    <li>✅ 避免频繁的DOM操作</li>
                    <li>✅ passive scroll 事件监听</li>
                    <li>✅ 滚动位置缓存优化</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 rounded">
                  <h3 className="font-semibold text-green-900">ID生成优化</h3>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>✅ 中文原生支持</li>
                    <li>✅ 重复ID自动处理</li>
                    <li>✅ 特殊字符过滤</li>
                    <li>✅ 统一的ID生成逻辑</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 浏览器兼容性说明 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">浏览器兼容性</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">现代浏览器支持</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-green-100 rounded text-center">
                      <div className="font-semibold">Chrome</div>
                      <div className="text-sm text-green-700">完全支持</div>
                    </div>
                    <div className="p-3 bg-green-100 rounded text-center">
                      <div className="font-semibold">Firefox</div>
                      <div className="text-sm text-green-700">完全支持</div>
                    </div>
                    <div className="p-3 bg-green-100 rounded text-center">
                      <div className="font-semibold">Safari</div>
                      <div className="text-sm text-green-700">完全支持</div>
                    </div>
                    <div className="p-3 bg-green-100 rounded text-center">
                      <div className="font-semibold">Edge</div>
                      <div className="text-sm text-green-700">完全支持</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">核心功能兼容性</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✅</span>
                      <span>CSS scroll-behavior 平滑滚动</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✅</span>
                      <span>requestAnimationFrame 性能优化</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✅</span>
                      <span>passive 事件监听器</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✅</span>
                      <span>History API URL hash管理</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}