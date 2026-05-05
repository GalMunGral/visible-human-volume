# Visible Human: Volume Rendering

**Live demo:** https://galmungral.github.io/visible-human-volume/

## Rhetorical Design

### Purpose

This demo is intended for those familiar with surface rendering but new to volume rendering. The goal is to show that real-time ray-marched volume rendering of a CT dataset is well within reach of a straightforward fragment shader.

### Strategy

The full CT volume is stored as a 3D texture. A single fullscreen quad covers the viewport; for each fragment, the shader casts a ray from the camera position through the volume, stepping forward and accumulating color and opacity at each sample. The result is composited front-to-back and mapped through the Viridis colormap.