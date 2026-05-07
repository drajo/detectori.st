export interface FindPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  isCover: boolean;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
}

export interface FindAttribute {
  id: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface Find {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  discoveryDate: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  photos: FindPhoto[];
  attributes: FindAttribute[];
}

export interface FindListItem {
  id: string;
  name: string;
  description: string | null;
  discoveryDate: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  coverPhoto: FindPhoto | null;
}

export interface FindMapMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  coverThumbnailUrl: string | null;
}

// DTOs żądań
export interface CreateFindRequest {
  name: string;
  description?: string;
  discoveryDate?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateFindRequest {
  name?: string;
  description?: string;
  discoveryDate?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CreateAttributeRequest {
  key: string;
  value: string;
}

export interface UpdateAttributeRequest {
  value: string;
}

export type FindSortBy = 'createdAt' | 'discoveryDate' | 'name';
export type SortOrder = 'asc' | 'desc';

export interface FindListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: FindSortBy;
  sortOrder?: SortOrder;
}
