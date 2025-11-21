export interface ModelFile {
  name: string;
  url: string;
  size_mb: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  files: ModelFile[];
  is_default: boolean;
}

export interface ModelStatus {
  model: ModelInfo;
  downloaded: boolean;
  file_paths: string[];
}

export interface ProcessImageResult {
  input_path: string;
  output_path: string;
  success: boolean;
  error?: string;
}

export interface DownloadProgress {
  model_id: string;
  file_name: string;
  downloaded: number;
  total: number;
  percentage: number;
}

export interface ProcessingProgress {
  current: number;
  total: number;
  file_name: string;
}
