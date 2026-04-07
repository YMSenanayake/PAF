package com.smartcampus.paf_assignment.repository;

import com.smartcampus.paf_assignment.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    // Custom search method to filter by type (e.g., find all LABS)
    List<Resource> findByType(String type);
}