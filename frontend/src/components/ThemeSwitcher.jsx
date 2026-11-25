import React from 'react';
import { Leaf, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const OPTIONS = [
  { id: 'verde', label: 'Verde', icon: Leaf },
  { id: 'blanco', label: 'Blanco', icon: Sun },
  { id: 'oscuro', label: 'Negro', icon: Moon },
];

export default function ThemeSwitcher({ compact = false }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`theme-switcher ${compact ? 'compact' : ''}`} role="group" aria-label="Seleccionar tema de fondo">
      {OPTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={`theme-pill ${theme === id ? 'active' : ''}`}
          onClick={() => setTheme(id)}
          title={`Fondo ${label}`}
        >
          <Icon size={13} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
