/**
 * 生成标题ID的工具函数
 * 保留中文字符，移除特殊字符，替换空格为连字符
 */
export function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff-]/g, '') // 保留中文、字母、数字、空格和连字符
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * 处理HTML内容，为标题添加ID和样式类
 * 返回处理后的HTML和ID映射
 */
export function processHtmlContent(html: string): { processedHtml: string; idMap: Map<string, string> } {
  const existingIds = new Set<string>();
  const idMap = new Map<string, string>(); // 原始文本 -> 最终ID的映射
  
  const processedHtml = html.replace(
    /<h([1-6])[^>]*>([^<]+)<\/h([1-6])>/g,
    (match, level, text) => {
      let id = generateHeadingId(text);
      let counter = 1;
      
      // 确保ID唯一
      while (existingIds.has(id)) {
        id = `${generateHeadingId(text)}-${counter}`;
        counter++;
      }
      
      existingIds.add(id);
      idMap.set(text, id);
      
      return `<h${level} id="${id}" class="scroll-mt-24">${text}</h${level}>`;
    }
  );
  
  return { processedHtml, idMap };
}

/**
 * 从Markdown内容解析标题，使用与HTML相同的ID生成逻辑
 */
export function parseHeadingsFromMarkdown(content: string): Array<{
  id: string;
  text: string;
  level: number;
}> {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const matches: Array<{ id: string; text: string; level: number }> = [];
  const existingIds = new Set<string>();
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    
    // 使用与HTML相同的ID生成逻辑
    let id = generateHeadingId(text);
    let counter = 1;
    
    // 确保ID唯一
    while (existingIds.has(id)) {
      id = `${generateHeadingId(text)}-${counter}`;
      counter++;
    }
    
    existingIds.add(id);

    matches.push({ id, text, level });
  }

  return matches;
}

/**
 * 为了向后兼容，保留旧的函数签名
 */
export function processHtmlContentLegacy(html: string): string {
  const { processedHtml } = processHtmlContent(html);
  return processedHtml;
}