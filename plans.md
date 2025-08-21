# AI UGC Video Platform - Project Plans

## Overview
Based on the transcript analysis, we need to build a platform that automates the entire AI video ad creation process that currently requires multiple tools and manual steps. The goal is to streamline the workflow from script creation to final video output.

## Current Manual Process (From Transcript)
1. Find winning video ads and download them
2. Transcribe videos using reream.io
3. Use custom GPT to create adapted scripts
4. Generate voiceover using 11Labs
5. Create images for each scene using ChatGPT/Sora
6. Animate images using Cling AI
7. Edit everything together in CapCut

## Our Platform Solution - Step-by-Step Process

### Step 1: Campaign Setup
**User Action**: Name the campaign and upload product images
- Campaign name input field
- Product image upload interface (max 5 images)
- Drag & drop upload area with preview thumbnails
- Add/delete images with smooth animations
- Image validation and optimization

### Step 2: Script Generation & Editing
**User Action**: Generate script with scene breakdown and edit as needed
- Backend generates script based on uploaded product images
- Script includes scene breakdown matching number of uploaded images
- Editable script interface with real-time preview
- Scene-by-scene breakdown display

### Step 3: Image Generation from Scenes
**User Action**: Select script sections and product images to generate scene images
- Interactive script editor where users can select paragraphs/lines
- Product image selector for each scene
- Backend creates image prompts from scene + product image
- AI generates actual scene images
- Preview generated images with approval/regeneration options

### Step 4: Image Selection & Arrangement
**User Action**: Choose final images and arrange sequence
- Gallery view of all generated images
- Drag & drop interface to rearrange image sequence
- Preview of video flow with selected images
- Option to regenerate specific images

### Step 5: Video Prompt Creation
**User Action**: Generate video prompts for animation
- Automatic video prompt generation for each selected image
- Editable prompts with animation style options
- Preview of expected animation effects

### Step 6: Video Generation
**User Action**: Send to Kling AI for animation
- Batch processing of images with video prompts
- Real-time status updates for each video generation
- Preview individual animated clips

### Step 7: Final Video Assembly
**User Action**: Review and export final video
- Automatic combination of all animated clips
- Preview final video with playback controls
- Export options and download functionality

## Detailed UI/UX Design Plans

### Step 1: Campaign Setup Interface
**Layout**: Clean, centered form with progress indicator
- **Header**: "Create New Campaign" with step 1/7 progress bar
- **Campaign Name**: Large input field with placeholder "Enter campaign name..."
- **Product Upload Section**:
  - Large drag-and-drop area with dashed border
  - "Drop images here or click to browse" message
  - Thumbnail grid below (max 5 images)
  - Each thumbnail has delete (X) button with hover animation
  - Add more button (+ icon) if under 5 images
  - Image preview modal on click
- **Validation**: Real-time validation with error messages
- **Navigation**: "Next" button (disabled until name + 1 image uploaded)

### Step 2: Script Generation Interface
**Layout**: Split-screen with script on left, controls on right
- **Header**: "Generate Script" with step 2/7 progress bar
- **Left Panel (70%)**: 
  - Loading state while generating script
  - Generated script in editable text area
  - Scene breakdown with numbered sections
  - Character count and estimated duration
- **Right Panel (30%)**:
  - Product images thumbnail stack
  - "Regenerate Script" button
  - Script settings (tone, length, style)
- **Script Editor Features**:
  - Syntax highlighting for scene breaks
  - Live word count
  - Undo/redo functionality
- **Navigation**: "Back" and "Next" buttons

### Step 3: Image Generation Interface
**Layout**: Interactive script with image generation controls
- **Header**: "Generate Scene Images" with step 3/7 progress bar
- **Main Content**:
  - Script display with selectable paragraphs/lines
  - Selected text highlighted in blue
  - Floating action panel when text selected:
    - Product image selector (thumbnail grid)
    - "Generate Image" button
    - Loading state with progress
- **Generated Images Section**:
  - Grid layout of generated images
  - Each image card shows: preview, regenerate button, approve/reject
  - Scene number label on each image
- **Side Panel**:
  - Queue of pending generations
  - History of generated images
- **Navigation**: Progress tracking, "Back" and "Next" buttons

### Step 4: Image Selection & Arrangement Interface
**Layout**: Gallery view with drag-and-drop reordering
- **Header**: "Select & Arrange Images" with step 4/7 progress bar
- **Main Gallery**:
  - Grid of all generated images
  - Checkbox selection on each image
  - Selected images have blue border and checkmark
- **Sequence Panel**:
  - Horizontal timeline showing selected images in order
  - Drag handles for reordering
  - Scene numbers and titles
- **Preview Section**:
  - Video flow preview with selected images
  - Estimated duration display
- **Actions**:
  - "Select All" / "Deselect All" buttons
  - "Regenerate Image" option on hover
- **Navigation**: "Back" and "Next" buttons

### Step 5: Video Prompt Creation Interface
**Layout**: Image cards with prompt editing
- **Header**: "Create Video Prompts" with step 5/7 progress bar
- **Image Cards Layout**:
  - Each selected image displayed as a card
  - Image preview on left, prompt editor on right
  - Auto-generated prompt with edit capabilities
  - Animation style dropdown (smooth, dramatic, explosive, etc.)
  - Duration selector (3s, 5s, 10s)
- **Prompt Templates**:
  - Quick insert buttons for common effects
  - "Product showcase", "Explosion", "Zoom in", "Rotation"
- **Preview Panel**:
  - Mock animation preview (static representation)
  - Estimated cost per video generation
- **Navigation**: "Back" and "Generate Videos" buttons

