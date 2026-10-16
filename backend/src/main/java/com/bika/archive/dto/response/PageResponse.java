package com.bika.archive.dto.response;

import java.util.List;
import org.springframework.data.domain.Page;

/**
 * A stable, self-contained pagination envelope. Spring Data's Page/PageImpl isn't meant to be
 * serialized directly to JSON (its own docs warn about this), so every paginated endpoint maps
 * into this instead of leaking Spring Data's internal representation into the API contract.
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
