
import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Cropper from "react-easy-crop";
import { Camera, UploadCloud } from "lucide-react";
import getCroppedImg from "@/lib/cropImage";

interface ImageUploadCropperProps {
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: number;
}

const ImageUploadCropper = ({ value, onChange, aspectRatio = 1 }: ImageUploadCropperProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setTempImage(reader.result as string);
        setIsDialogOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropImage = async () => {
    if (tempImage && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(tempImage, croppedAreaPixels, zoom);
        onChange(croppedImage);
        setIsDialogOpen(false);
      } catch (e) {
        console.error("Error cropping image:", e);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative w-28 h-28 bg-gray-100 rounded-md overflow-hidden border">
          {value ? (
            <img
              src={value}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("image-upload")?.click()}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload Image
          </Button>
          <input
            id="image-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          <p className="text-sm text-muted-foreground">
            Upload a profile image. Square images work best.
          </p>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>
          <div className="relative h-[300px] w-full bg-black">
            {tempImage && (
              <Cropper
                image={tempImage}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                objectFit="contain"
              />
            )}
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCropImage}>Apply</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageUploadCropper;
