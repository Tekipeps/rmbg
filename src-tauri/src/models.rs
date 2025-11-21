use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    pub files: Vec<ModelFile>,
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelFile {
    pub name: String,
    pub url: String,
    pub size_mb: u32,
}

pub fn get_all_models() -> Vec<ModelInfo> {
    vec![
        ModelInfo {
            id: "u2net".to_string(),
            name: "U2Net".to_string(),
            description: "A pre-trained model for general use cases.".to_string(),
            files: vec![ModelFile {
                name: "u2net.onnx".to_string(),
                url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx".to_string(),
                size_mb: 176,
            }],
            is_default: true,
        },
        ModelInfo {
            id: "u2netp".to_string(),
            name: "U2Net-P".to_string(),
            description: "A lightweight version of u2net model.".to_string(),
            files: vec![ModelFile {
                name: "u2netp.onnx".to_string(),
                url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx".to_string(),
                size_mb: 4,
            }],
            is_default: false,
        },
        ModelInfo {
            id: "u2net_human_seg".to_string(),
            name: "U2Net Human Seg".to_string(),
            description: "A pre-trained model for human segmentation.".to_string(),
            files: vec![ModelFile {
                name: "u2net_human_seg.onnx".to_string(),
                url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net_human_seg.onnx".to_string(),
                size_mb: 176,
            }],
            is_default: false,
        },
        ModelInfo {
            id: "u2net_cloth_seg".to_string(),
            name: "U2Net Cloth Seg".to_string(),
            description: "A pre-trained model for cloth parsing (Upper body, Lower body, Full body).".to_string(),
            files: vec![ModelFile {
                name: "u2net_cloth_seg.onnx".to_string(),
                url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net_cloth_seg.onnx".to_string(),
                size_mb: 176,
            }],
            is_default: false,
        },
        ModelInfo {
            id: "silueta".to_string(),
            name: "Silueta".to_string(),
            description: "Same as u2net but reduced to 43MB.".to_string(),
            files: vec![ModelFile {
                name: "silueta.onnx".to_string(),
                url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/silueta.onnx".to_string(),
                size_mb: 43,
            }],
            is_default: false,
        },
        ModelInfo {
            id: "isnet-general-use".to_string(),
            name: "ISNet General".to_string(),
            description: "A new pre-trained model for general use cases.".to_string(),
            files: vec![ModelFile {
                name: "isnet-general-use.onnx".to_string(),
                url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx".to_string(),
                size_mb: 176,
            }],
            is_default: false,
        },
        ModelInfo {
            id: "isnet-anime".to_string(),
            name: "ISNet Anime".to_string(),
            description: "High-accuracy segmentation for anime characters.".to_string(),
            files: vec![ModelFile {
                name: "isnet-anime.onnx".to_string(),
                url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-anime.onnx".to_string(),
                size_mb: 176,
            }],
            is_default: false,
        },
        ModelInfo {
            id: "sam".to_string(),
            name: "SAM".to_string(),
            description: "Segment Anything Model for any use cases.".to_string(),
            files: vec![
                ModelFile {
                    name: "sam_vit_b_01ec64-encoder.onnx".to_string(),
                    url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/vit_b-encoder-quant.onnx".to_string(),
                    size_mb: 180,
                },
                ModelFile {
                    name: "sam_vit_b_01ec64-decoder.onnx".to_string(),
                    url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/vit_b-decoder-quant.onnx".to_string(),
                    size_mb: 16,
                },
            ],
            is_default: false,
        },
        ModelInfo {
            id: "birefnet-general".to_string(),
            name: "BiRefNet General".to_string(),
            description: "A pre-trained model for general use cases.".to_string(),
            files: vec![ModelFile {
                name: "BiRefNet-general-epoch_244.onnx".to_string(),
                url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-epoch_244.onnx".to_string(),
                size_mb: 223,
            }],
            is_default: false,
        },
        ModelInfo {
            id: "birefnet-general-lite".to_string(),
            name: "BiRefNet General Lite".to_string(),
            description: "A light pre-trained model for general use cases.".to_string(),
            files: vec![ModelFile {
                name: "BiRefNet-general-bb_swin_v1_tiny-epoch_232.onnx".to_string(),
                url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-bb_swin_v1_tiny-epoch_232.onnx".to_string(),
                size_mb: 130,
            }],
            is_default: false,
        },
        ModelInfo {
            id: "birefnet-portrait".to_string(),
            name: "BiRefNet Portrait".to_string(),
            description: "A pre-trained model for human portraits.".to_string(),
            files: vec![ModelFile {
                name: "BiRefNet-portrait-epoch_150.onnx".to_string(),
                url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-portrait-epoch_150.onnx".to_string(),
                size_mb: 223,
            }],
            is_default: false,
        },
        ModelInfo {
            id: "birefnet-dis".to_string(),
            name: "BiRefNet DIS".to_string(),
            description: "A pre-trained model for dichotomous image segmentation (DIS).".to_string(),
            files: vec![ModelFile {
                name: "BiRefNet-DIS-epoch_590.onnx".to_string(),
                url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-DIS-epoch_590.onnx".to_string(),
                size_mb: 223,
            }],
            is_default: false,
        },
        ModelInfo {
            id: "birefnet-hrsod".to_string(),
            name: "BiRefNet HRSOD".to_string(),
            description: "A pre-trained model for high-resolution salient object detection (HRSOD).".to_string(),
            files: vec![ModelFile {
                name: "BiRefNet-HRSOD_DHU-epoch_115.onnx".to_string(),
                url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-HRSOD_DHU-epoch_115.onnx".to_string(),
                size_mb: 223,
            }],
            is_default: false,
        },
        ModelInfo {
            id: "birefnet-cod".to_string(),
            name: "BiRefNet COD".to_string(),
            description: "A pre-trained model for concealed object detection (COD).".to_string(),
            files: vec![ModelFile {
                name: "BiRefNet-COD-epoch_125.onnx".to_string(),
                url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-COD-epoch_125.onnx".to_string(),
                size_mb: 223,
            }],
            is_default: false,
        },
        ModelInfo {
            id: "birefnet-massive".to_string(),
            name: "BiRefNet Massive".to_string(),
            description: "A pre-trained model with massive dataset.".to_string(),
            files: vec![ModelFile {
                name: "BiRefNet-massive-epoch_240.onnx".to_string(),
                url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-massive-epoch_240.onnx".to_string(),
                size_mb: 223,
            }],
            is_default: false,
        },
    ]
}

