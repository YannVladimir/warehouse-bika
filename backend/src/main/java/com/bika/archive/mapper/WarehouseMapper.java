package com.bika.archive.mapper;

import com.bika.archive.domain.entity.Warehouse;
import com.bika.archive.dto.response.WarehouseResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface WarehouseMapper {

    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "companyName", source = "company.name")
    WarehouseResponse toResponse(Warehouse warehouse);
}
