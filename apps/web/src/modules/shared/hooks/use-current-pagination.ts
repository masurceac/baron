import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

const pageSchema = z.preprocess(
  (val) => Number(val),
  z.number().int().min(1).default(1),
);

function getPageFromSearch(search: string) {
  const params = new URLSearchParams(search);
  const pageParam = params.get('page');

  const parsedPage = pageSchema.safeParse(pageParam);
  return parsedPage.success ? parsedPage.data : 1;
}

export function useCurrentPagination(options?: { take: number }) {
  const take = options?.take ?? 10;
  const previousSearchRef = useRef<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    const currentSearch = searchParams.get('search');
    const previousSearch = previousSearchRef.current;

    if (previousSearch === null) {
      previousSearchRef.current = currentSearch;
      return;
    }

    if (currentSearch !== previousSearch) {
      previousSearchRef.current = currentSearch;

      if (searchParams.get('page') !== '1') {
        searchParams.set('page', '1');
        setSearchParams(searchParams);
      }
    }
  }, [searchParams, setSearchParams]);

  const skip = useMemo(() => {
    const page = getPageFromSearch(location.search) - 1;

    return page * take;
  }, [location.search]);

  return {
    skip,
    take,
  };
}
