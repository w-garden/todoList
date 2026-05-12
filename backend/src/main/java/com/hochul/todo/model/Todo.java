package com.hochul.todo.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

@DynamoDbBean
public class Todo {

    private String userId;
    private String todoId;
    private String title;
    private boolean done;
    private String category;
    private String dueDate;
    private String createdAt;


    @DynamoDbPartitionKey
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    @DynamoDbSortKey
    public String getTodoId() { return todoId; }
    public void setTodoId(String todoId) { this.todoId = todoId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public boolean isDone() { return done; }
    public void setDone(boolean done) { this.done = done; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
