
import type { Area } from "react-easy-crop";

/**
 * Returns cropped image as base64 png with improved quality and aspect ratio preservation
 */
export default function getCroppedImg(imageSrc: string, croppedAreaPixels: Area, zoom: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;
    
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) return reject("Could not get context");
      
      // Set canvas dimensions to match cropped area
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      
      // Fill with white background first to handle transparent images
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Apply high quality image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      
      // Draw the cropped image onto the canvas
      try {
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );
        
        // Get image data at best quality
        const dataUrl = canvas.toDataURL("image/png", 1.0);
        resolve(dataUrl);
      } catch (e) {
        reject(`Error drawing image to canvas: ${e}`);
      }
    };
    
    image.onerror = (e) => reject(`Error loading image: ${e}`);
  });
}

/**
 * Helper to maintain aspect ratio while resizing images
 */
export function getResizedDimensions(
  originalWidth: number, 
  originalHeight: number, 
  maxWidth: number, 
  maxHeight: number
): { width: number, height: number } {
  // Calculate aspect ratio
  const aspectRatio = originalWidth / originalHeight;
  
  // Start with maximum dimensions
  let newWidth = maxWidth;
  let newHeight = maxHeight;
  
  // Adjust dimensions while maintaining aspect ratio
  if (maxWidth / maxHeight > aspectRatio) {
    // Height is the limiting factor
    newWidth = maxHeight * aspectRatio;
  } else {
    // Width is the limiting factor
    newHeight = maxWidth / aspectRatio;
  }
  
  return { width: Math.round(newWidth), height: Math.round(newHeight) };
}

/**
 * Create cropped image with specified dimensions while maintaining aspect ratio
 */
export function createCroppedImageWithAspect(
  imageUrl: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    
    img.onload = () => {
      // Calculate source dimensions to maintain aspect ratio
      const sourceAspect = img.width / img.height;
      const targetAspect = targetWidth / targetHeight;
      
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = img.width;
      let sourceHeight = img.height;
      
      // Crop source image to match target aspect ratio
      if (sourceAspect > targetAspect) {
        // Image is wider than target aspect ratio
        sourceWidth = img.height * targetAspect;
        sourceX = (img.width - sourceWidth) / 2;
      } else if (sourceAspect < targetAspect) {
        // Image is taller than target aspect ratio
        sourceHeight = img.width / targetAspect;
        sourceY = (img.height - sourceHeight) / 2;
      }
      
      // Create canvas and draw cropped image
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return reject("Could not get canvas context");
      
      // Use high quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      
      // Draw image with proper cropping
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight, 
        0, 0, targetWidth, targetHeight
      );
      
      // Return as data URL
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      resolve(dataUrl);
    };
    
    img.onerror = (e) => reject(`Error loading image: ${e}`);
  });
}
