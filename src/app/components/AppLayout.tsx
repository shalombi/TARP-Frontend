'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import AIAssistant from './AIAssistant';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't show sidebar on auth pages
  const isAuthPage = pathname?.startsWith('/auth');
  
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main
        style={{
          marginLeft: 280,
          flex: 1,
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: 'linear-gradient(180deg, rgba(102, 126, 234, 0.03) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      </main>
      <AIAssistant />
    </div>
  );
}

