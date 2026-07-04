import { useEffect, useState } from 'react'
import { fetchMoods, createMood } from '../api'
import './home.css'

// Must match ALLOWED_MOODS on the backend.
const MOODS = ['great', 'good', 'okay', 'low', 'awful']

function formatDate(ms) {
  return new Date(ms).toLocaleString()
}

function Home({ email, onLogout }) {
  const [moods, setMoods] = useState([])
  const [selected, setSelected] = useState('')
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  // Load the user's existing moods once on mount.
  useEffect(() => {
    let active = true
    fetchMoods()
      .then((data) => {
        if (active) setMoods(data)
      })
      .catch(() => {
        if (active) setMessage('Could not load your moods.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    if (!selected) {
      setMessage('Pick a mood first.')
      return
    }
    try {
      const saved = await createMood(selected, note)
      setMoods((current) => [saved, ...current])
      setSelected('')
      setNote('')
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <main className="home">
      <div className="home-card">
        <header className="home-header">
          <div>
            <p className="home-brand">aise-moods</p>
            <p className="home-email">{email}</p>
          </div>
          <button type="button" className="home-logout" onClick={onLogout}>
            Log out
          </button>
        </header>

        <h1>How are you?</h1>

        <form onSubmit={handleSubmit}>
          <div className="mood-options">
            {MOODS.map((option) => (
              <button
                type="button"
                key={option}
                className={`mood-option mood-${option}${
                  selected === option ? ' is-selected' : ''
                }`}
                aria-pressed={selected === option}
                onClick={() => setSelected(option)}
              >
                {option}
              </button>
            ))}
          </div>

          <label htmlFor="note">Note (optional)</label>
          <textarea
            id="note"
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What's on your mind?"
          />

          <button type="submit" className="mood-submit">
            Log mood
          </button>
        </form>

        {message && <p className="home-message">{message}</p>}

        <h2>Your moods</h2>
        {loading ? (
          <p className="home-empty">Loading…</p>
        ) : moods.length === 0 ? (
          <p className="home-empty">No moods logged yet.</p>
        ) : (
          <ul className="mood-list">
            {moods.map((entry) => (
              <li key={entry.id} className="mood-item">
                <span className={`mood-tag mood-${entry.mood}`}>{entry.mood}</span>
                {entry.note && <p className="mood-note">{entry.note}</p>}
                <time className="mood-time">{formatDate(entry.created_at)}</time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}

export default Home
