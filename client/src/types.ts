export interface App {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  status: 'running' | 'suspended' | 'paused';
  createdAt: string;
  updatedAt?: string;
  mongoUser?: string;
  mongoPassword?: string;
  owner?: string;
  stats?: AppStats;
}

export interface ServerConfig {
  mongoHost: string;
  mongoPort: number;
}

export interface AppStats {
  dataSize: number;
  storageSize: number;
  collections: number;
  objects: number;
  collectionNames: string[];
}

export interface DashboardStats {
  apps: {
    total: number;
    running: number;
    suspended: number;
    paused: number;
  };
  storage: {
    dataSize: number;
    disk: {
      total: number;
      used: number;
      available: number;
    };
  };
  mongodb: {
    version: string;
    uptime: number;
    connections: {
      current: number;
      available: number;
    };
  };
}

export interface Database {
  name: string;
  sizeOnDisk: number;
  empty: boolean;
}

export interface Collection {
  name: string;
  count: number;
  size: number;
}

export interface DocumentPage {
  total: number;
  page: number;
  limit: number;
  pages: number;
  documents: Record<string, unknown>[];
}
