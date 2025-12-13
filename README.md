#### Backend-InsightGlobal-Application

This project is a backend application built with NestJS. It uses MongoDB to store the data and GraphQL to expose the API.

### Overview

- The application connects to MongoDB when it starts
- A single MongoDB connection is used throughout the app
- During the ingestion process, the existing data is replaced with the latest dataset
- The GraphQL API is read-only and is used only to fetch stored data

## How to Run the Application
Prerequisites

Make sure you have the following installed on your machine:

- Node.js (v18 or later recommended)
- npm
- Docker and Docker Compose (for running MongoDB)

# 1-Clone Repository
git clone <repository-url>
cd backend-insightglobal-application

# 2-Configure Environment Variables
ensure you have a .env file with the correct variables

# 3-Start MongoDB
you can use a local MongoDB installation.

# 4-Install dependencies
npm install

# 5-Start the application
npm run start:dev

# 6-Access GraphQL
http://localhost:4000/graphql

### GraphQL API

The application exposes a single, read-only GraphQL endpoint.

- URL: `/graphql`
- Data is served from MongoDB
- No external API calls are made from GraphQL resolvers

Example query:

```graphql
query {
  vehicleData
}