'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { generateHeadingId, parseHeadingsFromMarkdown } from '@/lib/heading-utils';

interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TableOfContentsItem[]>([]);
  const [activeHeading, setActiveHeading] = useState<string>('');

  // 解析标题并确保ID唯一性
  useEffect(() => {
    if (!content) return;

    // 使用统一的函数解析标题
    const parsedHeadings = parseHeadingsFromMarkdown(content);
    const existingIds = new Set<string>();
    const uniqueHeadings: TableOfContentsItem[] = [];

    // 确保ID唯一
    parsedHeadings.forEach((heading) => {
      let finalId = heading.id;
      let counter = 1;
      
      while (existingIds.has(finalId)) {
        finalId = `${heading.id}-${counter}`;
        counter++;
      }
      
      existingIds.add(finalId);
      uniqueHeadings.push({
        ...heading,
        id: finalId
      });
    });

    setHeadings(uniqueHeadings);

    // 设置第一个标题为活动状态
    if (uniqueHeadings.length > 0 && !activeHeading) {
      setActiveHeading(uniqueHeadings[0].id);
    }
  }, [content, activeHeading]);

  // 使用Intersection Observer实现精确的滚动高亮
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  useEffect(() => {
    if (headings.length === 0) return;

    // 清理之前的observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // 创建Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // 找到所有正在相交的标题
        const intersectingEntries = entries.filter(entry => entry.isIntersecting);
        
        if (intersectingEntries.length > 0) {
          // 找到最顶部的相交标题
          const topEntry = intersectingEntries.reduce((prev, current) => {
            return prev.boundingClientRect.top < current.boundingClientRect.top ? prev : current;
          });
          
          const headingId = topEntry.target.id;
          if (headingId && headingId !== activeHeading) {
            setActiveHeading(headingId);
          }
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px', // 顶部偏移80px，底部偏移70%
        threshold: 0.1 // 10%的标题可见就触发
      }
    );

    // 观察所有标题元素
    headings.forEach(heading => {
      const element = document.getElementById(heading.id);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings, activeHeading]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="w-96 bg-white border-r border-gray-200 p-8 sticky top-4 h-fit">
      <h3 className="text-lg font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
        📋 文章目录
      </h3>
      <ul className="space-y-3">
        {headings.map((heading) => (
          <li key={heading.id}>
            <div
              className={`w-full text-left px-5 py-4 text-base rounded-lg transition-all duration-200 ${
                activeHeading === heading.id
                  ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-500 shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
              style={{ paddingLeft: `${(heading.level - 1) * 20 + 20}px` }}
            >
              {heading.text}
            </div>
          </li>
        ))}
      </ul>
    </nav>
  );
}