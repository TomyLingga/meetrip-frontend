'use client';

import React, { useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { openDocument } from '@/utils/api';

type Props = {
  path: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'indigo' | 'amber';
  icon?: React.ReactNode;
};

export default function DocumentDownloadButton({
  path,
  children,
  className = '',
  variant = 'secondary',
  icon = <Printer className="h-3.5 w-3.5" />,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await openDocument(path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleClick}
      className={className}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {children}
    </Button>
  );
}
