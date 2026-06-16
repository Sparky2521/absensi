# Project Structure

Dokumentasi struktur folder dan file dalam project Sistem Absensi Karyawan.

## Overview

```
Web Absensi Keren/
├── .kiro/                      # Kiro workspace configuration
│   └── specs/                  # Project specifications
├── app/                        # Next.js App Router pages
│   ├── admin/                  # Admin pages
│   │   ├── attendance/         # Admin attendance management
│   │   ├── employees/          # Employee management
│   │   ├── settings/           # Geofencing settings
│   │   └── page.tsx           # Admin dashboard
│   ├── attendance/            # Employee attendance page
│   ├── dashboard/             # Employee dashboard
│   ├── history/               # Employee attendance history
│   ├── login/                 # Login page
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page (redirect)
├── components/                 # React components
│   ├── ui/                    # Reusable UI components
│   │   ├── Alert.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── FaceRecognitionCapture.tsx
│   ├── Navbar.tsx
│   └── ProtectedRoute.tsx
├── hooks/                      # Custom React hooks
│   ├── useAuth.ts             # Authentication hook
│   └── useGeofence.ts         # Geofencing hook
├── lib/                        # Utility libraries
│   ├── supabase/              # Supabase clients
│   │   ├── client.ts          # Client-side Supabase
│   │   └── server.ts          # Server-side Supabase
│   ├── clsx.ts                # ClassName utility
│   ├── face-recognition.ts    # Face recognition utilities
│   ├── geolocation.ts         # Geolocation utilities
│   └── utils.ts               # General utilities
├── public/                     # Static assets
│   └── models/                # Face recognition models
│       ├── tiny_face_detector_model-*
│       ├── face_landmark_68_model-*
│       └── face_recognition_model-*
├── types/                      # TypeScript type definitions
│   ├── database.ts            # Supabase database types
│   └── index.ts               # General types
├── .env.local.example         # Environment variables template
├── .eslintrc.json             # ESLint configuration
├── .gitignore                 # Git ignore rules
├── API.md                     # API documentation
├── CONTRIBUTING.md            # Contribution guidelines
├── DEPLOYMENT.md              # Deployment guide
├── next.config.js             # Next.js configuration
├── package.json               # Dependencies and scripts
├── postcss.config.js          # PostCSS configuration
├── README.md                  # Main documentation
├── SETUP.md                   # Setup instructions
├── supabase-schema.sql        # Database schema
├── tailwind.config.ts         # Tailwind CSS configuration
└── tsconfig.json              # TypeScript configuration
```

## Detailed Structure

### `/app` - Next.js App Router

Menggunakan App Router (Next.js 13+) untuk routing dan server components.

#### Admin Routes (`/app/admin/*`)
- `page.tsx` - Dashboard admin dengan statistik
- `employees/` - CRUD karyawan dan pendaftaran wajah
- `attendance/` - Manajemen dan laporan absensi
- `settings/` - Konfigurasi geofencing

#### Employee Routes
- `dashboard/` - Dashboard karyawan
- `attendance/` - Halaman clock in/out
- `history/` - Riwayat absensi

#### Auth Routes
- `login/` - Halaman login

### `/components` - React Components

#### UI Components (`/components/ui/`)
Komponen reusable untuk user interface:
- `Alert.tsx` - Notifikasi dan pesan
- `Button.tsx` - Tombol dengan variants
- `Card.tsx` - Container dengan header/body/footer
- `Input.tsx` - Input field dengan label dan error
- `Modal.tsx` - Dialog/popup modal

#### Feature Components
- `FaceRecognitionCapture.tsx` - Komponen capture wajah
- `Navbar.tsx` - Navigation bar
- `ProtectedRoute.tsx` - Route guard untuk auth

### `/hooks` - Custom Hooks

- `useAuth.ts` - Hook untuk authentication state
- `useGeofence.ts` - Hook untuk geofencing validation

### `/lib` - Library & Utilities

#### Supabase (`/lib/supabase/`)
- `client.ts` - Client component Supabase client
- `server.ts` - Server component Supabase client

#### Core Libraries
- `face-recognition.ts` - Face API wrapper dan utilities
- `geolocation.ts` - GPS utilities dan validation
- `utils.ts` - Date formatting, CSV export, dll
- `clsx.ts` - ClassName merging utility

### `/types` - TypeScript Types

- `database.ts` - Auto-generated Supabase types
- `index.ts` - Application-specific types

### `/public` - Static Assets

- `/models` - Face recognition model files (tidak di-commit ke Git)
- Images, icons, dll (jika ada)

## Key Files

### Configuration Files

**next.config.js**
- Next.js configuration
- Image domains
- Build settings

**tailwind.config.ts**
- Tailwind CSS configuration
- Custom colors dan theme
- Content paths

**tsconfig.json**
- TypeScript compiler options
- Path aliases (`@/*`)
- Strict mode settings

**postcss.config.js**
- PostCSS plugins
- Tailwind CSS setup
- Autoprefixer

