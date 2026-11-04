import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Flags a long-standing, otherwise-ordinary "load data on mount/when a
      // dependency changes" effect pattern used throughout this app's pages
      // (DetailsPage, ReportsPage, SearchPage, LocationPicker, HandoffPage).
      // Worth revisiting (e.g. react-query/suspense-style data fetching
      // instead of effect+setState), but rewriting six data-loading flows
      // without a live backend to verify against isn't a safe unattended
      // change -- kept as a warning rather than silently disabled.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Context files intentionally co-locate a Provider component with its
    // consumer hook/constants -- idiomatic React, just not Fast-Refresh-safe.
    files: ['src/context/**/*.{js,jsx}'],
    rules: {
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    // Vite config runs under Node, not the browser.
    files: ['vite.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.test.{js,jsx}'],
    languageOptions: {
      globals: globals.vitest,
    },
  },
])
