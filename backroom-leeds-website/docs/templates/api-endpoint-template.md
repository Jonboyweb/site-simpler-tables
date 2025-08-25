# API Endpoint: {ENDPOINT_NAME}

## Overview
{BRIEF_DESCRIPTION}

## Endpoint Details
- **Method**: `{HTTP_METHOD}`
- **URL**: `{BASE_URL}/{ENDPOINT_PATH}`
- **Authentication**: {AUTH_REQUIRED}
- **Rate Limit**: {RATE_LIMIT}

## Parameters

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
{PATH_PARAMETERS_TABLE}

### Query Parameters  
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
{QUERY_PARAMETERS_TABLE}

### Request Body
```json
{REQUEST_BODY_EXAMPLE}
```

#### Schema
{REQUEST_SCHEMA_DETAILS}

## Response

### Success Response (200)
```json
{SUCCESS_RESPONSE_EXAMPLE}
```

#### Schema
{RESPONSE_SCHEMA_DETAILS}

### Error Responses

#### 400 Bad Request
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "description of validation error"
    }
  }
}
```

#### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 404 Not Found
```json
{
  "error": {
    "code": "NOT_FOUND", 
    "message": "Resource not found"
  }
}
```

#### 500 Internal Server Error
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## Code Examples

### JavaScript/TypeScript (fetch)
```typescript
const response = await fetch('{BASE_URL}/{ENDPOINT_PATH}', {
  method: '{HTTP_METHOD}',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({REQUEST_BODY_EXAMPLE})
});

const data = await response.json();
console.log(data);
```

### cURL
```bash
curl -X {HTTP_METHOD} \
  '{BASE_URL}/{ENDPOINT_PATH}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{REQUEST_BODY_JSON}'
```

### Node.js (axios)
```javascript
const axios = require('axios');

try {
  const response = await axios.{HTTP_METHOD_LOWERCASE}(
    '{BASE_URL}/{ENDPOINT_PATH}',
    {REQUEST_BODY_EXAMPLE},
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  console.log(response.data);
} catch (error) {
  console.error('Error:', error.response.data);
}
```

## Use Cases

### {USE_CASE_1_TITLE}
{USE_CASE_1_DESCRIPTION}

**Example Scenario**: {SCENARIO_DESCRIPTION}

```typescript
// Example implementation
{USE_CASE_CODE_EXAMPLE}
```

### {USE_CASE_2_TITLE} 
{USE_CASE_2_DESCRIPTION}

## Testing

### Unit Test Example
```typescript
describe('{ENDPOINT_NAME}', () => {
  test('should {EXPECTED_BEHAVIOR}', async () => {
    // Test implementation
    const response = await request(app)
      .{HTTP_METHOD_LOWERCASE}('{ENDPOINT_PATH}')
      .send({REQUEST_BODY_EXAMPLE})
      .expect(200);
    
    expect(response.body).toMatchObject({EXPECTED_RESPONSE});
  });
});
```

### Integration Test
```typescript
describe('{ENDPOINT_NAME} Integration', () => {
  test('should handle {INTEGRATION_SCENARIO}', async () => {
    // Integration test implementation
  });
});
```

## Notes

### Business Logic
{BUSINESS_LOGIC_NOTES}

### Performance Considerations
{PERFORMANCE_NOTES}

### Security Notes
{SECURITY_CONSIDERATIONS}

## Related Endpoints
- [{RELATED_ENDPOINT_1}]({RELATED_ENDPOINT_1_LINK})
- [{RELATED_ENDPOINT_2}]({RELATED_ENDPOINT_2_LINK})

## Changelog
- **v1.0**: Initial implementation
- **{VERSION}**: {CHANGE_DESCRIPTION}

---
*Last updated: {LAST_UPDATE_DATE}*
*Documentation auto-generated from API schema*