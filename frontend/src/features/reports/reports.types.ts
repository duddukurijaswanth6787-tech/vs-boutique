export type ReportType = 'SALES' | 'INVENTORY' | 'CUSTOMER' | 'ORDER' | 'PAYMENT';
export type ExportFormat = 'CSV' | 'EXCEL';

export interface GenerateReportDto {
  type: ReportType;
  startDate?: string;
  endDate?: string;
  format?: ExportFormat;
}

export interface ReportResponse {
  type: string;
  data: Record<string, unknown>;
  generatedAt: string;
}

export interface ExportJob {
  id: string;
  type: string;
  format: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  fileUrl?: string;
  error?: string;
  createdAt: string;
}

export interface ExportJobResponse {
  id: string;
  type: string;
  format: string;
  status: string;
  fileUrl?: string;
  createdAt: string;
}
