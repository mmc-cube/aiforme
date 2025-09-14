'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onUploadSuccess?: (data: any) => void;
  onUploadError?: (error: string) => void;
}

export default function FileUpload({ onUploadSuccess, onUploadError }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const response = await fetch('/api/admin/posts/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (data.success) {
        onUploadSuccess?.(data.data);
        // 重置状态
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 1000);
      } else {
        throw new Error(data.error || '上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : '上传失败';
      onUploadError?.(errorMessage);
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onUploadSuccess, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/markdown': ['.md', '.markdown'],
      'text/plain': ['.md', '.markdown']
    },
    multiple: false,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive || dragActive
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="text-4xl">📄</div>
          
          {uploading ? (
            <div className="space-y-3">
              <div className="text-lg font-medium text-gray-900">上传中...</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="text-sm text-gray-500">{uploadProgress}%</div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-lg font-medium text-gray-900">
                {isDragActive ? '释放文件到这里' : '拖拽Markdown文件到这里'}
              </div>
              <div className="text-sm text-gray-500">
                或者点击选择文件
              </div>
              <div className="text-xs text-gray-400">
                支持 .md, .markdown 格式，最大 10MB
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 上传说明 */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">文件格式要求：</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• 文件必须是 Markdown 格式（.md 或 .markdown）</li>
          <li>• 支持标准 Markdown 语法</li>
          <li>• 可以在文件开头添加 YAML front matter：</li>
        </ul>
        <div className="mt-2 p-2 bg-blue-100 rounded text-xs font-mono">
          <div>---<br/>title: 文章标题<br/>slug: article-url<br/>excerpt: 文章摘要<br/>author: 作者名<br/>tags: [标签1, 标签2]<br/>published: true<br/>---<br/><br/>文章内容...
          </div>
        </div>
      </div>
    </div>
  );
}