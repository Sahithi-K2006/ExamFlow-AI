import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider';
import { IconButton } from './IconButton';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <IconButton
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      variant="secondary"
      onClick={toggleTheme}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </IconButton>
  );
};
