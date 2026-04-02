// FaviconImage - Displays favicon for a URL with background discovery
import { createSignal, onMount, Show } from 'solid-js';

// In-memory cache for favicon URLs (shared across all component instances)
// TODO: Replace with Redis cache in the future for persistence
const faviconCache = new Map();

// Export function to clear favicon cache for a specific URL
export function clearFaviconCache(url) {
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;
    faviconCache.delete(domain);
    console.log(`[FAVICON] Cleared cache for domain: ${domain}`);
  } catch (err) {
    console.error('[FAVICON] Error clearing cache:', err);
  }
}

// Export function to clear ALL favicon cache (useful for debugging)
export function clearAllFaviconCache() {
  faviconCache.clear();
  console.log('[FAVICON] Cleared all favicon cache');
}

async function discoverFavicon(url) {
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;
    const origin = parsedUrl.origin;
    
    // Check cache first
    if (faviconCache.has(domain)) {
      return faviconCache.get(domain);
    }
    
    // List of favicon sources to try (in order of preference)
    const faviconSources = [
      `${origin}/favicon.ico`,
      `${origin}/favicon.png`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    ];
    
    // Try each source by attempting to load as image
    for (const faviconUrl of faviconSources) {
      try {
        // Create a promise that resolves when image loads or rejects on error
        const canLoad = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => reject(false);
          // Set a timeout to avoid hanging
          setTimeout(() => reject(false), 3000);
          img.src = faviconUrl;
        });
        
        if (canLoad) {
          // Cache the successful URL
          faviconCache.set(domain, faviconUrl);
          return faviconUrl;
        }
      } catch (err) {
        // Try next source
        continue;
      }
    }
    
    // If all fail, use the last one (Google) as fallback
    const fallbackUrl = faviconSources[faviconSources.length - 1];
    faviconCache.set(domain, fallbackUrl);
    return fallbackUrl;
    
  } catch (err) {
    return null;
  }
}

export default function FaviconImage(props) {
  const [faviconUrl, setFaviconUrl] = createSignal(null);

  onMount(async () => {
    if (!props.url) {
      return;
    }

    // Start discovery in background (non-blocking)
    discoverFavicon(props.url).then(discoveredUrl => {
      if (discoveredUrl) {
        setFaviconUrl(discoveredUrl);
      }
    }).catch(() => {
      // Silently fail - will show fallback icon
    });
  });

  const handleError = () => {
    // If image fails to load, fall back to icon
    setFaviconUrl(null);
  };

  return (
    <Show
      when={faviconUrl()}
      fallback={props.fallbackIcon || null}
    >
      <img
        src={faviconUrl()}
        alt=""
        class={props.class || "w-4 h-4"}
        onError={handleError}
        loading="lazy"
      />
    </Show>
  );
}
