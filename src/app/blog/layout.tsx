import { AuthProvider } from '@/components/AuthProvider';

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}