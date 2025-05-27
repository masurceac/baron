import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function RedirectTo(props: { path: string }) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(props.path, { replace: true });
  }, [navigate, props.path]);

  return null;
}
