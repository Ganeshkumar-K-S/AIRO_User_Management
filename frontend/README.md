<<<<<<< HEAD
# AIRO_User_Management
=======
# Finnger — Files to Add

Drop these files into your existing Next.js project.

## Where each file goes

```
your-project/
├── .env.local                          ← ADD (create if missing)
│
├── app/
│   ├── layout.tsx                      ← REPLACE
│   ├── page.tsx                        ← REPLACE (redirects to /login)
│   ├── login/
│   │   └── page.tsx                    ← ADD (create folder + file)
│   ├── signup/
│   │   └── page.tsx                    ← ADD
│   ├── otp/
│   │   └── page.tsx                    ← ADD
│   └── home/
│       └── page.tsx                    ← ADD
│
├── components/
│   └── AuthLayout.tsx                  ← ADD (create folder + file)
│
├── lib/
│   └── api.ts                          ← ADD (create folder + file)
│
└── styles/
    └── globals.css                     ← ADD (create folder + file)
```

## ✅ JWT — How it works

**Login / OTP success** → `saveAuth(token, email, name)` stores:
```
localStorage['access_token'] = "eyJhbGci..."
localStorage['user_email']   = "user@example.com"
localStorage['user_name']    = "Stanley"
```

**Every protected API call** uses `apiGet()` / `apiPostAuth()` / `apiPatch()`:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Public calls** (login, signup, send-otp) use `apiPost()` — no JWT needed.

## ⚠️ Add CORS to your FastAPI main.py

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Run

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Auth Flow

```
/signup  →  fill form  →  POST /auth/send-otp  →  /otp
/otp     →  enter code →  POST /auth/signup
                        →  POST /auth/login (auto)
                        →  JWT saved  →  /home

/login   →  fill form  →  POST /auth/login
                        →  JWT saved  →  /home
```

## Your tailwind.config.js — make sure content includes app/

```js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './styles/**/*.css',
  ],
  theme: { extend: {} },
  plugins: [],
}
```
>>>>>>> 9626379 (Resume added)
