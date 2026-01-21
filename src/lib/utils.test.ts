import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility function', () => {
  it('should merge class names', () => {
    const result = cn('class1', 'class2')
    expect(result).toContain('class1')
    expect(result).toContain('class2')
  })

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'conditional', false && 'hidden')
    expect(result).toContain('base')
    expect(result).toContain('conditional')
    expect(result).not.toContain('hidden')
  })

  it('should handle empty inputs', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should merge tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4')
    // tailwind-merge should resolve px-2 and px-4 to px-4
    expect(result).toContain('px-4')
    expect(result).not.toContain('px-2')
  })
})
