export default function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Email Co-Composer API</h1>
      <p>The API server is running.</p>
      <p><code>POST /api/generate</code> — Generate an email from intent</p>
    </div>
  );
}
