package com.hochul.todo;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.hochul.todo.service.TodoService;

import java.util.Map;

public class TodoHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private TodoService service;

    private TodoService getService() {
        if (service == null) service = new TodoService();
        return service;
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        String method = event.getHttpMethod();
        String path = event.getPath();

        // OPTIONS preflight
        if ("OPTIONS".equals(method)) {
            return new APIGatewayProxyResponseEvent()
                .withStatusCode(200)
                .withHeaders(Map.of(
                    "Access-Control-Allow-Origin", "*",
                    "Access-Control-Allow-Headers", "Content-Type,Authorization",
                    "Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS"
                ))
                .withBody("");
        }

        // Cognito Authorizer가 JWT 검증 후 claims를 flat하게 주입 (로컬에서는 null → test-user)
        var authorizer = event.getRequestContext().getAuthorizer();
        String userId = (authorizer != null && authorizer.get("sub") != null)
            ? (String) authorizer.get("sub")
            : "test-user";

        Map<String, String> pathParams = event.getPathParameters();
        String todoId = pathParams != null ? pathParams.get("todoId") : null;

        return switch (method) {
            case "GET"    -> getService().list(userId);
            case "POST"   -> getService().create(userId, event.getBody());
            case "PUT"    -> getService().update(userId, todoId, event.getBody());
            case "DELETE" -> getService().delete(userId, todoId);
            default       -> new APIGatewayProxyResponseEvent().withStatusCode(405).withBody("{\"error\":\"Method not allowed\"}");
        };
    }
}
