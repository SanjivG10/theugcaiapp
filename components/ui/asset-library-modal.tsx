"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { AssetFile, AssetFolder } from "@/types";
import {
  Check,
  ChevronLeft,
  Edit3,
  Folder,
  FolderOpen,
  FolderPlus,
  Grid3X3,
  Image as ImageIcon,
  List,
  Loader2,
  MoreVertical,
  Search,
  Trash2,
  Upload,
  Wand2,
  Download,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

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
  title = "Asset Library",
  description = "Browse, upload or generate images for your project",
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
  const [editImageOpen, setEditImageOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<AssetFile | null>(null);
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
  const [editForm, setEditForm] = useState({
    prompt: "",
    size: "1024x1024" as
      | "1024x1024"
      | "1536x1024"
      | "1024x1536"
      | "256x256"
      | "512x512",
    quality: "auto" as "auto" | "low" | "medium" | "high",
    style: "vivid" as "vivid" | "natural",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");

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
      setActiveTab("browse");
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
  const handleUploadFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate file types and sizes
    for (const file of Array.from(files)) {
      const isValidType = acceptedFileTypes.some(
        (type) => type === "*/*" || file.type.startsWith(type.replace("/*", ""))
      );
      if (!isValidType) {
        toast.error(`File type ${file.type} is not allowed`);
        return;
      }
      if (file.size > maxFileSize) {
        toast.error(
          `File ${file.name} is too large (max ${Math.round(
            maxFileSize / 1024 / 1024
          )}MB)`
        );
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
        tags: generateForm.tags
          ? generateForm.tags.split(",").map((t) => t.trim())
          : undefined,
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

  // Edit image handler
  const handleEditImage = async () => {
    if (!editingFile || !editForm.prompt.trim()) {
      toast.error("Prompt is required");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.editAssetImage(editingFile.id, {
        prompt: editForm.prompt,
        size: editForm.size,
        quality: editForm.quality,
        style: editForm.style,
      });

      if (response.success) {
        toast.success("Image edited successfully");
        setEditImageOpen(false);
        setEditForm({
          prompt: "",
          size: "1024x1024",
          quality: "auto",
          style: "vivid",
        });
        setEditingFile(null);
        loadFiles();
      } else {
        toast.error(response.message || "Failed to edit image");
      }
    } catch (error) {
      console.error("Error editing image:", error);
      toast.error("Failed to edit image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditClick = (file: AssetFile) => {
    setEditingFile(file);
    setEditImageOpen(true);
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
    setCurrentFolderId(
      newPath.length > 0 ? newPath[newPath.length - 1].id : null
    );
  };

  const navigateToRoot = () => {
    setCurrentFolderId(null);
    setFolderPath([]);
  };

  // Selection handlers
  const handleAssetSelect = (asset: AssetFile) => {
    if (multiSelect) {
      const isSelected = selectedAssets.some((a) => a.id === asset.id);
      if (isSelected) {
        setSelectedAssets((prev) => prev.filter((a) => a.id !== asset.id));
      } else {
        setSelectedAssets((prev) => [...prev, asset]);
      }
    } else {
      setSelectedAssets([asset]);
    }
  };

  const isAssetSelected = (asset: AssetFile) => {
    return selectedAssets.some((a) => a.id === asset.id);
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

  const handleDownloadFile = (file: AssetFile) => {
    window.open(file.storage_url, "_blank");
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[85vh] flex flex-col gap-0 p-0 bg-white">
          <DialogHeader className="bg-white p-6 border-b border-gray-200">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {title}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-base mt-1">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex">
            {/* Vertical Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab("browse")}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                    activeTab === "browse"
                      ? "bg-primary text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <FolderOpen className="w-5 h-5" />
                  <span className="font-medium">Browse Library</span>
                </button>
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                    activeTab === "upload"
                      ? "bg-primary text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Upload Files</span>
                </button>
                <button
                  onClick={() => setActiveTab("generate")}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                    activeTab === "generate"
                      ? "bg-primary text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Wand2 className="w-5 h-5" />
                  <span className="font-medium">Generate Image</span>
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {activeTab === "browse" && (
                <div className="flex-1 flex flex-col space-y-4 p-6">
                  {/* Breadcrumb Navigation */}
                  {folderPath.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <button
                        onClick={navigateToRoot}
                        className="hover:text-gray-700"
                      >
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
                            className="hover:text-gray-700"
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={navigateBack}
                        >
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
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                        onClick={() =>
                          setViewMode(viewMode === "grid" ? "list" : "grid")
                        }
                      >
                        {viewMode === "grid" ? (
                          <List className="w-4 h-4" />
                        ) : (
                          <Grid3X3 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Folders */}
                        {folders.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-3 text-gray-700">
                              Folders
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                              {folders.map((folder) => (
                                <div
                                  key={folder.id}
                                  className="flex flex-col items-center p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors group"
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
                                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        align="end"
                                        className="bg-white border border-gray-200 shadow-lg"
                                      >
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
                                  <p className="text-xs font-medium text-center truncate w-full text-gray-700">
                                    {folder.name}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Files */}
                        <div>
                          <h4 className="text-sm font-medium mb-3 text-gray-700">
                            Files
                          </h4>
                          {filesLoading ? (
                            <div className="flex items-center justify-center h-32">
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                          ) : files.length === 0 ? (
                            <div className="text-center py-12">
                              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500">
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
                                  className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all group ${
                                    isAssetSelected(file)
                                      ? "border-primary ring-2 ring-primary/20"
                                      : "border-gray-200 hover:border-primary/50"
                                  }`}
                                  onClick={() => handleAssetSelect(file)}
                                >
                                  <img
                                    src={file.thumbnail_url || file.storage_url}
                                    alt={file.alt_text || file.name}
                                    className="w-full h-full object-cover"
                                  />
                                  {isAssetSelected(file) && (
                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                      </div>
                                    </div>
                                  )}
                                  {file.is_generated && (
                                    <Badge
                                      variant="secondary"
                                      className="absolute top-1 left-1 text-xs"
                                    >
                                      AI
                                    </Badge>
                                  )}
                                  <div className="absolute top-1 right-1">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        align="end"
                                        className="bg-white border border-gray-200 shadow-lg"
                                      >
                                        <DropdownMenuItem
                                          onClick={() => handleEditClick(file)}
                                        >
                                          <Edit3 className="w-4 h-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleDownloadFile(file)
                                          }
                                        >
                                          <Download className="w-4 h-4 mr-2" />
                                          Download
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() =>
                                            handleDeleteClick(
                                              "file",
                                              file.id,
                                              file.name
                                            )
                                          }
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-1">
                                    <p
                                      className="text-xs truncate"
                                      title={file.name}
                                    >
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
                                      : "hover:bg-gray-50"
                                  }`}
                                  onClick={() => handleAssetSelect(file)}
                                >
                                  <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0 mr-3">
                                    <img
                                      src={
                                        file.thumbnail_url || file.storage_url
                                      }
                                      alt={file.alt_text || file.name}
                                      width={40}
                                      height={40}
                                      className="object-cover w-full h-full"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <p className="font-medium text-sm truncate text-gray-900">
                                        {file.name}
                                      </p>
                                      {file.is_generated && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          AI
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(file.file_size)} •{" "}
                                      {file.width} × {file.height}
                                    </p>
                                  </div>
                                  {isAssetSelected(file) && (
                                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center ml-2">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="ml-2"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="bg-white border border-gray-200 shadow-lg"
                                    >
                                      <DropdownMenuItem
                                        onClick={() => handleEditClick(file)}
                                      >
                                        <Edit3 className="w-4 h-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDownloadFile(file)}
                                      >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() =>
                                          handleDeleteClick(
                                            "file",
                                            file.id,
                                            file.name
                                          )
                                        }
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "upload" && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center max-w-lg w-full">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 bg-gray-50 hover:border-primary transition-colors">
                      <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Upload Files
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Select images from your computer to add to your library
                      </p>
                      <div className="space-y-4">
                        <Input
                          type="file"
                          multiple
                          accept={acceptedFileTypes.join(",")}
                          onChange={handleUploadFile}
                          disabled={isUploading}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer"
                        />
                        {isUploading && (
                          <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between text-sm font-medium">
                              <span>Uploading files...</span>
                              <span className="text-primary">
                                {Math.round(uploadProgress)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-4">
                        Supports: JPG, PNG, WebP, GIF (Max 10MB each)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "generate" && (
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="text-center">
                      <Wand2 className="w-12 h-12 text-primary mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2 text-gray-900">
                        Generate AI Image
                      </h3>
                      <p className="text-gray-600">
                        Create a new image using AI based on your description.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-2">
                            Image Name
                          </label>
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
                          <label className="text-sm font-medium text-gray-700 block mb-2">
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
                            rows={4}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-2">
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
                          <label className="text-sm font-medium text-gray-700 block mb-2">
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
                          <label className="text-sm font-medium text-gray-700 block mb-2">
                            Size
                          </label>
                          <Select
                            value={generateForm.size}
                            onValueChange={(
                              value: "1024x1024" | "1792x1024" | "1024x1792"
                            ) =>
                              setGenerateForm((prev) => ({
                                ...prev,
                                size: value,
                              }))
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
                          <label className="text-sm font-medium text-gray-700 block mb-2">
                            Quality
                          </label>
                          <Select
                            value={generateForm.quality}
                            onValueChange={(value: "standard" | "hd") =>
                              setGenerateForm((prev) => ({
                                ...prev,
                                quality: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="hd">
                                HD (Higher Cost)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-2">
                            Style
                          </label>
                          <Select
                            value={generateForm.style}
                            onValueChange={(value: "vivid" | "natural") =>
                              setGenerateForm((prev) => ({
                                ...prev,
                                style: value,
                              }))
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
                        <Button
                          onClick={handleGenerateImage}
                          disabled={
                            isGenerating ||
                            !generateForm.name.trim() ||
                            !generateForm.prompt.trim()
                          }
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
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between bg-white p-6 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-600">
              {selectedAssets.length > 0 && (
                <div className="flex items-center space-x-3 bg-primary/10 px-4 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-primary font-medium">
                    {selectedAssets.length} asset
                    {selectedAssets.length === 1 ? "" : "s"} selected
                  </span>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose} className="px-6">
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSelection}
                disabled={selectedAssets.length === 0}
                className="px-6"
              >
                <Check className="w-4 h-4 mr-2" />
                Select{" "}
                {selectedAssets.length > 0 && `(${selectedAssets.length})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Create New Folder
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Create a new folder to organize your assets.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Folder Name
              </label>
              <Input
                value={folderForm.name}
                onChange={(e) =>
                  setFolderForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter folder name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
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
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Color
              </label>
              <div className="flex items-center space-x-2 mt-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() =>
                      setFolderForm((prev) => ({ ...prev, color: color.value }))
                    }
                    className={`w-6 h-6 rounded-full border-2 ${
                      folderForm.color === color.value
                        ? "border-gray-900"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateFolderOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Image Modal */}
      <Dialog open={editImageOpen} onOpenChange={setEditImageOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Edit Image
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Use AI to edit and modify your existing image with a new prompt.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Edit Prompt
                </label>
                <Textarea
                  value={editForm.prompt}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      prompt: e.target.value,
                    }))
                  }
                  placeholder="Describe how you want to modify the image"
                  rows={3}
                  className="w-full"
                />
              </div>
              {editingFile && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Original Image
                  </label>
                  <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img
                      src={editingFile.thumbnail_url || editingFile.storage_url}
                      alt={editingFile.alt_text || editingFile.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Size
                </label>
                <Select
                  value={editForm.size}
                  onValueChange={(
                    value:
                      | "1024x1024"
                      | "1536x1024"
                      | "1024x1536"
                      | "256x256"
                      | "512x512"
                  ) => setEditForm((prev) => ({ ...prev, size: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024x1024">
                      Square (1024×1024)
                    </SelectItem>
                    <SelectItem value="1536x1024">
                      Landscape (1536×1024)
                    </SelectItem>
                    <SelectItem value="1024x1536">
                      Portrait (1024×1536)
                    </SelectItem>
                    <SelectItem value="256x256">
                      Small Square (256×256)
                    </SelectItem>
                    <SelectItem value="512x512">
                      Medium Square (512×512)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Quality
                </label>
                <Select
                  value={editForm.quality}
                  onValueChange={(value: "auto" | "low" | "medium" | "high") =>
                    setEditForm((prev) => ({ ...prev, quality: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Style
                </label>
                <Select
                  value={editForm.style}
                  onValueChange={(value: "vivid" | "natural") =>
                    setEditForm((prev) => ({ ...prev, style: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vivid">Vivid (More stylized)</SelectItem>
                    <SelectItem value="natural">
                      Natural (More realistic)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditImageOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditImage} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Editing...
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Image
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Are you sure?
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              This will permanently delete {deleteTarget?.type} &quot;
              {deleteTarget?.name}&quot;. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
