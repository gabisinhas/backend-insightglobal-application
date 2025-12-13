#### Backend-InsightGlobal-Application

This project is a backend application built with NestJS. It implements a data ingestion pipeline that transforms XML data from public APIs into a unified JSON structure, stored in MongoDB and exposed via GraphQL.

### Overview

- Data Persistence: Uses MongoDB to store transformed vehicle data.
- Ingestion Logic: During the ingestion process, the service fetches makes and types, replacing the existing dataset with the latest version to ensure data consistency.
- API Layer: A read-only GraphQL API serves the stored data, ensuring no external overhead during client queries.

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

### as reference
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb+srv://gabisinhas:admin123gabriela@cluster0.oln4o.mongodb.net/?retryWrites=true&w=majority
PORT=3000
LOG_LEVEL=info

GET_ALL_MAKES_URL=https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=XML
GET_VEHICLE_TYPES_URL=https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleTypesForMakeId/{id}?format=xml

XML_FETCH_RETRIES=2
XML_FETCH_TIMEOUT=10000

# 3-Start MongoDB
you can use a local MongoDB installation.

# 4-Install dependencies
npm install

# 5-Run Locally (Development)
npm run start:dev

# 6-Run via Docker (Recommended)
docker-compose up --build

# 7-Access GraphQL
http://localhost:3000/graphql
Schema: Data is served directly from the persistent datastore.

# Example query:

query {
  vehicles {
    totalMakes
    generatedAt
    makes {
      makeName
      vehicleTypes {
        typeName
      }
    }
  }
}