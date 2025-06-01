# LuggageShare

A web application that connects travelers who have extra luggage space with those who need to transport items. Users can post ads offering their extra space or request space for their items.

## Features

- User authentication (signup/login)
- Post ads for available luggage space
- Post ads requesting luggage space
- View and manage your ads
- Browse available ads
- Image upload for items that need space
- Responsive design for mobile and desktop

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB
- Authentication: JWT
- File Upload: Multer

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/luggageshare.git
cd luggageshare
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGO_URI=mongodb://localhost:27017/luggageshare
JWT_SECRET=your_jwt_secret_key_here
```

4. Start MongoDB:
```bash
mongod
```

5. Start the server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
luggageshare/
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── common.js
│   ├── uploads/
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── dashboard.html
│   ├── post-ad.html
│   ├── available-ads.html
│   └── my-ads.html
├── models/
│   ├── user.js
│   └── ad.js
├── server.js
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/signup` - Register a new user
- `POST /api/login` - Login user
- `GET /api/profile` - Get user profile

### Ads
- `POST /api/ads` - Create a new ad
- `GET /api/ads` - Get all ads
- `GET /api/ads/my` - Get user's ads
- `GET /api/ads/:id` - Get single ad
- `PATCH /api/ads/:id` - Update ad
- `DELETE /api/ads/:id` - Delete ad

### File Upload
- `POST /api/upload` - Upload image

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [JWT](https://jwt.io/)
- [Multer](https://github.com/expressjs/multer) # luggage-buddy
