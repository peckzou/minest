#!/usr/bin/env python3
"""Test production playback protocol/coordinator/store logic without a paired Watch.
Only the platform notifications/widget reload and preference domain are substituted.
No production App Group data is accessed.
"""
from pathlib import Path
import subprocess
import tempfile
import uuid

root = Path(__file__).resolve().parents[2]
phone = root / 'ios/Minest/Minest'
watch = root / 'ios/Minest/MinestWatch'
widget = root / 'ios/Minest/MinestWidget'
assert (phone/'WatchPlaybackProtocol.swift').read_bytes() == (watch/'WatchPlaybackProtocol.swift').read_bytes()
assert (phone/'CarFlashStore.swift').read_bytes() == (widget/'CarFlashStore.swift').read_bytes()
store = (phone/'CarFlashStore.swift').read_text()
store = store.replace('group.com.zouminmin.minest', 'test.minest.watch.' + str(uuid.uuid4()))
store = store.replace('#if canImport(WidgetKit)\nimport WidgetKit\n#endif', '')
store = store.replace('        #if canImport(WidgetKit)\n        WidgetCenter.shared.reloadTimelines(ofKind: widgetKind)\n        #endif', '')
store = '\n'.join(line for line in store.splitlines() if 'CFNotificationCenterPostNotification' not in line)
with tempfile.TemporaryDirectory(prefix='minest-watch-tests-') as directory:
    temp = Path(directory)
    (temp/'CarFlashStore.swift').write_text(store)
    subprocess.run(['xcrun', 'swiftc', '-swift-version', '5', '-parse-as-library',
                    str(phone/'WatchPlaybackProtocol.swift'), str(phone/'WatchPlaybackCoordinator.swift'),
                    str(temp/'CarFlashStore.swift'), str(Path(__file__).with_name('PlaybackTests.swift')),
                    '-o', str(temp/'playback-tests')], check=True)
    subprocess.run([str(temp/'playback-tests')], check=True)
