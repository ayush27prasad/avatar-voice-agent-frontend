'use client';

import { type RefObject, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export function useAutoScroll(scrollContentContainerRef: RefObject<Element | null>) {
  useEffect(() => {
    function scrollToBottom() {
      const container = scrollContentContainerRef.current;
      const scrollParent = container?.parentElement;
      
      if (scrollParent) {
        scrollParent.scrollTop = scrollParent.scrollHeight;
      } else {
        // Fallback to document scrolling
        const { scrollingElement } = document;
        if (scrollingElement) {
          scrollingElement.scrollTop = scrollingElement.scrollHeight;
        }
      }
    }

    if (scrollContentContainerRef.current) {
      const resizeObserver = new ResizeObserver(scrollToBottom);

      resizeObserver.observe(scrollContentContainerRef.current);
      scrollToBottom();

      return () => resizeObserver.disconnect();
    }
  }, [scrollContentContainerRef]);
}
interface ChatProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export const ChatMessageView = ({ className, children, ...props }: ChatProps) => {
  const scrollContentRef = useRef<HTMLDivElement>(null);

  useAutoScroll(scrollContentRef);

  return (
    <div ref={scrollContentRef} className={cn('flex flex-col justify-end', className)} {...props}>
      {children}
    </div>
  );
};
