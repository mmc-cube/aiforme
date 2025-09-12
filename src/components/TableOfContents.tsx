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
  onNavigate?: (id: string) => void;
}

export default function TableOfContents({ content, onNavigate }: TableOfContentsProps) {
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

  // 处理标题点击
  const handleHeadingClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // 更新URL hash但不触发滚动
      const hash = `#${id}`;
      history.pushState(null, '', hash);
      
      // 使用CSS scroll-behavior进行平滑滚动
      element.scrollIntoView({ 
        block: 'start'
      });
      
      setActiveHeading(id);
      if (onNavigate) {
        onNavigate(id);
      }
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="w-64 bg-white border-l border-gray-200 p-4 sticky top-4 h-fit">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">文章目录</h3>
      <ul className="space-y-1">
        {headings.map((heading) => (
          <li key={heading.id}>
            <button
              onClick={() => handleHeadingClick(heading.id)}
              className={`w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                activeHeading === heading.id
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}