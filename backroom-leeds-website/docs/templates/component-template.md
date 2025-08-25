# {ComponentName}

## Overview
{COMPONENT_DESCRIPTION}

## Usage
```tsx
import { {ComponentName} } from '@/components/{COMPONENT_CATEGORY}'

// Basic usage
<{ComponentName} 
  {REQUIRED_PROP}="{REQUIRED_VALUE}"
  {OPTIONAL_PROP}="{OPTIONAL_VALUE}"
/>

// With prohibition theme styling
<{ComponentName}
  className="art-deco-border vintage-hover"
  theme="prohibition"
  {ADDITIONAL_PROPS}
/>
```

## Props

### Required Props
| Prop | Type | Description |
|------|------|-------------|
{REQUIRED_PROPS_TABLE}

### Optional Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
{OPTIONAL_PROPS_TABLE}

### Theme Props (Prohibition Styling)
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `'classic' \| 'modern' \| 'luxury'` | `'classic'` | Prohibition theme variant |
| `artDecoStyle` | `boolean` | `false` | Apply Art Deco styling patterns |
| `goldAccent` | `boolean` | `false` | Add speakeasy gold accent styling |

## Examples

### Basic Example
```tsx
<{ComponentName}
  {BASIC_EXAMPLE_PROPS}
/>
```

### With Prohibition Theme
```tsx
<{ComponentName}
  {PROHIBITION_EXAMPLE_PROPS}
  theme="classic"
  className="bg-gradient-to-b from-speakeasy-noir to-speakeasy-noir/90 border-speakeasy-gold"
/>
```

### Advanced Usage
```tsx
<{ComponentName}
  {ADVANCED_EXAMPLE_PROPS}
  onAction={(data) => {
    // Handle component action
    console.log('Component action:', data);
  }}
  customStyles={{
    container: 'vintage-hover',
    header: 'font-bebas text-speakeasy-gold',
    content: 'font-playfair text-speakeasy-champagne'
  }}
/>
```

### With Form Integration
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { {ComponentName} } from '@/components/{COMPONENT_CATEGORY}'

