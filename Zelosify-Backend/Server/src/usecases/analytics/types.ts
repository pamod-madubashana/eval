export interface DashboardStats {
  openings: {
    total: number;
    byStatus: Record<string, number>;
  };
  profiles: {
    total: number;
    byStatus: Record<string, number>;
    recent: number;
  };
  recommendations: {
    total: number;
    avgScore: number;
  };
}
