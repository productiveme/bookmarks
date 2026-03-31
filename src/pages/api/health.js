// Health check endpoint
export async function GET() {
  return new Response(JSON.stringify({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'bookmarks-bar'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
