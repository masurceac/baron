import { Button } from '@baron/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@baron/ui/components/dropdown-menu';
import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import { MouseEvent } from 'react';
import { useTheme } from './theme-provider';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (
    e: MouseEvent,
    value: 'light' | 'dark' | 'system',
  ) => {
    setTheme(value);
    e.stopPropagation();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="min-w-[100px]">
          <div role="icon" className="relative">
            {theme === 'system' ? (
              <MonitorIcon className="size-4" />
            ) : (
              <>
                <SunIcon className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <MoonIcon className="absolute top-0 left-0 size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </>
            )}
          </div>
          <div className="relative ml-2">
            {theme === 'system'
              ? 'System'
              : theme === 'light'
                ? 'Light'
                : 'Dark'}
          </div>
          <span className="sr-only">{'Toggle theme'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={(e) => handleThemeChange(e, 'light')}>
          {'Light'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleThemeChange(e, 'dark')}>
          {'Dark'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleThemeChange(e, 'system')}>
          {'System'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
