package ru.itmo.web.lab2;

public record ApiError(
        String message,
        String currentTime,
        long executionTimeNs) {
}
