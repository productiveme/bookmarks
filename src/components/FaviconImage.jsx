// FaviconImage - Displays favicon for a URL with fallback to icon
import { createSignal, onMount, Show } from 'solid-js';

export default function FaviconImage(props) {
  const [faviconUrl, setFaviconUrl] = createSignal(null);
  const [error, setError] = createSignal(false);
  const [attempts, setAttempts] = createSignal(0);

  onMount(() => {
    if (!props.url) return;

    try {
      const url = new URL(props.url);
      const domain = url.hostname;
      const origin = url.origin;
      
      // Try multiple favicon sources in order
      const faviconSources = [
        // Try the actual site's favicon first (most accurate)
        `${origin}/favicon.ico`,
        // Try the site's root for favicon
        `${origin}/favicon.png`,
        // Try DuckDuckGo's favicon service (good quality, privacy-friendly)
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
        // Fallback to Google (reliable but sometimes generic)
        `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
      ];
      
      setFaviconUrl(faviconSources[0]);
      setAttempts(0);
    } catch (err) {
      setError(true);
    }
  });

  const handleError = () => {
    const url = props.url;
    if (!url) {
      setError(true);
      return;
    }

    try {
      const parsedUrl = new URL(url);
      const domain = parsedUrl.hostname;
      const origin = parsedUrl.origin;
      
      const faviconSources = [
        `${origin}/favicon.ico`,
        `${origin}/favicon.png`,
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
      ];
      
      const nextAttempt = attempts() + 1;
      
      if (nextAttempt < faviconSources.length) {
        setAttempts(nextAttempt);
        setFaviconUrl(faviconSources[nextAttempt]);
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    }
  };

  return (
    <Show
      when={!error() && faviconUrl()}
      fallback={props.fallbackIcon || null}
    >
      <img
        src={faviconUrl()}
        alt=""
        class={props.class || "w-4 h-4"}
        onError={handleError}
      />
    </Show>
  );
}
