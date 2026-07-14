# Vision Market Africa - Backend API

## Setup
1. `npm install`
2. Create `.env` file from `.env.example`
3. Add your API keys for:
   - MongoDB (Atlas)
   - OpenAI (AI Buddy)
   - Cloudinary (Image Uploads)
   - Gmail/SMTP (Email Notifications)
   - Flutterwave/Stripe (Payments)

## API Routes
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/products` - List products
- `POST /api/products` - Add product (Suppliers/Admin only, supports image upload)
- `POST /api/orders` - Place an order (Sends email)
- `GET /api/orders` - View user orders
- `POST /api/payments/initiate` - Start payment process
- `POST /api/ai/chat` - Interact with VMA Buddy (OpenAI)
- `GET /api/admin/stats` - Dashboard stats (Admin only)

## Tech Stack
- Node.js & Express
- MongoDB & Mongoose
- JWT for Authentication
- Cloudinary for Media
- Nodemailer for SMTP
- OpenAI API for AI Features
