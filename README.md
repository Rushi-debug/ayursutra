# Panchakarma — Full Project (Frontend + Backend)

This document contains a complete project structure with all files for a local **frontend (Vite + React)** and **backend (Node + Express + MongoDB)** setup. The homepage includes the Panchakarma scroll animation and **Sign Up / Sign In controls at the top-left**. Authentication uses JWT and stores user accounts in MongoDB (database `panchakarma_db`, collection `users`).

---

## Project layout

```
panchakarma-project/
├─ backend/
│  ├─ package.json
│  ├─ .env.example
│  ├─ server.js
│  ├─ routes/
│  │  └─ auth.js
│  └─ models/
│     └─ User.js
├─ frontend/
│  ├─ package.json
│  ├─ index.html
│  ├─ vite.config.js (optional)
│  └─ src/
│     ├─ main.jsx
│     ├─ App.jsx
│     ├─ api.js
│     ├─ styles.css
│     └─ components/
│        ├─ SignUp.jsx
│        ├─ SignIn.jsx
│        └─ RemoteLottie.jsx
└─ README.md
```

---

> **DB name:** `panchakarma_db`
> **Collection:** `users`
> Mongo URI: `mongodb://localhost:27017/panchakarma_db`

---

## Full file contents

### `README.md` (root)

```md
# Panchakarma — Full Project

This repo contains a frontend (Vite + React) and backend (Node + Express + MongoDB) for a Panchakarma homepage with SignUp / SignIn.

## Run locally

### Backend
1. Open terminal and `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and set `JWT_SECRET`
4. Ensure MongoDB is running (localhost:27017)
5. `npm run dev` (uses nodemon)

Server runs at http://localhost:5000 by default.

### Frontend
1. Open another terminal and `cd frontend`
2. `npm install`
3. `npm run dev`

Frontend (Vite) runs at http://localhost:5173 by default.

---

DB: `panchakarma_db`, collection: `users`.
```

---

### Backend files

#### `backend/package.json`

```json
{
  "name": "panchakarma-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "mongoose": "^7.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
```

#### `backend/.env.example`

```text
PORT=5000
MONGO_URI=mongodb://localhost:27017/panchakarma_db
JWT_SECRET=replace_with_a_strong_secret
JWT_EXPIRES_IN=7d
```

#### `backend/server.js`

```js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/panchakarma_db';

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' })); // allow Vite dev server

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => res.json({ ok: true }));

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log('Server running on port', PORT));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
```

#### `backend/models/User.js`

```js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
  },
  { timestamps: true, collection: 'users' }
);

