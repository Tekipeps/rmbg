import { useState, useEffect } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { openPath } from "@tauri-apps/plugin-opener";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import "./App.css";
import type {
  ModelInfo,
  ModelStatus,
  ProcessImageResult,
  DownloadProgress,
  ProcessingProgress,
} from "./types";

function App() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [modelStatuses, setModelStatuses] = useState<Map<string, ModelStatus>>(new Map());
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null);
  const [results, setResults] = useState<ProcessImageResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return (saved as "light" | "dark") || "dark";
  });

  useEffect(() => {
    initializeApp();
    setupEventListeners();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  async function initializeApp() {
    try {
      // Check if first time setup is needed
      const needsSetup = await invoke<boolean>("check_first_time_setup");
      setShowFirstTimeSetup(needsSetup);

      // Load all models
      const allModels = await invoke<ModelInfo[]>("get_all_models");
      setModels(allModels);

      // Get default model
      const defaultModel = await invoke<ModelInfo>("get_default_model");
      setSelectedModelId(defaultModel.id);

      // Load model statuses
      await refreshModelStatuses(allModels);
    } catch (error) {
      console.error("Failed to initialize app:", error);
    }
  }

  async function refreshModelStatuses(modelList: ModelInfo[]) {
    const statusMap = new Map<string, ModelStatus>();
    for (const model of modelList) {
      try {
        const status = await invoke<ModelStatus>("get_model_status", {
          modelId: model.id,
        });
        statusMap.set(model.id, status);
      } catch (error) {
        console.error(`Failed to get status for model ${model.id}:`, error);
      }
    }
    setModelStatuses(statusMap);
  }

  function setupEventListeners() {
    // Listen for download progress
    listen<DownloadProgress>("download-progress", (event) => {
      setDownloadProgress(event.payload);
    });

    // Listen for processing progress
    listen<ProcessingProgress>("processing-progress", (event) => {
      setProcessingProgress(event.payload);
    });
  }

  async function downloadDefaultModel() {
    try {
      setDownloading(true);
      const defaultModel = await invoke<ModelInfo>("get_default_model");
      await invoke("download_model", { modelId: defaultModel.id });
      setShowFirstTimeSetup(false);
      await refreshModelStatuses(models);
    } catch (error) {
      console.error("Failed to download default model:", error);
      alert(`Failed to download model: ${error}`);
    } finally {
      setDownloading(false);
      setDownloadProgress(null);
    }
  }

  async function downloadModel(modelId: string) {
    try {
      setDownloading(true);
      await invoke("download_model", { modelId });
      await refreshModelStatuses(models);
    } catch (error) {
      console.error("Failed to download model:", error);
      alert(`Failed to download model: ${error}`);
    } finally {
      setDownloading(false);
      setDownloadProgress(null);
    }
  }

  async function selectImages() {
    try {
      const selected = await openDialog({
        multiple: true,
        filters: [
          {
            name: "Image",
            extensions: ["png", "jpg", "jpeg", "webp", "bmp", "tiff"],
          },
        ],
      });

      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected];
        setSelectedImages(paths);
        setResults([]);
      }
    } catch (error) {
      console.error("Failed to select images:", error);
    }
  }

  async function processImages() {
    if (selectedImages.length === 0) {
      alert("Please select images first");
      return;
    }

    const modelStatus = modelStatuses.get(selectedModelId);
    if (!modelStatus?.downloaded) {
      alert("Please download the selected model first");
      return;
    }

    try {
      setProcessing(true);
      setResults([]);
      const processResults = await invoke<ProcessImageResult[]>("process_images", {
        request: {
          image_paths: selectedImages,
          model_id: selectedModelId,
          output_dir: null,
        },
      });
      setResults(processResults);
    } catch (error) {
      console.error("Failed to process images:", error);
      alert(`Failed to process images: ${error}`);
    } finally {
      setProcessing(false);
      setProcessingProgress(null);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imagePaths = files
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => (file as any).path);

    if (imagePaths.length > 0) {
      setSelectedImages(imagePaths);
      setResults([]);
    }
  }

  async function openFile(path: string) {
    try {
      await openPath(path);
    } catch (error) {
      console.error("Failed to open file:", error);
    }
  }

  function removeImage(index: number) {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  }

  const selectedModel = models.find((m) => m.id === selectedModelId);
  const selectedModelStatus = modelStatuses.get(selectedModelId);

  return (
    <div className="app">
      {showFirstTimeSetup && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Welcome to RMBG!</h2>
            <p>
              To get started, we need to download the default background removal
              model (U2Net, ~176MB).
            </p>
            {downloading && downloadProgress && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${downloadProgress.percentage}%` }}
                  />
                </div>
                <p className="progress-text">
                  {downloadProgress.file_name}: {downloadProgress.percentage.toFixed(1)}%
                  ({(downloadProgress.downloaded / 1024 / 1024).toFixed(1)} MB / {(downloadProgress.total / 1024 / 1024).toFixed(1)} MB)
                </p>
              </div>
            )}
            <div className="modal-buttons">
              <button
                onClick={downloadDefaultModel}
                disabled={downloading}
                className="button-primary"
              >
                {downloading ? "Downloading..." : "Download Model"}
              </button>
              <button
                onClick={() => setShowFirstTimeSetup(false)}
                disabled={downloading}
                className="button-secondary"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Settings</h2>
              <button
                className="close-button"
                onClick={() => setShowSettings(false)}
                title="Close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="settings-content">
              <div className="setting-item">
                <div className="setting-label">
                  <h3>Theme</h3>
                  <p className="setting-description">Choose your preferred color theme</p>
                </div>
                <div className="theme-toggle">
                  <button
                    className={`theme-option ${theme === "light" ? "active" : ""}`}
                    onClick={() => setTheme("light")}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                    Light
                  </button>
                  <button
                    className={`theme-option ${theme === "dark" ? "active" : ""}`}
                    onClick={() => setTheme("dark")}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                    Dark
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="header">
        <div className="header-content">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 28L14 4L18 14L26 2" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="14" cy="4" r="2.5" fill="url(#gradient)"/>
              <path d="M22 8L20 12L24 14L28 10" stroke="url(#gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <defs>
                <linearGradient id="gradient" x1="6" y1="2" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#818cf8"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <button
            className="settings-button"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m0-18a2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2Z"></path>
            </svg>
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="sidebar">
          <div className="section">
            <h2>Model Selection</h2>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="model-select"
              disabled={processing || downloading}
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                  {modelStatuses.get(model.id)?.downloaded ? " ✓" : ""}
                </option>
              ))}
            </select>

            {selectedModel && (
              <div className="model-info">
                <p className="model-description">{selectedModel.description}</p>
                <p className="model-size">
                  Size: {selectedModel.files.reduce((sum, f) => sum + f.size_mb, 0)} MB
                </p>
                {selectedModelStatus && !selectedModelStatus.downloaded && (
                  <button
                    onClick={() => downloadModel(selectedModelId)}
                    disabled={downloading || processing}
                    className="button-primary"
                  >
                    Download Model
                  </button>
                )}
                {selectedModelStatus?.downloaded && (
                  <p className="model-downloaded">✓ Model Downloaded</p>
                )}
              </div>
            )}

            {downloading && downloadProgress && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${downloadProgress.percentage}%` }}
                  />
                </div>
                <p className="progress-text">
                  {downloadProgress.percentage.toFixed(1)}%
                </p>
              </div>
            )}
          </div>

          <div className="section">
            <h2>Available Models</h2>
            <div className="models-list">
              {models.map((model) => {
                const status = modelStatuses.get(model.id);
                return (
                  <div key={model.id} className="model-item">
                    <div className="model-item-header">
                      <span className="model-name">{model.name}</span>
                      {status?.downloaded && <span className="status-badge">✓</span>}
                    </div>
                    <p className="model-item-description">{model.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="main-panel">
          <div className="section">
            <h2>Select Images</h2>
            <div
              className={`drop-zone ${isDragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={selectImages}
            >
              <p className="drop-zone-text">
                Drag and drop images here or click to select
              </p>
              <p className="drop-zone-hint">
                Supports: PNG, JPG, JPEG, WebP, BMP, TIFF
              </p>
            </div>

            {selectedImages.length > 0 && (
              <div className="selected-images">
                <div className="selected-header">
                  <h3>{selectedImages.length} image(s) selected</h3>
                  <button
                    onClick={() => setSelectedImages([])}
                    className="button-text"
                  >
                    Clear All
                  </button>
                </div>
                <div className="image-grid">
                  {selectedImages.map((path, idx) => (
                    <div key={`${path}-${idx}`} className="image-preview-item">
                      <div className="image-preview-wrapper">
                        <img
                          src={convertFileSrc(path)}
                          alt={`Selected ${idx}`}
                          className="image-preview"
                        />
                        <button
                          className="remove-image-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(idx);
                          }}
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                      <p className="image-name" title={path}>{path.split(/[\\/]/).pop()}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={processImages}
                  disabled={processing || downloading || !selectedModelStatus?.downloaded}
                  className="button-primary button-large"
                >
                  {processing ? "Processing..." : "Remove Background"}
                </button>
              </div>
            )}

            {processing && processingProgress && (
              <div className="progress-container">
                <p className="progress-text">
                  Processing {processingProgress.file_name}...
                </p>
                <p className="progress-text">
                  {processingProgress.current} / {processingProgress.total}
                </p>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(processingProgress.current / processingProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {results.length > 0 && (
            <div className="section">
              <h2>Results</h2>
              <div className="results-grid">
                {results.map((result, idx) => (
                  <div key={idx} className="result-item">
                    {result.success ? (
                      <>
                        <div className="result-image-container">
                          <img
                            src={convertFileSrc(result.output_path)}
                            alt={`Processed ${idx + 1}`}
                            className="result-image"
                          />
                        </div>
                        <p className="result-filename">
                          {result.output_path.split(/[\\/]/).pop()}
                        </p>
                        <button
                          onClick={() => openFile(result.output_path)}
                          className="button-secondary"
                        >
                          Open File
                        </button>
                      </>
                    ) : (
                      <div className="result-error">
                        <p>❌ Failed to process</p>
                        <p className="error-message">{result.error}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>
          made with ❤️ by{" "}
          <a href="https://tekipeps.com" target="_blank" rel="noopener noreferrer">
            tekipeps
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
