'use client';

import React, { useState } from 'react';
import PageTemplate from '@/components/layout/PageTemplate';
import Button from '@/components/ui/Button';
import TabPagu from '@/components/master-data/TabPagu';
import { RotateCcw, ShieldCheck } from 'lucide-react';

import { useAlert } from '@/context/FeedbackContext';

export default function MasterPaguPage() {
  const { showAlert } = useAlert();

  const handleRefresh = () => {
    window.location.reload();
  };

  const headerActions = (
    <Button onClick={handleRefresh} variant="secondary" className="px-4 py-2 text-xs font-bold rounded-xl w-1/3 sm:w-auto flex justify-center">
      <RotateCcw className="h-4 w-4" />
      <span>Refresh</span>
    </Button>
  );

  return (
    <PageTemplate
      title="Master Pagu Perjalanan Dinas"
      sectionTitle="Master Data"
      description="Kelola pagu limit pembiayaan dinas berdasarkan tingkat jabatan (job level) dan wilayah tujuan."
      headerActions={headerActions}
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <TabPagu showToast={showAlert} />
      </div>
    </PageTemplate>
  );
}
