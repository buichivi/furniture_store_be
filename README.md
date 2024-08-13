
# Furniture Store - Backend

This repository contains the backend API for the Furniture Store application, handling server-side logic, database interactions, and payment processing.

## Tech Stack

- **Node.js**: JavaScript runtime built on Chrome's V8 engine.
- **Express.js**: Web framework for Node.js to build APIs.
- **Mongoose**: MongoDB object modeling tool designed to work in an asynchronous environment.
- **MongoDB**: NoSQL database used for storing application data.

## Features

- **User Authentication**: Secure login and registration using JWT tokens.
- **Product Management**: APIs for adding, updating, deleting, and retrieving products.
- **Order Management**: APIs for handling customer orders and tracking order status.
- **Payment Integration**: Integration with PayPal and VNPAY for processing payments.
- **Data Validation**: Ensures data integrity with Mongoose schemas.

## Installation

### Node.js Version 
Ensure you have Node.js version **18.x** or higher installed on your machine.

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```plaintext SECRET_KEY=d4037ecd42bf3aeb246dbefa88e691b208c0d8eb50943b4cd995e6ebd6ac1ec6a62bc45cac2e7059fa22d12c5c1982d501147367ac2dbea4c44e7d433d8c2a39
USER=<Your email>
PASSWORD=<Your email application password>
PORT=3000
MONGO_URL=mongodb+srv://buivi04062002:SOCngCl4MbSbH4XL@furniture-db.auruwxu.mongodb.net/FurnitureStore
ALLOWED_ORIGINS=https://fixtures-store.onrender.com #Origins are accessed at the server's origin separated by ','
VNP_TMPCODE=<Your VN Pay tmp code>
VNP_HASHSECRET=<Your VN Pay hash secret>
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURNURL=https://fixtures-store.netlify.app/checkout
```

3. Start the server:

```bash
npm start
```

## Project structure

```plaintext
src/
├── controllers/
├── models/
├── routes/
├── middleware/
├── config/
├── ultils/
```

#### Explanation:

- `controllers/`: Contains the logic for handling requests and sending responses.
- `models/`: Mongoose schemas and models for MongoDB collections.
- `routes/`: API route definitions.
- `middleware/`: Custom middleware functions, including authentication.
- `config/`: Configuration files for database connections.
- `ultils/`: Functions are used many times in many places.
