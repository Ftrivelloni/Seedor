'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

NProgress.configure({ showSpinner: false });

export function NProgressHandler() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.currentTarget as HTMLAnchorElement;
      const targetUrl = new URL(target.href);
      const currentUrl = new URL(window.location.href);

      if (targetUrl?.href !== currentUrl?.href) {
        NProgress.start();
      }
    };

    const handleMutation = () => {
      const anchorElements = document.querySelectorAll('a[href]');
      anchorElements.forEach((anchor) => {
        anchor.addEventListener('click', handleAnchorClick as EventListener);
      });
    };

    const mutationObserver = new MutationObserver(handleMutation);
    mutationObserver.observe(document, { childList: true, subtree: true });

    handleMutation();

    return () => {
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}
