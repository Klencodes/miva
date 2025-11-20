import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageTitle(title: string, dependencies = []) {
  const location = useLocation();

  useEffect(() => {
    document.title = title ? `${title} | EV Admin` : 'EV Admin';
     // eslint-disable-next-line
  }, [title, location.pathname, ...dependencies]);
}