package com.smartcampus.paf_assignment.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users") // "user" is a reserved word in some SQL versions, so we use "users"
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    private String fullName;

    @Column(unique = true)
    private String email;

    private String role; // USER, ADMIN, TECHNICIAN

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true; // All new users are active by default

    // --- Getters and Setters ---

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}