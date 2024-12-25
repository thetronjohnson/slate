export function extractImageUrl(event: ClipboardEvent): string | null {
  // Extract image URL from clipboard data
  const items = event.clipboardData?.items;
  
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      return URL.createObjectURL(item.getAsFile());
    }
  }
  
  return null;
}

export function generateUniqueFilename(url: string): string {
  const timestamp = Date.now();
  const extension = url.split('.').pop();
  return `image-${timestamp}.${extension}`;
} 