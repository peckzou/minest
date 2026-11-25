#!/usr/bin/env python3
"""Static server for the island. The stock `python3 -m http.server` only queues 5 pending connections, so a page that
loads many scripts and frames at once (the holo console does) can get connections reset and come up half-loaded."""
import http.server, socketserver, sys, os
import re, urllib.request, urllib.parse

CACHE = 'books-cache'
UA = 'PhilosophersIsland/1.0 (local educational project)'

def gutenberg_text(book_id):
    """Plain text of a Project Gutenberg book (public domain), from a mirror; cached on disk."""
    path = os.path.join(CACHE, 'pg%d.txt' % book_id)
    if os.path.exists(path):
        with open(path, 'rb') as f: return f.read()
    s = str(book_id); d = '/'.join(s[:-1]) if len(s) > 1 else '0'
    base = 'https://gutenberg.pglaf.org/%s/%s/%s' % (d, s, s)
    for suffix, enc in (('-0.txt', 'utf-8'), ('.txt', 'latin-1'), ('-8.txt', 'latin-1')):
        try:
            with urllib.request.urlopen(urllib.request.Request(base + suffix, headers={'User-Agent': UA}), timeout=40) as r:
                data = r.read().decode(enc, 'replace').encode('utf-8')
            os.makedirs(CACHE, exist_ok=True)
            with open(path, 'wb') as f: f.write(data)
            return data
        except Exception:
            continue
    return None

class Handler(http.server.SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
    def do_GET(self):
        # /api/pg?id=1497 → the text of that Project Gutenberg book (the mirror sends no CORS header, so the page can't fetch it itself)
        u = urllib.parse.urlparse(self.path)
        if u.path == '/api/pg':
            m = re.match(r'^\d{1,6}$', urllib.parse.parse_qs(u.query).get('id', [''])[0])
            data = gutenberg_text(int(m.group(0))) if m else None
            if data is None:
                self.send_response(404); self.send_header('Content-Length', '0'); self.end_headers(); return
            self.send_response(200); self.send_header('Content-Type', 'text/plain; charset=utf-8'); self.send_header('Content-Length', str(len(data))); self.end_headers(); self.wfile.write(data); return
        super().do_GET()
    def log_message(self, *a):
        pass

class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    request_queue_size = 256

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    print('http://127.0.0.1:%d/' % port, flush=True)
    Server(('127.0.0.1', port), Handler).serve_forever()
