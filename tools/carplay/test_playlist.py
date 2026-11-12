from pathlib import Path
import subprocess,tempfile
source=Path('ios/Minest/Minest/CarFlashStore.swift').read_text()
assert source==Path('ios/Minest/MinestWidget/CarFlashStore.swift').read_text(),'app/widget schema diverged'
model='import Foundation\n'+source[source.index('public struct CarFlashPlaylist'):source.index('public enum CarFlashStore')]
with tempfile.TemporaryDirectory(prefix='minest-carflash-test-') as folder:
    file=Path(folder)/'main.swift'
    file.write_text(model+Path('tools/carplay/playlist-tests.swift').read_text())
    sdk=subprocess.check_output(['xcrun','--sdk','macosx','--show-sdk-path'],text=True).strip()
    subprocess.run(['xcrun','swift','-sdk',sdk,str(file)],check=True,timeout=90)
