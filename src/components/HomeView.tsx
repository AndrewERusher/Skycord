export default function HomeView() {
  return (
    <div style={{ flex: 1, backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--accent-primary)' }}>Welcome to Skycord</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Select a chat from the sidebar to start messaging, or explore your dashboard.</p>
      
      <div style={{ display: 'flex', gap: '24px', width: '80%', maxWidth: '800px' }}>
        <div style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Recent Highlights</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No new highlights today. Check back later!</p>
        </div>
        <div style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Missed Calls</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>You have 0 missed calls.</p>
        </div>
      </div>
    </div>
  );
}
