import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'LifeMap — 나의 삶의 관계를 정리하는 시각화 도구',
  description: '피그마 스타일 무한 캔버스 위에서 내 삶의 모든 관계를 노드와 연결선으로 시각화하고, 각 노드에 풍부한 메모를 기록하는 개인용 웹 도구',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="antialiased">
        {children}
        <Toaster
          position="bottom-center"
          offset={64}
          gap={8}
          expand={false}
          richColors={false}
          closeButton={false}
        />
      </body>
    </html>
  );
}
