package com.smartcampus.paf_assignment.repository;

import com.smartcampus.paf_assignment.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // By extending JpaRepository, Spring Boot automatically gives you built-in methods 
    // to save(), findAll(), findById(), and delete() users without writing any SQL!
    User findByEmail(String email);

    // Find all users with a specific role (e.g. "ADMIN", "TECHNICIAN")
    List<User> findByRole(String role);
}