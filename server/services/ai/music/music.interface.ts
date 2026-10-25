export interface GenerateMusicOptions {
  prompt: string;
  title?: string;
  instrumental?: boolean;
  durationSeconds?: number;
  tags?: string;
}

export interface GenerateMusicResult {
  title: string;
  fileName: string;
  filePath: string;
  audioUrl?: string;
  duration?: number;
  provider: 'suno' | 'musicgen' | 'mock';
  metadata?: Record<string, any>;
}

export interface IMusicProvider {
  id: 'suno' | 'musicgen';
  name: string;
  isConfigured(): boolean;
  generate(options: GenerateMusicOptions): Promise<GenerateMusicResult>;
}
