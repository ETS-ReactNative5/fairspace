package io.fairspace.saturn.services.views;

import lombok.*;

import javax.validation.constraints.*;
import java.util.*;

@Data
public class ViewRequest {
    @Data
    public static class Filter {
        @NotBlank
        String field;
        @Singular
        List<Object> values = new ArrayList<>();
        Object rangeStart;
        Object rangeEnd;
    }

    @NotBlank
    String view;
    @Min(1)
    Integer page;
    @Min(1)
    Integer size;
    List<Filter> filters;
}
