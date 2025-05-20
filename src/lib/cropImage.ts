
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
