import { useState } from 'react'

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
      <h1>Create account</h1>
      <p>Track how you feel, one day at a time.</p>

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

      <p>
        Already have an account? <a href="#login">Log in</a>
      </p>
    </main>
  )
}

export default Register
