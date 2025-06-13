import { trpc } from '@/core/trpc';
import type { TradingPair } from '@baron/common';
import type { PredefinedFrvpProfile } from '@baron/schema';
import { SelectWithSearch } from '@baron/ui-spa/select-with-search';
import { Button } from '@baron/ui/components/button';
import { Skeleton } from '@baron/ui/components/skeleton';
import { Suspense, useCallback, useState } from 'react';

interface FrvpSelectProps {
  value: string;
  onChange: (value: string) => void;
}

interface FrvpItem {
  id: string;
  name: string;
  pair: TradingPair;
  lastDate: Date;
  profiles: PredefinedFrvpProfile[];
}

function FrvpSelectContent({ value, onChange }: FrvpSelectProps) {
  const [search, setSearch] = useState('');

  const [result] = trpc.frvp.list.useSuspenseQuery({
    search,
    skip: 0,
    take: 20,
  });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  return (
    <SelectWithSearch<FrvpItem>
      value={value}
      search={search}
      data={result.data}
      searchableKeys={['name']}
      onChange={onChange}
      onSearch={handleSearch}
      placeholder="Search FRVP..."
      renderItem={({
        item,
        selected,
      }: {
        item: FrvpItem;
        selected: boolean;
      }) => (
        <div className="flex items-center gap-2">
          <span>{item.name}</span>
          {selected && (
            <span className="text-xs text-muted-foreground">(selected)</span>
          )}
        </div>
      )}
    >
      <Button variant="outline" className="w-full justify-between">
        {result.data.find((frvp: FrvpItem) => frvp.id === value)?.name ??
          'Select FRVP'}
      </Button>
    </SelectWithSearch>
  );
}

export function FrvpSelect(props: FrvpSelectProps) {
  return (
    <Suspense fallback={<Skeleton className="w-full h-10" />}>
      <FrvpSelectContent {...props} />
    </Suspense>
  );
}
