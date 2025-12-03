import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageTitle(title: string, dependencies = []) {
  const location = useLocation();

  useEffect(() => {
    document.title = title ? `${title} | GOD-DID MART` : 'GOD-DID MART';
     // eslint-disable-next-line
  }, [title, location.pathname, ...dependencies]);
}