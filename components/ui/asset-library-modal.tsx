"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  FolderPlus,
  Upload,
  Wand2,
  Search,
  Grid3X3,
  List,
  Folder,
  Image as ImageIcon,
  MoreVertical,
  Edit3,
  Trash2,
  ChevronLeft,
  Loader2,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import Image from "next/image";

interface AssetFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  parent_folder_id?: string;
  created_at: string;
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

interface AssetLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAssets: (assets: AssetFile[]) => void;
  multiSelect?: boolean;
  title?: string;
  description?: string;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
}

const FOLDER_COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Red", value: "#EF4444" },
  { name: "Yellow", value: "#F59E0B" },
  { name: "Pink", value: "#EC4899" },
];

export function AssetLibraryModal({
  isOpen,
  onClose,
  onSelectAssets,
  multiSelect = false,
  title = "Select Assets",
  description = "Choose assets from your library or upload new ones",
  acceptedFileTypes = ["image/*"],
  maxFileSize = 10 * 1024 * 1024, // 10MB
}: AssetLibraryModalProps) {
  // State management
  const [folders, setFolders] = useState<AssetFolder[]>([]);
  const [files, setFiles] = useState<AssetFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<AssetFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Selection
  const [selectedAssets, setSelectedAssets] = useState<AssetFile[]>([]);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("");

  // Dialog states
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "folder" | "file"; id: string; name: string } | null>(null);

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
    }
  }, [currentFolderId]);

  const loadFiles = useCallback(async () => {
    setFilesLoading(true);
    try {
      const params = {
        folder_id: currentFolderId,
        search: searchQuery || undefined,
        file_type: fileTypeFilter || undefined,
        limit: 50, // Show more items in modal
      };

      const response = await api.getAssetFiles(params);
      if (response.success && response.data) {
        setFiles(response.data.files);
      }
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setFilesLoading(false);
    }
  }, [currentFolderId, searchQuery, fileTypeFilter]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([loadFolders(), loadFiles()]);
        setLoading(false);
      };
      loadData();
    }
  }, [isOpen, loadFolders, loadFiles]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedAssets([]);
      setCurrentFolderId(null);
      setFolderPath([]);
      setSearchQuery("");
      setFileTypeFilter("");
      setCreateFolderOpen(false);
    }
  }, [isOpen]);

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
  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate file types and sizes
    for (const file of Array.from(files)) {
      const isValidType = acceptedFileTypes.some(type => 
        type === "*/*" || file.type.startsWith(type.replace("/*", ""))
      );
      if (!isValidType) {
        toast.error(`File type ${file.type} is not allowed`);
        return;
      }
      if (file.size > maxFileSize) {
        toast.error(`File ${file.name} is too large (max ${Math.round(maxFileSize / 1024 / 1024)}MB)`);
        return;
      }
    }

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
        tags: generateForm.tags ? generateForm.tags.split(",").map(t => t.trim()) : undefined,
        size: generateForm.size,
        quality: generateForm.quality,
        style: generateForm.style,
      });

      if (response.success) {
        toast.success("Image generated successfully");
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
  };

  const navigateBack = () => {
    if (folderPath.length === 0) return;
    
    const newPath = folderPath.slice(0, -1);
    setFolderPath(newPath);
    setCurrentFolderId(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
  };

  const navigateToRoot = () => {
    setCurrentFolderId(null);
    setFolderPath([]);
  };

  // Selection handlers
  const handleAssetSelect = (asset: AssetFile) => {
    if (multiSelect) {
      const isSelected = selectedAssets.some(a => a.id === asset.id);
      if (isSelected) {
        setSelectedAssets(prev => prev.filter(a => a.id !== asset.id));
      } else {
        setSelectedAssets(prev => [...prev, asset]);
      }
    } else {
      setSelectedAssets([asset]);
    }
  };

  const isAssetSelected = (asset: AssetFile) => {
    return selectedAssets.some(a => a.id === asset.id);
  };

  // Delete handlers
  const handleDeleteClick = (type: "folder" | "file", id: string, name: string) => {
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

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleConfirmSelection = () => {
    onSelectAssets(selectedAssets);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[85vh] flex flex-col gap-0 p-0 bg-white dark:bg-gray-900">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 border-0 rounded-t-lg">
            <DialogTitle className="text-2xl font-bold text-white">{title}</DialogTitle>
            <DialogDescription className="text-blue-100 text-base mt-2">{description}</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="browse" className="flex-1 flex flex-col p-6">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-6">
              <TabsTrigger value="browse">Browse Library</TabsTrigger>
              <TabsTrigger value="upload">Upload Files</TabsTrigger>
              <TabsTrigger value="generate">Generate Image</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="flex-1 flex flex-col space-y-4">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateFolderOpen(true)}
                  >
                    <FolderPlus className="w-4 h-4 mr-1" />
                    New Folder
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  >
                    {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Folders */}
                    {folders.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-3">Folders</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {folders.map((folder) => (
                            <div
                              key={folder.id}
                              className="flex flex-col items-center p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors group"
                              onClick={() => navigateToFolder(folder)}
                            >
                              <div className="flex items-center justify-between w-full mb-2">
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
                                        handleDeleteClick("folder", folder.id, folder.name);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <p className="text-xs font-medium text-center truncate w-full">
                                {folder.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Files */}
                    <div>
                      <h4 className="text-sm font-medium mb-3">Files</h4>
                      {filesLoading ? (
                        <div className="flex items-center justify-center h-32">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : files.length === 0 ? (
                        <div className="text-center py-12">
                          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            {searchQuery
                              ? "No files match your search"
                              : "No files in this folder"}
                          </p>
                        </div>
                      ) : viewMode === "grid" ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {files.map((file) => (
                            <div
                              key={file.id}
                              className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                                isAssetSelected(file)
                                  ? "border-primary ring-2 ring-primary/20"
                                  : "border-border hover:border-primary/50"
                              }`}
                              onClick={() => handleAssetSelect(file)}
                            >
                              <Image
                                src={file.thumbnail_url || file.storage_url}
                                alt={file.alt_text || file.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16.67vw"
                              />
                              {isAssetSelected(file) && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              )}
                              {file.is_generated && (
                                <Badge variant="secondary" className="absolute top-1 left-1 text-xs">
                                  AI
                                </Badge>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-1">
                                <p className="text-xs truncate" title={file.name}>
                                  {file.name}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {files.map((file) => (
                            <div
                              key={file.id}
                              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                                isAssetSelected(file)
                                  ? "bg-primary/10 border border-primary/20"
                                  : "hover:bg-muted/50"
                              }`}
                              onClick={() => handleAssetSelect(file)}
                            >
                              <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0 mr-3">
                                <Image
                                  src={file.thumbnail_url || file.storage_url}
                                  alt={file.alt_text || file.name}
                                  width={40}
                                  height={40}
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium text-sm truncate">{file.name}</p>
                                  {file.is_generated && <Badge variant="secondary" className="text-xs">AI</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(file.file_size)} • {file.width} × {file.height}
                                </p>
                              </div>
                              {isAssetSelected(file) && (
                                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center ml-2">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="upload" className="flex-1 flex flex-col">
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-lg w-full">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 bg-gray-50 dark:bg-gray-800/50 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                    <Upload className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Upload Files</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                      Select images from your computer to add to your library
                    </p>
                    <div className="space-y-4">
                      <Input
                        type="file"
                        multiple
                        accept={acceptedFileTypes.join(",")}
                        onChange={handleUploadFile}
                        disabled={isUploading}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-600 file:to-purple-600 file:text-white hover:file:from-blue-700 hover:file:to-purple-700 file:cursor-pointer border-2 border-gray-300 rounded-xl p-4"
                      />
                      {isUploading && (
                        <div className="space-y-3 bg-white dark:bg-gray-800 p-4 rounded-xl border">
                          <div className="flex items-center justify-between text-sm font-medium">
                            <span>Uploading files...</span>
                            <span className="text-blue-600">{Math.round(uploadProgress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
                      Supports: JPG, PNG, WebP, GIF (Max 10MB each)
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="generate" className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="text-center">
                    <Wand2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Generate AI Image</h3>
                    <p className="text-muted-foreground">
                      Create a new image using AI based on your description.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Image Name</label>
                        <Input
                          value={generateForm.name}
                          onChange={(e) => setGenerateForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter image name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description/Prompt</label>
                        <Textarea
                          value={generateForm.prompt}
                          onChange={(e) => setGenerateForm(prev => ({ ...prev, prompt: e.target.value }))}
                          placeholder="Describe the image you want to generate"
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Alt Text (Optional)</label>
                        <Input
                          value={generateForm.alt_text}
                          onChange={(e) => setGenerateForm(prev => ({ ...prev, alt_text: e.target.value }))}
                          placeholder="Alt text for accessibility"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Tags (Optional)</label>
                        <Input
                          value={generateForm.tags}
                          onChange={(e) => setGenerateForm(prev => ({ ...prev, tags: e.target.value }))}
                          placeholder="tag1, tag2, tag3"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Size</label>
                        <Select
                          value={generateForm.size}
                          onValueChange={(value: "1024x1024" | "1792x1024" | "1024x1792") =>
                            setGenerateForm(prev => ({ ...prev, size: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1024x1024">Square (1024×1024)</SelectItem>
                            <SelectItem value="1792x1024">Landscape (1792×1024)</SelectItem>
                            <SelectItem value="1024x1792">Portrait (1024×1792)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Quality</label>
                        <Select
                          value={generateForm.quality}
                          onValueChange={(value: "standard" | "hd") =>
                            setGenerateForm(prev => ({ ...prev, quality: value }))
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
                            setGenerateForm(prev => ({ ...prev, style: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vivid">Vivid (More stylized)</SelectItem>
                            <SelectItem value="natural">Natural (More realistic)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleGenerateImage}
                        disabled={isGenerating || !generateForm.name.trim() || !generateForm.prompt.trim()}
                        className="w-full"
                      >
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
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedAssets.length > 0 && (
                <div className="flex items-center space-x-3 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-full">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-blue-700 dark:text-blue-300 font-semibold">
                    {selectedAssets.length} asset{selectedAssets.length === 1 ? "" : "s"} selected
                  </span>
                </div>
              )}
            </div>
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={onClose} 
                className="px-8 py-2 border-2 border-gray-300 hover:border-gray-400 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSelection}
                disabled={selectedAssets.length === 0}
                className="px-8 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4 mr-2" />
                Select {selectedAssets.length > 0 && `(${selectedAssets.length})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">Create New Folder</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Create a new folder to organize your assets.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Folder Name</label>
              <Input
                value={folderForm.name}
                onChange={(e) => setFolderForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter folder name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea
                value={folderForm.description}
                onChange={(e) => setFolderForm(prev => ({ ...prev, description: e.target.value }))}
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
                    onClick={() => setFolderForm(prev => ({ ...prev, color: color.value }))}
                    className={`w-6 h-6 rounded-full border-2 ${
                      folderForm.color === color.value ? "border-foreground" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create Folder</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-2 border-red-200 dark:border-red-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteTarget?.type} &quot;{deleteTarget?.name}&quot;.
              This action cannot be undone.
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
    </>
  );
}