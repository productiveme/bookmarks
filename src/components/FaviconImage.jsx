// FaviconImage - Displays favicon for a URL with fallback to icon
import { createSignal, onMount, Show } from 'solid-js';

export default function FaviconImage(props) {
  const [faviconUrl, setFaviconUrl] = createSignal(null);
  const [error, setError] = createSignal(false);

  onMount(() => {
    if (!props.url) return;

    try {
      const url = new URL(props.url);
      const domain = url.hostname;
      
      // Try Google's favicon service first (most reliable)
      const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      setFaviconUrl(googleFavicon);
    } catch (err) {
      setError(true);
    }
  });

  const handleError = () => {
    setError(true);
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
