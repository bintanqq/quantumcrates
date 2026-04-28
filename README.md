Rework Preview Modal — 3D Crate Viewer
In my web dashboard (preview-modal.js), rework PreviewModal.open(crate) completely. Build a 3D crate preview using Three.js (CDN: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js).
3D scene:

Rotating 3D cube in center, auto-rotates on Y axis
User can click+drag to orbit, scroll to zoom (manual implementation, no OrbitControls)
Cube color/glow based on State.rarityColor() of the crate's highest rarity reward
Particles orbit the cube based on crate's idleAnimation config — type (RING/HELIX/SPHERE/SPIRAL/RAIN), density, speed, radius all read from crate.idleAnimation
Clicking cube triggers open animation — cube shakes + particles burst outward

Tech constraints:

Single modal using existing Modal.open() from utils.js
Three.js r128, no OrbitControls
Canvas 100% width, ~380px height
Uses existing globals: State, Utils, Modal
Dispose renderer and cancel animation loop on Modal.close() to prevent memory leaks


I'm building a Minecraft Paper plugin called QuantumCrates (Java 21, Paper 1.21). I have issues to fix/add:
1. Particle/Animation system is bad — currently using BukkitRunnable with world.spawnParticle() in loops (RING, HELIX, SPHERE, SPIRAL, RAIN types). The animations look cheap compared to plugins like PhoenixCrates and ExcellentCrates. I need: smoother animations using proper tick-based math, better particle density scaling, a working NONE option that actually stops all particles, and the idle vs open animations should feel distinctly different. Research how top crate plugins implement their particle effects and suggest a rewrite of ParticleManager.java.
2. HTML range slider can't be dragged smoothly — in my web dashboard (components.js, function SliderRow), the <input type="range"> only responds to clicks, not smooth drag. The slider is inside a dynamically created div that gets appended to the DOM. I've tried e.stopPropagation() on mousedown but it didn't fix it. The issue is likely that the parent container intercepts pointer events or touch-action isn't set correctly. Show me the correct fix for a draggable range slider inside a dynamically rendered DOM element, including proper touch support.
3. Text selection color is wrong — when clicking/selecting text in the dashboard, the browser's default selection highlight makes text appear too dark/unreadable. Need to override ::selection pseudo-element in CSS to use our cream white #f9f6ee for selected text color with a navy blue #004aad background at ~40% opacity so it matches our theme. Some elements might need individual overrides.
4. Also can u add simple animation on the website please