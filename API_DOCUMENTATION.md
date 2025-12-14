# API Documentation

## Introduction

The Backend-InsightGlobal-Application provides a GraphQL API to access vehicle data. This API allows clients to query vehicle makes, types, and metadata stored in the MongoDB database.

---

## GraphQL Schema Overview

### Queries

- **vehicles**: Fetches all vehicle data, including makes and types.
  - **Arguments**: None
  - **Returns**: A list of vehicles with metadata.

- **vehicleById**: Fetches a specific vehicle by its identifier.
  - **Arguments**:
    - `id` (String): The unique identifier of the vehicle.
  - **Returns**: A single vehicle object.

### Mutations

- **addVehicle**: Adds a new vehicle to the database.
  - **Arguments**:
    - `makeName` (String): The name of the vehicle make.
    - `typeName` (String): The name of the vehicle type.
  - **Returns**: The newly created vehicle object.

- **updateVehicle**: Updates an existing vehicle's details.
  - **Arguments**:
    - `id` (String): The unique identifier of the vehicle.
    - `makeName` (String): The updated name of the vehicle make.
    - `typeName` (String): The updated name of the vehicle type.
  - **Returns**: The updated vehicle object.

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

### Fetch Vehicle by ID
```graphql
query {
  vehicleById(id: "12345") {
    identifier
    makeName
    typeName
  }
}
```

### Add a New Vehicle
```graphql
mutation {
  addVehicle(makeName: "Toyota", typeName: "SUV") {
    identifier
    makeName
    typeName
  }
}
```

### Update an Existing Vehicle
```graphql
mutation {
  updateVehicle(id: "12345", makeName: "Honda", typeName: "Sedan") {
    identifier
    makeName
    typeName
  }
}
```

---

## Error Handling

- **Invalid ID**:
  - **Message**: `Vehicle not found.`
  - **Cause**: The provided `id` does not exist in the database.

- **Validation Errors**:
  - **Message**: `Invalid input.`
  - **Cause**: Missing or incorrect arguments in the query/mutation.

---

## How to Test the API

1. **Start the Application**:
   - Ensure the application is running locally or via Docker.

2. **Access GraphQL Playground**:
   - Open [http://localhost:4000/graphql](http://localhost:4000/graphql) in your browser.

3. **Run Queries/Mutations**:
   - Use the examples provided above to interact with the API.

4. **Use Postman (Optional)**:
   - Set the request type to `POST`.
   - URL: `http://localhost:4000/graphql`
   - Body: Use raw JSON with the GraphQL query/mutation.

---

## Notes

- The API is read-only for queries and supports basic CRUD operations for vehicles.
- Ensure the MongoDB database is running and properly configured before testing the API.