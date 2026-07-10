import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Register from './Register'

describe('Register screen', () => {
  it('shows the create account heading', () => {
    render(<Register />)
    expect(
      screen.getByRole('heading', { name: /create account/i })
    ).toBeInTheDocument()
  })

  it('has email and password fields', () => {
    render(<Register />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('has a register button', () => {
    render(<Register />)
    expect(
      screen.getByRole('button', { name: /register/i })
    ).toBeInTheDocument()
  })

  it('calls onSubmit with the entered email and password', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<Register onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'you@university.edu')
    await user.type(screen.getByLabelText(/password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /register/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'you@university.edu',
      password: 'secret123',
    })
  })

  describe('Input validation', () => {
    it('shows error when email is empty', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<Register onSubmit={onSubmit} />)

      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /register/i }))

      expect(screen.getByText('Email cannot be empty')).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('shows error when password is empty', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<Register onSubmit={onSubmit} />)

      await user.type(screen.getByLabelText(/email/i), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /register/i }))

      expect(screen.getByText('Password cannot be empty')).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('shows error when password is too short', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<Register onSubmit={onSubmit} />)

      await user.type(screen.getByLabelText(/email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/password/i), 'short')
      await user.click(screen.getByRole('button', { name: /register/i }))

      expect(
        screen.getByText('Password must be at least 8 characters')
      ).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('shows error when email format is invalid', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<Register onSubmit={onSubmit} />)

      // Use an email that passes browser validation but fails our custom validation
      await user.type(screen.getByLabelText(/email/i), 'invalid@email')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /register/i }))

      expect(
        screen.getByText('Email must be a valid format')
      ).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('shows error when password is too long', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<Register onSubmit={onSubmit} />)

      const longPassword = 'a'.repeat(129)
      await user.type(screen.getByLabelText(/email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/password/i), longPassword)
      await user.click(screen.getByRole('button', { name: /register/i }))

      expect(
        screen.getByText('Password must not exceed 128 characters')
      ).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('accepts valid email and password', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<Register onSubmit={onSubmit} />)

      await user.type(screen.getByLabelText(/email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/password/i), 'validpass123')
      await user.click(screen.getByRole('button', { name: /register/i }))

      expect(onSubmit).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'validpass123',
      })
    })

    it('clears previous error message on new submission', async () => {
      const user = userEvent.setup()
      render(<Register />)

      // First submit with short password
      await user.type(screen.getByLabelText(/email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/password/i), 'short')
      await user.click(screen.getByRole('button', { name: /register/i }))
      expect(
        screen.getByText('Password must be at least 8 characters')
      ).toBeInTheDocument()

      // Fix the password and submit again
      await user.clear(screen.getByLabelText(/password/i))
      await user.type(screen.getByLabelText(/password/i), 'validpass123')
      await user.click(screen.getByRole('button', { name: /register/i }))

      // The password error should be gone
      expect(
        screen.queryByText('Password must be at least 8 characters')
      ).not.toBeInTheDocument()
    })
  })
})
