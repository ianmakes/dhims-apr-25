
import React, { useRef, useState } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import { Button } from "@/components/ui/button";
import { Upload, Image, X } from "lucide-react";

/**
 * Helper to convert cropped area to blob
 */
async function cropImageToBlob(imageSrc: string, crop: any, zoom: number): Promise<Blob> {
  const croppedImage = await getCroppedImg(imageSrc, crop, zoom);
  const bstr = atob(croppedImage.split(",")[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--){
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], {type:'image/png'});
}

interface ImageUploadCropperProps {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUploadCropper({ value, onChange, label="Profile Image" }: ImageUploadCropperProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropping, setCropping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const open = () => fileInputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCrop = async () => {
    setCropping(true);
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      const blob = await cropImageToBlob(imageSrc, croppedAreaPixels, zoom);

      // upload to Supabase storage
      const filePath = `students/${Date.now()}.png`;
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.storage.from("profile-images").upload(filePath, blob, {
        cacheControl: "3600",
        upsert: true,
        contentType: "image/png",
      });
      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(filePath);
      onChange(urlData?.publicUrl || "");
      setImageSrc(null);
    } catch (err) {
      alert("Failed to upload/crop image");
    }
    setCropping(false);
  };

  const handleRemove = () => {
    onChange("");
    setImageSrc(null);
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2">
        {value ? (
          <div className="relative">
            <img src={value} alt="profile" className="rounded-md w-20 h-20 object-cover" />
            <button type="button" className="absolute top-0 right-0 bg-white rounded-full" onClick={handleRemove}>
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={open}>
            <Upload className="w-4 h-4 mr-1" /> Upload
          </Button>
        )}
        <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={onFileChange} />
      </div>
      {imageSrc && (
        <div className="fixed z-50 inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-4 rounded shadow-lg flex flex-col">
            <div className="relative w-72 h-72 bg-gray-100">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            </div>
            <div className="flex gap-4 mt-4">
              <Button type="button" onClick={handleCrop} disabled={cropping}>{cropping ? "Saving..." : "Crop & Save"}</Button>
              <Button type="button" variant="outline" onClick={() => setImageSrc(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
