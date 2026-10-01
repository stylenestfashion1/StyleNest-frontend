/**
 * Renders the cropped region (in source-image pixels, as produced by
 * react-easy-crop's onCropComplete) onto a canvas and returns it as a File.
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

// Bounding box of an image after rotating it by `rotation` degrees around
// its center -- needed so the intermediate canvas below is large enough to
// hold the fully-rotated image with nothing clipped off before cropping.
function rotatedBoundingBox(width, height, rotation) {
  const rad = degreesToRadians(rotation);
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

/**
 * cropPixels and rotation both come straight from react-easy-crop's
 * onCropComplete/rotation state -- when a rotation is in effect, the
 * library already computes cropPixels in the coordinate space of the
 * *rotated* image, so the rotation has to be baked into the canvas before
 * the crop rectangle is applied, or the output would be misaligned.
 * rotation defaults to 0, so existing callers that never pass it keep
 * behaving exactly as before (rotatedBoundingBox is a no-op at 0deg).
 */
export async function getCroppedImageFile(imageSrc, cropPixels, fileName = "image.jpg", rotation = 0) {
  const image = await loadImage(imageSrc);

  const rotatedCanvas = document.createElement("canvas");
  const rotatedCtx = rotatedCanvas.getContext("2d");
  const { width: boxWidth, height: boxHeight } = rotatedBoundingBox(image.width, image.height, rotation);
  rotatedCanvas.width = boxWidth;
  rotatedCanvas.height = boxHeight;

  rotatedCtx.translate(boxWidth / 2, boxHeight / 2);
  rotatedCtx.rotate(degreesToRadians(rotation));
  rotatedCtx.translate(-image.width / 2, -image.height / 2);
  rotatedCtx.drawImage(image, 0, 0);

  const canvas = document.createElement("canvas");
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(
    rotatedCanvas,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not crop image"));
          return;
        }
        resolve(new File([blob], fileName, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  });
}
