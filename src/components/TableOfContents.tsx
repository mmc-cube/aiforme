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

  // 使用requestAnimationFrame优化滚动性能
  const rafId = useRef<number | null>(null);
  const lastScrollPosition = useRef(0);
  
  const handleScroll = useCallback(() => {
    if (rafId.current !== null) return;
    
    rafId.current = requestAnimationFrame(() => {
      const currentScrollPosition = window.scrollY;
      
      // 避免频繁更新
      if (Math.abs(currentScrollPosition - lastScrollPosition.current) < 5) {
        rafId.current = null;
        return;
      }
      
      lastScrollPosition.current = currentScrollPosition;
      
      const headingElements = headings.map(h => 
        document.getElementById(h.id)
      ).filter(Boolean);

      if (headingElements.length === 0) {
        rafId.current = null;
        return;
      }

      const scrollPosition = currentScrollPosition + 100;
      
      // 找到当前视窗内的标题
      let currentHeading = '';
      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i];
        if (element && element.offsetTop <= scrollPosition) {
          currentHeading = element.id || '';
          break;
        }
      }

      if (currentHeading && currentHeading !== activeHeading) {
        setActiveHeading(currentHeading);
      }
      
      rafId.current = null;
    });
  }, [headings, activeHeading]);

  // 监听滚动事件，使用passive: true提升性能
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // 初始检查

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [handleScroll]);

  // 移除跳转功能，仅保留视觉反馈
  const handleHeadingHover = (id: string) => {
    // 可以在这里添加悬停效果或预览功能
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="w-80 bg-white border-r border-gray-200 p-6 sticky top-4 h-fit">
      <h3 className="text-lg font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
        📋 文章目录
      </h3>
      <ul className="space-y-2">
        {headings.map((heading) => (
          <li key={heading.id}>
            <div
              className={`w-full text-left px-4 py-3 text-base rounded-lg transition-all duration-200 ${
                activeHeading === heading.id
                  ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-500 shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
              style={{ paddingLeft: `${(heading.level - 1) * 16 + 16}px` }}
              onMouseEnter={() => handleHeadingHover(heading.id)}
            >
              {heading.text}
            </div>
          </li>
        ))}
      </ul>
    </nav>
  );
}