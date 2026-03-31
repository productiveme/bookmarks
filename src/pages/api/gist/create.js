// POST /api/gist/create - Create new Gist
import { createGist } from '../../../utils/gist.js';
import { stringifyYaml, DEFAULT_BOOKMARKS } from '../../../utils/yaml.js';

export async function POST({ request }) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const defaultContent = stringifyYaml(DEFAULT_BOOKMARKS);
    const gistId = await createGist(token, defaultContent);
    
    return new Response(JSON.stringify({ gistId }), {
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
