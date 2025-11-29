import { toast } from "@/hooks/use-toast";

type ToastVariant = "default" | "destructive";

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
}

export function showToast(options: ToastOptions, variant: ToastVariant = "default"): void {
  toast({
    title: options.title,
    description: options.description,
    variant,
    duration: options.duration,
  });
}

export function showSuccessToast(options: ToastOptions): void {
  showToast(options, "default");
}

export function showErrorToast(options: ToastOptions): void {
  showToast(options, "destructive");
}

export function showInfoToast(options: ToastOptions): void {
  showToast(options, "default");
}

export const toastMessages = {
  photoSaved: (uploaded: boolean) => ({
    title: uploaded ? "Photo Uploaded" : "Photo Saved",
    description: uploaded ? "Photo uploaded to cloud" : "Photo saved locally",
  }),
  
  uploadError: (error?: string) => ({
    title: "Upload Error",
    description: error || "Failed to upload photo",
  }),
  
  deleteSuccess: () => ({
    title: "Deleted",
    description: "Photo has been deleted",
  }),
  
  copySuccess: () => ({
    title: "Copied",
    description: "Link copied to clipboard",
  }),
  
  copyError: () => ({
    title: "Copy Failed",
    description: "Failed to copy link",
  }),
  
  apiKeyRequired: () => ({
    title: "Error",
    description: "Please configure ImgBB API key first",
  }),
  
  allUploaded: () => ({
    title: "Info",
    description: "All photos are already uploaded to cloud",
  }),
  
  uploadComplete: (success: number, errors: number) => ({
    title: "Upload Complete",
    description: `Uploaded: ${success}, errors: ${errors}`,
  }),
  
  settingsReset: () => ({
    title: "Settings Reset",
    description: "All settings have been restored to defaults",
  }),
  
  networkError: () => ({
    title: "Network Error",
    description: "Please check your internet connection",
  }),
};
