package com.smartcampus.paf_assignment.controller;

import com.smartcampus.paf_assignment.entity.User;
import com.smartcampus.paf_assignment.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users") // This is the base URL for this controller
@CrossOrigin("*") // This tells Spring Boot to allow requests from your React frontend later
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // 1. CREATE A USER (POST Request)
    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@RequestBody User newUser) {
        // newUser contains the JSON data sent from Postman/React
        User savedUser = userRepository.save(newUser);
        return new ResponseEntity<>(savedUser, HttpStatus.CREATED); // Returns 201 Created status
    }

    // 2. GET ALL USERS (GET Request)
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return new ResponseEntity<>(users, HttpStatus.OK); // Returns 200 OK status
    }
}