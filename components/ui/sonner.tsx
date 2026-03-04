'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-gray-100 group-[.toaster]:shadow-[0_4px_24px_rgba(0,0,0,0.08)] group-[.toaster]:rounded-2xl group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:font-[var(--font-pretendard)]',
          description: 'group-[.toast]:text-gray-500 group-[.toast]:text-[13px]',
          actionButton:
            'group-[.toast]:bg-[#3182F6] group-[.toast]:text-white group-[.toast]:rounded-lg group-[.toast]:text-[13px] group-[.toast]:font-semibold',
          cancelButton:
            'group-[.toast]:bg-gray-100 group-[.toast]:text-gray-500 group-[.toast]:rounded-lg',
          success:
            'group-[.toaster]:!bg-[#F8FFF8] group-[.toaster]:!border-[#E8F5E9]',
          error:
            'group-[.toaster]:!bg-[#FFF8F8] group-[.toaster]:!border-[#FFEBEE]',
        },
      }}
      style={
        {
          '--normal-bg': '#ffffff',
          '--normal-text': '#191F28',
          '--normal-border': 'hsl(220, 13%, 91%)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
