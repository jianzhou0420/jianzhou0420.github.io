#!/usr/bin/env python3
"""Idempotently wire a page for inline editing: add data-eid to body text blocks
(h1-h4, p, li, figcaption, blockquote) that sit outside nav/footer/head/script/
style/table, and include /_edit/inline-edit.js once. Skips elements that already
carry data-eid, so re-running is safe."""
import sys
import re
from html.parser import HTMLParser

TARGET = {"h1", "h2", "h3", "h4", "p", "li", "figcaption", "blockquote"}
EXCLUDE = {"nav", "footer", "head", "script", "style", "table"}


class Scan(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.exdepth = 0
        self.hits = []
        self.lines = []

    def run(self, html):
        self.lines = html.split("\n")
        self.feed(html)

    def _off(self):
        ln, col = self.getpos()
        return sum(len(self.lines[i]) + 1 for i in range(ln - 1)) + col

    def handle_starttag(self, tag, attrs):
        if tag in EXCLUDE:
            self.exdepth += 1
            return
        if self.exdepth == 0 and tag in TARGET:
            raw = self.get_starttag_text()
            if "data-eid=" not in raw and not raw.endswith("/>"):
                self.hits.append((self._off(), tag))

    def handle_endtag(self, tag):
        if tag in EXCLUDE and self.exdepth > 0:
            self.exdepth -= 1


def wire(path):
    html = open(path).read()
    sc = Scan()
    sc.run(html)
    used = set(re.findall(r'data-eid="([^"]+)"', html))
    counters = {}
    inserts = []
    for off, tag in sc.hits:
        counters[tag] = counters.get(tag, 0) + 1
        eid = "%s-%d" % (tag, counters[tag])
        while eid in used:
            counters[tag] += 1
            eid = "%s-%d" % (tag, counters[tag])
        used.add(eid)
        inserts.append((off + 1 + len(tag), ' data-eid="%s"' % eid))
    for at, text in sorted(inserts, reverse=True):
        html = html[:at] + text + html[at:]
    if "inline-edit.js" not in html:
        tag = '\n  <script src="/_edit/inline-edit.js" defer></script>\n</body>'
        if "\n</body>" in html:
            html = html.replace("\n</body>", tag, 1)
        else:
            html = html.replace("</body>", tag.lstrip("\n"), 1)
    open(path, "w").write(html)
    return len(inserts)


for p in sys.argv[1:]:
    print("%-58s +%d eids" % (p, wire(p)))
