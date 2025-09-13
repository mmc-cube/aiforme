import { redirect } from 'next/navigation'

// 根路径重定向到博客页面
export default function HomePage() {
  redirect('/blog')
}