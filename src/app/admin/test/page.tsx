export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">测试页面</h1>
        <p className="text-gray-600">如果你能看到这个页面，说明基本路由正常工作</p>
        <div className="mt-4">
          <a href="/admin/login" className="text-blue-600 hover:text-blue-800">
            前往登录页面
          </a>
        </div>
      </div>
    </div>
  );
}