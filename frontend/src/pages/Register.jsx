import { useState } from 'react'
import { validateRegistration } from '../validation'
import './auth.css'

function Register({ onSubmit }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    // Validate input before submitting
    const validationError = validateRegistration(email, password)
    if (validationError) {
      setMessage(validationError)
      return
    }

    try {
      if (onSubmit) {
        await onSubmit({ email, password })
      }
      setMessage('Account created! You can now log in.')
    } catch (error) {
      setMessage(error.message)
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

        {message && <p className="auth-message">{message}</p>}

        <p className="auth-footer">
          Already have an account? <a href="#login">Log in</a>
        </p>
      </div>
    </main>
  )
}

export default Register
