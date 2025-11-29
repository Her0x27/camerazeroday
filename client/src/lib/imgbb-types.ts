export interface ImgBBImageData {
  filename: string;
  name: string;
  mime: string;
  extension: string;
  url: string;
}

export interface ImgBBResponseData {
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
  image: ImgBBImageData;
  thumb: ImgBBImageData;
  delete_url: string;
}

export interface ImgBBSuccessResponse {
  data: ImgBBResponseData;
  success: true;
  status: number;
}

export interface ImgBBErrorResponse {
  error: {
    message: string;
    code: number;
  };
  success: false;
  status_code: number;
  status_txt: string;
}

export type ImgBBResponse = ImgBBSuccessResponse | ImgBBErrorResponse;

export function isImgBBSuccess(response: unknown): response is ImgBBSuccessResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    response.success === true &&
    "data" in response
  );
}

export function isImgBBError(response: unknown): response is ImgBBErrorResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    response.success === false &&
    "error" in response
  );
}
