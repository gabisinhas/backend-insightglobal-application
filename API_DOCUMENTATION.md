# API Documentation

## Introduction

The Backend-InsightGlobal-Application provides a GraphQL API to access vehicle data. This API allows clients to query vehicle makes, types, and metadata stored in the MongoDB database.

---

## GraphQL Schema Overview

### Queries

- **vehicles**: Fetches all vehicle data, including makes and types.
  - **Arguments**: None
  - **Returns**: A list of vehicles with metadata.

---

## Example Queries

### Fetch All Vehicles
```graphql
query {
  vehicles {
    identifier
    totalMakes
    lastUpdated
    makes {
      makeId
      makeName
      vehicleTypes {
        typeId
        typeName
      }
    }
  }
}
```

---

## Error Handling

- **No Data Found**:
  - **Message**: `No vehicle data available.`
  - **Cause**: The database does not contain any vehicle data.

---

## How to Test the API

1. **Start the Application**:
   - Ensure the application is running locally or via Docker.

2. **Access GraphQL Playground**:
   - Open [http://localhost:4000/graphql](http://localhost:4000/graphql) in your browser.

3. **Run Queries**:
   - Use the examples provided above to interact with the API.

4. **Use Postman (Optional)**:
   - Set the request type to `POST`.
   - URL: `http://localhost:4000/graphql`
   - Body: Use raw JSON with the GraphQL query.

---

## Notes

- The API is read-only for queries.
- Ensure the MongoDB database is running and properly configured before testing the API.