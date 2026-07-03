import { useState } from 'react'
import './Register.css'

function Register({ onSubmit }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    if (onSubmit) {
      onSubmit({ email, password })
    }
  }

  return (
    <main className="auth">
      <div className="auth-card">
        <p className="auth-brand">aise-moods</p>
        <h1>Create account</h1>
        <p className="auth-subtitle">Track how you feel, one day at a time.</p>

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

          <button type="submit">Register</button>
        </form>

        <p className="auth-footer">
          Already have an account? <a href="#login">Log in</a>
        </p>
      </div>
    </main>
  )
}

export default Register
