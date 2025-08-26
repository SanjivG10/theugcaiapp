-- Asset Library Tables
-- These tables will store folders and assets for the asset library system

-- Asset Folders Table
CREATE TABLE IF NOT EXISTS asset_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for folder customization
    parent_folder_id UUID REFERENCES asset_folders(id) ON DELETE CASCADE, -- For nested folders
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, name, parent_folder_id), -- Prevent duplicate folder names at same level
    CHECK (name != ''), -- Folder name cannot be empty
    CHECK (color ~ '^#[0-9A-Fa-f]{6}$') -- Valid hex color format
);

-- Asset Files Table
CREATE TABLE IF NOT EXISTS asset_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES asset_folders(id) ON DELETE SET NULL,
    
    -- File Information
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL, -- Original filename when uploaded
    file_type VARCHAR(50) NOT NULL, -- image/jpeg, image/png, etc.
    file_size BIGINT NOT NULL, -- Size in bytes
    width INTEGER, -- Image width in pixels
    height INTEGER, -- Image height in pixels
    
    -- Storage Information
    storage_url TEXT NOT NULL, -- Full URL to the file
    storage_path TEXT NOT NULL, -- Path in storage bucket
    thumbnail_url TEXT, -- Thumbnail URL for quick previews
    
    -- Generation Information (for AI-generated images)
    is_generated BOOLEAN DEFAULT FALSE,
    generation_prompt TEXT, -- Prompt used to generate the image
    generation_model VARCHAR(100), -- AI model used (dall-e-3, midjourney, etc.)
    generation_settings JSONB, -- Additional generation parameters
    
    -- Metadata
    alt_text TEXT, -- Alt text for accessibility
    tags TEXT[], -- Array of tags for organization
    metadata JSONB DEFAULT '{}', -- Additional metadata (EXIF, etc.)
    
    -- Usage Tracking
    download_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (name != ''), -- File name cannot be empty
    CHECK (file_size > 0), -- File size must be positive
    CHECK (width IS NULL OR width > 0), -- Width must be positive if set
    CHECK (height IS NULL OR height > 0), -- Height must be positive if set
    CHECK (download_count >= 0) -- Download count cannot be negative
);

-- Asset File Shares Table (for sharing assets between users/businesses)
CREATE TABLE IF NOT EXISTS asset_file_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES asset_files(id) ON DELETE CASCADE,
    shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_with_business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    permission VARCHAR(20) NOT NULL DEFAULT 'view', -- view, download, edit
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (shared_with_user_id IS NOT NULL OR shared_with_business_id IS NOT NULL), -- Must share with someone
    CHECK (permission IN ('view', 'download', 'edit')), -- Valid permissions only
    CHECK (expires_at IS NULL OR expires_at > NOW()) -- Expiry must be in future if set
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_asset_folders_user_id ON asset_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_folders_business_id ON asset_folders(business_id);
CREATE INDEX IF NOT EXISTS idx_asset_folders_parent_folder_id ON asset_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_asset_folders_created_at ON asset_folders(created_at);

CREATE INDEX IF NOT EXISTS idx_asset_files_user_id ON asset_files(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_files_business_id ON asset_files(business_id);
CREATE INDEX IF NOT EXISTS idx_asset_files_folder_id ON asset_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_asset_files_file_type ON asset_files(file_type);
CREATE INDEX IF NOT EXISTS idx_asset_files_is_generated ON asset_files(is_generated);
CREATE INDEX IF NOT EXISTS idx_asset_files_created_at ON asset_files(created_at);
CREATE INDEX IF NOT EXISTS idx_asset_files_tags ON asset_files USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_asset_file_shares_file_id ON asset_file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_asset_file_shares_shared_with_user_id ON asset_file_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_asset_file_shares_shared_with_business_id ON asset_file_shares(shared_with_business_id);

-- RLS (Row Level Security) Policies
ALTER TABLE asset_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_file_shares ENABLE ROW LEVEL SECURITY;

-- Asset Folders Policies
CREATE POLICY "Users can view their own folders" ON asset_folders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders" ON asset_folders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON asset_folders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON asset_folders
    FOR DELETE USING (auth.uid() = user_id);

-- Asset Files Policies
CREATE POLICY "Users can view their own files" ON asset_files
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own files" ON asset_files
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files" ON asset_files
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files" ON asset_files
    FOR DELETE USING (auth.uid() = user_id);

-- Asset File Shares Policies
CREATE POLICY "Users can view files shared with them" ON asset_file_shares
    FOR SELECT USING (
        auth.uid() = shared_with_user_id OR 
        auth.uid() = shared_by_user_id OR
        shared_with_business_id IN (
            SELECT business_id FROM business_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create shares for their files" ON asset_file_shares
    FOR INSERT WITH CHECK (
        auth.uid() = shared_by_user_id AND
        file_id IN (SELECT id FROM asset_files WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update their own shares" ON asset_file_shares
    FOR UPDATE USING (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can delete their own shares" ON asset_file_shares
    FOR DELETE USING (auth.uid() = shared_by_user_id);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_asset_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_asset_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_update_asset_folders_updated_at
    BEFORE UPDATE ON asset_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_asset_folders_updated_at();

CREATE TRIGGER trigger_update_asset_files_updated_at
    BEFORE UPDATE ON asset_files
    FOR EACH ROW
    EXECUTE FUNCTION update_asset_files_updated_at();

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_download_count(file_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE asset_files 
    SET download_count = download_count + 1,
        last_accessed_at = NOW()
    WHERE id = file_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;