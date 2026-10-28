package ru.itmo.web.lab2;

public record CheckResult(
        int x,
        double y,
        double r,
        boolean hit,
        String currentTime,
        long executionTimeNs) {
}
