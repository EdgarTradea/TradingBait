
// Main app module that provides all necessary exports for the application
// This serves as the "app" import for components and router

// Export auth-related functionality - this is what UserGuard comes from
export * from '../app/auth';

// Export constants (Mode, APP_BASE_PATH, etc.) - this is what router needs
export * from '../constants';

// Re-export commonly used React Router hooks
export { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';

// Export Firebase types that components might need
export type { User } from 'firebase/auth';
