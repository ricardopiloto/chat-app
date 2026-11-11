import { MEDIA_TYPE_HEADER, http, request, requestBytes } from "../http";

export interface CameraBackground {
  id: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

const base = "/api/auth/camera-backgrounds";
export const cameraBackgrounds = {
  list: () => http.get<CameraBackground[]>(base),
  upload: (image: Blob) => request<CameraBackground>(base, { method: "POST", bytes: image, headers: { [MEDIA_TYPE_HEADER]: image.type } }),
  remove: (id: string) => http.delete(`${base}/${encodeURIComponent(id)}`),
  image: async (id: string) => {
    const { bytes, headers } = await requestBytes(`${base}/${encodeURIComponent(id)}`);
    return new Blob([bytes as BlobPart], { type: headers.get("content-type") ?? "image/png" });
  },
};
