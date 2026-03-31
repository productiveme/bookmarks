// Generate bookmarklet code with the app URL
export function generateBookmarklet(appUrl) {
  const code = `(function(){if(window.bookmarksBar){window.bookmarksBar.toggle()}else{const i=document.createElement('iframe');i.src='${appUrl}/bar?t='+Date.now();i.id='bookmarks-bar-iframe';i.style.cssText='position:fixed;top:0;left:0;width:100%;height:40px;border:none;z-index:2147483647;box-shadow:0 2px 4px rgba(0,0,0,0.1)';document.body.style.marginTop='40px';document.body.prepend(i);window.addEventListener('message',(e)=>{if(e.origin!=='${appUrl}')return;if(e.data.type==='request-page-info'){i.contentWindow.postMessage({type:'page-info',title:document.title,url:window.location.href},'${appUrl}')}if(e.data.type==='close-bar'){window.bookmarksBar.hide()}});window.bookmarksBar={toggle:function(){const v=i.style.display==='none';i.style.display=v?'block':'none';document.body.style.marginTop=v?'40px':'0'},show:function(){i.style.display=v?'block':'none';document.body.style.marginTop=v?'40px':'0';if(v){i.src='${appUrl}/bar?t='+Date.now()}},hide:function(){i.style.display='none';document.body.style.marginTop='0'}}}})()`;
  
  return `javascript:${code}`;
}
