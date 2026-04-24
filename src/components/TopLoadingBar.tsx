import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import NProgress from "nprogress";

// Configure NProgress: no spinner, custom speed, minimum display time
NProgress.configure({
  showSpinner: false,
  speed: 300,
  minimum: 0.15,
  trickleSpeed: 120,
});

/**
 * Hook-based component: starts NProgress on route change,
 * finishes after a short delay to simulate loading.
 * Place once inside <BrowserRouter>.
 */
export function TopLoadingBar() {
  const location = useLocation();

  useEffect(() => {
    NProgress.start();
    const timer = setTimeout(() => NProgress.done(), 250);
    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [location.pathname]);

  return null;
}
