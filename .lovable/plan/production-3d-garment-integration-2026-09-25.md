# Production 3D garment integration

## Goal
Replace the block-built clothing mockups with a viewer designed for one production-quality garment on its mannequin.

## Changes
- Bring the current public showroom into this Lovable project.
- Remove the four procedural placeholder garments and their selector.
- Add a GLB loader for a combined garment-and-mannequin scene, preserving embedded fabric textures and material maps.
- Automatically center and scale the imported scene, enable physically based lighting, shadows, orbit controls, loading progress, and a clear missing-file state.
- Keep the product details focused on the first garment rather than presenting invented products.
- Verify the viewer on desktop and mobile and confirm metadata and error handling.

## Required source asset
The repository currently has no `.glb`, `.gltf`, CAD, fabric texture, or mannequin file. The final exact visual cannot be produced from the website code alone. Add a single self-contained GLB containing the first garment, mannequin, UVs, and textures at `public/models/garment.glb`, or upload it here. If it exceeds 20 MB, commit it to the public repository and share its path.

## Technical notes
- The viewer will load real mesh geometry instead of generating shapes in React.
- Materials from the GLB remain authoritative; lighting will use color-managed, physically based rendering.
- Exactness depends on the supplied geometry, UVs, texture resolution, fabric maps, and capture/calibration data.
