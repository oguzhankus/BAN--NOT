'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
}

export default function ScrollReveal({
  children,
  className = '',
  stagger = false,
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (!('IntersectionObserver' in window)) {
      element.dataset.revealReady = 'true';
      element.dataset.visible = 'true';
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        element.dataset.revealReady = 'true';
        if (entry.isIntersecting) {
          element.dataset.visible = 'true';
          observer.unobserve(element);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={elementRef}
      className={`scroll-reveal${stagger ? ' scroll-reveal-stagger' : ''}${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  );
}
