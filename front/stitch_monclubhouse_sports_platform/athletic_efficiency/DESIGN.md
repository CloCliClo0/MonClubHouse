---
name: Athletic Efficiency
colors:
  surface: '#fbf8ff'
  surface-dim: '#d7d8f4'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f2ff'
  surface-container: '#edecff'
  surface-container-high: '#e6e6ff'
  surface-container-highest: '#e0e0fc'
  on-surface: '#181a2e'
  on-surface-variant: '#404943'
  inverse-surface: '#2d2f44'
  inverse-on-surface: '#f1efff'
  outline: '#707973'
  outline-variant: '#bfc9c1'
  surface-tint: '#2c694e'
  primary: '#0f5238'
  on-primary: '#ffffff'
  primary-container: '#2d6a4f'
  on-primary-container: '#a8e7c5'
  inverse-primary: '#95d4b3'
  secondary: '#3f6653'
  on-secondary: '#ffffff'
  secondary-container: '#beead1'
  on-secondary-container: '#436b58'
  tertiary: '#005236'
  on-tertiary: '#ffffff'
  tertiary-container: '#006d48'
  on-tertiary-container: '#89edba'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b1f0ce'
  primary-fixed-dim: '#95d4b3'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#0e5138'
  secondary-fixed: '#c1ecd4'
  secondary-fixed-dim: '#a5d0b9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#274e3d'
  tertiary-fixed: '#92f7c3'
  tertiary-fixed-dim: '#75daa8'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005235'
  background: '#fbf8ff'
  on-background: '#181a2e'
  surface-variant: '#e0e0fc'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar_width: 260px
  topbar_height: 64px
  container_max_width: 1280px
  gutter: 24px
  stack_sm: 8px
  stack_md: 16px
  stack_lg: 24px
  stack_xl: 32px
---

## Brand & Style
The design system is built for the operational heart of French sports clubs. The brand personality is "Athletic but Restrained"—it captures the energy of the pitch while maintaining the discipline of a professional management suite. It is designed to feel like a high-end backoffice tool (Notion-inspired) specifically tailored for the athletic sector.

The emotional response should be one of competence, community, and clarity. The UI avoids the visual "noise" of consumer sports apps, opting instead for a **Corporate / Modern** aesthetic that emphasizes data density and utility. The visual language uses solid blocks of color, crisp lines, and an intentional lack of decorative gradients or heavy shadows to ensure the focus remains on club management tasks.

## Colors
This design system utilizes a structured green-centric palette to signify the sporting context, balanced by a deep charcoal neutral for professional weight.

- **Primary Stack:** Used for action-oriented elements, active states, and brand presence.
- **Surface & Background:** The UI utilizes a soft-grey background (`#f4f4f6`) to let white cards (`#ffffff`) pop, creating clear visual boundaries without relying on shadows.
- **Sidebar:** A high-contrast dark background (`#2b2d42`) is used for the navigation rail to provide a permanent anchor for the user’s orientation within the platform.
- **Borders:** Subtle grey borders (`#e8e8f0`) are the primary tool for element separation, maintaining a clean, systematic look.

## Typography
The system relies exclusively on **Inter** to achieve a neutral, systematic, and utilitarian feel. The hierarchy is built through weight variation rather than drastic size changes, ensuring the interface remains compact and data-forward.

- **Headlines:** Use Bold (700) or ExtraBold (800) for section titles and display metrics to provide "athletic" impact.
- **Body:** Regular (400) is the default for all long-form content and data entries.
- **Labels:** Semi-Bold (600) is used for buttons, navigation links, and table headers to ensure clear affordance and readability at smaller sizes.

## Layout & Spacing
The layout follows a **Fixed Sidebar + Fluid Content** model. The 260px sidebar is a constant anchor on the left, while the main content area adjusts to the viewport width within a maximum container of 1280px to maintain readability on wide monitors.

- **Grid:** A 12-column grid is used for dashboard layouts and form structures.
- **Margins:** A standard 24px gutter is maintained between the sidebar and the content area, and between major card elements.
- **Mobile:** On mobile devices, the sidebar collapses into a hidden drawer accessible via a hamburger menu in the 64px topbar. All margins scale down to 16px to maximize screen real estate.

## Elevation & Depth
This design system rejects heavy drop shadows in favor of **Low-contrast outlines** and **Tonal layers**. 

- **Level 0 (Background):** The base layer uses `#f4f4f6`.
- **Level 1 (Cards/Surface):** White `#ffffff` containers with a 1px solid border of `#e8e8f0`. This is the default state for content modules.
- **Level 2 (Interaction):** Subtle, 4px blur shadows are reserved exclusively for floating elements like dropdown menus, tooltips, or modals to separate them from the card layer.
- **Sidebar:** Deep neutral `#2b2d42` provides high-contrast depth, acting as the furthest "back" layer in the visual hierarchy.

## Shapes
The shape language is "Rounded" to soften the professional tone and make the platform feel more welcoming ("Your club, your home").

- **Components:** Buttons, input fields, and small UI widgets use a 0.5rem (8px) radius.
- **Containers:** Dashboard cards and content blocks use a 0.75rem (12px) radius.
- **Large Elements:** Large modals or empty state containers use a 1rem (16px) radius.
- **Data Points:** Status badges and avatars are fully rounded (pill-shaped) to distinguish them from structural UI elements.

## Components
Consistent implementation of components is critical for the "Notion-meets-Backoffice" feel.

- **Buttons:** Solid primary green `#2d6a4f` for main actions. Text is white, weight is 600. Secondary buttons use a white background with a `#e8e8f0` border and dark text.
- **Input Fields:** White background with `#e8e8f0` borders. On focus, the border shifts to primary green `#2d6a4f` with a 2px outer glow (no blur).
- **Cards:** Mandatory 1px border. No shadows. Padding should be consistent at 24px for desktop.
- **Lists/Tables:** Rows are separated by 1px horizontal lines. Header rows use a light grey tint (`#f9fafb`) and `label-md` typography.
- **Chips/Badges:** Small, pill-shaped markers for status (e.g., "Active", "Paid"). Use light versions of status colors with dark text for maximum legibility.
- **Sidebar Nav:** Active links use a subtle background highlight (Primary Light Green at 10% opacity) and a 4px vertical bar on the left edge.