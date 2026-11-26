# EduConnect frontend

This is a dependency-free frontend for the EduConnect Express API.

## Run it

1. Start the backend from the `backend` folder with `npm run dev` (or `npm start`).
2. Open the local URL printed by the server, normally `http://localhost:5000`. The backend serves the frontend there; you can also open `frontend/index.html` directly.
3. Sign in or create a student account. On localhost, the frontend uses that local backend. On the deployed site, it uses `https://educonnect123456789.vercel.app/api` by default. Change the API URL in **Settings** if needed.

After sign-in, users are sent to `/admin/dashboard`, `/teacher/dashboard`, or `/student/dashboard` according to their lowercase role. Use the theme button on the sign-in page or workspace to switch between light and dark mode; the choice is saved in the browser. In-app notifications refresh every 15 seconds and are created for new announcements, enrolled-course assignments, and published results.

Profiles can be edited from **Profile**, including a public HTTP/HTTPS image URL; **Sign out** is available in the sidebar. Public sign-up creates Student accounts only. Admin and Teacher accounts are not pre-created and must be provisioned by an administrator. Every MongoDB user must have a `role` field set to `admin`, `teacher`, or `student`; the account name does not determine its role. Admins can add, edit, and remove accounts from **People**; teachers can view their student list and create assignments from **Students** and **Assignments**.

For local role testing, run `npm run seed:demo` from `backend`. It creates only missing demo accounts and prints randomly generated passwords once; existing accounts are never reset.

The backend needs its MongoDB and JWT settings configured in `backend/.env`. If MongoDB times out, check that the URI is valid, the database user's credentials are correct, and your current IP address is allowed in the MongoDB Atlas network access settings.
