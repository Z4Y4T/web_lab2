package ru.itmo.web.lab2;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class AreaService {

    public boolean isHit(int x, double y, double r) {
        boolean triangle = x <= 0
                && y >= 0
                && y <= x + r;

        boolean rectangle = x >= 0
                && x <= r / 2.0
                && y >= 0
                && y <= r;

        boolean quarterCircle = x <= 0
                && y <= 0
                && x * x + y * y <= r * r / 4.0;

        return triangle || rectangle || quarterCircle;
    }
}
