package com.smartcampus.paf_assignment.controller;

import com.smartcampus.paf_assignment.entity.Booking;
import com.smartcampus.paf_assignment.entity.Ticket;
// import com.smartcampus.paf_assignment.entity.TicketAttachment;
import com.smartcampus.paf_assignment.entity.User;
import com.smartcampus.paf_assignment.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin("*")
public class UserController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private TicketRepository ticketRepository;
    @Autowired
    private TicketAttachmentRepository ticketAttachmentRepository;

    // 1. CREATE A USER (POST Request)
    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@RequestBody User newUser) {
        User savedUser = userRepository.save(newUser);
        return new ResponseEntity<>(savedUser, HttpStatus.CREATED);
    }

    // 2. GET ALL USERS (GET Request)
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return new ResponseEntity<>(users, HttpStatus.OK);
    }

    // 3. GET USER BY EMAIL (used by frontend after JWT decode)
    @GetMapping("/email/{email}")
    public ResponseEntity<?> getUserByEmail(@PathVariable String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            return new ResponseEntity<>("User not found.", HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(user, HttpStatus.OK);
    }

    // 4. UPDATE USER ROLE (ADMIN only)
    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestParam String role) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return new ResponseEntity<>("User not found.", HttpStatus.NOT_FOUND);
        }
        User user = userOpt.get();
        user.setRole(role.toUpperCase());
        userRepository.save(user);
        return new ResponseEntity<>(user, HttpStatus.OK);
    }

    // 5. DELETE A USER with full cascade (ADMIN only)
    // Order: notifications → ticket_attachments → tickets → bookings → user
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return new ResponseEntity<>("User not found.", HttpStatus.NOT_FOUND);
        }
        try {
            // 1. Delete notifications
            notificationRepository.deleteAll(
                    notificationRepository.findByUser_UserIdOrderByCreatedAtDesc(id));

            // 2. Delete ticket attachments, then tickets
            List<Ticket> tickets = ticketRepository.findByUser_UserId(id);
            for (Ticket t : tickets) {
                ticketAttachmentRepository.deleteAll(
                        ticketAttachmentRepository.findByTicket_TicketId(t.getTicketId()));
            }
            ticketRepository.deleteAll(tickets);

            // 3. Delete bookings
            List<Booking> bookings = bookingRepository.findByUser_UserId(id);
            bookingRepository.deleteAll(bookings);

            // 4. Delete user
            userRepository.deleteById(id);

            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to delete user: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}