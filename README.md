# Patent4AI - Vue SPA

AI-powered patent intelligence platform built with Vue 3, TypeScript, and Naive UI.

## Tech Stack

- **Vue 3** with Composition API and `<script setup>`
- **TypeScript** for type safety
- **Naive UI** - Component library
- **Vue Router** - Routing
- **Pinia** - State management
- **Axios** - HTTP client
- **Vite** - Build tool

_Note: ApexCharts removed for now, will add when charts are needed_

## Color Scheme

Based on the original Patent4AI Flask app:

- **Primary Gradient**: `#667eea` → `#764ba2` (Purple)
- **Secondary Gradient**: `#4A90E2` → `#4CAF50` (Blue to Green)
- **Text**: `#1e293b` (dark), `#64748b` (medium), `#6b7280` (gray)
- **Backgrounds**: `#ffffff`, `#f8fafc`, `#f1f5f9`

## Authentication

Uses HTTP-only cookie-based authentication via `login.4aitek.com`:

- More secure than JWT localStorage (XSS-protected)
- Cross-subdomain support (`*.4aitek.com`)
- Server-side token validation

## Features

### Current Pages

- **Console** - Dashboard with credit usage info
- **Prior Art Search** - Placeholder (to be implemented)
- **Create Patent** - Placeholder (to be implemented)
- **OA Response** - Placeholder (to be implemented)
- **Customize AI** - Placeholder (to be implemented)

### Layout

- Collapsible sidebar navigation
- Credits badge
- User profile section
- Responsive design

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── assets/         # CSS and static assets
├── components/     # Reusable components
│   └── DashboardLayout.vue
├── composables/    # Composition API composables
│   └── useAuth.ts
├── router/         # Vue Router configuration
├── stores/         # Pinia stores
├── views/          # Page components
│   ├── Console.vue
│   ├── PriorArt.vue
│   ├── CreatePatent.vue
│   ├── OAResponse.vue
│   └── CustomizeAI.vue
├── App.vue
└── main.ts
```

## Next Steps

1. Implement Prior Art Search page
2. Implement Create Patent page
3. Add API integration with backend
4. Add charts and analytics
5. Implement real-time features
# spa_talent
