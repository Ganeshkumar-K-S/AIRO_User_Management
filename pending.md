# Pending Technical Debt

## 1. Database Implementation (MongoDB)

Currently, the application relies on an in-memory dictionary (`MOCK_USER_DATA`) in `backend/app/routes/form_routes.py` to bypass a real database. We need to implement MongoDB to persist user data across sessions.

### Proposed MongoDB Schema & Structure
```javascript
// Database: airo
// Collection: users

{
  "_id": ObjectId("..."),       // MongoDB assigned unique ID
  "email": "user@gmail.com",    // User's primary email (Indexed, Unique)
  "name": "Jane Doe",           // User's full name
  "auth_provider": "google",    // How they logged in (e.g., Google OAuth)
  
  // Profile Information
  "profile": {
    "role": "Frontend Developer",
    "bio": "Passionate developer focusing on React and Next.js",
    "skills": ["JavaScript", "TypeScript", "React", "Next.js"],
    "experience_years": 3
  },
  
  // Platform Integrations (Currently Mocked)
  "integrations": {
    "github": {
      "username": "janedoe",
      "verified": true,
      "linked_at": ISODate("2026-03-05T10:00:00Z"),
      "stats": {
        "public_repos": 15,
        "followers": 20
      }
    },
    "leetcode": {
      "username": "janedoe123",
      "verified": true,
      "linked_at": ISODate("2026-03-05T10:05:00Z"),
      "stats": {
        "solved_count": 150,
        "rating": 1650
      }
    }
  },
  
  // App Specific Data
  "generated_resumes": [
    {
      "resume_id": ObjectId("..."),
      "target_role": "Senior Frontend Engineer",
      "created_at": ISODate("2026-03-05T11:00:00Z"),
      "ats_score": 85,
      "data": {} // The actual parsed/generated JSON resume structure
    }
  ],
  
  "created_at": ISODate("2026-03-04T08:00:00Z"),
  "updated_at": ISODate("2026-03-05T10:05:00Z")
}
```

---

## 2. Resolving Platform Authentication (GitHub & LeetCode)

Currently, `form_routes.py` uses hardcoded mock strings (like `123456`) to instantly verify GitHub and LeetCode connections. 

### How to Finish GitHub Authentication
The most secure way to link a user's GitHub account is using **OAuth 2.0**:
1. **Register an OAuth App:** Create a new OAuth application in your GitHub Developer Settings. You'll get a `Client ID` and `Client Secret`.
2. **Frontend Redirect:** When the user clicks "Link GitHub", redirect them to `https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID&scope=read:user`.
3. **Handle Callback:** GitHub will redirect the user back to your app with a temporary `code` in the URL (e.g., `/api/auth/github/callback?code=abc...`).
4. **Exchange Code for Token:** Your backend takes this `code` and exchanges it for an `access_token` by making a POST request to GitHub's API using your `Client Secret`.
5. **Fetch and Save User Data:** Use the `access_token` to fetch the user's GitHub profile (`https://api.github.com/user`) and save their GitHub username and stats in your MongoDB `integrations.github` object.

### How to Finish LeetCode Authentication
LeetCode does **not** have a public OAuth API. To verify ownership of a LeetCode account, use the **Bio Verification Method**:
1. **Generate a Unique Code:** When a user wants to link their LeetCode account (e.g., `user_xyz`), your backend generates a unique, random string (e.g., `airo-verify-9b4f2`).
2. **Prompt the User:** Ask the user to paste this unique string into their LeetCode completely public "About Me" or "Bio" section.
3. **Verify:** When the user clicks "Verify" in your app, your backend scrapes the user's public LeetCode profile (e.g., `https://leetcode.com/user_xyz/`). 
4. **Check for Code:** If your backend finds the generated string (`airo-verify-9b4f2`) in the scraped HTML/Bio, verification is successful! Save the linked status to MongoDB.
5. **Cleanup:** Instruct the user they can now safely remove the string from their LeetCode bio.
