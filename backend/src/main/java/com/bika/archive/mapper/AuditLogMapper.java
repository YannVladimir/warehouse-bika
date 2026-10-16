package com.bika.archive.mapper;

import com.bika.archive.domain.entity.AuditLog;
import com.bika.archive.dto.response.AuditLogResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AuditLogMapper {

    @Mapping(target = "actorEmail", source = "user.email")
    @Mapping(target = "actorName", source = "user.fullName")
    @Mapping(target = "companyId", source = "company.id")
    AuditLogResponse toResponse(AuditLog log);
}
