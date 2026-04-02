// BookmarkIcon - SVG icon for the bookmarks logo
export default function BookmarkIcon(props) {
  return (
    <img 
      src="/favicon.svg" 
      alt="Bookmarks" 
      class={props.class || "w-5 h-5"} 
    />
  );
}
