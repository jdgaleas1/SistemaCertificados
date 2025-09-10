import { useEffect, useState } from "react";

export default function useImage(url?: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }

    setLoading(true);
    setError(null);

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      setImage(img);
      setLoading(false);
    };
    
    img.onerror = () => {
      setError(new Error(`Failed to load image: ${url}`));
      setLoading(false);
    };
    
    img.src = url;
  }, [url]);

  return [image, loading, error] as const;
}
