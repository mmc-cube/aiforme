import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '知识分享博客 - 个人知识分享平台',
  description: '一个基于邀请码访问的个人知识分享网站',
  keywords: ['博客', '知识', '分享', '个人'],
  authors: [{ name: '博主' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}