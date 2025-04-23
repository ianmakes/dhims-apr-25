
import type { Area } from "react-easy-crop";

/**
 * Returns cropped image as base64 png
 */
export default function getCroppedImg(imageSrc: string, croppedAreaPixels: Area, zoom: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("Could not get context");
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
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = (e) => reject(e);
  });
}
