
import React, { useRef, useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

/**
 * Helper to convert cropped area to blob
 */
async function cropImageToBlob(imageSrc: string, crop: any, zoom: number): Promise<Blob> {
  try {
    const croppedImage = await getCroppedImg(imageSrc, crop, zoom);
    const response = await fetch(croppedImage);
    if (!response.ok) {
      throw new Error(`Failed to fetch cropped image: ${response.status}`);
    }
    return await response.blob();
  } catch (error) {
    console.error("Error in cropImageToBlob:", error);
    throw error;
  }
}

interface ImageUploadCropperProps {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
  aspectRatio?: number;
}

export default function ImageUploadCropper({ 
  value, 
  onChange, 
  label="Profile Image",
  aspectRatio = 1 
}: ImageUploadCropperProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropping, setCropping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const open = useCallback(() => fileInputRef.current?.click(), []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.addEventListener('load', () => {
        // Set the image source to trigger the cropper
        setImageSrc(reader.result as string);
      });
      
      reader.readAsDataURL(file);
    }
    e.target.value = ""; // Reset input value
  };

  const handleCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCrop = async () => {
    setCropping(true);
    try {
      if (!imageSrc || !croppedAreaPixels) {
        toast({ title: "Error", description: "No image to crop", variant: "destructive" });
        return;
      }
      
      const blob = await cropImageToBlob(imageSrc, croppedAreaPixels, zoom);

      // Upload to Supabase storage
      const filePath = `students/${Date.now()}.png`;
      const { supabase } = await import("@/integrations/supabase/client");
      
      const { data, error } = await supabase.storage.from("profile-images").upload(filePath, blob, {
        cacheControl: "3600",
        upsert: true,
        contentType: "image/png",
      });
      
      if (error) {
        console.error("Storage upload error:", error);
        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(filePath);
      onChange(urlData?.publicUrl || "");
      setImageSrc(null);
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (err: any) {
      console.error("Failed to upload/crop image:", err);
      toast({ 
        title: "Error", 
        description: err.message || "Failed to upload/crop image", 
        variant: "destructive" 
      });
    } finally {
      setCropping(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    setImageSrc(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {value ? (
          <div className="relative group">
            <img 
              src={value} 
              alt="profile" 
              className="rounded-md w-24 h-24 object-cover" 
              onError={() => {
                console.error("Failed to load image:", value);
                toast({
                  title: "Image Error",
                  description: "Failed to load image",
                  variant: "destructive"
                });
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
              <button 
                type="button" 
                className="p-1 bg-white rounded-full" 
                onClick={handleRemove}
                aria-label="Remove image"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={open} className="flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload {label}
          </Button>
        )}
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={onFileChange}
        />
      </div>
      
      {imageSrc && (
        <div className="fixed z-50 inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[90%] max-w-md flex flex-col">
            <h3 className="text-lg font-medium mb-4">Crop Image</h3>
            <div className="relative w-full h-64 bg-gray-100 rounded-md overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Zoom</span>
                  <span className="text-sm text-gray-500">{zoom.toFixed(1)}x</span>
                </div>
                <Slider
                  min={1}
                  max={3}
                  step={0.1}
                  value={[zoom]}
                  onValueChange={(value) => setZoom(value[0])}
                />
              </div>
            </div>
            
            <div className="flex gap-4 mt-6 justify-end">
              <Button type="button" variant="outline" onClick={() => setImageSrc(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleCrop} disabled={cropping}>
                {cropping ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
