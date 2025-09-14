import { remark } from 'remark';
import html from 'remark-html';
import { Cache } from './cache';

interface MarkdownCacheEntry {
  html: string;
  processedAt: number;
  fileHash: string;
}

export class MarkdownOptimizer {
  private cache: Cache<string, MarkdownCacheEntry>;
  private processingQueue = new Map<string, Promise<string>>();
  private remarkProcessor: any;

  constructor() {
    this.cache = new Cache({
      maxSize: 100, // 最多缓存100个文档
      ttl: 30 * 60 * 1000, // 30分钟TTL
    });

    // 预编译remark处理器
    this.remarkProcessor = remark().use(html, {
      sanitize: false,
      remarkPlugins: [],
    });
  }

  /**
   * 生成文件内容哈希
   */
  private generateHash(content: string): string {
    // 简单的哈希算法，生产环境可考虑更复杂的算法
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(36);
  }

  /**
   * 异步处理Markdown内容
   */
  async processMarkdown(content: string, filePath?: string): Promise<string> {
    const fileHash = this.generateHash(content);
    const cacheKey = filePath || fileHash;

    // 检查缓存
    const cached = this.cache.get(cacheKey);
    if (cached && cached.fileHash === fileHash) {
      return cached.html;
    }

    // 检查是否正在处理中
    if (this.processingQueue.has(cacheKey)) {
      return this.processingQueue.get(cacheKey)!;
    }

    // 创建处理Promise
    const processPromise = this.processMarkdownInternal(content, fileHash);
    this.processingQueue.set(cacheKey, processPromise);

    try {
      const result = await processPromise;
      return result;
    } finally {
      this.processingQueue.delete(cacheKey);
    }
  }

  /**
   * 内部Markdown处理逻辑
   */
  private async processMarkdownInternal(content: string, fileHash: string): Promise<string> {
    try {
      // 使用Web Worker进行大规模处理（如果可用）
      if (typeof Worker !== 'undefined' && content.length > 10000) {
        return this.processWithWorker(content, fileHash);
      }

      // 直接处理
      const processedContent = await this.remarkProcessor.process(content);
      const html = processedContent.toString();

      // 缓存结果
      this.cache.set('default', {
        html,
        processedAt: Date.now(),
        fileHash,
      });

      return html;
    } catch (error) {
      console.error('Markdown processing error:', error);
      throw new Error(`Failed to process markdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 使用Web Worker处理大型文档
   */
  private async processWithWorker(content: string, fileHash: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // 在实际实现中，这里会创建Web Worker
      // 为了简化，我们直接处理
      this.remarkProcessor
        .process(content)
        .then((processedContent: any) => {
          const html = processedContent.toString();
          this.cache.set('default', {
            html,
            processedAt: Date.now(),
            fileHash,
          });
          resolve(html);
        })
        .catch(reject);
    });
  }

  /**
   * 批量处理多个Markdown文件
   */
  async processMultiple(markdowns: Array<{ content: string; path?: string }>): Promise<string[]> {
    const promises = markdowns.map(({ content, path }) =>
      this.processMarkdown(content, path)
    );
    return Promise.all(promises);
  }

  /**
   * 预热常用文档缓存
   */
  async warmCache(markdowns: Array<{ content: string; path?: string }>): Promise<void> {
    await this.processMultiple(markdowns);
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.processingQueue.clear();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      processingQueueSize: this.processingQueue.size,
    };
  }
}

// 创建全局实例
export const markdownOptimizer = new MarkdownOptimizer();

// 便捷函数
export async function optimizeMarkdown(content: string, filePath?: string): Promise<string> {
  return markdownOptimizer.processMarkdown(content, filePath);
}

export async function optimizeMultipleMarkdown(markdowns: Array<{ content: string; path?: string }>): Promise<string[]> {
  return markdownOptimizer.processMultiple(markdowns);
}