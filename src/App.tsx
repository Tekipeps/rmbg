import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open as openPath } from "@tauri-apps/plugin-opener";
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

  useEffect(() => {
    initializeApp();
    setupEventListeners();
  }, []);

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

      <header className="header">
        <h1>Background Removal</h1>
        <p>Remove backgrounds from images using AI models</p>
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
                <h3>{selectedImages.length} image(s) selected</h3>
                <ul className="image-list">
                  {selectedImages.map((path, idx) => (
                    <li key={idx}>{path.split(/[\\/]/).pop()}</li>
                  ))}
                </ul>
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
                            src={`file://${result.output_path}`}
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
    </div>
  );
}

export default App;
