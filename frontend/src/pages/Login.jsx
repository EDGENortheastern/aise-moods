import { useState } from 'react'
import './auth.css'

function Login({ onSubmit }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    try {
      if (onSubmit) {
        await onSubmit({ email, password })
      }
      setMessage('Welcome back!')
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <main className="auth">
      <div className="auth-card">
        <p className="auth-brand">aise-moods</p>
        <h1>Log in</h1>
        <p className="auth-subtitle">Pick up where you left off.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@university.edu"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button type="submit">Log in</button>
        </form>

        {message && <p className="auth-message">{message}</p>}

        <p className="auth-footer">
          Need an account? <a href="#register">Register</a>
        </p>
      </div>
    </main>
  )
}

export default Login
