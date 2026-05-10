# 🚀 Postman-Like API Client

A powerful, lightweight, and modern API client built with Next.js 15+, designed for developers who need a quick and efficient way to test APIs without the overhead of heavy desktop applications. Built with a focus on speed, aesthetics, and a seamless developer experience.

![Hero Image](public/hero.png)

## ✨ Features

-   **🎯 Single Workspace**: Focused environment for your API development.
-   **🛠️ Request Editor**: Support for multiple HTTP methods (GET, POST, PUT, DELETE, etc.).
-   **📊 Parameter Management**: Intuitive editors for Query Parameters, Headers, and JSON/Text bodies.
-   **🕒 Request History**: Keep track of every execution with detailed status codes and durations.
-   **💬 Request Comments**: Annotate your requests to keep notes for yourself or your team.
-   **🌐 Global Variables**: Store and reuse values across different requests using dynamic templates.
-   **🔗 cURL Integration**: Easily copy any request as a cURL command for terminal use.
-   **🌓 Dark Mode**: Sleek, eye-friendly design out of the box.
-   **🔒 No Auth Required**: Minimal setup, just run and start testing.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
-   **Database**: [PostgreSQL](https://www.postgresql.org/) with [Neon](https://neon.tech/) (Serverless Postgres)
-   **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
-   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/)
-   **Icons**: [Hugeicons](https://hugeicons.com/)

## 🚀 Getting Started

### Prerequisites

-   Node.js 20+
-   pnpm or npm
-   A PostgreSQL database (Recommended: [Neon.tech](https://neon.tech))

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Jervi-sir/postman-like.git
    cd postman-like
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root directory and add your Neon PostgreSQL connection string:
    ```env
    DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
    ```

4.  **Database Setup**:
    Push the schema to your database:
    ```bash
    npx drizzle-kit push
    ```

5.  **Run the development server**:
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

```text
├── app/                  # Next.js App Router (Pages & API Routes)
│   ├── api/              # Backend API Endpoints
│   └── requests/         # Dynamic Request Pages
├── components/           # UI Components
│   ├── api-client/       # Core API Client Logic (Sidebar, Editor, Panels)
│   └── ui/               # Reusable Shadcn UI Components
├── lib/                  # Utilities, DB Schema, and Services
│   ├── schema.ts         # Drizzle Database Schema
│   └── db.ts             # Database Connection
├── store/                # Zustand State Stores
├── public/               # Static Assets
└── drizzle.config.ts     # Drizzle Configuration
```

## 🗄️ Database Schema

The project uses a clean relational schema managed by Drizzle:

-   **`requests`**: Primary storage for API configurations.
-   **`history`**: Audit log of all executed requests.
-   **`request_comments`**: Persistent notes for specific requests.
-   **`global_variables`**: Centralized store for reusable values.

## 📝 License

This project is open-source and available under the MIT License.

---

Built with ❤️ by [Jervi-sir](https://github.com/Jervi-sir)
