package ru.itmo.web.lab2;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.Set;

@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
public class AreaResource {

    private static final Set<Integer> ALLOWED_X = Set.of(-5, -4, -3, -2, -1, 0, 1, 2, 3);
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern(
            "uuuu-MM-dd HH:mm:ssXXX");

    @Inject
    AreaService areaService;
    @Inject
    ResultStore resultStore;

    @GET
    @Path("/check")
    public Response check(
            @QueryParam("x") String xRaw,
            @QueryParam("y") String yRaw,
            @QueryParam("r") String rRaw) {
        long start = System.nanoTime();

        try {
            PointParameters parameters = parseAndValidate(xRaw, yRaw, rRaw);

            boolean hit = areaService.isHit(
                    parameters.x(),
                    parameters.y(),
                    parameters.r());

            long executionTime = System.nanoTime() - start;

            CheckResult result = new CheckResult(
                    parameters.x(),
                    parameters.y(),
                    parameters.r(),
                    hit,
                    currentTime(),
                    executionTime);
            resultStore.add(result);

            return Response
                    .ok(result)
                    .build();

        } catch (IllegalArgumentException exception) {

            long executionTime = System.nanoTime() - start;

            ApiError error = new ApiError(
                    exception.getMessage(),
                    currentTime(),
                    executionTime);

            return Response
                    .status(Response.Status.BAD_REQUEST)
                    .entity(error)
                    .build();
        }
    }

    private PointParameters parseAndValidate(
            String xRaw,
            String yRaw,
            String rRaw) {
        if (xRaw == null || xRaw.isBlank()) {
            throw new IllegalArgumentException(
                    "Не передан параметр X.");
        }

        if (yRaw == null || yRaw.isBlank()) {
            throw new IllegalArgumentException(
                    "Не передан параметр Y.");
        }

        if (rRaw == null || rRaw.isBlank()) {
            throw new IllegalArgumentException(
                    "Не передан параметр R.");
        }

        final int x;
        final double y;
        final double r;

        try {
            x = Integer.parseInt(xRaw.trim());
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException(
                    "X должен быть целым числом.");
        }

        try {
            y = Double.parseDouble(yRaw.trim());
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException(
                    "Y должен быть числом.");
        }

        try {
            r = Double.parseDouble(rRaw.trim());
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException(
                    "R должен быть числом.");
        }

        if (!Double.isFinite(y)) {
            throw new IllegalArgumentException(
                    "Y должен быть конечным числом.");
        }

        if (!Double.isFinite(r)) {
            throw new IllegalArgumentException(
                    "R должен быть конечным числом.");
        }

        if (!ALLOWED_X.contains(x)) {
            throw new IllegalArgumentException(
                    "X должен быть одним из значений {-5, -4, -3, -2, -1, 0, 1, 2, 3}.");
        }

        if (y < -3 || y > 3) {
            throw new IllegalArgumentException(
                    "Y должен находиться в диапазоне [-3; 3].");
        }

        if (r < 1 || r > 4) {
            throw new IllegalArgumentException(
                    "R должен находиться в диапазоне [1; 4].");
        }

        return new PointParameters(x, y, r);
    }

    private record PointParameters(
            int x,
            double y,
            double r) {
    }

    private String currentTime() {
        return OffsetDateTime
                .now()
                .format(TIME_FORMAT);
    }

    @GET
    @Path("/results")
    public List<CheckResult> results() {
        return resultStore.getAll();
    }
}
