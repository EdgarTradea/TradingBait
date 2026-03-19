import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

interface Props {
  variant?: 'icon' | 'text';
  className?: string;
}

export const LanguageToggle = ({ variant = 'icon', className = '' }: Props) => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language;
  const languageNames = {
    en: 'English',
    es: 'Español'
  };

  if (variant === 'text') {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Button
          variant={currentLanguage === 'en' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => changeLanguage('en')}
          className="text-xs"
        >
          EN
        </Button>
        <Button
          variant={currentLanguage === 'es' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => changeLanguage('es')}
          className="text-xs"
        >
          ES
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-9 w-9 p-0 ${className}`}
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => changeLanguage('en')}
          className={currentLanguage === 'en' ? 'bg-accent' : ''}
        >
          🇺🇸 English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('es')}
          className={currentLanguage === 'es' ? 'bg-accent' : ''}
        >
          🇪🇸 Español
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};