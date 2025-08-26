import { supabaseAdmin } from "../config/supabase";
import { v4 as uuidv4 } from "uuid";
import { ApiResponse } from "../types/database";

export interface AssetFolder {
  id: string;
  user_id: string;
  business_id?: string;
  name: string;
  description?: string;
  color: string;
  parent_folder_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AssetFile {
  id: string;
  user_id: string;
  business_id?: string;
  folder_id?: string;
  name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  width?: number;
  height?: number;
  storage_url: string;
  storage_path: string;
  thumbnail_url?: string;
  is_generated: boolean;
  generation_prompt?: string;
  generation_model?: string;
  generation_settings?: Record<string, any>;
  alt_text?: string;
  tags: string[];
  metadata: Record<string, any>;
  download_count: number;
  last_accessed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AssetFileShare {
  id: string;
  file_id: string;
  shared_by_user_id: string;
  shared_with_user_id?: string;
  shared_with_business_id?: string;
  permission: 'view' | 'download' | 'edit';
  expires_at?: string;
  created_at: string;
}

export interface CreateFolderRequest {
  name: string;
  description?: string;
  color?: string;
  parent_folder_id?: string;
  business_id?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  description?: string;
  color?: string;
  parent_folder_id?: string;
}

export interface CreateFileRequest {
  folder_id?: string;
  business_id?: string;
  name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  width?: number;
  height?: number;
  storage_url: string;
  storage_path: string;
  thumbnail_url?: string;
  is_generated?: boolean;
  generation_prompt?: string;
  generation_model?: string;
  generation_settings?: Record<string, any>;
  alt_text?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateFileRequest {
  folder_id?: string;
  name?: string;
  alt_text?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface GetFilesOptions {
  folder_id?: string;
  business_id?: string;
  file_type?: string;
  is_generated?: boolean;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'name' | 'file_size' | 'download_count';
  sort_order?: 'asc' | 'desc';
}

export class AssetLibraryService {
  // Folder Methods
  static async createFolder(
    userId: string,
    folderData: CreateFolderRequest
  ): Promise<ApiResponse<AssetFolder>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('asset_folders')
        .insert({
          id: uuidv4(),
          user_id: userId,
          business_id: folderData.business_id || null,
          name: folderData.name,
          description: folderData.description || null,
          color: folderData.color || '#3B82F6',
          parent_folder_id: folderData.parent_folder_id || null,
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
        data,
        message: 'Folder created successfully',
      };
    } catch (error) {
      console.error('Error creating folder:', error);
      return {
        success: false,
        message: 'Failed to create folder',
      };
    }
  }

  static async getFolders(
    userId: string,
    businessId?: string,
    parentFolderId?: string | null
  ): Promise<ApiResponse<AssetFolder[]>> {
    try {
      let query = supabaseAdmin
        .from('asset_folders')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      if (parentFolderId === null) {
        query = query.is('parent_folder_id', null);
      } else if (parentFolderId) {
        query = query.eq('parent_folder_id', parentFolderId);
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
        message: 'Folders retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting folders:', error);
      return {
        success: false,
        message: 'Failed to get folders',
      };
    }
  }

  static async updateFolder(
    userId: string,
    folderId: string,
    updates: UpdateFolderRequest
  ): Promise<ApiResponse<AssetFolder>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('asset_folders')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', folderId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      if (!data) {
        return {
          success: false,
          message: 'Folder not found',
        };
      }

      return {
        success: true,
        data,
        message: 'Folder updated successfully',
      };
    } catch (error) {
      console.error('Error updating folder:', error);
      return {
        success: false,
        message: 'Failed to update folder',
      };
    }
  }

