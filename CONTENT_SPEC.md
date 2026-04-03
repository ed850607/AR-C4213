# 3D content specification (for manufacturers)

Deliver **glTF 2.0** assets, preferably **`.glb`** (single file, embedded textures).

| Item | Recommendation |
|------|----------------|
| Format | **GLB** (binary glTF 2.0) |
| Units | **Meters** in the DCC export; document any exception |
| Pivots | Part origin at a logical attach point when possible |
| Animation | Use **glTF animation clips** for tool motion; reference clip names in `manifest.json` |
| Naming | ASCII file names, e.g. `step01_rail.glb` |

Optional fields in `manifest.json` per step:

- `partModel`: path under `public/`, e.g. `models/step01_rail.glb`
- `animationClip`: name of a clip inside that GLB (wired in code when you add a mixer)

Convert FBX/OBJ/STEP in Blender or your CAD pipeline to GLB before shipping.
