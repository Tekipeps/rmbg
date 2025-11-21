# RMBG - Desktop Background Removal App

A desktop application for removing backgrounds from images using AI models, built with Tauri, React, and TypeScript.

## Features

- **Multiple AI Models**: Support for 15 different background removal models including U2Net, BiRefNet, ISNet, and more
- **Model Management**: Download and manage models within the app
- **Batch Processing**: Process multiple images at once
- **Drag and Drop**: Easy image selection via drag-and-drop or file picker
- **Progress Tracking**: Real-time progress indicators for downloads and processing
- **First-Time Setup**: Automatic prompt to download the default model on first launch
- **Local Storage**: All models are stored locally in `~/.u2net` directory

## Available Models

1. **U2Net** (176 MB) - Default model for general use cases
2. **U2Net-P** (4 MB) - Lightweight version
3. **U2Net Human Seg** (176 MB) - Human segmentation
4. **U2Net Cloth Seg** (176 MB) - Clothing parsing
5. **Silueta** (43 MB) - Compact general model
6. **ISNet General** (176 MB) - Improved segmentation
7. **ISNet Anime** (176 MB) - Anime character segmentation
8. **SAM** (196 MB) - Segment Anything Model
9. **BiRefNet General** (223 MB) - General use cases
10. **BiRefNet General Lite** (130 MB) - Lightweight version
11. **BiRefNet Portrait** (223 MB) - Human portraits
12. **BiRefNet DIS** (223 MB) - Dichotomous image segmentation
13. **BiRefNet HRSOD** (223 MB) - High-resolution salient object detection
14. **BiRefNet COD** (223 MB) - Concealed object detection
15. **BiRefNet Massive** (223 MB) - Trained on massive dataset

## Prerequisites

### System Dependencies

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y \
    libgtk-3-dev \
    libwebkit2gtk-4.1-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libssl-dev \
    pkg-config

# Fedora
sudo dnf install gtk3-devel webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel openssl-devel

# Arch Linux
sudo pacman -S gtk3 webkit2gtk-4.1 libappindicator-gtk3 librsvg openssl
```

#### macOS
```bash
# Install Xcode Command Line Tools
xcode-select --install
```

#### Windows
No additional dependencies required.

### Development Dependencies

- **Node.js** 18+ or **Bun** 1.0+
- **Rust** 1.70+
- **Cargo**

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd rmbg
```

2. Install frontend dependencies:
```bash
bun install
# or
npm install
```

3. Run the development server:
```bash
bun run tauri dev
# or
npm run tauri dev
```

## Building

To create a production build:

```bash
bun run tauri build
# or
npm run tauri build
```

The built application will be in `src-tauri/target/release/bundle/`.

## Usage

1. **First Launch**: On first launch, the app will prompt you to download the default U2Net model (~176 MB).

2. **Select Images**:
   - Click the drop zone to select images via file picker
   - Or drag and drop images directly into the app
   - Supports: PNG, JPG, JPEG, WebP, BMP, TIFF

3. **Choose Model**:
   - Select a model from the dropdown in the sidebar
   - Download additional models as needed
   - Downloaded models are marked with a ✓

4. **Process Images**:
   - Click "Remove Background" to process selected images
   - Progress is shown in real-time
   - Processed images are saved with `_no_bg.png` suffix in the same directory

5. **View Results**:
   - Processed images are displayed in the results grid
   - Click "Open File" to view the processed image in your default image viewer

## Architecture

### Backend (Rust)
- **`models.rs`**: Model metadata and configuration
- **`downloader.rs`**: HTTP download functionality with progress tracking
- **`processor.rs`**: ONNX Runtime integration for background removal
- **`lib.rs`**: Tauri commands and application entry point

### Frontend (React + TypeScript)
- **`App.tsx`**: Main application component
- **`types.ts`**: TypeScript type definitions
- **`App.css`**: Application styling

### Technologies Used
- **Tauri 2**: Cross-platform desktop framework
- **React 19**: UI framework
- **TypeScript**: Type-safe development
- **ONNX Runtime**: ML model inference
- **Rust**: High-performance backend
- **Vite**: Fast build tool

## Model Storage

All models are stored in the `~/.u2net` directory in your home folder. You can manually delete models from this directory to free up space.

## Troubleshooting

### Linux Build Issues

If you encounter build errors related to GTK or WebKit, ensure all system dependencies are installed:

```bash
# Check if pkg-config can find GTK
pkg-config --modversion gtk+-3.0

# Check if WebKit is available
pkg-config --modversion webkit2gtk-4.1
```

### ONNX Runtime Issues

The ONNX Runtime binaries are automatically downloaded during build. If you encounter issues:

1. Ensure you have a stable internet connection
2. Try cleaning and rebuilding:
```bash
cd src-tauri
cargo clean
cd ..
bun run tauri build
```

### Model Download Issues

If model downloads fail:
1. Check your internet connection
2. Verify you have write permissions to `~/.u2net`
3. Try downloading the model again from the app

## Performance Tips

- **Model Selection**: Lighter models (U2Net-P, Silueta) process faster but may be less accurate
- **Batch Processing**: Process multiple images at once for better efficiency
- **Storage**: Keep only the models you need to save disk space

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Your License Here]

## Credits

- Models from [rembg](https://github.com/danielgatis/rembg) project
- Built with [Tauri](https://tauri.app/)
- ONNX Runtime for model inference
