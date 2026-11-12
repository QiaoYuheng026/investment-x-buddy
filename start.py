"""Local-only launcher. Requires Python 3; installs no packages."""
import functools
import http.server
import pathlib
import threading
import webbrowser

root = pathlib.Path(__file__).resolve().parent
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
with http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler) as server:
    url = f'http://127.0.0.1:{server.server_port}/index.html'
    print('Investment X Buddy: ' + url)
    print('Local files only. Keep this window open. Press Ctrl+C to stop.')
    threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
