export interface BulkOperationResult {
  success: string[];
  failed: { id: string; error: string }[];
}

export interface BulkOperationDto {
  ids: string[];
  action: string;
}
