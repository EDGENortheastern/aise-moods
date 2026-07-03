import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from './Home'

describe('Home screen', () => {
  it('shows the logged-in email', () => {
    render(<Home email="you@university.edu" onLogout={() => {}} />)
    expect(screen.getByText(/you@university\.edu/)).toBeInTheDocument()
  })

  it('calls onLogout when the log out button is clicked', async () => {
    const user = userEvent.setup()
    const onLogout = vi.fn()
    render(<Home email="you@university.edu" onLogout={onLogout} />)

    await user.click(screen.getByRole('button', { name: /log out/i }))

    expect(onLogout).toHaveBeenCalled()
  })
})