const ExampleForm = () => {
  const form = useForm({
    resolver: zodResolver({VALIDATION_SCHEMA})
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <{ComponentName}
        {...form.register('{FIELD_NAME}')}
        error={form.formState.errors.{FIELD_NAME}?.message}
        {FORM_SPECIFIC_PROPS}
      />
    </form>
  );
};
```

## Variants

### {VARIANT_1_NAME}
{VARIANT_1_DESCRIPTION}

```tsx
<{ComponentName}
  variant="{VARIANT_1_VALUE}"
  {VARIANT_1_PROPS}
/>
```

### {VARIANT_2_NAME}
{VARIANT_2_DESCRIPTION}

```tsx
<{ComponentName}
  variant="{VARIANT_2_VALUE}"
  {VARIANT_2_PROPS}
/>
```

## Styling

### CSS Classes
The component applies the following CSS classes:

```css
.{COMPONENT_CSS_CLASS} {
  /* Base component styles */
}

.{COMPONENT_CSS_CLASS}--prohibition {
  /* Prohibition theme specific styles */
  background: var(--speakeasy-noir);
  border: 1px solid var(--speakeasy-gold);
  color: var(--speakeasy-champagne);
}

.{COMPONENT_CSS_CLASS}__element {
  /* Component element styles */
}
```

### Custom Styling
```tsx
// Using Tailwind classes with prohibition theme
<{ComponentName}
  className="
    bg-gradient-to-b from-speakeasy-noir to-speakeasy-noir/90
    border-2 border-speakeasy-gold/30
    shadow-2xl shadow-speakeasy-burgundy/30
    font-playfair text-speakeasy-champagne
    vintage-hover art-deco-border
  "
/>

// Using custom CSS modules
<{ComponentName}
  className={styles.prohibitionStyle}
/>
```

## Accessibility

### WCAG 2.1 AA Compliance
- ✅ **Keyboard Navigation**: Fully accessible via keyboard
- ✅ **Screen Reader**: Compatible with NVDA, JAWS, VoiceOver
- ✅ **Color Contrast**: 4.5:1 minimum contrast ratio
- ✅ **Focus Management**: Clear focus indicators
- ✅ **ARIA Labels**: Proper semantic markup and labels

### Accessibility Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `aria-label` | `string` | - | Accessible label for screen readers |
| `aria-describedby` | `string` | - | ID of element that describes the component |
| `role` | `string` | - | ARIA role for semantic meaning |

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Tab` | Navigate to next focusable element |
| `Shift + Tab` | Navigate to previous focusable element |
| `Enter` | {ENTER_KEY_ACTION} |
| `Space` | {SPACE_KEY_ACTION} |
| `Escape` | {ESCAPE_KEY_ACTION} |

## Testing

### Unit Tests
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { {ComponentName} } from './{ComponentName}'

describe('{ComponentName}', () => {
  test('renders with prohibition theme', () => {
    render(<{ComponentName} theme="classic" />);
    
    const component = screen.getByRole('{COMPONENT_ROLE}');
    expect(component).toHaveClass('prohibition-theme');
    expect(component).toBeInTheDocument();
  });

  test('handles user interaction', async () => {
    const handleAction = jest.fn();
    render(<{ComponentName} onAction={handleAction} />);
    
    const element = screen.getByRole('{INTERACTIVE_ELEMENT_ROLE}');
    fireEvent.click(element);
    
    expect(handleAction).toHaveBeenCalledWith({EXPECTED_ACTION_DATA});
  });

  test('meets accessibility requirements', () => {
    render(<{ComponentName} aria-label="Test component" />);
    
    const component = screen.getByRole('{COMPONENT_ROLE}');
    expect(component).toHaveAttribute('aria-label', 'Test component');
    expect(component).toBeVisible();
  });
});
```

### Integration Tests
```tsx
import { render } from '@testing-library/react'
import { {ComponentName} } from './{ComponentName}'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

test('integrates with prohibition theme provider', () => {
  render(
    <ThemeProvider theme="prohibition">
      <{ComponentName} />
    </ThemeProvider>
  );
  
  // Test theme integration
});
```

### E2E Tests (Playwright)
```typescript
test('{ComponentName} user workflow', async ({ page }) => {
  await page.goto('/component-demo/{COMPONENT_NAME}');
  
  // Test component in real browser environment
  await page.click('[data-testid="{COMPONENT_TESTID}"]');
  await expect(page.locator('{SUCCESS_SELECTOR}')).toBeVisible();
});
```

## Performance

### Bundle Size Impact
- **Gzipped**: ~{BUNDLE_SIZE}KB
- **Dependencies**: {DEPENDENCY_LIST}
- **Tree Shaking**: ✅ Supports tree shaking

### Optimization Tips
```tsx
// Lazy load for better performance
const {ComponentName} = lazy(() => import('@/components/{COMPONENT_CATEGORY}/{ComponentName}'));

// Use with Suspense
<Suspense fallback={<ComponentSkeleton />}>
  <{ComponentName} />
</Suspense>
```

## Related Components
- [{RelatedComponent1}](./{RelatedComponent1}.md)
- [{RelatedComponent2}](./{RelatedComponent2}.md)
- [{RelatedComponent3}](./{RelatedComponent3}.md)

## Migration Guide

### From v{OLD_VERSION} to v{NEW_VERSION}
{MIGRATION_INSTRUCTIONS}

```tsx
// Before (v{OLD_VERSION})
<{ComponentName} {OLD_PROPS} />

// After (v{NEW_VERSION})
<{ComponentName} {NEW_PROPS} />
```

## Development Notes

### Design System Integration
This component follows the Backroom Leeds prohibition-era design system:
- Uses speakeasy color palette (noir, burgundy, gold, copper, champagne)
- Implements Art Deco typography (Bebas Neue, Playfair Display, Great Vibes)
- Includes vintage hover effects and geometric patterns

### Browser Support
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari 14+
- ✅ Chrome Mobile 90+

## Changelog
- **v{VERSION}**: {CHANGE_DESCRIPTION}
- **v1.0.0**: Initial component implementation

---
*Last updated: {LAST_UPDATE_DATE}*
*Auto-generated from component props and JSDoc comments*