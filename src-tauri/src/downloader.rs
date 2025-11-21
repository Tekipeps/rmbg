use anyhow::Result;
use futures_util::StreamExt;
use std::path::Path;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;

pub struct DownloadProgress {
    pub downloaded: u64,
    pub total: u64,
}

pub async fn download_file(
    url: &str,
    dest_path: &Path,
    progress_callback: impl Fn(DownloadProgress),
) -> Result<()> {
    let client = reqwest::Client::new();
    let response = client.get(url).send().await?;

    if !response.status().is_success() {
        return Err(anyhow::anyhow!(
            "Failed to download file: HTTP {}",
            response.status()
        ));
    }

    let total_size = response.content_length().unwrap_or(0);

    // Create parent directory if it doesn't exist
    if let Some(parent) = dest_path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }

    let mut file = File::create(dest_path).await?;
    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk?;
        file.write_all(&chunk).await?;
        downloaded += chunk.len() as u64;

        progress_callback(DownloadProgress {
            downloaded,
            total: total_size,
        });
    }

    file.flush().await?;
    Ok(())
}
