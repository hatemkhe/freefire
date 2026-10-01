"""
MonoCanvas - Minimalist Drawing Studio
Built using Python (Flask) with embedded HTML, CSS, and JavaScript.

Structure:
1. Authentication Logic (Login & Session)
   [Separated by 10 empty lines]
2. Canvas Studio Logic (2 tools: Pen & Eraser, 1 saved drawing per account)
"""

import os
import sqlite3
from flask import Flask, request, jsonify, render_template_string, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "monocanvas-studio-secret-key")
DB_NAME = "monocanvas.db"


def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS drawings (
            user_id INTEGER PRIMARY KEY,
            image_data TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    """)
    conn.commit()
    conn.close()


init_db()


# ==============================================================================
# SECTION 1: AUTHENTICATION & LOGIN CODE
# ==============================================================================

@app.route("/")
def index():
    if "user_id" in session:
        return redirect(url_for("canvas_page"))
    return redirect(url_for("login_page"))


@app.route("/login", methods=["GET", "POST"])
def login_page():
    if request.method == "POST":
        data = request.get_json() if request.is_json else request.form
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        if not email or not password:
            msg = "Please enter both email and password."
            return jsonify({"success": False, "error": msg}), 400

        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("SELECT id, password_hash FROM users WHERE email = ?", (email,))
        user = c.fetchone()

        if user:
            if check_password_hash(user[1], password):
                session["user_id"] = user[0]
                session["user_email"] = email
                conn.close()
                if request.is_json:
                    return jsonify({"success": True, "redirect": url_for("canvas_page")})
                return redirect(url_for("canvas_page"))
            else:
                conn.close()
                msg = "Invalid password."
                if request.is_json:
                    return jsonify({"success": False, "error": msg}), 401
                return render_template_string(HTML_TEMPLATE, view="login", error=msg)
        else:
            # Automatic account registration for authorized new user
            pw_hash = generate_password_hash(password)
            c.execute("INSERT INTO users (email, password_hash) VALUES (?, ?)", (email, pw_hash))
            conn.commit()
            user_id = c.lastrowid
            session["user_id"] = user_id
            session["user_email"] = email
            conn.close()
            if request.is_json:
                return jsonify({"success": True, "redirect": url_for("canvas_page")})
            return redirect(url_for("canvas_page"))

    return render_template_string(HTML_TEMPLATE, view="login")


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login_page"))










# ==============================================================================
# SECTION 2: DRAWING CANVAS CODE (2 TOOLS: PEN & ERASER - 1 SAVED DRAWING)
# (Separated by 10 empty lines from Authentication code above)
# ==============================================================================

@app.route("/canvas")
def canvas_page():
    if "user_id" not in session:
        return redirect(url_for("login_page"))
    return render_template_string(
        HTML_TEMPLATE,
        view="canvas",
        user_email=session.get("user_email")
    )


@app.route("/api/drawing", methods=["GET"])
def get_user_drawing():
    """Fetch the single saved drawing for this user."""
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT image_data, updated_at FROM drawings WHERE user_id = ?", (session["user_id"],))
    row = c.fetchone()
    conn.close()

    if row:
        return jsonify({"has_drawing": True, "image_data": row[0], "updated_at": row[1]})
    return jsonify({"has_drawing": False, "image_data": None})


@app.route("/api/drawing", methods=["POST"])
def save_user_drawing():
    """Save or overwrite the single drawing slot for this user account."""
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    image_data = data.get("image_data")

    if not image_data or not image_data.startswith("data:image/"):
        return jsonify({"error": "Invalid image payload."}), 400

    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Exactly one drawing per account: UPSERT replaces the single record
    c.execute("""
        INSERT INTO drawings (user_id, image_data, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
            image_data = excluded.image_data,
            updated_at = CURRENT_TIMESTAMP
    """, (session["user_id"], image_data))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Drawing saved successfully to your single account slot."})


@app.route("/api/drawing", methods=["DELETE"])
def delete_user_drawing():
    """Clear the single saved artwork slot."""
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("DELETE FROM drawings WHERE user_id = ?", (session["user_id"],))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Drawing slot cleared."})


# ==============================================================================
# HTML & CSS INTERFACE TEMPLATE
# ==============================================================================

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MonoCanvas - Minimalist Drawing Studio</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: #f8fafc; color: #0f172a; min-height: 100vh; display: flex; flex-direction: column; }
    header { background: #ffffff; border-bottom: 1px solid #e2e8f0; height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }
    .brand { font-size: 1.1rem; font-weight: 700; color: #0f172a; }
    .user-tag { font-size: 0.85rem; color: #64748b; }
    .btn-logout { text-decoration: none; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; color: #334155; margin-left: 12px; }
    .btn-logout:hover { background: #f1f5f9; }

    /* Login Box CSS */
    .login-wrapper { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .login-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; width: 100%; max-width: 380px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); text-align: center; }
    .login-title { font-size: 1.4rem; font-weight: 700; margin-bottom: 20px; }
    .field-group { text-align: left; margin-bottom: 16px; }
    .field-group label { display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: #475569; }
    .field-group input { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; outline: none; }
    .btn-submit { width: 100%; padding: 11px; background: #0f172a; color: #ffffff; border: none; border-radius: 8px; font-weight: 600; font-size: 0.9rem; cursor: pointer; margin-top: 8px; }
    .btn-submit:hover { background: #1e293b; }
    .alert-msg { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 6px; padding: 8px 12px; font-size: 0.8rem; margin-bottom: 16px; }










    /* Canvas Board CSS (Separated by 10 empty lines) */
    .canvas-layout { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 20px; }
    .toolbar-row { display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 860px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 16px; margin-bottom: 16px; }
    .tools-wrap { display: flex; align-items: center; gap: 8px; }
    .tool-btn { padding: 8px 14px; border: 1px solid #cbd5e1; background: #ffffff; border-radius: 6px; font-size: 0.85rem; font-weight: 500; cursor: pointer; }
    .tool-btn.active { background: #0f172a; color: #ffffff; border-color: #0f172a; }
    .actions-wrap { display: flex; align-items: center; gap: 8px; }
    .btn-save { background: #0f172a; color: #ffffff; border: none; padding: 8px 14px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
    .btn-save:hover { background: #1e293b; }
    .btn-clear { background: #ffffff; color: #dc2626; border: 1px solid #fecaca; padding: 8px 12px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; }
    .btn-clear:hover { background: #fef2f2; }
    .board-frame { width: 100%; max-width: 860px; aspect-ratio: 16 / 10; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.03); }
    canvas { width: 100%; height: 100%; display: block; cursor: crosshair; }
    .meta-bar { width: 100%; max-width: 860px; margin-top: 10px; display: flex; justify-content: space-between; font-size: 0.8rem; color: #64748b; }
  </style>
</head>
<body>

  {% if view == 'canvas' %}
  <header>
    <div class="brand">MonoCanvas Studio</div>
    <div class="user-tag">
      <span>User: <strong>{{ user_email }}</strong></span>
      <a href="/logout" class="btn-logout">Log Out</a>
    </div>
  </header>
  {% endif %}

  {% if view == 'login' %}
  <!-- Login View -->
  <div class="login-wrapper">
    <div class="login-box">
      <h2 class="login-title">Sign In</h2>
      {% if error %}
      <div class="alert-msg">{{ error }}</div>
      {% endif %}
      <form method="POST" action="/login">
        <div class="field-group">
          <label>Email Address</label>
          <input type="email" name="email" required placeholder="name@example.com" autocomplete="email">
        </div>
        <div class="field-group">
          <label>Password</label>
          <input type="password" name="password" required placeholder="••••••••" autocomplete="current-password">
        </div>
        <button type="submit" class="btn-submit">Sign In</button>
      </form>
    </div>
  </div>
  {% endif %}










  {% if view == 'canvas' %}
  <!-- Canvas View (Separated by 10 empty lines) -->
  <div class="canvas-layout">
    <div class="toolbar-row">
      <!-- STRICTLY ONLY 2 TOOLS: PEN & ERASER -->
      <div class="tools-wrap">
        <button type="button" class="tool-btn active" id="btnPen" onclick="selectTool('pen')">✏️ Pen</button>
        <button type="button" class="tool-btn" id="btnEraser" onclick="selectTool('eraser')">🧹 Eraser</button>
        <label style="font-size: 0.8rem; color: #475569; margin-left: 8px;">Size:</label>
        <input type="range" id="sizeRange" min="2" max="36" value="4" oninput="updateSize(this.value)">
        <span id="sizeDisplay" style="font-size: 0.8rem; font-weight: 600; width: 30px;">4px</span>
      </div>

      <div class="actions-wrap">
        <button type="button" class="btn-clear" onclick="clearCanvas()">Clear</button>
        <button type="button" class="btn-save" id="btnSave" onclick="saveArtwork()">Save (1 Slot)</button>
      </div>
    </div>

    <div class="board-frame">
      <canvas id="drawingCanvas"></canvas>
    </div>

    <div class="meta-bar">
      <span id="slotStatus">Single drawing slot: Checking...</span>
      <span>Tools: Pen & Eraser only</span>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    let tool = 'pen'; // 'pen' or 'eraser' only
    let drawing = false;
    let strokeWidth = 4;

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }

    function selectTool(selected) {
      tool = selected;
      document.getElementById('btnPen').classList.toggle('active', tool === 'pen');
      document.getElementById('btnEraser').classList.toggle('active', tool === 'eraser');
    }

    function updateSize(val) {
      strokeWidth = val;
      document.getElementById('sizeDisplay').textContent = val + 'px';
    }

    function getCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function start(e) {
      drawing = true;
      const pos = getCoords(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      draw(e);
    }

    function draw(e) {
      if (!drawing) return;
      if (e.touches) e.preventDefault();
      const pos = getCoords(e);
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = tool === 'pen' ? '#0f172a' : '#ffffff';
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    function stop() {
      if (drawing) {
        ctx.closePath();
        drawing = false;
      }
    }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stop);

    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', stop);

    function clearCanvas() {
      if (confirm('Clear canvas to blank?')) {
        const rect = canvas.getBoundingClientRect();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);
      }
    }

    async function saveArtwork() {
      const btn = document.getElementById('btnSave');
      btn.textContent = 'Saving...';
      const dataUrl = canvas.toDataURL('image/png');
      try {
        const res = await fetch('/api/drawing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_data: dataUrl })
        });
        const result = await res.json();
        btn.textContent = 'Saved!';
        document.getElementById('slotStatus').textContent = 'Single slot: 1/1 artwork saved';
        setTimeout(() => { btn.textContent = 'Save (1 Slot)'; }, 2000);
      } catch (err) {
        btn.textContent = 'Save (1 Slot)';
        alert('Could not save drawing.');
      }
    }

    async function loadSaved() {
      try {
        const res = await fetch('/api/drawing');
        const data = await res.json();
        if (data.has_drawing && data.image_data) {
          const img = new Image();
          img.onload = () => {
            const rect = canvas.getBoundingClientRect();
            ctx.drawImage(img, 0, 0, rect.width, rect.height);
          };
          img.src = data.image_data;
          document.getElementById('slotStatus').textContent = 'Single slot: 1/1 artwork saved (' + data.updated_at + ')';
        } else {
          document.getElementById('slotStatus').textContent = 'Single slot: Empty';
        }
      } catch (err) {
        document.getElementById('slotStatus').textContent = 'Single slot: Ready';
      }
    }

    window.addEventListener('load', () => {
      resizeCanvas();
      loadSaved();
    });
  </script>
  {% endif %}

</body>
</html>
"""

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
