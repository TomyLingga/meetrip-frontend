export type DashboardContext = 'company' | 'employee' | 'assigner' | 'kabag';

export type DashboardTrip = {
  id: string;
  nomorBto: string | null;
  employeeNama: string | null;
  tujuanNama: string;
  status: string;
  estBerangkat: string;
  estKembali?: string;
  unitNama?: string | null;
  waitingHours?: number;
};

export type DashboardMeeting = {
  id: string;
  topik: string;
  mulai: string;
  selesai: string;
  ruangNama: string | null;
  createdByNama: string | null;
  needZoom: boolean;
  needSoundSystem: boolean;
  status: string;
  isMine: boolean;
};

export type DashboardOverview = {
  context: DashboardContext;
  contextLabel: string;
  availableContexts: DashboardContext[];
  roleContext: {
    isAdmin: boolean;
    isSdm: boolean;
    isKabag: boolean;
    isPemberiTugas: boolean;
    unitNama: string | null;
  };
  metrics: {
    pendingAction: number;
    pendingDpReview: number;
    pendingSdmReview: number;
    pendingSpdkIssue: number;
    pendingKabagReview: number;
    pendingBteReview: number;
    pendingPayment: number;
    activeTrips: number;
    upcomingSevenDays: number;
    needsRevision: number;
    overdueActions: number;
    completedThisMonth: number;
    oldestPendingHours: number;
    meetingsToday: number;
  };
  /** Ringkasan agenda ruang rapat — real-time, tidak mengikuti filter bulan. */
  meetings: {
    today: number;
    ongoing: number;
    upcomingSevenDays: number;
    thisMonth: number;
    cancelledThisMonth: number;
    mineUpcoming: number;
    next: DashboardMeeting | null;
    agenda: DashboardMeeting[];
  };
  actionQueue: DashboardTrip[];
  upcomingTrips: DashboardTrip[];
  actionStages: Array<{ status: string; total: number }>;
};

export type DashboardAnalytics = {
  year: number;
  month: number;
  context: DashboardContext;
  contextLabel: string;
  totalTrips: number;
  dailyVolume: Array<{ day: number; total: number }>;
  statusDistribution: Array<{ status: string; total: number }>;
  weeklyFinance: Array<{ week: number; trips: number; dp: number; bte: number }>;
  finance: {
    allocation: number | null;
    approvedDp: number;
    actualBte: number;
    exposure: number;
    pendingPayment: number;
    paidCash: number;
    settlementDelta: number;
    remaining: number | null;
    utilizationPercent: number | null;
    budgetNotes: string | null;
    budgetUpdatedAt: string | null;
    budgetUpdatedByNama: string | null;
  };
  categoryBreakdown: Array<{ category: string; total: number }>;
  unitBreakdown: Array<{ unit: string; trips: number; total: number }>;
  decisionOutcomes: Array<{ action: string; total: number }>;
  /** Statistik meeting pada bulan yang sama dengan statistik dinas. */
  meetings: {
    total: number;
    cancelled: number;
    withZoom: number;
    withRoom: number;
    withSoundSystem: number;
    totalMinutes: number;
    avgMinutes: number;
    hostCount: number;
    mine: number;
    participants: number;
    externalParticipants: number;
    dailyVolume: Array<{ day: number; total: number }>;
    roomBreakdown: Array<{ room: string; total: number; hours: number }>;
    statusDistribution: Array<{ status: string; total: number }>;
    topHosts: Array<{ nama: string; total: number }>;
  };
};
