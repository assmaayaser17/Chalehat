import type { Area } from "react-easy-crop";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () => reject(new Error("Couldn't load the image.")));
    img.src = src;
  });
}

/** Crops `imageSrc` down to `area` (source-image pixels, from react-easy-crop's `onCropComplete`) and returns the result as a File ready to upload. */
export async function cropImageToFile(imageSrc: string, area: Area, fileName: string, fileType: string): Promise<File> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't supported in this browser.");
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, fileType));
  if (!blob) throw new Error("Couldn't crop the image.");
  return new File([blob], fileName, { type: fileType });
}
