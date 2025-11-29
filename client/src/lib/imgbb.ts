import type { CloudData } from "@shared/schema";

interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: string;
    height: string;
    size: string;
    time: string;
    expiration: string;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

interface ImgBBError {
  error: {
    message: string;
    code: number;
  };
  status_code: number;
  status_txt: string;
}

export interface UploadResult {
  success: boolean;
  cloudData?: CloudData;
  error?: string;
}

export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, error: "API key cannot be empty" };
  }

  try {
    const testImage = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    
    const formData = new FormData();
    formData.append("image", testImage);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?expiration=60&key=${apiKey}`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();

    if (result.success) {
      return { valid: true };
    } else {
      const errorResult = result as ImgBBError;
      return { 
        valid: false, 
        error: errorResult.error?.message || "Invalid API key" 
      };
    }
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : "Key validation error" 
    };
  }
}

export async function uploadToImgBB(
  imageBase64: string,
  apiKey: string,
  expiration: number = 0
): Promise<UploadResult> {
  if (!apiKey || apiKey.trim().length === 0) {
    return { success: false, error: "API key not configured" };
  }

  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    const formData = new FormData();
    formData.append("image", base64Data);

    let url = `https://api.imgbb.com/1/upload?key=${apiKey}`;
    if (expiration > 0) {
      url += `&expiration=${expiration}`;
    }

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      const data = result as ImgBBResponse;
      const expirationTime = parseInt(data.data.expiration);
      
      const cloudData: CloudData = {
        url: data.data.url,
        viewerUrl: data.data.url_viewer,
        deleteUrl: data.data.delete_url,
        uploadedAt: Date.now(),
        expiresAt: expirationTime > 0 
          ? Date.now() + (expirationTime * 1000) 
          : null,
      };

      return { success: true, cloudData };
    } else {
      const errorResult = result as ImgBBError;
      return { 
        success: false, 
        error: errorResult.error?.message || "Upload error" 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Network error" 
    };
  }
}

export async function uploadMultipleToImgBB(
  images: Array<{ id: string; imageData: string }>,
  apiKey: string,
  expiration: number = 0,
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, UploadResult>> {
  const results = new Map<string, UploadResult>();
  const total = images.length;
  let completed = 0;

  for (const image of images) {
    const result = await uploadToImgBB(image.imageData, apiKey, expiration);
    results.set(image.id, result);
    completed++;
    onProgress?.(completed, total);
  }

  return results;
}
