# Visible Human: Volume Rendering

**Live demo:** https://galmungral.github.io/visible-human-volume/

## Rhetorical Design

### Purpose

This demo is intended for those familiar with surface rendering but new to volume rendering. The goal is to show that real-time ray-marched volume rendering of a CT dataset is well within reach of a straightforward fragment shader.

## Technical Challenges

### Ray marching

**Problem.** Unlike surface rendering, volume rendering requires integrating optical properties along a ray through the volume.

**Solution.** For each fragment, a ray is cast from the camera through the 3D texture. Samples are accumulated along the ray using front-to-back compositing, with density mapped to color via the Viridis colormap.