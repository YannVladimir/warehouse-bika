package com.bika.archive.mapper;

import com.bika.archive.domain.entity.DocumentType;
import com.bika.archive.dto.response.DocumentTypeResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DocumentTypeMapper {

    @Mapping(target = "companyId", source = "company.id")
    DocumentTypeResponse toResponse(DocumentType type);
}
