/* In-place text editor for the project pages.
 *
 * Activates ONLY when the URL has ?edit (so public visitors never see it).
 * Makes every [data-eid] element editable as plain text, shows a toolbar, and
 * on Save writes the changed text back to the .html source via the preview
 * server's POST /save. If the server has no save API (e.g. GitHub Pages), it
 * falls back to downloading a patched copy of the HTML.
 *
 * Include once, anywhere:  <script src="/_edit/inline-edit.js" defer></script>
 */
(function () {
  var params = new URLSearchParams(location.search);
  if (!params.has("edit")) return;

  var orig = new Map(); // eid -> original innerHTML
  var els = Array.prototype.slice.call(document.querySelectorAll("[data-eid]"));
  if (!els.length) return;

  var ALLOWED = { STRONG: 1, B: 1, EM: 1, I: 1, A: 1, CODE: 1, SPAN: 1, BR: 1 };
  // light sanitize: drop edit attrs, unwrap block/junk tags contentEditable may
  // inject (DIV/FONT/P…), keep the inline emphasis tags + their class/href/style.
  function clean(el) {
    var node = el.cloneNode(true);
    (function walk(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 1) {
          c.removeAttribute && c.removeAttribute("contenteditable");
          if (!ALLOWED[c.tagName]) {
            while (c.firstChild) n.insertBefore(c.firstChild, c);
            n.removeChild(c);
          } else {
            walk(c);
          }
        }
      });
    })(node);
    return node.innerHTML.replace(/ /g, "&nbsp;").trim();
  }

  els.forEach(function (el) {
    orig.set(el.getAttribute("data-eid"), clean(el));
    el.setAttribute("contenteditable", "true");
    el.classList.add("ie-editable");
    el.addEventListener("input", refresh);
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        el.blur();
      }
    });
    // paste as plain text so no foreign markup/styles sneak in
    el.addEventListener("paste", function (e) {
      e.preventDefault();
      var t = (e.clipboardData || window.clipboardData).getData("text/plain");
      document.execCommand("insertText", false, t);
    });
  });

  // ---- styles ----
  var css = document.createElement("style");
  css.textContent =
    ".ie-editable{outline:1px dashed rgba(255,140,80,.45);outline-offset:3px;border-radius:3px;cursor:text;transition:outline-color .15s}" +
    ".ie-editable:hover{outline-color:rgba(255,140,80,.9)}" +
    ".ie-editable:focus{outline:2px solid #ff8c50;background:rgba(255,140,80,.07)}" +
    ".ie-editable.ie-dirty{outline-color:#34e0bf}" +
    "#ie-bar{position:fixed;z-index:99999;right:16px;bottom:16px;display:flex;gap:8px;align-items:center;" +
    "padding:8px 10px;border-radius:10px;background:#11151fee;border:1px solid #2a3344;" +
    "box-shadow:0 8px 30px #000a;font:600 12px/1 'JetBrains Mono',ui-monospace,monospace;color:#cdd7e4;backdrop-filter:blur(6px)}" +
    "#ie-bar button{font:inherit;padding:6px 11px;border-radius:7px;border:1px solid #36425a;background:#1b2230;color:#cdd7e4;cursor:pointer}" +
    "#ie-bar button:hover{border-color:#52617d}" +
    "#ie-bar .ie-save{background:#ff6a3d;border-color:#ff6a3d;color:#1a1207}" +
    "#ie-bar .ie-save[disabled]{opacity:.4;cursor:default}" +
    "#ie-bar .ie-tag{color:#7f8ca0}#ie-bar .ie-n{color:#34e0bf}";
  document.head.appendChild(css);

  // ---- toolbar ----
  var bar = document.createElement("div");
  bar.id = "ie-bar";
  bar.innerHTML =
    '<span class="ie-tag">edit</span><span class="ie-n" id="ie-count">0</span>' +
    '<button class="ie-reset" id="ie-reset">Reset</button>' +
    '<button class="ie-save" id="ie-save" disabled>Save</button>';
  document.body.appendChild(bar);
  var $count = bar.querySelector("#ie-count");
  var $save = bar.querySelector("#ie-save");
  bar.querySelector("#ie-reset").addEventListener("click", resetAll);
  $save.addEventListener("click", save);

  function changed() {
    return els.filter(function (el) {
      return clean(el) !== orig.get(el.getAttribute("data-eid"));
    });
  }
  function refresh() {
    var n = 0;
    els.forEach(function (el) {
      var d = clean(el) !== orig.get(el.getAttribute("data-eid"));
      el.classList.toggle("ie-dirty", d);
      if (d) n++;
    });
    $count.textContent = n;
    $save.disabled = n === 0;
  }
  function resetAll() {
    els.forEach(function (el) {
      el.innerHTML = orig.get(el.getAttribute("data-eid"));
    });
    refresh();
  }

  function save() {
    var edits = changed().map(function (el) {
      return { eid: el.getAttribute("data-eid"), html: clean(el) };
    });
    if (!edits.length) return;
    $save.textContent = "Saving…";
    $save.disabled = true;
    fetch("/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: location.pathname, edits: edits }),
    })
      .then(function (r) {
        return r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status));
      })
      .then(function (res) {
        if (!res.ok) throw new Error(res.error || "save failed");
        edits.forEach(function (e) {
          orig.set(e.eid, e.html);
        });
        refresh();
        flash("Saved ✓ (" + res.applied + ")");
        if (res.missed && res.missed.length) flash("missed: " + res.missed.join(", "), true);
      })
      .catch(function () {
        // no server save API → offer a patched-HTML download
        downloadPatched(edits);
      })
      .finally(function () {
        $save.textContent = "Save";
        refresh();
      });
  }

  function patchByEid(html, eid, inner) {
    var open = new RegExp('<([a-zA-Z][\\w-]*)([^>]*\\bdata-eid="' + eid + '"[^>]*)>');
    var m = open.exec(html);
    if (!m) return html;
    var tag = m[1],
      openEnd = m.index + m[0].length;
    var close = new RegExp("<(/?)" + tag + "\\b[^>]*>", "ig");
    close.lastIndex = openEnd;
    var depth = 1,
      mm;
    while ((mm = close.exec(html))) {
      if (mm[1] === "/") {
        if (--depth === 0)
          return html.slice(0, openEnd) + inner + html.slice(mm.index);
      } else depth++;
    }
    return html;
  }
  function downloadPatched(edits) {
    fetch(location.pathname)
      .then(function (r) {
        return r.text();
      })
      .then(function (html) {
        edits.forEach(function (e) {
          html = patchByEid(html, e.eid, e.html);
        });
        var blob = new Blob([html], { type: "text/html" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = (location.pathname.split("/").pop() || "index.html");
        a.click();
        URL.revokeObjectURL(a.href);
        edits.forEach(function (e) {
          orig.set(e.eid, e.html);
        });
        flash("No save API — downloaded patched HTML");
      });
  }

  function flash(msg, warn) {
    var t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText =
      "position:fixed;right:16px;bottom:62px;z-index:99999;padding:7px 11px;border-radius:8px;" +
      "font:600 12px 'JetBrains Mono',monospace;color:#0c0f16;background:" +
      (warn ? "#ffcf5e" : "#34e0bf") + ";box-shadow:0 6px 20px #0008";
    document.body.appendChild(t);
    setTimeout(function () {
      t.style.transition = "opacity .4s";
      t.style.opacity = "0";
      setTimeout(function () {
        t.remove();
      }, 400);
    }, 1800);
  }

  refresh();
})();
