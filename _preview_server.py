#!/usr/bin/env python3
"""Static preview server WITH HTTP Range support + an in-place text-edit save API.

* GET: serves the repo root, honouring HTTP Range (so the hero <video> is
  seekable — stdlib http.server does NOT support Range).
* POST /save: body {"path": "/src/.../index.html", "edits": [{"eid","text"}]}.
  Rewrites only the inner text of each element carrying data-eid="<eid>" in that
  HTML file (minimal, targeted diffs), then writes it back. Used by the
  ?edit=1 inline editor (_edit/inline-edit.js).

Usage:  python3 _preview_server.py [port]   (default 8090, serves repo root)
"""
from __future__ import annotations  # 3.8: lazy annotations (allow tuple[...] hints)

import json
import os
import re
import sys
import threading
import time
from functools import partial
from http.server import HTTPServer, ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.abspath(__file__))

# ---- live-reload state (only active when started with --reload) ----
RELOAD = False
_VERSION = [0]  # bumped whenever a watched file changes
_WATCH_EXT = (".html", ".htm", ".css", ".js", ".svg", ".json", ".md")
_SKIP_DIRS = {".git", "node_modules", "__pycache__"}
_LR_SNIPPET = (
    b'<script>(function(){try{var s=new EventSource("/__livereload");'
    b's.onmessage=function(e){if(e.data==="reload")location.reload();};}'
    b"catch(_){}})();</script>"
)


def _watch_loop():
    """Bump _VERSION whenever any watched file's mtime changes."""
    prev = None
    while True:
        latest = 0
        for dp, dns, fns in os.walk(ROOT):
            dns[:] = [d for d in dns if d not in _SKIP_DIRS and not d.startswith(".")]
            for fn in fns:
                if fn.endswith(_WATCH_EXT):
                    try:
                        m = os.stat(os.path.join(dp, fn)).st_mtime_ns
                        if m > latest:
                            latest = m
                    except OSError:
                        pass
        if prev is None:
            prev = latest
        elif latest != prev:
            prev = latest
            _VERSION[0] += 1
        time.sleep(0.5)


def replace_inner_by_eid(html: str, eid: str, new_inner: str) -> tuple[str, bool]:
    """Replace the inner HTML of the element carrying data-eid="<eid>".
    `new_inner` is already valid HTML (the element's sanitized innerHTML, where
    the browser has entity-encoded any literal <, &). Matches the closing tag
    accounting for same-tag nesting."""
    open_re = re.compile(
        r'<([a-zA-Z][a-zA-Z0-9]*)([^>]*\bdata-eid="' + re.escape(eid) + r'"[^>]*)>'
    )
    m = open_re.search(html)
    if not m:
        return html, False
    tag = m.group(1)
    open_end = m.end()
    close_re = re.compile(r"<(/?)" + re.escape(tag) + r"\b[^>]*>", re.IGNORECASE)
    depth = 1
    i = open_end
    while True:
        mm = close_re.search(html, i)
        if not mm:
            return html, False
        if mm.group(1) == "/":
            depth -= 1
            if depth == 0:
                return html[:open_end] + new_inner + html[mm.start():], True
        else:
            depth += 1
        i = mm.end()


class EditHandler(SimpleHTTPRequestHandler):
    # ---- always-fresh: a dev preview must never serve stale partials ----
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    # ---- Range-capable GET ----
    def send_head(self):
        rng = self.headers.get("Range")
        if rng is None:
            return super().send_head()
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None
        size = os.fstat(f.fileno()).st_size
        try:
            unit, _, spec = rng.partition("=")
            s_s, _, e_s = spec.partition("-")
            start = int(s_s) if s_s else 0
            end = int(e_s) if e_s else size - 1
            end = min(end, size - 1)
            if unit.strip() != "bytes" or start > end:
                raise ValueError
        except ValueError:
            f.close()
            self.send_error(416, "Requested Range Not Satisfiable")
            return None
        f.seek(start)
        self._range = (start, end)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        return f

    def copyfile(self, source, outputfile):
        rng = getattr(self, "_range", None)
        if rng is None:
            return super().copyfile(source, outputfile)
        start, end = rng
        remaining = end - start + 1
        while remaining > 0:
            chunk = source.read(min(64 * 1024, remaining))
            if not chunk:
                break
            outputfile.write(chunk)
            remaining -= len(chunk)
        self._range = None

    # ---- live-reload (only when RELOAD) ----
    def do_GET(self):
        if RELOAD:
            p = self.path.split("?")[0]
            if p == "/__livereload":
                return self._serve_sse()
            fpath = self.translate_path(self.path)
            if os.path.isdir(fpath):
                fpath = os.path.join(fpath, "index.html")
            if fpath.endswith((".html", ".htm")) and os.path.isfile(fpath):
                return self._serve_html(fpath)
        return super().do_GET()

    def _serve_html(self, fpath):
        try:
            with open(fpath, "rb") as fh:
                body = fh.read()
        except OSError:
            self.send_error(404)
            return
        if b"</body>" in body:
            body = body.replace(b"</body>", _LR_SNIPPET + b"</body>", 1)
        else:
            body += _LR_SNIPPET
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _serve_sse(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Connection", "keep-alive")
        self.end_headers()
        last = _VERSION[0]
        try:
            while True:
                time.sleep(0.5)
                if _VERSION[0] != last:
                    last = _VERSION[0]
                    self.wfile.write(b"data: reload\n\n")
                else:
                    self.wfile.write(b": ping\n\n")
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, OSError):
            pass

    # ---- save API ----
    def _json(self, code: int, obj: dict):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path.split("?")[0] != "/save":
            self.send_error(404)
            return
        try:
            n = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(n) or b"{}")
            rel = (data.get("path") or "").lstrip("/")
            edits = data.get("edits") or []
            fpath = os.path.normpath(os.path.join(ROOT, rel))
            if not fpath.startswith(ROOT) or not fpath.endswith(
                (".html", ".htm")
            ) or not os.path.isfile(fpath):
                self._json(400, {"ok": False, "error": "bad path"})
                return
            with open(fpath, encoding="utf-8") as fh:
                html = fh.read()
            applied, missed = 0, []
            for e in edits:
                eid, inner = e.get("eid"), e.get("html", "")
                if not eid:
                    continue
                html, ok = replace_inner_by_eid(html, eid, inner)
                if ok:
                    applied += 1
                else:
                    missed.append(eid)
            with open(fpath, "w", encoding="utf-8") as fh:
                fh.write(html)
            self._json(200, {"ok": True, "applied": applied, "missed": missed})
        except Exception as exc:  # noqa: BLE001
            self._json(500, {"ok": False, "error": str(exc)})


def main():
    global RELOAD
    args = sys.argv[1:]
    RELOAD = "--reload" in args or os.environ.get("LIVERELOAD") == "1"
    args = [a for a in args if a != "--reload"]
    port = int(args[0]) if args else 8090
    handler = partial(EditHandler, directory=ROOT)
    server_cls = ThreadingHTTPServer if RELOAD else HTTPServer
    httpd = server_cls(("0.0.0.0", port), handler)
    extra = "  + live-reload (auto-refresh on file change)" if RELOAD else ""
    print(f"Range+edit preview on http://localhost:{port}{extra}  (root: {ROOT})")
    if RELOAD:
        threading.Thread(target=_watch_loop, daemon=True).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped.")


if __name__ == "__main__":
    main()
