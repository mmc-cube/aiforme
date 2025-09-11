import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const postsDirectory = path.join(process.cwd(), 'posts');

export interface PostData {
  id: string;
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  author?: string;
  contentHtml?: string;
}

export interface PostMeta {
  id: string;
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  author?: string;
}

/**
 * 获取所有文章的元数据（用于首页列表）
 */
export function getAllPostsMetadata(): PostMeta[] {
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map((fileName) => {
      const id = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const matterResult = matter(fileContents);

      return {
        id,
        title: matterResult.data.title || id,
        date: matterResult.data.date || '1970-01-01',
        excerpt: matterResult.data.excerpt || '',
        tags: matterResult.data.tags || [],
        author: matterResult.data.author || '作者',
      };
    });

  // 按日期排序（最新的在前）
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

/**
 * 获取所有文章ID（用于静态生成路径）
 */
export function getAllPostIds() {
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map((fileName) => {
      return {
        params: {
          id: fileName.replace(/\.md$/, ''),
        },
      };
    });
}

/**
 * 获取指定文章的完整数据（包含HTML内容）
 */
export async function getPostData(id: string): Promise<PostData | null> {
  try {
    const fullPath = path.join(postsDirectory, `${id}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);

    // 将Markdown转换为HTML
    const processedContent = await remark()
      .use(html)
      .process(matterResult.content);
    const contentHtml = processedContent.toString();

    return {
      id,
      contentHtml,
      title: matterResult.data.title || id,
      date: matterResult.data.date || '1970-01-01',
      excerpt: matterResult.data.excerpt || '',
      tags: matterResult.data.tags || [],
      author: matterResult.data.author || '作者',
    };
  } catch (error) {
    console.error(`Error reading post ${id}:`, error);
    return null;
  }
}

/**
 * 根据标签筛选文章
 */
export function getPostsByTag(tag: string): PostMeta[] {
  const allPosts = getAllPostsMetadata();
  return allPosts.filter(post => 
    post.tags && post.tags.includes(tag)
  );
}

/**
 * 获取所有使用过的标签
 */
export function getAllTags(): string[] {
  const allPosts = getAllPostsMetadata();
  const tags = new Set<string>();
  
  allPosts.forEach(post => {
    if (post.tags) {
      post.tags.forEach(tag => tags.add(tag));
    }
  });
  
  return Array.from(tags).sort();
}

/**
 * 搜索文章（标题和摘要）
 */
export function searchPosts(query: string): PostMeta[] {
  const allPosts = getAllPostsMetadata();
  const lowercaseQuery = query.toLowerCase();
  
  return allPosts.filter(post => 
    post.title.toLowerCase().includes(lowercaseQuery) ||
    (post.excerpt && post.excerpt.toLowerCase().includes(lowercaseQuery))
  );
}