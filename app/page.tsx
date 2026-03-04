'use client';

import dynamic from 'next/dynamic';

// React Flow는 SSR 호환이 안 되므로 dynamic import
const LifeMapCanvas = dynamic(
  () => import('@/components/canvas/LifeMapCanvas'),
  { ssr: false }
);

export default function Home() {
  return <LifeMapCanvas />;
}
