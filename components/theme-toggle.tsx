'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // マウント後にコンポーネントが使用可能になったことを示す
  useEffect(() => {
    setMounted(true);
  }, []);

  // ハイドレーション問題を回避するため、マウント前は何も表示しない
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <div className="h-4 w-4" />
        <span className="sr-only">テーマを読み込み中...</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 transition-all" />
      ) : (
        <Moon className="h-4 w-4 transition-all" />
      )}
      <span className="sr-only">
        {theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      </span>
    </Button>
  );
} 