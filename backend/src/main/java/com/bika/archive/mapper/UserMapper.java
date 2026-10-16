package com.bika.archive.mapper;

import com.bika.archive.domain.entity.User;
import com.bika.archive.dto.response.UserResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "companyName", source = "company.name")
    UserResponse toResponse(User user);
}
