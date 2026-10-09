'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
  variant?: 'fadeUp' | 'fadeIn' | 'scaleIn' | 'slideLeft' | 'slideRight';
  delay?: number;
  duration?: number;
  once?: boolean;
  amount?: number;
}

export default function ScrollReveal({
  children,
  className = '',
  stagger = false,
  variant = 'fadeUp',
  delay = 0,
  duration = 220,
  once = true,
  amount = 0.15,
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (!('IntersectionObserver' in window)) {
      element.dataset.visible = 'true';
      return;
    }

    let revealFrame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        element.dataset.revealReady = 'true';
        if (entry.isIntersecting) {
          revealFrame = window.requestAnimationFrame(() => {
            element.dataset.visible = 'true';
          });
          if (once) observer.unobserve(element);
        } else if (!once) {
          element.dataset.visible = 'false';
        }
      },
      { threshold: amount, rootMargin: '0px 0px 10% 0px' },
    );

    observer.observe(element);
    return () => {
      window.cancelAnimationFrame(revealFrame);
      observer.disconnect();
    };
  }, [amount, once]);

  return (
    <div
      ref={elementRef}
      className={`scroll-reveal${stagger ? ' scroll-reveal-stagger' : ''}${className ? ` ${className}` : ''}`}
      data-reveal-variant={variant}
      style={{ transitionDelay: `${delay}ms`, transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}
