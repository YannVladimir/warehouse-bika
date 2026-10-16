package com.bika.archive.mapper;

import com.bika.archive.domain.entity.Company;
import com.bika.archive.dto.response.CompanyResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CompanyMapper {

    CompanyResponse toResponse(Company company);
}
