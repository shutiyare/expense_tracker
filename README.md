# 💰 Personal Expense Tracker

A full-stack expense tracking application built with **Next.js 15**, **MongoDB**, **Tailwind CSS**, and **Shadcn UI**.

## 🚀 Features

- ✅ User authentication with JWT
- ✅ Track expenses and incomes
- ✅ Categorize transactions
- ✅ Beautiful dashboard with statistics
- ✅ Responsive design (mobile & desktop)
- ✅ Modern UI with Shadcn components
- ✅ Real-time data with MongoDB
- ✅ Secure API routes

## 🧱 Tech Stack

| Layer          | Technology               |
| -------------- | ------------------------ |
| Frontend       | Next.js 15 (App Router)  |
| Database       | MongoDB (Mongoose)       |
| Authentication | JWT                      |
| UI Library     | Tailwind CSS + Shadcn UI |
| HTTP Client    | Axios                    |
| Charts         | Recharts                 |
| Language       | TypeScript               |

## 📦 Project Structure

```
expense-tracker/
├── app/
│   ├── layout.tsx              # Root layout with navigation
│   ├── page.tsx                # Dashboard
│   ├── login/page.tsx          # Login page
│   ├── register/page.tsx       # Register page
│   └── api/
│       ├── auth/               # Authentication routes
│       ├── expenses/           # Expense CRUD routes
│       ├── incomes/            # Income CRUD routes
│       └── categories/         # Category CRUD routes
├── lib/
│   ├── db.ts                   # MongoDB connection
│   ├── auth.ts                 # JWT utilities
│   ├── axios.ts                # Axios instance with auth
│   └── utils.ts                # Utility functions
├── models/
│   ├── User.ts                 # User model
│   ├── Expense.ts              # Expense model
│   ├── Income.ts               # Income model
│   └── Category.ts             # Category model
├── components/
│   ├── Navbar.tsx              # Navigation component
│   └── ui/                     # Shadcn UI components
└── .env.example                # Environment variables template
```

## 🛠️ Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Git

### 2. Clone the Repository

```bash
git clone <your-repo-url>
cd expense_tracker
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Update the `.env.local` file with your values:

```env
# MongoDB Connection (Get from MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-tracker?retryWrites=true&w=majority

# JWT Secret (Generate a random secure string)
JWT_SECRET=your-super-secret-jwt-key-here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP address (or use `0.0.0.0/0` for development)
5. Get your connection string and add it to `.env.local`

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Pages & Routes

### Public Pages

- `/login` - User login
- `/register` - User registration

### Protected Pages (require authentication)

- `/` - Dashboard with statistics
- `/expenses` - View and manage expenses
- `/incomes` - View and manage incomes
- `/categories` - Manage categories
- `/reports` - Financial reports

## 🔐 API Routes

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Expenses

- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/[id]` - Get single expense
- `PUT /api/expenses/[id]` - Update expense
- `DELETE /api/expenses/[id]` - Delete expense

### Incomes

- `GET /api/incomes` - Get all incomes
- `POST /api/incomes` - Create income
- `GET /api/incomes/[id]` - Get single income
- `PUT /api/incomes/[id]` - Update income
- `DELETE /api/incomes/[id]` - Delete income

### Categories

- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category

## 🎨 Key Features Explained

### Authentication

- JWT-based authentication
- Tokens stored in localStorage
- Protected API routes with middleware
- Auto-redirect on token expiry

### Database Models

- **User**: name, email, passwordHash, currency
- **Expense**: userId, categoryId, title, amount, paymentMethod, date, notes
- **Income**: userId, categoryId, title, amount, source, date, notes
- **Category**: userId, name, type (expense/income), color, icon

### UI Components

- Built with Shadcn UI for consistency
- Fully responsive design
- Dark mode support (optional)
- Beautiful animations and transitions

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

### Environment Variables (Production)

Make sure to add these in Vercel:

- `MONGODB_URI`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL` (your production URL)

## 📝 Development Tips

### Adding New Shadcn Components

```bash
npx shadcn@latest add [component-name]
```

Example:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
```

### Database Queries

Use the models in your API routes:

```typescript
import Expense from "@/models/Expense";
const expenses = await Expense.find({ userId }).sort({ date: -1 });
```

### Authentication in API Routes

```typescript
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  // Your logic here
}
```

## 🐛 Common Issues

### MongoDB Connection Error

- Check your connection string in `.env.local`
- Ensure IP is whitelisted in MongoDB Atlas
- Verify database user credentials

### JWT Token Issues

- Make sure `JWT_SECRET` is set in `.env.local`
- Check browser localStorage for token
- Clear localStorage and login again

### Port Already in Use

```bash
# Kill the process on port 3000
npx kill-port 3000
# Or use a different port
npm run dev -- -p 3001
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT License - feel free to use this project for learning and production.

- MONGODB_URI=mongodb+srv://shutiye:carfaaye143@expensetrackerapp.wbiqizf.mongodb.net/expense_tracker?retryWrites=true&w=majority&appName=expenseTrackerApp
  JWT_SECRET=3b806f639d4eaa8614b6c4e5bb0b83eb106a2b53782d4c770dcf4eec1c961a5c
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  NEXTAUTH_SECRET=3b806f639d4eaa8614b6c4e5bb0b83eb106a2b53782d4c770dcf4eec1c961a5c
  NEXTAUTH_URL=http://localhost:3000

---

**Built with ❤️ using Next.js and MongoDB**
