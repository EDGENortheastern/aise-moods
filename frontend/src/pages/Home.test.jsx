import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from './Home'
import { fetchMoods, createMood } from '../api'

vi.mock('../api', () => ({
  fetchMoods: vi.fn(),
  createMood: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  fetchMoods.mockResolvedValue([])
  createMood.mockResolvedValue({ id: '1', mood: 'good', note: '', created_at: 0 })
})

describe('Home screen', () => {
  it('shows the logged-in email', async () => {
    render(<Home email="you@university.edu" onLogout={() => {}} />)
    expect(await screen.findByText(/you@university\.edu/)).toBeInTheDocument()
  })

  it('logs the selected mood', async () => {
    const user = userEvent.setup()
    render(<Home email="you@university.edu" onLogout={() => {}} />)
    await screen.findByText(/no moods logged yet/i)

    await user.click(screen.getByRole('button', { name: /good/i }))
    await user.click(screen.getByRole('button', { name: /log mood/i }))

    expect(createMood).toHaveBeenCalledWith('good', '')
  })

  it('warns if you submit without picking a mood', async () => {
    const user = userEvent.setup()
    render(<Home email="you@university.edu" onLogout={() => {}} />)
    await screen.findByText(/no moods logged yet/i)

    await user.click(screen.getByRole('button', { name: /log mood/i }))

    expect(createMood).not.toHaveBeenCalled()
    expect(screen.getByText(/pick a mood first/i)).toBeInTheDocument()
  })

  it('calls onLogout when the log out button is clicked', async () => {
    const user = userEvent.setup()
    const onLogout = vi.fn()
    render(<Home email="you@university.edu" onLogout={onLogout} />)

    await user.click(screen.getByRole('button', { name: /log out/i }))

    expect(onLogout).toHaveBeenCalled()
  })
})
