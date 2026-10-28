package ru.itmo.web.lab2;

import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.concurrent.ConcurrentLinkedDeque;

@ApplicationScoped
public class ResultStore {

    private final ConcurrentLinkedDeque<CheckResult> results = new ConcurrentLinkedDeque<>();

    public void add(CheckResult result) {
        results.addFirst(result);
    }

    public List<CheckResult> getAll() {
        return List.copyOf(results);
    }
}
