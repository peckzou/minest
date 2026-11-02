# iPhoneDuo67: Alpine + Admont + Trinity in one page

`iPhoneDuo67.html` stacks the three world patches on the untouched base `iPhoneDuo.html` (sha1 ed17ba0f7af2):
`patch_alps.py` -> `patch_admont.py` -> `patch_trinity.py`. Each patch only inserts; the later two were designed against the bare
base, so `mk.py` makes tolerant copies of them (adds the earlier worlds to their anchors and relaxes two "no Alpine layer" asserts).

    python3 tools/voxel-alps/patch_alps.py iPhoneDuo.html s1.html
    python3 mk.py admont/tools/patch_admont.py admont/tools/_combo_admont.py admont alpchalet
    python3 mk.py trinity/tools/patch_trinity.py trinity/tools/_combo_trinity.py trinity alpchalet,admont
    python3 admont/tools/_combo_admont.py s1.html s2.html
    python3 trinity/tools/_combo_trinity.py s2.html iPhoneDuo67.html

Checked headless: all of MinestAlps, MinestAdmont, MinestTrinity and MinestOia load; the Trinity flow (one-tap, door chooser,
Dollhouse with 4 rooms, return pill, walk-in, reload) passes; the Alpine and Admont one-taps open their 3D worlds.
Not tested on a real device.
