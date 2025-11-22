mod downloader;
mod models;
mod processor;

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{Emitter, Window};

#[derive(Clone, Serialize)]
struct DownloadProgressPayload {
    model_id: String,
    file_name: String,
    downloaded: u64,
    total: u64,
    percentage: f64,
}

#[derive(Clone, Serialize)]
struct ProcessingProgressPayload {
    current: usize,
    total: usize,
    file_name: String,
}

// Model management commands

#[tauri::command]
fn get_all_models() -> Vec<models::ModelInfo> {
    models::get_all_models()
}

#[tauri::command]
fn get_default_model() -> models::ModelInfo {
    models::get_default_model()
}

#[tauri::command]
fn get_model_status(model_id: String) -> Result<models::ModelStatus, String> {
    models::get_model_status(&model_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn is_model_downloaded(model_id: String) -> Result<bool, String> {
    models::is_model_downloaded(&model_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_models_dir() -> Result<String, String> {
    models::get_models_dir()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn download_model(model_id: String, window: Window) -> Result<(), String> {
    let model = models::get_model_by_id(&model_id)
        .ok_or_else(|| format!("Model not found: {}", model_id))?;

    let models_dir = models::get_models_dir().map_err(|e| e.to_string())?;

    for file in &model.files {
        let dest_path = models_dir.join(&file.name);

        // Skip if file already exists
        if dest_path.exists() {
            continue;
        }

        let model_id_clone = model_id.clone();
        let file_name = file.name.clone();
        let window_clone = window.clone();

        downloader::download_file(&file.url, &dest_path, move |progress| {
            let percentage = if progress.total > 0 {
                (progress.downloaded as f64 / progress.total as f64) * 100.0
            } else {
                0.0
            };

            let _ = window_clone.emit(
                "download-progress",
                DownloadProgressPayload {
                    model_id: model_id_clone.clone(),
                    file_name: file_name.clone(),
                    downloaded: progress.downloaded,
                    total: progress.total,
                    percentage,
                },
            );
        })
        .await
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

// Image processing commands

#[derive(Debug, Serialize, Deserialize)]
struct ProcessImageRequest {
    image_paths: Vec<String>,
    model_id: String,
    output_dir: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ProcessImageResult {
    input_path: String,
    output_path: String,
    success: bool,
    error: Option<String>,
}

#[tauri::command]
async fn process_images(
    request: ProcessImageRequest,
    window: Window,
) -> Result<Vec<ProcessImageResult>, String> {
    let model = models::get_model_by_id(&request.model_id)
        .ok_or_else(|| format!("Model not found: {}", request.model_id))?;

    let models_dir = models::get_models_dir().map_err(|e| e.to_string())?;

    // Get the model file path (use first file for single-file models)
    let model_file = model
        .files
        .first()
        .ok_or_else(|| "Model has no files".to_string())?;
    let model_path = models_dir.join(&model_file.name);

    if !model_path.exists() {
        return Err(format!(
            "Model file not found. Please download the model first."
        ));
    }

    let mut results = Vec::new();
    let total = request.image_paths.len();

    for (index, input_path) in request.image_paths.iter().enumerate() {
        let input_path_buf = PathBuf::from(input_path);

        // Emit progress
        let _ = window.emit(
            "processing-progress",
            ProcessingProgressPayload {
                current: index + 1,
                total,
                file_name: input_path_buf
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string(),
            },
        );

        // Determine output path
        let output_path = if let Some(ref output_dir) = request.output_dir {
            let file_stem = input_path_buf
                .file_stem()
                .ok_or_else(|| "Invalid input file name".to_string())?;
            PathBuf::from(output_dir).join(format!("{}_no_bg.png", file_stem.to_string_lossy()))
        } else {
            let file_stem = input_path_buf
                .file_stem()
                .ok_or_else(|| "Invalid input file name".to_string())?;
            let parent = input_path_buf
                .parent()
                .ok_or_else(|| "Invalid input file path".to_string())?;
            parent.join(format!("{}_no_bg.png", file_stem.to_string_lossy()))
        };

        // Process the image
        let result = match processor::process_image(&model_path, &input_path_buf, &output_path) {
            Ok(_) => ProcessImageResult {
                input_path: input_path.clone(),
                output_path: output_path.to_string_lossy().to_string(),
                success: true,
                error: None,
            },
            Err(e) => ProcessImageResult {
                input_path: input_path.clone(),
                output_path: String::new(),
                success: false,
                error: Some(e.to_string()),
            },
        };

        results.push(result);
    }

    Ok(results)
}

#[tauri::command]
fn check_first_time_setup() -> Result<bool, String> {
    let default_model = models::get_default_model();
    models::is_model_downloaded(&default_model.id)
        .map(|downloaded| !downloaded)
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_all_models,
            get_default_model,
            get_model_status,
            is_model_downloaded,
            get_models_dir,
            download_model,
            process_images,
            check_first_time_setup,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
