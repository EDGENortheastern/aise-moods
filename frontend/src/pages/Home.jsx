import './auth.css'

function Home({ email, onLogout }) {
  return (
    <main className="auth">
      <div className="auth-card">
        <p className="auth-brand">aise-moods</p>
        <h1>You&apos;re in</h1>
        <p className="auth-subtitle">Logged in as {email}.</p>

        <button type="button" style={{ width: '100%' }} onClick={onLogout}>
          Log out
        </button>
      </div>
    </main>
  )
}

export default Home
