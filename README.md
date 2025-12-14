## Backend-InsightGlobal-Application

This project is a backend application built with NestJS. It implements a data ingestion pipeline that transforms XML data from public APIs into a unified JSON structure, stored in MongoDB and exposed via GraphQL.

## Overview

- Data Persistence: Uses MongoDB to store transformed vehicle data.
- Ingestion Logic: During the ingestion process, the service fetches makes and types, replacing the existing dataset with the latest version to ensure data consistency.
- API Layer: A read-only GraphQL API serves the stored data, ensuring no external overhead during client queries.

## Tech Stack
- Framework: NestJS (Node.js)
- Language: TypeScript
- Database: MongoDB (Mongoose)
- API: GraphQL (Apollo)
- Validation: Zod (Configuration)
- Logging: Pino (Structured JSON Logs)

### Engineering Documentation
1. Ingestion Pipeline
The service follows a Fetch-Transform-Persist pattern:
- Fetch: Pulls raw XML from NHTSA endpoints.
- Transform: Parses XML using xml2js and maps it to TypeScript interfaces. It combines Make data with Vehicle Type data into a single unified object.
- Persist: Uses an upsert strategy in MongoDB to ensure the dataset is always the most recent without creating duplicates.

2. Error Handling Strategy
- Network Resilience: Implements a retry mechanism (max 3 attempts) for external XML API calls.
- Graceful Failures: Failures in specific "Make" enrichments are logged, but do not stop the entire ingestion process.
- Startup Validation: Configuration errors (missing .env keys) trigger immediate process exit with clear error reporting.

3. Logging Strategy
The application uses Structured JSON Logging. This allows for better observability and log aggregation in production environments (like ELK or Datadog).

## How to Run the Application
Prerequisites

Make sure you have the following installed on your machine:

- Node.js (v18 or later recommended)
- npm
- Docker and Docker Compose (for running MongoDB)

## 1-Clone Repository
git clone <repository-url>
cd backend-insightglobal-application

## 2-Configure Environment Variables
ensure you have a .env file with the correct variables

#### as reference
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb+srv://db:yourpassword@cluster0.oln4o.mongodb.net/?retryWrites=true&w=majority
PORT=3000
LOG_LEVEL=info

GET_ALL_MAKES_URL=https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=XML
GET_VEHICLE_TYPES_URL=https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleTypesForMakeId/{id}?format=xml

XML_FETCH_RETRIES=2
XML_FETCH_TIMEOUT=10000

## 3-Start MongoDB
you can use a local MongoDB installation.

## 4-Install dependencies
npm install

## 5-Run Locally (Development)
npm run start:dev

## 6-Run via Docker (Recommended)
docker-compose up --build

## 7-Access GraphQL
http://localhost:3000/graphql
Schema: Data is served directly from the persistent datastore.

## Example query:

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

## Running Tests
npm run test


## Ingestion Pipeline Architecture
```mermaid
graph TD
    Start[Start] --> FetchMakes{Fetch Makes XML}
    FetchMakes -- Error --> Retry[Retry Logic 3x]
    Retry --> FetchMakes
    FetchMakes -- Success --> Limit[Limit to 50 items]
    
    Limit --> Loop[Loop each Make]
    Loop --> FetchTypes{Fetch Types XML}
    FetchTypes -- Error --> LogSkip[Log Error & Skip]
    LogSkip --> Loop
    FetchTypes -- Success --> Transform[Transform to JSON]
    
    Transform --> Upsert[Upsert to MongoDB]
    Upsert --> CheckEnd{End of list?}
    
    CheckEnd -- No --> Loop
    CheckEnd -- Yes --> FinalDoc[Persist Final VehicleData]
    FinalDoc --> Success[Ingestion Complete]

    style Start fill:#f9f,stroke:#333
    style Success fill:#0f0,stroke:#333
    style Limit fill:#fff4dd,stroke:#d4a017
```