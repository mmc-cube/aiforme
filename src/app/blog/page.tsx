'use client';

import { useAuth } from '@/components/AuthProvider';
import LoginForm from '@/components/LoginForm';
import Link from 'next/link';
import { OptimizedPostList } from '@/components/OptimizedPostCard';
import { LazyLoad } from '@/components/LazyLoading';
import { useState, useEffect } from 'react';

function BlogHeader() {
  const { logout } = useAuth();

  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg border-b border-gray-200">
      <div className="max-w-full px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center py-8">
          <div className="flex items-center space-x-6">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-1">知识分享博客</h1>
              <p className="text-blue-100 text-lg">个人知识分享空间</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* 用户头像 */}
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">📚</span>
            </div>
            <button
              onClick={logout}
              className="text-white/80 hover:text-white transition-colors flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>退出登录</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function BlogFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center text-gray-600">
          <p className="text-sm">Built with Next.js & ❤️</p>
        </div>
      </div>
    </footer>
  );
}

export default function BlogPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto pt-16 px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">知识分享博客</h1>
            <p className="text-gray-600">请输入邀请码访问</p>
          </div>
          <LoginForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BlogHeader />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">最新文章</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <Link href="/admin" className="text-indigo-600 hover:text-indigo-800">
              管理后台
            </Link>
            <span>•</span>
            <span>欢迎来到知识分享空间</span>
          </div>
        </div>

        <LazyLoad>
          <OptimizedPostList />
        </LazyLoad>
      </main>

      <BlogFooter />
    </div>
  );
}