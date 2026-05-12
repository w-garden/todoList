package com.hochul.todo.service;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hochul.todo.model.Todo;
import software.amazon.awssdk.enhanced.dynamodb.*;
import software.amazon.awssdk.enhanced.dynamodb.model.*;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.Instant;
import java.util.*;

public class TodoService {

    private static final String TABLE_NAME = System.getenv("TABLE_NAME");
    private final DynamoDbEnhancedClient enhancedClient;
    private final DynamoDbTable<Todo> table;
    private final ObjectMapper mapper = new ObjectMapper();

    public TodoService() {
        String endpoint = System.getenv("DYNAMODB_ENDPOINT");
        DynamoDbClient ddb = endpoint != null
            ? DynamoDbClient.builder()
                .endpointOverride(java.net.URI.create(endpoint))
                .region(software.amazon.awssdk.regions.Region.AP_NORTHEAST_2)
                .credentialsProvider(software.amazon.awssdk.auth.credentials.StaticCredentialsProvider.create(
                    software.amazon.awssdk.auth.credentials.AwsBasicCredentials.create("dummy", "dummy")))
                .build()
            : DynamoDbClient.create();
        this.enhancedClient = DynamoDbEnhancedClient.builder().dynamoDbClient(ddb).build();
        this.table = enhancedClient.table(TABLE_NAME, TableSchema.fromBean(Todo.class));
    }

    public APIGatewayProxyResponseEvent list(String userId) {
        try {
            QueryConditional condition = QueryConditional.keyEqualTo(
                Key.builder().partitionValue(userId).build()
            );
            List<Todo> todos = table.query(condition).items().stream().toList();
            return ok(mapper.writeValueAsString(todos));
        } catch (Exception e) {
            return error(e.getMessage());
        }
    }

    public APIGatewayProxyResponseEvent create(String userId, String body) {
        try {
            Map<String, Object> req = mapper.readValue(body, Map.class);
            Todo todo = new Todo();
            todo.setUserId(userId);
            todo.setTodoId(UUID.randomUUID().toString());
            todo.setTitle((String) req.get("title"));
            todo.setDone(false);
            todo.setCategory((String) req.getOrDefault("category", "개인"));
            todo.setDueDate((String) req.get("dueDate"));
            todo.setCreatedAt(Instant.now().toString());
            table.putItem(todo);
            return ok(mapper.writeValueAsString(todo));
        } catch (Exception e) {
            return error(e.getMessage());
        }
    }

    public APIGatewayProxyResponseEvent update(String userId, String todoId, String body) {
        try {
            Map<String, Object> req = mapper.readValue(body, Map.class);
            Todo todo = table.getItem(Key.builder().partitionValue(userId).sortValue(todoId).build());
            if (todo == null) return notFound();
            if (req.containsKey("title"))    todo.setTitle((String) req.get("title"));
            if (req.containsKey("done"))     todo.setDone((Boolean) req.get("done"));
            if (req.containsKey("category")) todo.setCategory((String) req.get("category"));
            if (req.containsKey("dueDate"))  todo.setDueDate((String) req.get("dueDate"));
            table.putItem(todo);
            return ok(mapper.writeValueAsString(todo));
        } catch (Exception e) {
            return error(e.getMessage());
        }
    }

    public APIGatewayProxyResponseEvent delete(String userId, String todoId) {
        try {
            table.deleteItem(Key.builder().partitionValue(userId).sortValue(todoId).build());
            return ok("{\"deleted\":true}");
        } catch (Exception e) {
            return error(e.getMessage());
        }
    }

    private APIGatewayProxyResponseEvent ok(String body) {
        return new APIGatewayProxyResponseEvent()
            .withStatusCode(200)
            .withHeaders(corsHeaders())
            .withBody(body);
    }

    private APIGatewayProxyResponseEvent notFound() {
        return new APIGatewayProxyResponseEvent()
            .withStatusCode(404)
            .withHeaders(corsHeaders())
            .withBody("{\"error\":\"Not found\"}");
    }

    private APIGatewayProxyResponseEvent error(String msg) {
        return new APIGatewayProxyResponseEvent()
            .withStatusCode(500)
            .withHeaders(corsHeaders())
            .withBody("{\"error\":\"" + msg + "\"}");
    }

    private Map<String, String> corsHeaders() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Access-Control-Allow-Headers", "Content-Type,Authorization");
        return headers;
    }
}
