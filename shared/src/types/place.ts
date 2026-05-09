export interface PlacePhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  isCover: boolean;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
}

export interface Place {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  tags: string[];
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  photos: PlacePhoto[];
}

export interface PlaceListItem {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  coverPhoto: PlacePhoto | null;
}

export interface PlaceMapMarker {
  id: string;
  name: string;
  tags: string[];
  latitude: number;
  longitude: number;
  coverThumbnailUrl: string | null;
}

export interface CreatePlaceRequest {
  name: string;
  description?: string;
  tags?: string[];
  latitude?: number;
  longitude?: number;
}

export interface UpdatePlaceRequest {
  name?: string;
  description?: string | null;
  tags?: string[];
  latitude?: number | null;
  longitude?: number | null;
}

export type PlaceSortBy = 'createdAt' | 'name';

export interface PlaceListQuery {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
  sortBy?: PlaceSortBy;
  sortOrder?: 'asc' | 'desc';
}
