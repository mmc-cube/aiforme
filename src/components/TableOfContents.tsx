'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    if (!content) return;

    // 解析Markdown标题
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const matches: TableOfContentsItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      
      // 生成ID（移除特殊字符，转中文为拼音或直接使用）
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      matches.push({
        id,
        text,
        level
      });
    }

    setHeadings(matches);

    // 设置第一个标题为活动状态
    if (matches.length > 0 && !activeHeading) {
      setActiveHeading(matches[0].id);
    }
  }, [content, activeHeading]);

  // 监听滚动事件，更新活动标题
  useEffect(() => {
    const handleScroll = () => {
      const headingElements = headings.map(h => 
        document.getElementById(h.id)
      ).filter(Boolean);

      if (headingElements.length === 0) return;

      const scrollPosition = window.scrollY + 100;
      
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
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 初始检查

    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings, activeHeading]);

  const handleHeadingClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
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