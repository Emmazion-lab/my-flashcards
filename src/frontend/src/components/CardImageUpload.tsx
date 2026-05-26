import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";

interface CardImageUploadProps {
  label: string;
  image: ExternalBlob | null;
  onUpload: (blob: ExternalBlob) => void;
  onRemove: () => void;
  disabled?: boolean;
  isUploading?: boolean;
}

export function CardImageUpload({
  label,
  image,
  onUpload,
  onRemove,
  disabled,
  isUploading,
}: CardImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const blob = ExternalBlob.fromBytes(uint8Array);
    onUpload(blob);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  if (image) {
    return (
      <div className="relative group">
        <img
          src={image.getDirectURL()}
          alt={label}
          className="h-16 w-16 rounded object-cover border"
        />
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemove}
          disabled={disabled}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isUploading}
        className="h-16 w-16 flex flex-col gap-1"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
        <span className="text-[10px]">{label}</span>
      </Button>
    </>
  );
}
