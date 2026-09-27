import subprocess
import time
import sys

DEVICE_UDID = "00008130-00010CC63AE8001C"
APP_PATH = "/Users/cece/Library/Developer/Xcode/DerivedData/Minest-gllywvcihiiqozfoperlhbewmjyl/Build/Products/Debug-iphoneos/Minest.app"
SCREENSHOT_PATH = "/Users/cece/.gemini/antigravity/brain/d822a36f-63e2-4c41-9597-7d14274cee2f/real_iphone_deployed.png"
BUNDLE_ID = "com.zouminmin.minest"

print(f"[*] Starting auto-deploy watcher for Peck's iPhone ({DEVICE_UDID})...")
print(f"[*] App bundle: {APP_PATH}")

max_attempts = 45 # 90 seconds total
for attempt in range(1, max_attempts + 1):
    res = subprocess.run(["xcrun", "devicectl", "list", "devices"], capture_output=True, text=True)
    device_line = ""
    for line in res.stdout.splitlines():
        if DEVICE_UDID in line:
            device_line = line
            break
            
    if not device_line:
        print(f"[{attempt}/{max_attempts}] Device UDID not in list. Retrying in 2s...")
        time.sleep(2)
        continue

    # Format: Peck’s iPhone  <Hostname>  <UDID>  <State>  <Model>  physical
    is_unavailable = "unavailable" in device_line
    is_ready = ("available" in device_line and not is_unavailable) or ("connected" in device_line)

    if is_ready:
        print(f"[{attempt}/{max_attempts}] Device detected as READY: {device_line.strip()}")
        print("[*] Installing Minest.app...")
        inst_res = subprocess.run([
            "xcrun", "devicectl", "device", "install", "app",
            "--device", DEVICE_UDID,
            APP_PATH
        ], capture_output=True, text=True)
        
        if inst_res.returncode == 0:
            print("[+] Installation SUCCEEDED!")
            print(inst_res.stdout)
            print("[*] Launching Minest on device...")
            launch_res = subprocess.run([
                "xcrun", "devicectl", "device", "process", "launch",
                "--device", DEVICE_UDID,
                BUNDLE_ID
            ], capture_output=True, text=True)
            print(launch_res.stdout)
            
            time.sleep(2)
            print("[*] Capturing real device screenshot...")
            subprocess.run([
                "xcrun", "devicectl", "device", "capture", "screenshot",
                "--device", DEVICE_UDID,
                "--destination", SCREENSHOT_PATH
            ], capture_output=True, text=True)
            print(f"[+] Deployed and launched successfully! Screenshot saved to {SCREENSHOT_PATH}")
            sys.exit(0)
        else:
            print(f"[-] Install failed with code {inst_res.returncode}:")
            print(inst_res.stderr or inst_res.stdout)
            print("Will retry in 2s...")
    else:
        print(f"[{attempt}/{max_attempts}] Device state is UNAVAILABLE (Screen locked or disconnected). Waiting 2s...")
        
    time.sleep(2)

print("\n[!] Timeout waiting for device to become available.")
print("[!] Please unlock Peck's iPhone or connect via USB-C cable.")
sys.exit(1)
