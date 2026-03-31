// GET /api/bookmarks - Fetch bookmarks from Gist
import { fetchGist } from '../../utils/gist.js';

export async function GET({ url }) {
  const token = url.searchParams.get('token');
  const gistId = url.searchParams.get('gistId');
  
  if (!token || !gistId) {
    return new Response(JSON.stringify({ error: 'Missing token or gistId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const content = await fetchGist(token, gistId);
    
    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST /api/bookmarks - Update bookmarks to Gist
export async function POST({ request }) {
  try {
    const { token, gistId, content } = await request.json();
    
    if (!token || !gistId || !content) {
      return new Response(JSON.stringify({ error: 'Missing token, gistId, or content' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { updateGist } = await import('../../utils/gist.js');
    await updateGist(token, gistId, content);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