pub fn get_default_model() -> ModelInfo {
    get_all_models()
        .into_iter()
        .find(|m| m.is_default)
        .expect("No default model configured")
}

pub fn get_model_by_id(id: &str) -> Option<ModelInfo> {
    get_all_models().into_iter().find(|m| m.id == id)
}

pub fn get_models_dir() -> anyhow::Result<PathBuf> {
    let home = directories::BaseDirs::new()
        .ok_or_else(|| anyhow::anyhow!("Could not determine home directory"))?;
    let models_dir = home.home_dir().join(".u2net");

    if !models_dir.exists() {
        std::fs::create_dir_all(&models_dir)?;
    }

    Ok(models_dir)
}

pub fn is_model_downloaded(model_id: &str) -> anyhow::Result<bool> {
    let model = get_model_by_id(model_id)
        .ok_or_else(|| anyhow::anyhow!("Model not found: {}", model_id))?;

    let models_dir = get_models_dir()?;

    // Check if all files for this model exist
    for file in &model.files {
        let file_path = models_dir.join(&file.name);
        if !file_path.exists() {
            return Ok(false);
        }
    }

    Ok(true)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelStatus {
    pub model: ModelInfo,
    pub downloaded: bool,
    pub file_paths: Vec<String>,
}

pub fn get_model_status(model_id: &str) -> anyhow::Result<ModelStatus> {
    let model = get_model_by_id(model_id)
        .ok_or_else(|| anyhow::anyhow!("Model not found: {}", model_id))?;

    let models_dir = get_models_dir()?;
    let downloaded = is_model_downloaded(model_id)?;

    let file_paths: Vec<String> = model
        .files
        .iter()
        .map(|f| models_dir.join(&f.name).to_string_lossy().to_string())
        .collect();

    Ok(ModelStatus {
        model,
        downloaded,
        file_paths,
    })
}
