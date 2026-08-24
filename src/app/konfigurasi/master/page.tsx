'use client';

import React, { useState } from 'react';
import PageTemplate from '@/components/layout/PageTemplate';
import Button from '@/components/ui/Button';
import TabTransport from '@/components/master-data/TabTransport';
import TabRincian from '@/components/master-data/TabRincian';
import TabPagu from '@/components/master-data/TabPagu';
import TabRuang from '@/components/master-data/TabRuang';
import { RotateCcw } from 'lucide-react';
import { useAlert } from '@/context/FeedbackContext';

export default function AdminMasterPage() {
  const [activeTab, setActiveTab] = useState<'transport' | 'rincian' | 'pagu' | 'ruang'>('transport');
  const { showAlert } = useAlert();

  const handleRefresh = () => {
    window.location.reload();
  };

  const headerActions = (
    <Button onClick={handleRefresh} variant="secondary" className="px-4 py-2 text-xs font-bold rounded-xl">
      <RotateCcw className="h-4 w-4" />
      <span>Refresh</span>
    </Button>
  );

  return (
    <PageTemplate
      title="Master Data MeeTrip"
      sectionTitle="Admin"
      description="Kelola moda transportasi, rincian komponen biaya, pagu, dan ruang rapat."
      headerActions={headerActions}
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto hide-scrollbar whitespace-nowrap">
          <button
            onClick={() => setActiveTab('transport')}
            className={`pb-3 px-6 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'transport'
                ? 'border-teal-500 text-teal-600 dark:border-teal-400 dark:text-teal-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Moda Transportasi
          </button>
          <button
            onClick={() => setActiveTab('rincian')}
            className={`pb-3 px-6 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'rincian'
                ? 'border-teal-500 text-teal-600 dark:border-teal-400 dark:text-teal-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Rincian Biaya
          </button>
          <button
            onClick={() => setActiveTab('pagu')}
            className={`pb-3 px-6 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'pagu'
                ? 'border-teal-500 text-teal-600 dark:border-teal-400 dark:text-teal-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pagu Limit
          </button>
          <button
            onClick={() => setActiveTab('ruang')}
            className={`pb-3 px-6 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'ruang'
                ? 'border-teal-500 text-teal-600 dark:border-teal-400 dark:text-teal-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Ruang Meeting
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'transport' && <TabTransport showToast={showAlert} />}
        {activeTab === 'rincian' && <TabRincian showToast={showAlert} />}
        {activeTab === 'pagu' && <TabPagu showToast={showAlert} />}
        {activeTab === 'ruang' && <TabRuang showToast={showAlert} />}
      </div>
    </PageTemplate>
  );
}
