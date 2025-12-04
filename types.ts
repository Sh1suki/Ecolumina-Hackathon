export interface DIYOption {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
}

export interface AnalysisResult {
  itemName: string;
  isRecyclable: boolean;
  disposalInstruction: string;
  confidence: number;
  diyOptions: DIYOption[];
}

export interface WorkshopGuide {
  materials: string[];
  steps: string[];
  warning: string;
  youtubeQuery: string;
}

export interface UserProfile {
  id: string;
  name: string;
  points: number;
  scans: number;
  // Optional location/profile fields
  country?: string;
  province?: string;
  city?: string;
  barangay?: string;
  zip?: string;
}