import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { APP_NAME } from '../enums/roles';

export function usePageTitle(title: string, dependencies = []) {
  const location = useLocation();

  useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : `${APP_NAME}`;
     // eslint-disable-next-line
  }, [title, location.pathname, ...dependencies]);
}