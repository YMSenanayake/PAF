package com.smartcampus.paf_assignment.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users") // "user" is a reserved word in some SQL versions, so we use "users"
public class User {

    @Id // This marks it as the Primary Key
    @GeneratedValue(strategy = GenerationType.IDENTITY) // This makes it auto-increment (1, 2, 3...)
    private Long userId;

    private String fullName;
    
    @Column(unique = true) // Ensures no duplicate emails
    private String email;
    
    private String role; // USER, ADMIN, TECHNICIAN

    // --- Getters and Setters ---
    // (In Java, you need these so other parts of your app can read/write this data)

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}