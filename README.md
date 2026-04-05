# Digital/Smart Circular Management System

A comprehensive MERN stack application built to streamline the distribution of circulars within college environments.

## Features

- **Role-Based Access Control:** Differentiates between Principals, HODs, and Students.
- **Targeted Distribution:** Send circulars to specific departments, years, or roles.
- **Real-Time Notifications:** Students receive immediate updates via Socket.io when new circulars are published.
- **Flexible File Storage:** Supports both local filesystem and Cloudinary for storing circular attachments.
- **Secure Authentication:** Implementing JWT and secure practices for user sessions.

## Tech Stack

### Frontend
- React.js
- React Bootstrap
- React Router DOM
- Axios
- Socket.io Client

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- Socket.io
- Multer & Cloudinary (File Handling)
- JWT (Authentication)
- bcrypt (Password Hashing)

## Getting Started

### Prerequisites
- Node.js installed
- MongoDB instance (local or Atlas)
- Cloudinary account (optional, for remote storage)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd college-circular
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory with the required environment variables:
   - `PORT`
   - `MONGO_URI`
   - `JWT_SECRET`
   - `CLOUDINARY_CLOUD_NAME` (If using Cloudinary)
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

You can start both frontend and backend using the provided batch file or manually.

**Using start script (Windows):**
```bash
./start.bat
```

**Manually:**
In the backend terminal:
```bash
npm run dev
```

In the frontend terminal:
```bash
npm start
```
