
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface ImageUploadCropperProps {
  aspectRatio?: number;
  circularCrop?: boolean;
  onImageCropped: (blob: Blob) => void;
  onCancel: () => void;
}

export function ImageUploadCropper({
  aspectRatio = 1,
  circularCrop = false,
  onImageCropped,
  onCancel,
}: ImageUploadCropperProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setSrc(reader.result?.toString() || null);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const getCroppedImg = async (
    image: HTMLImageElement,
    crop: PixelCrop
  ): Promise<Blob> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width;
    canvas.height = crop.height;

    if (circularCrop) {
      ctx.beginPath();
      ctx.arc(
        crop.width / 2,
        crop.height / 2,
        Math.min(crop.width, crop.height) / 2,
        0,
        2 * Math.PI
      );
      ctx.clip();
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error("Canvas is empty");
        }
        resolve(blob);
      }, "image/png");
    });
  };

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop) return;

    try {
      setIsLoading(true);
      const croppedImg = await getCroppedImg(imgRef.current, completedCrop);
      onImageCropped(croppedImg);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!src) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-6">
        <div className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg p-4 text-center">
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-2">
            Click to upload or drag and drop
          </p>
          <input
            type="file"
            onChange={onSelectFile}
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-center">
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={aspectRatio}
          circularCrop={circularCrop}
        >
          <img
            ref={imgRef}
            src={src}
            alt="Crop preview"
            style={{ maxHeight: "300px" }}
          />
        </ReactCrop>
      </div>
      <div className="flex justify-end space-x-2 mt-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleCropComplete} disabled={isLoading || !completedCrop}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Apply"
          )}
        </Button>
      </div>
    </div>
  );
}