  static async deleteFolder(
    userId: string,
    folderId: string
  ): Promise<ApiResponse<void>> {
    try {
      // First check if folder has any files
      const { count: fileCount } = await supabaseAdmin
        .from('asset_files')
        .select('id', { count: 'exact' })
        .eq('folder_id', folderId)
        .eq('user_id', userId);

      if (fileCount && fileCount > 0) {
        return {
          success: false,
          message: 'Cannot delete folder that contains files. Please move or delete files first.',
        };
      }

      // Check if folder has subfolders
      const { count: subfolderCount } = await supabaseAdmin
        .from('asset_folders')
        .select('id', { count: 'exact' })
        .eq('parent_folder_id', folderId)
        .eq('user_id', userId);

      if (subfolderCount && subfolderCount > 0) {
        return {
          success: false,
          message: 'Cannot delete folder that contains subfolders. Please move or delete subfolders first.',
        };
      }

      const { error } = await supabaseAdmin
        .from('asset_folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', userId);

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
        message: 'Folder deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting folder:', error);
      return {
        success: false,
        message: 'Failed to delete folder',
      };
    }
  }

  // File Methods
  static async createFile(
    userId: string,
    fileData: CreateFileRequest
  ): Promise<ApiResponse<AssetFile>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('asset_files')
        .insert({
          id: uuidv4(),
          user_id: userId,
          business_id: fileData.business_id || null,
          folder_id: fileData.folder_id || null,
          name: fileData.name,
          original_name: fileData.original_name,
          file_type: fileData.file_type,
          file_size: fileData.file_size,
          width: fileData.width || null,
          height: fileData.height || null,
          storage_url: fileData.storage_url,
          storage_path: fileData.storage_path,
          thumbnail_url: fileData.thumbnail_url || null,
          is_generated: fileData.is_generated || false,
          generation_prompt: fileData.generation_prompt || null,
          generation_model: fileData.generation_model || null,
          generation_settings: fileData.generation_settings || {},
          alt_text: fileData.alt_text || null,
          tags: fileData.tags || [],
          metadata: fileData.metadata || {},
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
        data,
        message: 'File created successfully',
      };
    } catch (error) {
      console.error('Error creating file:', error);
      return {
        success: false,
        message: 'Failed to create file',
      };
    }
  }

  static async getFiles(
    userId: string,
    options: GetFilesOptions = {}
  ): Promise<ApiResponse<{ files: AssetFile[]; total: number; page: number; limit: number; totalPages: number }>> {
    try {
      const {
        folder_id,
        business_id,
        file_type,
        is_generated,
        tags,
        search,
        page = 1,
        limit = 20,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = options;

      let query = supabaseAdmin
        .from('asset_files')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      if (folder_id !== undefined) {
        if (folder_id === null) {
          query = query.is('folder_id', null);
        } else {
          query = query.eq('folder_id', folder_id);
        }
      }

      if (business_id) {
        query = query.eq('business_id', business_id);
      }

      if (file_type) {
        query = query.eq('file_type', file_type);
      }

      if (is_generated !== undefined) {
        query = query.eq('is_generated', is_generated);
      }

      if (tags && tags.length > 0) {
        query = query.overlaps('tags', tags);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,alt_text.ilike.%${search}%,generation_prompt.ilike.%${search}%`);
      }

      // Apply sorting
      const ascending = sort_order === 'asc';
      query = query.order(sort_by, { ascending });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          files: data || [],
          total,
          page,
          limit,
          totalPages,
        },
        message: 'Files retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting files:', error);
      return {
        success: false,
        message: 'Failed to get files',
      };
    }
  }

  static async getFile(
    userId: string,
    fileId: string
  ): Promise<ApiResponse<AssetFile>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('asset_files')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', userId)
        .single();

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      if (!data) {
        return {
          success: false,
          message: 'File not found',
        };
      }

      return {
        success: true,
        data,
        message: 'File retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting file:', error);
      return {
        success: false,
        message: 'Failed to get file',
      };
    }
  }

  static async updateFile(
    userId: string,
    fileId: string,
    updates: UpdateFileRequest
  ): Promise<ApiResponse<AssetFile>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('asset_files')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', fileId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      if (!data) {
        return {
          success: false,
          message: 'File not found',
        };
      }

      return {
        success: true,
        data,
        message: 'File updated successfully',
      };
    } catch (error) {
      console.error('Error updating file:', error);
      return {
        success: false,
        message: 'Failed to update file',
      };
    }
  }

  static async deleteFile(
    userId: string,
    fileId: string
  ): Promise<ApiResponse<void>> {
    try {
      // Get file info first for cleanup
      const fileResult = await this.getFile(userId, fileId);
      if (!fileResult.success || !fileResult.data) {
        return {
          success: false,
          message: 'File not found',
        };
      }

      // Delete from database
      const { error } = await supabaseAdmin
        .from('asset_files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', userId);

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      // Delete from storage
      try {
        const { error: storageError } = await supabaseAdmin.storage
          .from('campaigns')
          .remove([fileResult.data.storage_path]);

        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Don't fail the whole operation if storage cleanup fails
        }
      } catch (storageError) {
        console.error('Error deleting file from storage:', storageError);
      }

      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting file:', error);
      return {
        success: false,
        message: 'Failed to delete file',
      };
    }
  }

  static async incrementDownloadCount(
    userId: string,
    fileId: string
  ): Promise<ApiResponse<void>> {
    try {
      // First verify the user has access to this file
      const fileResult = await this.getFile(userId, fileId);
      if (!fileResult.success) {
        return {
          success: false,
          message: fileResult.message,
        };
      }

      const { error } = await supabaseAdmin.rpc('increment_download_count', {
        file_uuid: fileId
      });

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
        message: 'Download count updated',
      };
    } catch (error) {
      console.error('Error incrementing download count:', error);
      return {
        success: false,
        message: 'Failed to update download count',
      };
    }
  }
}