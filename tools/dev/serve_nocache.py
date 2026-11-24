#!/usr/bin/env python3
"""Static preview server that tells the browser to revalidate every file.

`python3 -m http.server` sends no Cache-Control, so a browser keeps showing an older index.html (and older scripts beside
a newer page) for a while after the files change. This one answers with `Cache-Control: no-cache`: the browser still
gets a quick 304 for a file that has not changed, and the new file as soon as it has.

Usage: python3 tools/dev/serve_nocache.py [port]   (default 3006; serves the repository root)
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3006
    ThreadingHTTPServer(('0.0.0.0', port), partial(Handler, directory=str(ROOT))).serve_forever()
