use anyhow::Result;
use image::{DynamicImage, GenericImageView, ImageBuffer, Rgba};
use ndarray::{Array, Array4, Axis};
use ort::{Session, SessionOutputs};
use std::path::Path;

pub struct BackgroundRemover {
    session: Session,
}

impl BackgroundRemover {
    pub fn new(model_path: &Path) -> Result<Self> {
        let session = Session::builder()?
            .with_optimization_level(ort::GraphOptimizationLevel::Level3)?
            .commit_from_file(model_path)?;

        Ok(Self { session })
    }

    pub fn remove_background(&self, input_image: &DynamicImage) -> Result<DynamicImage> {
        let (orig_width, orig_height) = input_image.dimensions();

        // Preprocess image
        let input_tensor = self.preprocess_image(input_image)?;

        // Run inference
        let outputs: SessionOutputs = self.session.run(ort::inputs![input_tensor]?)?;

        // Get the output tensor
        let output = outputs[0]
            .try_extract_tensor::<f32>()?
            .into_dimensionality::<ndarray::Ix4>()?;

        // Post-process to get mask
        let mask = self.postprocess_output(output, orig_width, orig_height)?;

        // Apply mask to original image
        let result = self.apply_mask(input_image, &mask)?;

        Ok(result)
    }

    fn preprocess_image(&self, image: &DynamicImage) -> Result<Array4<f32>> {
        // Resize to 320x320 (standard input size for U2Net models)
        let resized = image.resize_exact(320, 320, image::imageops::FilterType::Lanczos3);
        let rgb = resized.to_rgb8();

        // Convert to ndarray and normalize
        let mut input = Array4::<f32>::zeros((1, 3, 320, 320));

        for y in 0..320 {
            for x in 0..320 {
                let pixel = rgb.get_pixel(x, y);
                // Normalize to [0, 1]
                input[[0, 0, y as usize, x as usize]] = pixel[0] as f32 / 255.0;
                input[[0, 1, y as usize, x as usize]] = pixel[1] as f32 / 255.0;
                input[[0, 2, y as usize, x as usize]] = pixel[2] as f32 / 255.0;
            }
        }

        Ok(input)
    }

    fn postprocess_output(
        &self,
        output: ndarray::ArrayView4<f32>,
        target_width: u32,
        target_height: u32,
    ) -> Result<ImageBuffer<image::Luma<u8>, Vec<u8>>> {
        // Get the first output (batch=0)
        let mask = output.index_axis(Axis(0), 0);

        // Find min and max for normalization
        let min = mask
            .iter()
            .fold(f32::INFINITY, |a, &b| a.min(b));
        let max = mask
            .iter()
            .fold(f32::NEG_INFINITY, |a, &b| a.max(b));
        let range = max - min;

        // Get dimensions
        let (channels, height, width) = mask.dim();

        // Take first channel if multi-channel
        let channel_data = if channels > 0 {
            mask.index_axis(Axis(0), 0)
        } else {
            return Err(anyhow::anyhow!("Invalid output dimensions"));
        };

        // Create normalized mask
        let mut mask_img = ImageBuffer::new(width as u32, height as u32);
        for y in 0..height {
            for x in 0..width {
                let val = channel_data[[y, x]];
                let normalized = if range > 0.0 {
                    ((val - min) / range * 255.0) as u8
                } else {
                    0
                };
                mask_img.put_pixel(x as u32, y as u32, image::Luma([normalized]));
            }
        }

        // Resize mask to original image size
        let resized_mask = image::imageops::resize(
            &mask_img,
            target_width,
            target_height,
            image::imageops::FilterType::Lanczos3,
        );

        Ok(resized_mask)
    }

    fn apply_mask(
        &self,
        image: &DynamicImage,
        mask: &ImageBuffer<image::Luma<u8>, Vec<u8>>,
    ) -> Result<DynamicImage> {
        let rgba = image.to_rgba8();
        let (width, height) = rgba.dimensions();

        let mut result = ImageBuffer::new(width, height);

        for y in 0..height {
            for x in 0..width {
                let pixel = rgba.get_pixel(x, y);
                let mask_value = mask.get_pixel(x, y)[0];

                result.put_pixel(
                    x,
                    y,
                    Rgba([pixel[0], pixel[1], pixel[2], mask_value]),
                );
            }
        }

        Ok(DynamicImage::ImageRgba8(result))
    }
}

pub fn process_image(model_path: &Path, input_path: &Path, output_path: &Path) -> Result<()> {
    // Load input image
    let input_image = image::open(input_path)?;

    // Create background remover
    let remover = BackgroundRemover::new(model_path)?;

    // Process image
    let result = remover.remove_background(&input_image)?;

    // Save result
    result.save(output_path)?;

    Ok(())
}
