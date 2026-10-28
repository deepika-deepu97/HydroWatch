package com.waterleak.baseline.repository;

import com.waterleak.baseline.model.PropertyBaseline;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PropertyBaselineRepository extends JpaRepository<PropertyBaseline, String> {
    Optional<PropertyBaseline> findByPropertyId(String propertyId);
}
