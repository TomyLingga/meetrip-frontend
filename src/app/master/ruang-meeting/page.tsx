'use client';

import React, { useState } from 'react';
import PageTemplate from '@/components/layout/PageTemplate';
import Button from '@/components/ui/Button';
import TabRuang from '@/components/master-data/TabRuang';
import { RotateCcw, ShieldCheck } from 'lucide-react';

import { useAlert } from '@/context/FeedbackContext';

export default function MasterRuangMeetingPage() {
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
      title="Master Ruang Rapat"
      sectionTitle="Master Data"
      description="Kelola daftar ruang rapat dan jadwal booking rapat PT. Industri Nabati Lestari."
      headerActions={headerActions}
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <TabRuang showToast={showAlert} />
      </div>
    </PageTemplate>
  );
}
