# Quick Reference - New Features

## 🎯 Toast Notifications

### Import & Use
```typescript
import { useToast } from "@/components/ui/ToastProvider";

function MyComponent() {
  const toast = useToast();
  
  // Success message
  toast.showToast({ 
    tone: "success", 
    message: "Action completed successfully!" 
  });
  
  // Error message
  toast.showToast({ 
    tone: "error", 
    message: "Something went wrong. Please try again." 
  });
  
  // Info message
  toast.showToast({ 
    tone: "info", 
    message: "Please wait while we process your request" 
  });
  
  // Warning with action button
  toast.showToast({ 
    tone: "warning", 
    message: "You have unsaved changes",
    actionLabel: "Discard",
    onAction: () => handleDiscard()
  });
}
```

### API
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `tone` | `"success"` \| `"error"` \| `"info"` \| `"warning"` | ✅ | Visual style |
| `message` | `string` | ✅ | Toast content |
| `actionLabel` | `string` | ❌ | Button text |
| `onAction` | `() => void` | ❌ | Button click handler |
| `duration` | `number` (ms) | ❌ | Auto-dismiss time (default: 4000) |

---

## 🚀 Onboarding Modal

### What It Does
Shows a 4-step guided tour on first visit only, using localStorage to remember completion status.

### Steps Configuration
```typescript
// components/ui/OnboardingModal.tsx
const steps = [
  {
    title: "Welcome to Stack Underflow",
    subtitle: "Your hub for student collaboration...",
    icon: "gift",
    color: "bg-accent"
  },
  // ... more steps
];
```

### Customize Steps
Edit in `OnboardingModal.tsx`:
- Change `title` and `subtitle`
- Swap icons from Boxicons (e.g., `magnify`, `code-braces`)
- Modify colors using Tailwind utilities (`bg-surface`, `bg-bg`)

### How It Works
1. Checks localStorage key `onboarding_completed`
2. If not set → shows modal
3. User can "Skip for now" or complete all steps
4. Sets localStorage → next visits won't see it

---

## 📱 Mobile Menu

### Automatic Behavior
- **Screens < 768px**: Hamburger menu appears (left corner, below TopBar)
- **Screens ≥ 768px**: Sidebar always visible (desktop layout)

### Control Sidebar State
The hamburger state is managed internally by `AppShell`. No manual control needed.

### Styling Hooks
The sidebar uses CSS transitions:
```css
translate-x-0       /* Visible */
-translate-x-full   /* Hidden (mobile) */
```

---

## 🎨 Color Tokens

### Feedback Colors Added
All components can use these via Tailwind utilities:

```css
/* Backgrounds */
bg-success, bg-error, bg-info, bg-warning

/* Text */
text-success, text-error, text-info, text-warning

/* Borders */
border-success, border-error, border-info, border-warning
```

### Hex Values
- `--uf-success: #00c853` (green)
- `--uf-error: #ff3b30` (red)
- `--uf-info: #007aff` (blue)
- `--uf-warning: #ffcc00` (yellow)

---

## 🔧 Common Patterns

### Form Submission with Toasts
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  
  // Show pending/in-progress
  toast.showToast({ 
    tone: "info", 
    message: "Submitting..." 
  });
  
  try {
    await submitForm(formData);
    
    // Show success
    toast.showToast({ 
      tone: "success", 
      message: "Successfully submitted!" 
    });
    
  } catch (err) {
    // Show error
    toast.showToast({ 
      tone: "error", 
      message: "Failed to submit" 
    });
  }
};
```

### Loading States
Combine toast + button disabled state:
```typescript
const [submitting, setSubmitting] = useState(false);

<button 
  type="submit" 
  disabled={submitting}
  className="...disabled:opacity-50"
>
  {submitting ? "Saving..." : "Save"}
</button>
```

---

## ⚠️ Troubleshooting

### Toast Not Appearing
Check you're using `useToast()` inside a provider:
```bash
# App layout must have ToastProvider
<ToastProvider>
  {children}
</ToastProvider>
```

### Onboarding Keeps Showing
Clear localStorage:
```javascript
localStorage.removeItem("onboarding_completed");
location.reload();
```

### Mobile Menu Stuck Open
Force close via console:
```javascript
// In browser DevTools
document.querySelector('[data-testid="mobile-menu-button"]').click();
```

---

## 📚 Full Documentation
For detailed implementation notes, see: `PRODUCTION_FIXES.md`
