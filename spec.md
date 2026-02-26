# Specification

## Summary
**Goal:** Replace the header logo in Header.tsx with an animated "Shayla" text that has a carved ivory/wood aesthetic, a 60-second water-fill animation, and a synchronized Web Audio API chime at each cycle's end.

**Planned changes:**
- Replace the current header logo/text in `Header.tsx` with a "Shayla" text element styled to look carved/engraved into a warm ivory-cream wooden surface using CSS text-shadow and filter effects
- Add a subtle floating/levitation CSS keyframe animation to the "Shayla" text
- Implement a water-fill visual effect (SVG clip-path or Canvas overlay) around the "Shayla" text that rises incrementally once per second over 60 seconds, with a wave-like undulating top edge, then resets and repeats
- Use `requestAnimationFrame` or a second-tick interval to drive the 60-step fill animation smoothly
- At the end of each 60-second cycle, play a procedurally generated soft chime/bell tone via the Web Audio API (no external audio files), synchronized with the water reset

**User-visible outcome:** The app header displays an animated "Shayla" text with a carved ivory look that bobs gently, is gradually surrounded by rising water over 60 seconds, and plays a soft chime sound when the water completes its fill cycle before resetting.
