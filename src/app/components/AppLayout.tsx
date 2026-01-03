'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import AIAssistant from './AIAssistant';
import OnlineUsers from './OnlineUsers';
import ConnectionStatus from './ConnectionStatus';
import ToastContainer from './Toast';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't show sidebar on auth pages
  const isAuthPage = pathname?.startsWith('/auth');
  
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Determine context type based on current page
  let contextType: 'artifacts' | 'experiments' | null = null;
  if (pathname?.startsWith('/artifacts')) {
    contextType = 'artifacts';
  } else if (pathname?.startsWith('/experiments')) {
    contextType = 'experiments';
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main
        style={{
          marginLeft: 280,
          flex: 1,
          minHeight: '100vh',
          background: '#ffffff',
          position: 'relative',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      </main>
      {contextType && <AIAssistant contextType={contextType} />}
      <OnlineUsers />
      <ConnectionStatus />
      <ToastContainer />
    </div>
  );
}