module.exports = mongoose.model('User', userSchema);
```

#### `backend/routes/auth.js`

```js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required.' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use.' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashed });
    await user.save();

    // create token
    const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({ ok: true, user: { id: user._id, name: user.name, email: user.email }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({ ok: true, user: { id: user._id, name: user.name, email: user.email }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
```

---

### Frontend files

#### `frontend/package.json`

```json
{
  "name": "panchakarma-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "gsap": "^3.12.0",
    "lottie-react": "^2.3.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

#### `frontend/index.html`

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Panchakarma</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

#### `frontend/src/main.jsx`

```jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')).render(<App />)
```

#### `frontend/src/api.js`

```js
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export async function post(path, body) {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}
```

#### `frontend/src/components/RemoteLottie.jsx`

```jsx
import React, { useEffect, useState } from 'react'
import Lottie from 'lottie-react'

export default function RemoteLottie({ url, style }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    setData(null)
    fetch(url)
      .then(r => r.json())
      .then(json => {
        if (!cancelled) setData(json)
      })
      .catch(err => console.error('Failed to load Lottie JSON', err))
    return () => (cancelled = true)
  }, [url])

  if (!data) return <div className="placeholder">Loading…</div>
  return <Lottie animationData={data} loop style={style || { width: 300, height: 240 }} />
}
```

#### `frontend/src/components/SignUp.jsx`

```jsx
import React, { useState } from 'react'
import { post } from '../api'

export default function SignUp({ onClose, onAuth }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handle(e) {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    const res = await post('/api/auth/register', { name, email, password })
    setLoading(false)
    if (res.ok) {
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      onAuth(res.user)
      onClose()
    } else {
      setErr(res.message || 'Failed')
    }
  }

  return (
    <div className="modal">
      <div className="modalContent">
        <button className="close" onClick={onClose}>×</button>
        <h3>Create account</h3>
        <form onSubmit={handle} className="authForm">
          <input required placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="primary" disabled={loading}>{loading ? 'Creating...' : 'Sign up'}</button>
          {err && <div className="error">{err}</div>}
        </form>
      </div>
    </div>
  )
}
```

#### `frontend/src/components/SignIn.jsx`

```jsx
import React, { useState } from 'react'
import { post } from '../api'

export default function SignIn({ onClose, onAuth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handle(e) {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    const res = await post('/api/auth/login', { email, password })
    setLoading(false)
    if (res.ok) {
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      onAuth(res.user)
      onClose()
    } else {
      setErr(res.message || 'Failed')
    }
  }

  return (
    <div className="modal">
      <div className="modalContent">
        <button className="close" onClick={onClose}>×</button>
        <h3>Sign in</h3>
        <form onSubmit={handle} className="authForm">
          <input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="primary" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
          {err && <div className="error">{err}</div>}
        </form>
      </div>
    </div>
  )
}
```

#### `frontend/src/App.jsx`

```jsx
import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import RemoteLottie from './components/RemoteLottie'
import SignUp from './components/SignUp'
import SignIn from './components/SignIn'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const sectionsRef = useRef([])
  sectionsRef.current = []
  const addToRefs = el => { if (el && !sectionsRef.current.includes(el)) sectionsRef.current.push(el) }

  const [showSignUp, setShowSignUp] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (raw) setUser(JSON.parse(raw))
  }, [])

  useEffect(() => {
    const css = `
      :root{ --bg:#f7f4ef; --card:#fff; --muted:#6b6b6b; --accent:#7aa07a }
      *{box-sizing:border-box}
      body,html,#root{height:100%;margin:0;font-family:Inter, Arial, sans-serif}
      .app{background:linear-gradient(180deg,var(--bg) 0%,#eef6f0 100%);min-height:100vh}
      header.hero{position:sticky;top:0;background:transparent;padding:18px 20px;display:flex;align-items:center;justify-content:flex-start;z-index:40}
      .brand{font-weight:700;color:var(--accent);font-size:1.1rem;margin-left:12px}
      .authControls{margin-left:12px;display:flex;gap:8px;align-items:center}
      .authControls button{background:transparent;border:1px solid rgba(0,0,0,0.08);padding:8px 10px;border-radius:8px;cursor:pointer}
      main{width:100%;max-width:1100px;margin:0 auto;padding:20px}
      .section{min-height:70vh;display:flex;align-items:center;justify-content:center;padding:40px}
      .card{width:100%;max-width:880px;background:var(--card);box-shadow:0 8px 30px rgba(0,0,0,0.08);border-radius:14px;display:flex;gap:24px;align-items:center;padding:24px}
      .animWrap{width:320px;flex:0 0 320px;display:flex;align-items:center;justify-content:center}
      .placeholder{width:280px;height:220px;border-radius:10px;background:linear-gradient(180deg,#f3fbf3,#fff);display:flex;align-items:center;justify-content:center;border:1px dashed rgba(0,0,0,0.06);color:var(--muted);}

      /* modal */
      .modal{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.35);z-index:80}
      .modalContent{width:360px;background:#fff;padding:18px;border-radius:12px;position:relative}
      .modalContent .close{position:absolute;right:10px;top:8px;border:none;background:transparent;font-size:20px}
      .authForm{display:flex;flex-direction:column;gap:8px}
      .authForm input{padding:10px;border-radius:8px;border:1px solid #ddd}
      .primary{background:var(--accent);color:#fff;padding:10px;border-radius:8px;border:none;cursor:pointer}
      .error{color:#b00020}

      footer{padding:24px;text-align:center;color:var(--muted)}

      @media (max-width:900px){ .card{flex-direction:column} .animWrap{width:100%} }
    `
    const style = document.createElement('style')
    style.innerHTML = css
    document.head.appendChild(style)

    sectionsRef.current.forEach(section => {
      const card = section.querySelector('.card')
      gsap.set(card, { autoAlpha: 0, y: 40 })
      ScrollTrigger.create({
        trigger: section,
        start: 'top 75%',
        end: 'top 40%',
        onEnter: () => gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }),
        onLeaveBack: () => gsap.to(card, { autoAlpha: 0, y: 40, duration: 0.6, ease: 'power3.out' })
      })

      const animWrap = section.querySelector('.animWrap')
      if (animWrap) {
        gsap.fromTo(animWrap, { y: -10 }, {
          y: 10, ease: 'none', scrollTrigger: { trigger: section, scrub: 0.8, start: 'top bottom', end: 'bottom top' }
        })
      }
    })

    return () => { document.head.removeChild(style); ScrollTrigger.getAll().forEach(t => t.kill()); gsap.killTweensOf('*') }
  }, [])

  const publicAnimations = {
    massage1: 'https://assets7.lottiefiles.com/packages/lf20_7fCbvNSmFD.json',
    massage2: 'https://assets5.lottiefiles.com/packages/lf20_uNwwkb.json',
    calmBreath: 'https://assets.lottiefiles.com/packages/lf20_UJNc2t.json',
    healing: 'https://assets2.lottiefiles.com/packages/lf20_i9mxcD.json'
  }

  const steps = [
    { id: 'vamana', title: 'Vamana — Therapeutic Emesis', desc: 'A cleansing therapy to remove excess Kapha and toxins from the upper digestive tract.', anim: publicAnimations.calmBreath },
    { id: 'virechana', title: 'Virechana — Purgation Therapy', desc: 'A medicated purgation to cleanse Pitta-related toxins and cleanse the intestinal tract.', anim: publicAnimations.healing },
    { id: 'basti', title: 'Basti — Medicated Enema', desc: 'A therapeutic enema using herbal oils and decoctions to balance Vata and remove deep-seated toxins.', anim: publicAnimations.massage1 },
    { id: 'nasya', title: 'Nasya — Nasal Therapy', desc: 'Administration of herbal oils or powders through the nostrils to clear head-related channels and balance doshas.', anim: publicAnimations.massage2 },
    { id: 'raktamokshana', title: 'Raktamokshana — Bloodletting / Purification', desc: 'An ancient cleansing technique to remove impure blood and balance certain conditions.', anim: publicAnimations.healing }
  ]

  function logout() {
    localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null)
  }

  return (
    <div className="app">
      <header className="hero">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="authControls">
            {!user ? (
              <>
                <button onClick={() => setShowSignIn(true)}>Sign in</button>
                <button onClick={() => setShowSignUp(true)}>Sign up</button>
              </>
            ) : (
              <>
                <span style={{ marginRight: 8 }}>Hi, {user.name}</span>
                <button onClick={logout}>Log out</button>
              </>
            )}
          </div>
          <div className="brand">Panchakarma</div>
        </div>
      </header>

      <main>
        <div style={{ textAlign: 'center', padding: 20 }}>
          <h1 style={{ margin: 0 }}>Panchakarma — A Journey of Deep Cleansing</h1>
          <p style={{ color: '#6b6b6b' }}>Scroll down to experience the five primary Panchakarma therapies.</p>
        </div>

        {steps.map(step => (
          <section className="section" key={step.id} ref={addToRefs} id={step.id}>
            <div className="card">
              <div className="animWrap">
                {typeof step.anim === 'string' ? <RemoteLottie url={step.anim} /> : <div className="placeholder">Visual</div>}
              </div>
              <div className="text">
                <h2>{step.title}</h2>
                <p>{step.desc}</p>
                <p style={{ marginTop: 8, color: '#4b4b4b', fontSize: 14 }}>Tip: Add practitioner notes and session details here.</p>
              </div>
            </div>
          </section>
        ))}
      </main>

      <footer>Built with care — always consult an Ayurvedic practitioner.</footer>

      {showSignUp && <SignUp onClose={() => setShowSignUp(false)} onAuth={u => setUser(u)} />}
      {showSignIn && <SignIn onClose={() => setShowSignIn(false)} onAuth={u => setUser(u)} />}
    </div>
  )
}
```

#### `frontend/src/styles.css`

```css
/* Empty - most styles injected by App.jsx for convenience */
body { margin: 0; }
```

---

## How to run (step-by-step)

1. Ensure MongoDB is running on your machine (e.g., `mongod` service or MongoDB Desktop/Compass).
2. Clone or place the folder `panchakarma-project` on your machine.

### Backend

```bash
cd panchakarma-project/backend
npm install
cp .env.example .env
# edit .env and set JWT_SECRET (strong random string)
npm run dev
```

Server will run on `http://localhost:5000`.

### Frontend

```bash
cd panchakarma-project/frontend
npm install
npm run dev
```

Open `http://localhost:5173` and you should see the homepage. Use the **Sign up / Sign in** buttons at the top-left.

---

## Notes & Next steps I can do for you (pick any)

* Add email verification and password reset flows.
* Replace JWT in localStorage with httpOnly cookies (safer).
* Dockerize backend and frontend.
* Push this structure to a GitHub repo and provide the repository link or ZIP.

If you want, I can now **create a zip-style single-file download or prepare a GitHub-ready repo layout** (I will put code into the canvas — ready to copy). Which one do you want next?
