"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import {
  Calendar,
  ChevronLeft,
  Download,
  Edit3,
  Eye,
  FileIcon,
  Folder,
  FolderPlus,
  Grid3X3,
  Image as ImageIcon,
  List,
  Loader2,
  MoreVertical,
  Search,
  Tags,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

interface AssetFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  parent_folder_id?: string;
  created_at: string;
  file_count?: number;
}

interface AssetFile {
  id: string;
  name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  width?: number;
  height?: number;
  storage_url: string;
  thumbnail_url?: string;
  is_generated: boolean;
  generation_prompt?: string;
  alt_text?: string;
  tags: string[];
  download_count: number;
  created_at: string;
  folder_id?: string;
}

interface AssetFilesResponse {
  files: AssetFile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const FOLDER_COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Red", value: "#EF4444" },
  { name: "Yellow", value: "#F59E0B" },
  { name: "Pink", value: "#EC4899" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Gray", value: "#6B7280" },
];

export default function AssetLibraryPage() {
  // State management
  const [folders, setFolders] = useState<AssetFolder[]>([]);
  const [files, setFiles] = useState<AssetFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<AssetFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);
  const itemsPerPage = 20;

  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("");
  const [generatedFilter, setGeneratedFilter] = useState<boolean | undefined>();
  const [sortBy, setSortBy] = useState<
    "created_at" | "name" | "file_size" | "download_count"
  >("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Dialog states
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [uploadFileOpen, setUploadFileOpen] = useState(false);
  const [generateImageOpen, setGenerateImageOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<AssetFile | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "folder" | "file";
    id: string;
    name: string;
  } | null>(null);

  // Form states
  const [folderForm, setFolderForm] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    name: "",
    prompt: "",
    alt_text: "",
    tags: "",
    size: "1024x1024" as "1024x1024" | "1792x1024" | "1024x1792",
    quality: "standard" as "standard" | "hd",
    style: "vivid" as "vivid" | "natural",
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Load folders and files
  const loadFolders = useCallback(async () => {
    try {
      const response = await api.getAssetFolders({
        parent_folder_id: currentFolderId,
      });
      if (response.success && response.data) {
        setFolders(response.data);
      }
    } catch (error) {
      console.error("Error loading folders:", error);
      toast.error("Failed to load folders");
    }
  }, [currentFolderId]);

  const loadFiles = useCallback(async () => {
    setFilesLoading(true);
    try {
      const params = {
        folder_id: currentFolderId,
        search: searchQuery || undefined,
        file_type: fileTypeFilter && fileTypeFilter !== "all" ? fileTypeFilter : undefined,
        is_generated: generatedFilter,
        page: currentPage,
        limit: itemsPerPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      const response = await api.getAssetFiles(params);
      if (response.success && response.data) {
        setFiles(response.data.files);
        setTotalPages(response.data.totalPages);
        setTotalFiles(response.data.total);
      }
    } catch (error) {
      console.error("Error loading files:", error);
      toast.error("Failed to load files");
    } finally {
      setFilesLoading(false);
    }
  }, [
    currentFolderId,
    searchQuery,
    fileTypeFilter,
    generatedFilter,
    currentPage,
    sortBy,
    sortOrder,
  ]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadFolders(), loadFiles()]);
      setLoading(false);
    };
    loadData();
  }, [loadFolders, loadFiles]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, fileTypeFilter, generatedFilter, sortBy, sortOrder]);

  // Create folder handler
  const handleCreateFolder = async () => {
    if (!folderForm.name.trim()) {
      toast.error("Folder name is required");
      return;
    }

    try {
      const response = await api.createAssetFolder({
        name: folderForm.name,
        description: folderForm.description || undefined,
        color: folderForm.color,
        parent_folder_id: currentFolderId || undefined,
      });

      if (response.success) {
        toast.success("Folder created successfully");
        setCreateFolderOpen(false);
        setFolderForm({ name: "", description: "", color: "#3B82F6" });
        loadFolders();
      } else {
        toast.error(response.message || "Failed to create folder");
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Failed to create folder");
    }
  };

  // Upload file handler
  const handleUploadFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder_id", currentFolderId || "");
        formData.append("name", file.name.split(".")[0]);

        const response = await api.uploadAssetFile(formData);

        if (response.success) {
          setUploadProgress(((i + 1) / files.length) * 100);
        } else {
          toast.error(`Failed to upload ${file.name}: ${response.message}`);
        }
      }

      toast.success(`Successfully uploaded ${files.length} file(s)`);
      loadFiles();
      setUploadFileOpen(false);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      event.target.value = "";
    }
  };

  // Generate image handler
  const handleGenerateImage = async () => {
    if (!generateForm.name.trim() || !generateForm.prompt.trim()) {
      toast.error("Name and prompt are required");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.generateAssetImage({
        folder_id: currentFolderId || undefined,
        name: generateForm.name,
        prompt: generateForm.prompt,
        alt_text: generateForm.alt_text || undefined,
        tags: generateForm.tags
          ? generateForm.tags.split(",").map((t) => t.trim())
          : undefined,
        size: generateForm.size,
        quality: generateForm.quality,
        style: generateForm.style,
      });

      if (response.success) {
        toast.success("Image generated successfully");
        setGenerateImageOpen(false);
        setGenerateForm({
          name: "",
          prompt: "",
          alt_text: "",
          tags: "",
          size: "1024x1024",
          quality: "standard",
          style: "vivid",
        });
        loadFiles();
      } else {
        toast.error(response.message || "Failed to generate image");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  // Navigation handlers
  const navigateToFolder = (folder: AssetFolder) => {
    setCurrentFolderId(folder.id);
    setFolderPath([...folderPath, folder]);
    setCurrentPage(1);
  };

  const navigateBack = () => {
    if (folderPath.length === 0) return;

    const newPath = folderPath.slice(0, -1);
    setFolderPath(newPath);
    setCurrentFolderId(
      newPath.length > 0 ? newPath[newPath.length - 1].id : null
    );
    setCurrentPage(1);
  };

  const navigateToRoot = () => {
    setCurrentFolderId(null);
    setFolderPath([]);
    setCurrentPage(1);
  };

  // Delete handlers
  const handleDeleteClick = (
    type: "folder" | "file",
    id: string,
    name: string
  ) => {
    setDeleteTarget({ type, id, name });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "folder") {
        const response = await api.deleteAssetFolder(deleteTarget.id);
        if (response.success) {
          toast.success("Folder deleted successfully");
          loadFolders();
        } else {
          toast.error(response.message || "Failed to delete folder");
        }
      } else {
        const response = await api.deleteAssetFile(deleteTarget.id);
        if (response.success) {
          toast.success("File deleted successfully");
          loadFiles();
        } else {
          toast.error(response.message || "Failed to delete file");
        }
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete");
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  // File download handler
  const handleDownloadFile = async (file: AssetFile) => {
    try {
      await api.downloadAssetFile(file.id);
      toast.success("Download started");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Asset Library</h1>
          <p className="text-muted-foreground">
            Organize and manage your images, generated content, and media files
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? (
              <List className="w-4 h-4" />
            ) : (
              <Grid3X3 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {folderPath.length > 0 && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <button onClick={navigateToRoot} className="hover:text-foreground">
            Root
          </button>
          {folderPath.map((folder, index) => (
            <React.Fragment key={folder.id}>
              <span>/</span>
              <button
                onClick={() => {
                  const newPath = folderPath.slice(0, index + 1);
                  setFolderPath(newPath);
                  setCurrentFolderId(folder.id);
                }}
                className="hover:text-foreground"
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {folderPath.length > 0 && (
            <Button variant="outline" size="sm" onClick={navigateBack}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderPlus className="w-4 h-4 mr-1" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Create a new folder to organize your assets.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Folder Name</label>
                  <Input
                    value={folderForm.name}
                    onChange={(e) =>
                      setFolderForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Enter folder name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Description (Optional)
                  </label>
                  <Textarea
                    value={folderForm.description}
                    onChange={(e) =>
                      setFolderForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter folder description"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <div className="flex items-center space-x-2 mt-2">
                    {FOLDER_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() =>
                          setFolderForm((prev) => ({
                            ...prev,
                            color: color.value,
                          }))
                        }
                        className={`w-6 h-6 rounded-full border-2 ${
                          folderForm.color === color.value
                            ? "border-foreground"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCreateFolderOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder}>Create Folder</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={uploadFileOpen} onOpenChange={setUploadFileOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-1" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Files</DialogTitle>
                <DialogDescription>
                  Upload images to your asset library. You can select multiple
                  files.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleUploadFile}
                    disabled={isUploading}
                  />
                </div>
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={generateImageOpen} onOpenChange={setGenerateImageOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Wand2 className="w-4 h-4 mr-1" />
                Generate Image
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generate AI Image</DialogTitle>
                <DialogDescription>
                  Create a new image using AI based on your description.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Image Name</label>
                    <Input
                      value={generateForm.name}
                      onChange={(e) =>
                        setGenerateForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter image name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Description/Prompt
                    </label>
                    <Textarea
                      value={generateForm.prompt}
                      onChange={(e) =>
                        setGenerateForm((prev) => ({
                          ...prev,
                          prompt: e.target.value,
                        }))
                      }
                      placeholder="Describe the image you want to generate"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Alt Text (Optional)
                    </label>
                    <Input
                      value={generateForm.alt_text}
                      onChange={(e) =>
                        setGenerateForm((prev) => ({
                          ...prev,
                          alt_text: e.target.value,
                        }))
                      }
                      placeholder="Alt text for accessibility"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Tags (Optional)
                    </label>
                    <Input
                      value={generateForm.tags}
                      onChange={(e) =>
                        setGenerateForm((prev) => ({
                          ...prev,
                          tags: e.target.value,
                        }))
                      }
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Size</label>
                    <Select
                      value={generateForm.size}
                      onValueChange={(
                        value: "1024x1024" | "1792x1024" | "1024x1792"
                      ) =>
                        setGenerateForm((prev) => ({ ...prev, size: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1024x1024">
                          Square (1024×1024)
                        </SelectItem>
                        <SelectItem value="1792x1024">
                          Landscape (1792×1024)
                        </SelectItem>
                        <SelectItem value="1024x1792">
                          Portrait (1024×1792)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Quality</label>
                    <Select
                      value={generateForm.quality}
                      onValueChange={(value: "standard" | "hd") =>
                        setGenerateForm((prev) => ({ ...prev, quality: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="hd">HD (Higher Cost)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Style</label>
                    <Select
                      value={generateForm.style}
                      onValueChange={(value: "vivid" | "natural") =>
                        setGenerateForm((prev) => ({ ...prev, style: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vivid">
                          Vivid (More stylized)
                        </SelectItem>
                        <SelectItem value="natural">
                          Natural (More realistic)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setGenerateImageOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleGenerateImage} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Image
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="File type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image/jpeg">JPEG</SelectItem>
                <SelectItem value="image/png">PNG</SelectItem>
                <SelectItem value="image/webp">WebP</SelectItem>
                <SelectItem value="image/gif">GIF</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={
                generatedFilter === undefined ? "all" : generatedFilter.toString()
              }
              onValueChange={(value) =>
                setGeneratedFilter(value === "all" ? undefined : value === "true")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="true">AI Generated</SelectItem>
                <SelectItem value="false">Uploaded</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={`${sortBy}_${sortOrder}`}
              onValueChange={(value) => {
                const [sort, order] = value.split("_") as [
                  typeof sortBy,
                  typeof sortOrder
                ];
                setSortBy(sort);
                setSortOrder(order);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at_desc">Newest First</SelectItem>
                <SelectItem value="created_at_asc">Oldest First</SelectItem>
                <SelectItem value="name_asc">Name A-Z</SelectItem>
                <SelectItem value="name_desc">Name Z-A</SelectItem>
                <SelectItem value="file_size_desc">Largest First</SelectItem>
                <SelectItem value="file_size_asc">Smallest First</SelectItem>
                <SelectItem value="download_count_desc">
                  Most Downloaded
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}
      <div className="space-y-6">
        {/* Folders */}
        {folders.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Folders</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {folders.map((folder) => (
                <Card
                  key={folder.id}
                  className="cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={() => navigateToFolder(folder)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center"
                        style={{ backgroundColor: folder.color }}
                      >
                        <Folder className="w-5 h-5 text-white" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(
                                "folder",
                                folder.id,
                                folder.name
                              );
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p
                      className="text-sm font-medium truncate"
                      title={folder.name}
                    >
                      {folder.name}
                    </p>
                    {folder.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {folder.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Files */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Files {totalFiles > 0 && `(${totalFiles})`}
            </h3>
          </div>

          {filesLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No files found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ||
                    fileTypeFilter ||
                    generatedFilter !== undefined
                      ? "No files match your current filters"
                      : "Get started by uploading files or generating images"}
                  </p>
                  {!searchQuery &&
                    !fileTypeFilter &&
                    generatedFilter === undefined && (
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setUploadFileOpen(true)}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Files
                        </Button>
                        <Button onClick={() => setGenerateImageOpen(true)}>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Generate Image
                        </Button>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {files.map((file) => (
                <Card key={file.id} className="group">
                  <CardContent className="p-0">
                    <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted">
                      <Image
                        src={file.thumbnail_url || file.storage_url}
                        alt={file.alt_text || file.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16.67vw"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedFile(file)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDownloadFile(file)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="secondary">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() =>
                                  handleDeleteClick("file", file.id, file.name)
                                }
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      {file.is_generated && (
                        <Badge
                          variant="secondary"
                          className="absolute top-2 left-2"
                        >
                          AI
                        </Badge>
                      )}
                    </div>
                    <div className="p-3">
                      <p
                        className="font-medium text-sm truncate"
                        title={file.name}
                      >
                        {file.name}
                      </p>
                      <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span>{file.download_count} downloads</span>
                      </div>
                      {file.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {file.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {file.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{file.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center p-4 hover:bg-muted/50"
                    >
                      <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0 mr-4">
                        <Image
                          src={file.thumbnail_url || file.storage_url}
                          alt={file.alt_text || file.name}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium truncate">{file.name}</p>
                          {file.is_generated && (
                            <Badge variant="secondary">AI</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <FileIcon className="w-4 h-4 mr-1" />
                            {formatFileSize(file.file_size)}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(file.created_at)}
                          </span>
                          <span className="flex items-center">
                            <Download className="w-4 h-4 mr-1" />
                            {file.download_count}
                          </span>
                        </div>
                        {file.tags.length > 0 && (
                          <div className="flex items-center mt-1 space-x-1">
                            <Tags className="w-3 h-3 text-muted-foreground" />
                            <div className="flex flex-wrap gap-1">
                              {file.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedFile(file)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadFile(file)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() =>
                                handleDeleteClick("file", file.id, file.name)
                              }
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalFiles)} of{" "}
                {totalFiles} files
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File Preview Modal */}
      {selectedFile && (
        <Dialog
          open={!!selectedFile}
          onOpenChange={() => setSelectedFile(null)}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>{selectedFile.name}</span>
                {selectedFile.is_generated && (
                  <Badge variant="secondary">AI Generated</Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6">
              <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
                <Image
                  src={selectedFile.storage_url}
                  alt={selectedFile.alt_text || selectedFile.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">File Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File Size:</span>
                      <span>{formatFileSize(selectedFile.file_size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dimensions:</span>
                      <span>
                        {selectedFile.width} × {selectedFile.height}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{selectedFile.file_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Downloads:</span>
                      <span>{selectedFile.download_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{formatDate(selectedFile.created_at)}</span>
                    </div>
                  </div>
                </div>

                {selectedFile.alt_text && (
                  <div>
                    <h4 className="font-medium mb-2">Alt Text</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedFile.alt_text}
                    </p>
                  </div>
                )}

                {selectedFile.is_generated &&
                  selectedFile.generation_prompt && (
                    <div>
                      <h4 className="font-medium mb-2">Generation Prompt</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedFile.generation_prompt}
                      </p>
                    </div>
                  )}

                {selectedFile.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedFile.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  <Button onClick={() => handleDownloadFile(selectedFile)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteTarget?.type} &quot;
              {deleteTarget?.name}&quot;.
              {deleteTarget?.type === "folder" &&
                " This action cannot be undone and will delete all files within this folder."}
              {deleteTarget?.type === "file" &&
                " This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
