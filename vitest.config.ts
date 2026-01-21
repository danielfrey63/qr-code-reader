/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global setup files
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    
    // Test file patterns
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '*.spec.ts'], // Exclude Playwright specs at root
    
    // Coverage configuration
    coverage: {
      // Use V8 provider for coverage
      provider: 'v8',
      
      // Enable coverage by default when running with --coverage flag
      enabled: false,
      
      // Output formats - lcov is the main format requested
      reporter: ['text', 'text-summary', 'lcov', 'html', 'json'],
      
      // Output directory for coverage reports
      reportsDirectory: './coverage',
      
      // Files to include in coverage
      include: ['src/**/*.{ts,tsx}'],
      
      // Files to exclude from coverage
      exclude: [
        'node_modules',
        'dist',
        'src/test/**',
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/main.tsx', // Entry point
        'src/vite-env.d.ts',
      ],
      
      // Coverage thresholds (optional - can be adjusted)
      thresholds: {
        // Uncomment and adjust these as needed
        // lines: 80,
        // functions: 80,
        // branches: 80,
        // statements: 80,
      },
      
      // Clean coverage results before running
      clean: true,
      
      // All files - include untested files in coverage report
      all: true,
    },
    
    // Reporter for test results
    reporters: ['default', 'html'],
    
    // Output directory for test reports
    outputFile: {
      html: './test-reports/index.html',
    },
  },
})
