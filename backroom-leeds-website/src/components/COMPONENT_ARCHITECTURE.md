# Component Architecture Documentation

## Overview
The Backroom Leeds component system follows **Atomic Design** principles with a prohibition-themed speakeasy aesthetic. All components are built with TypeScript, React 19, and Tailwind CSS, ensuring type safety, accessibility (WCAG 2.1 AA), and consistent styling.

## Architecture Structure

```
src/components/
├── atoms/          # Basic UI elements (buttons, inputs, headings)
├── molecules/      # Combinations of atoms (form fields, cards, modals)
├── organisms/      # Complex features (navigation, forms, cards)
├── templates/      # Page layouts (main, admin, booking)
└── ui/            # shadcn/ui-style base components (future)
```

## Design System Integration

### Color Palette (Prohibition Theme)
- **Speakeasy Noir**: `oklch(8% 0.02 240)` - Deep background
- **Speakeasy Burgundy**: `oklch(25% 0.15 15)` - Accent dark
- **Speakeasy Gold**: `oklch(76.9% 0.188 70.08)` - Primary accent
- **Speakeasy Copper**: `oklch(55% 0.12 45)` - Secondary accent
- **Speakeasy Champagne**: `oklch(95% 0.05 85)` - Light text

### Typography
- **Headlines**: Bebas Neue (uppercase, tracking-wider)
- **Subheadings**: Playfair Display (serif)
- **Body**: Inter (sans-serif)
- **Decorative**: Great Vibes (italic script)

### Special Effects
- **Art Deco Borders**: Gradient borders with gold/copper
- **Vintage Hover**: Perspective transform with shadow
- **Vintage Grain**: Subtle repeating pattern overlay
- **Neon Glow**: Drop shadow effects for emphasis

## Component Categories

### Atoms (Base Components)
Foundation elements that cannot be broken down further:

- **Button**: Multiple variants (primary, secondary, ghost, gold, copper)
- **Input**: Text input with art deco styling option
- **Heading**: 6 levels with font variants
- **Text**: Body text with size variants
- **Icon**: SVG icon wrapper with common icons
- **Badge**: Status indicators
- **LoadingSpinner**: Loading state indicator

### Molecules (Combined Components)
Combinations of atoms creating functional units:

- **FormField**: Input with label, error, and hint
- **Card**: Container with multiple variants
- **NavigationItem**: Link or button for navigation
- **Select**: Dropdown with styled options
- **Modal**: Overlay dialog with portal rendering

### Organisms (Complex Features)
Self-contained features combining multiple molecules:

- **NavigationHeader**: Main site navigation with mobile menu
- **Footer**: Site footer with links and branding
- **EventCard**: Event display with image and details
- **TableBookingForm**: Multi-step booking form

### Templates (Page Layouts)
Complete page structures:

- **MainLayout**: Standard page with header/footer
- **AdminLayout**: Dashboard layout with sidebar
- **BookingLayout**: Multi-step process layout

## TypeScript Integration

All components have comprehensive TypeScript interfaces in `/src/types/components.ts`:

```typescript
// Example: Button component props
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold' | 'copper';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  artDeco?: boolean;
}
```

## Accessibility Features

All components include:
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus indicators
- Screen reader announcements
- Color contrast compliance (WCAG 2.1 AA)

## Usage Examples

### Basic Button
```tsx
import { Button } from '@/components/atoms';

<Button variant="gold" size="lg" artDeco>
  Book Now
</Button>
```

### Form Field with Validation
```tsx
import { FormField } from '@/components/molecules';

<FormField
  name="email"
  label="Email Address"
  type="email"
  required
  error={errors.email}
  hint="We'll never share your email"
  artDeco
/>
```

### Event Card
```tsx
import { EventCard } from '@/components/organisms';

<EventCard
  id="event-1"
  title="LA FIESTA Saturdays"
  date={new Date('2024-12-28')}
  artists={['DJ Santos', 'MC Rivera']}
  ticketLink="https://fatsoma.com/..."
/>
```

### Complete Page Layout
```tsx
import { MainLayout } from '@/components/templates';

<MainLayout transparentHeader>
  {/* Page content */}
</MainLayout>
```

## Styling Approach

1. **Utility-First**: Tailwind CSS for rapid styling
2. **Component Classes**: Custom CSS for complex effects
3. **Theme Consistency**: Design tokens in Tailwind config
4. **Responsive Design**: Mobile-first with breakpoint utilities

## Performance Considerations

- **Code Splitting**: Components are individually importable
- **Lazy Loading**: Templates support dynamic imports
- **Optimized Renders**: React.memo and forwardRef where appropriate
- **Bundle Size**: Tree-shaking enabled through barrel exports

## Future Enhancements

1. **Animation Library**: Framer Motion integration
2. **Form Management**: React Hook Form integration
3. **State Management**: Zustand for complex state
4. **Testing**: Component unit tests with Jest
5. **Storybook**: Component documentation and testing
6. **Dark/Light Mode**: Theme switching capability

## Component Development Guidelines

1. **Always include TypeScript types**
2. **Follow atomic design hierarchy**
3. **Maintain accessibility standards**
4. **Use consistent naming conventions**
5. **Document complex props**
6. **Include usage examples**
7. **Test across breakpoints**
8. **Optimize for performance**

## Barrel Exports

Each component level has an index.ts for clean imports:

```typescript
// Import individual components
import { Button, Input, Heading } from '@/components/atoms';

// Import all from a level
import * as Atoms from '@/components/atoms';
```

## Integration with Next.js 15.5

- **Server Components**: Templates are client components for interactivity
- **App Router**: Full compatibility with app directory
- **Image Optimization**: Next/Image used in EventCard
- **Font Optimization**: Fonts loaded via Next.js font system
- **Link Component**: Next/Link for client-side navigation

## Component Testing Strategy

Each component should have:
1. **Unit Tests**: Props and rendering
2. **Integration Tests**: User interactions
3. **Accessibility Tests**: ARIA and keyboard
4. **Visual Tests**: Screenshot comparisons
5. **Performance Tests**: Render time and bundle size