**.eslintrc.json**
- ESLint rules
- Next.js recommended settings
- TypeScript rules

### Documentation Files

**README.md**
- Project overview
- Quick start guide
- Features list

**SETUP.md**
- Detailed setup instructions
- Step-by-step guide
- Troubleshooting

**DEPLOYMENT.md**
- Deployment guide
- Platform-specific instructions
- Post-deployment checklist

**API.md**
- Database schema
- API reference
- Common queries

**CONTRIBUTING.md**
- Contribution guidelines
- Code style
- PR process

### Database Files

**supabase-schema.sql**
- Complete database schema
- Table definitions
- RLS policies
- Indexes
- Functions & triggers

## Import Aliases

Project menggunakan TypeScript path aliases:

```typescript
// Instead of: import { Button } from '../../../components/ui/Button'
import { Button } from '@/components/ui/Button'

// @ resolves to project root
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import type { Employee } from '@/types'
```

## Naming Conventions

### Files
- Components: PascalCase (`Button.tsx`, `FaceRecognitionCapture.tsx`)
- Utilities: camelCase (`utils.ts`, `face-recognition.ts`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`)
- Types: camelCase (`database.ts`, `index.ts`)
- Pages: kebab-case atau lowercase (`page.tsx`, `[id]/page.tsx`)

### Components
- React Components: PascalCase (`<Button />`, `<Modal />`)
- Functions: camelCase (`formatDate()`, `calculateDistance()`)
- Constants: UPPER_SNAKE_CASE (`MODEL_URL`, `DEFAULT_THRESHOLD`)

### Database
- Tables: snake_case (`employees`, `attendance_records`)
- Columns: snake_case (`full_name`, `clock_in_time`)
- Foreign Keys: `table_id` (`employee_id`, `user_id`)

## Data Flow

### Authentication Flow
```
Login Page
  ↓
Supabase Auth
  ↓
useAuth Hook
  ↓
ProtectedRoute
  ↓
Dashboard (Admin/Employee)
```

### Clock In/Out Flow
```
Attendance Page
  ↓
Request Camera & GPS Permission
  ↓
useGeofence Hook → Validate Location
  ↓
FaceRecognitionCapture → Capture Face
  ↓
Compare with Stored Descriptor
  ↓
Save to Database (attendance_records)
  ↓
Show Success/Error Message
```

### Admin CRUD Flow
```
Admin Dashboard
  ↓
Employees Page
  ↓
Add/Edit Employee Form
  ↓
Save to Database (employees + auth.users)
  ↓
Register Face (optional)
  ↓
Upload Face Descriptor to Storage
  ↓
Update Employee Record
```

## Environment Variables

Required in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL        # Public, used in client
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Public, used in client
SUPABASE_SERVICE_ROLE_KEY       # Secret, server-only

# Configuration
NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD  # Public
NEXT_PUBLIC_GEOFENCE_RADIUS             # Public
```

## Build & Deploy

### Development
```bash
npm run dev          # Start dev server
npm run lint         # Run ESLint
```

### Production
```bash
npm run build        # Build for production
npm run start        # Start production server
```

### Output
```
.next/               # Build output (not in Git)
├── cache/          # Build cache
├── server/         # Server-side code
├── static/         # Static assets
└── ...
```

## Dependencies Overview

### Core
- `next` - Next.js framework
- `react` - React library
- `typescript` - TypeScript

### Backend
- `@supabase/supabase-js` - Supabase client
- `@supabase/auth-helpers-nextjs` - Auth helpers

### UI
- `tailwindcss` - Utility-first CSS
- `autoprefixer` - CSS prefixer
- `postcss` - CSS processor

### Face Recognition
- `face-api.js` - Face detection & recognition

### Utilities
- `date-fns` - Date manipulation

## Best Practices

### File Organization
1. Group related files together
2. Keep components small and focused
3. Use index files for exports when appropriate
4. Separate business logic from UI

### Component Structure
```tsx
// 1. Imports
import React from 'react';
import { Button } from '@/components/ui/Button';

// 2. Types/Interfaces
interface MyComponentProps {
  title: string;
}

// 3. Component
export const MyComponent: React.FC<MyComponentProps> = ({ title }) => {
  // 4. State & hooks
  const [count, setCount] = useState(0);
  
  // 5. Effects
  useEffect(() => {}, []);
  
  // 6. Handlers
  const handleClick = () => {};
  
  // 7. Render
  return <div>{title}</div>;
};
```

### State Management
- Use React hooks for local state
- Use Supabase for global/persistent state
- Consider Context API for app-wide state (if needed)

### Error Handling
- Always handle Supabase errors
- Show user-friendly error messages
- Log errors for debugging

### Performance
- Use Next.js Image component
- Lazy load components when possible
- Memoize expensive calculations
- Optimize database queries

## Security Notes

### Never Commit
- `.env.local` file
- Service role key
- User credentials
- Face descriptor files (too large)

### Always
- Use environment variables for secrets
- Enable RLS on all tables
- Validate user input
- Use HTTPS in production
