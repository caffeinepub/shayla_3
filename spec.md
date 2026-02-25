# Specification

## Summary
**Goal:** Add "Back to Home" and "Clear" buttons to the Content Generator page to improve navigation and workflow efficiency.

**Planned changes:**
- Add a "Back to Home" (بازگشت به صفحه اصلی) button on `ContentGeneratorPage` that navigates to `/` using TanStack Router, styled with the luxury dark/gold theme
- Add a "Clear" (پاک کردن) button on `ContentGeneratorPage` that resets all input fields (URL, free-text, file uploads), clears the generated output panel, resets the multi-stage progress indicator, removes error/warning messages, and focuses the URL input field — all via in-memory React state updates without a page reload

**User-visible outcome:** Users can quickly navigate back to the home screen from the Content Generator page, and can rapidly clear all inputs and outputs to start generating content for a new product link without reloading the page.
