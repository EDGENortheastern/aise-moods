import { describe, it, expect } from 'vitest'
import { validateRegistration } from './validation'

describe('validateRegistration', () => {
  it('returns null for valid email and password', () => {
    const error = validateRegistration('user@example.com', 'password123')
    expect(error).toBeNull()
  })

  it('rejects empty email', () => {
    const error = validateRegistration('', 'password123')
    expect(error).toBe('Email cannot be empty')
  })

  it('rejects whitespace-only email', () => {
    const error = validateRegistration('   ', 'password123')
    expect(error).toBe('Email cannot be empty')
  })

  it('rejects empty password', () => {
    const error = validateRegistration('user@example.com', '')
    expect(error).toBe('Password cannot be empty')
  })

  it('rejects password shorter than 8 characters', () => {
    const error = validateRegistration('user@example.com', 'short')
    expect(error).toBe('Password must be at least 8 characters')
  })

  it('accepts password with exactly 8 characters', () => {
    const error = validateRegistration('user@example.com', '12345678')
    expect(error).toBeNull()
  })

  it('rejects password longer than 128 characters', () => {
    const longPassword = 'a'.repeat(129)
    const error = validateRegistration('user@example.com', longPassword)
    expect(error).toBe('Password must not exceed 128 characters')
  })

  it('accepts password with exactly 128 characters', () => {
    const maxPassword = 'a'.repeat(128)
    const error = validateRegistration('user@example.com', maxPassword)
    expect(error).toBeNull()
  })

  it('rejects email without @ symbol', () => {
    const error = validateRegistration('userexample.com', 'password123')
    expect(error).toBe('Email must be a valid format')
  })

  it('rejects email without dot', () => {
    const error = validateRegistration('user@example', 'password123')
    expect(error).toBe('Email must be a valid format')
  })

  it('rejects email starting with @', () => {
    const error = validateRegistration('@example.com', 'password123')
    expect(error).toBe('Email must be a valid format')
  })

  it('rejects email ending with @', () => {
    const error = validateRegistration('user@', 'password123')
    expect(error).toBe('Email must be a valid format')
  })

  it('returns first error when multiple validations fail', () => {
    const error = validateRegistration('', '')
    expect(error).toBe('Email cannot be empty')
  })

  it('accepts valid email with subdomain', () => {
    const error = validateRegistration('user@mail.example.com', 'password123')
    expect(error).toBeNull()
  })

  it('accepts valid email with numbers', () => {
    const error = validateRegistration('user123@example.com', 'password123')
    expect(error).toBeNull()
  })
})
