# Headless E-commerce API

A comprehensive headless e-commerce API built with Node.js, Express, TypeScript, and TypeORM.

## Features

### Product Management
- **Products**: Complete product management with variants, options, and inventory
- **Product Variants**: Handle different variations (size, color, etc.) with individual pricing and inventory
- **Product Options**: Flexible option system for creating variants (e.g., Size: S, M, L)
- **Categories**: Hierarchical category system with tree structure
- **Collections**: Manual and automatic product collections
- **Inventory**: Real-time inventory tracking with reorder levels

### Customer Management
- **Customers**: Complete customer profiles with addresses and preferences
- **Customer Groups**: Segmentation with automatic discount application
- **Authentication**: Secure password hashing and JWT tokens

### Order Management
- **Orders**: Full order lifecycle from creation to fulfillment
- **Order Items**: Detailed line items with product snapshots
- **Payments**: Multiple payment methods and status tracking
- **Order Status**: Comprehensive status tracking (pending, processing, shipped, delivered)

### Marketing & Promotions
- **Promotions**: Flexible promotion system (percentage, fixed amount, free shipping)
- **Campaigns**: Marketing campaign management with analytics
- **Targeting**: Customer and product-based targeting

## Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with TypeORM
- **Validation**: class-validator
- **Security**: helmet, cors, bcryptjs, rate limiting
- **Documentation**: REST API with JSON responses

## Database Schema

### Core Entities

1. **Product** - Main product entity with SEO, images, and metadata
2. **ProductVariant** - Product variations with individual pricing and inventory
3. **ProductOption** - Option types (Color, Size, etc.)
4. **ProductOptionValue** - Option values (Red, Blue, S, M, L, etc.)
5. **Category** - Hierarchical categories using closure table
6. **Collection** - Product collections (manual/automatic)
7. **Inventory** - Real-time inventory tracking per variant
8. **Customer** - Customer profiles with addresses
9. **CustomerGroup** - Customer segmentation
10. **Order** - Order management with status tracking
11. **OrderItem** - Order line items with product snapshots
12. **Payment** - Payment processing and tracking
13. **Promotion** - Flexible promotion system
14. **Campaign** - Marketing campaigns with analytics

## API Endpoints

### Products
- `GET /api/products` - List products with filtering and pagination
- `GET /api/products/search?q=term` - Search products by title, description, and tags
- `GET /api/products/:id` - Get single product with variants
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PATCH /api/products/:id/status` - Update product status

### Categories
- `GET /api/categories` - Get category tree
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Collections
- `GET /api/collections` - List collections
- `GET /api/collections/:id` - Get single collection
- `POST /api/collections` - Create collection
- `PUT /api/collections/:id` - Update collection
- `DELETE /api/collections/:id` - Delete collection

### Customers
- `GET /api/customers` - List customers
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order

### Additional endpoints for payments, promotions, campaigns, inventory, and product options.

#### Product Search Example

```http
GET /api/products/search?q=shirt&page=1&limit=5
```

Response:

```json
{
  "products": [
    { "id": "prod_123", "title": "Blue Shirt", "score": 1.5 }
  ],
  "pagination": { "page": 1, "limit": 5, "total": 1, "pages": 1 }
}
```

## Setup & Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   cd your-project-directory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and other configuration
   ```

4. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE ecommerce_db;
   ```

5. **Run database migrations** (auto-sync is enabled in development)
   ```bash
   npm run dev
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

### Production Setup

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set NODE_ENV to production**
   ```bash
   export NODE_ENV=production
   ```

3. **Run migrations**
   ```bash
   npm run migration:run
   ```

4. **Start the server**
   ```bash
   npm start
   ```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migration:generate` - Generate new migration
- `npm run migration:run` - Run migrations
- `npm run migration:revert` - Revert last migration

### Project Structure

```
src/
├── entities/          # TypeORM entities
├── routes/           # API routes
├── middleware/       # Express middleware
├── data-source.ts    # TypeORM configuration
└── index.ts         # Application entry point
```

## Key Design Decisions

### Product-Variant Architecture
- Every product has at least one variant (even simple products)
- This provides consistency and scalability
- Variants handle pricing, inventory, and SKUs

### Product Options System
- Options are primary (Color, Size)
- Option values are secondary (Red, Blue, S, M, L)
- Variants are created from option value combinations
- Not all combinations need to exist

### Inventory Management
- Real-time tracking at variant level
- Support for backorders and reorder levels
- Location and warehouse tracking

### Flexible Promotions
- Multiple promotion types (percentage, fixed, free shipping)
- Complex targeting (products, categories, customers)
- Usage limits and scheduling

## API Response Format

All API responses follow this format:

```json
{
  "success": boolean,
  "data": object | array,
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "pages": number
  },
  "error": string
}
```

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Password hashing with bcrypt
- Input validation with class-validator
- SQL injection prevention with TypeORM

## Performance Features

- Database indexing on frequently queried fields
- Pagination for large datasets
- Efficient eager loading with TypeORM relations
- Compression middleware
- Response caching headers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions and support, please open an issue in the repository.
