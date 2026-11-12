#!/bin/sh
# the voxel world layers, in order (each later one sits after the earlier ones in mn-voxel-62)
cd "$(dirname "$0")/../.." && python3 tools/voxel/patch_build75.py && python3 tools/voxel/patch_terrain76.py && python3 tools/voxel/patch_console77.py && python3 tools/voxel/patch_show78.py && python3 tools/voxel/patch_levels79.py && python3 tools/voxel/patch_ux80.py