### Step 6: Video Generation Interface
**Layout**: Processing dashboard with real-time updates
- **Header**: "Generating Videos" with step 6/7 progress bar
- **Processing Queue**:
  - List of videos being processed
  - Progress bar for each video
  - Status indicators (queued, processing, completed, failed)
  - ETA estimates
- **Completed Videos Section**:
  - Preview thumbnails of completed videos
  - Play button overlay
  - Re-generate option if unsatisfied
- **Real-time Updates**:
  - WebSocket connection for live status
  - Sound notification on completion
  - Error handling with retry options
- **Navigation**: "Back" button, "Next" enabled when all complete

### Step 7: Final Video Assembly Interface
**Layout**: Video preview with export controls
- **Header**: "Final Video Preview" with step 7/7 progress bar
- **Video Player**:
  - Large video player with standard controls
  - Full-screen option
  - Timeline with scene markers
- **Assembly Options**:
  - Transition style selector
  - Background music options
  - Text overlay settings
  - Logo/branding placement
- **Export Panel**:
  - Format selection (MP4, MOV)
  - Quality options (720p, 1080p, 4K)
  - Aspect ratio (16:9, 9:16, 1:1)
  - Download button with progress
- **Navigation**: "Back" to edit, "Download" and "Create New Campaign"

## Technical Implementation Plans

### Frontend Architecture
- **React Components**: Modular step components with shared layouts
- **State Management**: Context API for campaign state across steps
- **File Upload**: Drag-and-drop with image optimization
- **Real-time Updates**: WebSocket integration for generation status
- **Animations**: Framer Motion for smooth transitions
- **Image Handling**: Next.js Image component for optimization

### Backend Architecture
- **Campaign Management**: CRUD operations for campaign data
- **File Storage**: AWS S3 for image/video storage
- **AI Integrations**: 
  - OpenAI API for script generation and image prompts
  - DALL-E/Midjourney for image generation
  - Kling AI API for video generation
- **Queue System**: Redis for managing generation jobs
- **WebSocket**: Real-time status updates
- **Video Processing**: FFmpeg for final video assembly

### API Endpoints
```
POST /api/campaigns - Create new campaign
PUT /api/campaigns/:id - Update campaign
GET /api/campaigns/:id - Get campaign data
POST /api/campaigns/:id/script - Generate script
POST /api/campaigns/:id/images - Generate scene images
POST /api/campaigns/:id/video-prompts - Create video prompts
POST /api/campaigns/:id/videos - Generate videos
POST /api/campaigns/:id/assemble - Create final video
GET /api/campaigns/:id/status - Get generation status
```

### Database Schema
```
campaigns:
- id, name, user_id, created_at, updated_at
- product_images (JSON array)
- script (text)
- generated_images (JSON array)
- selected_images (JSON array)
- video_prompts (JSON array)
- generated_videos (JSON array)
- final_video_url
- status (draft, processing, completed, failed)
```

## Process Flow Consistency with Transcript

### Alignment with Original Workflow
Our 7-step process directly maps to the transcript workflow:

1. **Campaign Setup** → Replaces manual product photo collection
2. **Script Generation** → Automates the custom GPT script creation process
3. **Image Generation** → Streamlines the ChatGPT/Sora image creation with product context
4. **Image Selection** → Organizes the manual image curation process
5. **Video Prompts** → Automates the prompt creation for Kling AI
6. **Video Generation** → Direct integration with Kling AI (as used in transcript)
7. **Final Assembly** → Replaces manual CapCut editing

### Key Improvements Over Manual Process
- **Reduced Tools**: Single platform vs 6+ separate tools
- **Automation**: Script generation considers product images automatically
- **Consistency**: Product appearance maintained across all scenes
- **Speed**: Batch processing vs individual scene creation
- **User Control**: Edit at every step while maintaining automation

## Implementation Phases

### Phase 1: MVP (Core 7-Step Flow)
**Goal**: Functional end-to-end campaign creation
- Campaign setup with image upload
- Basic script generation using product context
- Image generation from script + product images
- Simple image selection and arrangement
- Video prompt creation and Kling AI integration
- Basic video assembly and export

### Phase 2: Enhanced UX
**Goal**: Polished user experience and advanced features
- Advanced script editing with templates
- Improved image generation with style controls
- Real-time preview throughout process
- Enhanced video assembly with transitions/effects
- Performance analytics and optimization

### Phase 3: Scale & Advanced Features
**Goal**: Enterprise features and automation
- Batch campaign creation
- API access for developers
- Advanced AI model fine-tuning
- Team collaboration features
- Custom branding and white-label options

## Success Metrics & KPIs
- **Campaign Completion Rate**: % of users who complete all 7 steps
- **Time to Complete**: Average time from start to final video
- **User Satisfaction**: Quality ratings for generated content
- **AI Success Rate**: % of generated content approved by users
- **Platform Retention**: Monthly active users and churn rates

## Technical Considerations

### Scalability Requirements
- **Concurrent Users**: Support 100+ simultaneous campaign creations
- **AI Queue Management**: Handle 500+ image/video generations per hour
- **Storage Optimization**: Efficient handling of large video files
- **Global CDN**: Fast content delivery worldwide

### Cost Management
- **AI Usage Optimization**: Smart prompting to reduce API costs
- **Storage Efficiency**: Automatic cleanup of unused assets
- **Processing Optimization**: Batch operations where possible
- **User Tier Management**: Fair usage policies per subscription level

### Quality Assurance
- **Content Filtering**: Ensure generated content meets quality standards
- **Product Consistency**: Maintain visual coherence across scenes
- **Error Recovery**: Graceful handling of AI generation failures
- **User Feedback Loop**: Continuous improvement based on user ratings

This comprehensive plan provides a clear roadmap for building an automated AI video creation platform that streamlines the complex manual process demonstrated in the transcript while maintaining user control and quality output.