# Project Name

This project is built with Next.js, TypeScript, and uses Supabase for the backend. It uses Yarn as the package manager.

## Prerequisites

- Node.js (v14 or later)
- Yarn
- Supabase account
- Prisma CLI
- Plaid

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   ```

2. Install dependencies:
   ```
   yarn install
   ```

3. Set up environment variables:
   Create two files in the root directory: `.env` and `.env.local`. Add the following variables to both files:

   ```
   # .env and .env.local

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Database
   DATABASE_URL=your_database_url

   # Plaid
   PLAID_CLIENT_ID=your_plaid_client_id
   PLAID_SECRET=your_plaid_secret
   PLAID_ENV=sandbox # or development, or production

   # Next Auth
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000 # or your production URL

   # Add any other environment variables your project needs
   ```

   Replace the placeholder values with your actual credentials.

4. Set up Supabase:
   - Create a new project in Supabase
   - Get the project URL and anon key from the project settings
   - Update the `.env` and `.env.local` files with these values

5. Run Prisma migrations:
   ```
   npx prisma migrate dev
   ```

6. Start the development server:
   ```
   yarn dev
   ```

The application should now be running at `http://localhost:3000`.

## Building for Production

To create a production build:
