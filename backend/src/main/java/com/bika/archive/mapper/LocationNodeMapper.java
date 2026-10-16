package com.bika.archive.mapper;

import com.bika.archive.domain.entity.LocationNode;
import com.bika.archive.dto.response.LocationNodeResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface LocationNodeMapper {

    @Mapping(target = "warehouseId", source = "warehouse.id")
    @Mapping(target = "parentId", source = "parent.id")
    LocationNodeResponse toResponse(LocationNode node);
}
