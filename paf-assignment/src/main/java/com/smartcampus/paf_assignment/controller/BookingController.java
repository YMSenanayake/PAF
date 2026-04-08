package com.smartcampus.paf_assignment.controller;

import com.smartcampus.paf_assignment.entity.Booking;
import com.smartcampus.paf_assignment.entity.Notification;
import com.smartcampus.paf_assignment.entity.Resource;
import com.smartcampus.paf_assignment.entity.User;
import com.smartcampus.paf_assignment.repository.BookingRepository;
import com.smartcampus.paf_assignment.repository.NotificationRepository;
import com.smartcampus.paf_assignment.repository.ResourceRepository;
import com.smartcampus.paf_assignment.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin("*")
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    // ── Helper: create and persist a notification ──────────────────────────
    private void sendNotification(User user, String message) {
        Notification notif = new Notification();
        notif.setUser(user);
        notif.setMessage(message);
        notificationRepository.save(notif);
    }

    // 1. REQUEST A BOOKING (POST)
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody Booking bookingRequest) {

        Optional<User> user = userRepository.findById(bookingRequest.getUser().getUserId());
        Optional<Resource> resource = resourceRepository.findById(bookingRequest.getResource().getResourceId());

        if (user.isEmpty() || resource.isEmpty()) {
            return new ResponseEntity<>("Error: User or Resource not found.", HttpStatus.BAD_REQUEST);
        }

        // Check for time conflicts
        List<Booking> conflicts = bookingRepository.findOverlappingBookings(
                resource.get().getResourceId(),
                bookingRequest.getBookingDate(),
                bookingRequest.getStartTime(),
                bookingRequest.getEndTime()
        );

        if (!conflicts.isEmpty()) {
            return new ResponseEntity<>("Error: The resource is already booked for this time slot.", HttpStatus.CONFLICT);
        }

        bookingRequest.setStatus("PENDING");
        bookingRequest.setUser(user.get());
        bookingRequest.setResource(resource.get());

        Booking savedBooking = bookingRepository.save(bookingRequest);

        // Notify all ADMINs that a new booking request has arrived
        String notifMsg = "📅 New booking request for \"" + resource.get().getName()
                + "\" on " + bookingRequest.getBookingDate()
                + " from " + user.get().getFullName() + ".";
        userRepository.findByRole("ADMIN")
                .forEach(admin -> sendNotification(admin, notifMsg));


        return new ResponseEntity<>(savedBooking, HttpStatus.CREATED);
    }

    // 2. GET ALL BOOKINGS (Admin)
    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings() {
        return new ResponseEntity<>(bookingRepository.findAll(), HttpStatus.OK);
    }

    // 3. GET BOOKINGS FOR A SPECIFIC USER
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Booking>> getUserBookings(@PathVariable Long userId) {
        return new ResponseEntity<>(bookingRepository.findByUser_UserId(userId), HttpStatus.OK);
    }

    // 4. UPDATE BOOKING STATUS (Approve, Reject, or Cancel)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateBookingStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String adminReason) {

        Optional<Booking> optionalBooking = bookingRepository.findById(id);

        if (optionalBooking.isEmpty()) {
            return new ResponseEntity<>("Error: Booking not found.", HttpStatus.NOT_FOUND);
        }

        Booking booking = optionalBooking.get();
        String newStatus = status.toUpperCase();
        booking.setStatus(newStatus);

        if ("REJECTED".equals(newStatus) && adminReason != null) {
            booking.setAdminReason(adminReason);
        }

        Booking updatedBooking = bookingRepository.save(booking);

        // ── Auto-notify the booking owner ──────────────────────────────────
        User bookingUser = updatedBooking.getUser();
        String resourceName = updatedBooking.getResource() != null
                ? updatedBooking.getResource().getName() : "Unknown Resource";
        String date = updatedBooking.getBookingDate() != null
                ? updatedBooking.getBookingDate().toString() : "";

        String message;
        switch (newStatus) {
            case "APPROVED":
                message = "✅ Your booking for \"" + resourceName + "\" on " + date + " has been APPROVED!";
                break;
            case "REJECTED":
                message = "❌ Your booking for \"" + resourceName + "\" on " + date + " was REJECTED." +
                        (adminReason != null && !adminReason.isBlank() ? " Reason: " + adminReason : "");
                break;
            case "CANCELLED":
                message = "🚫 Your booking for \"" + resourceName + "\" on " + date + " has been cancelled.";
                break;
            default:
                message = "📋 Your booking for \"" + resourceName + "\" status changed to: " + newStatus;
        }

        sendNotification(bookingUser, message);

        return new ResponseEntity<>(updatedBooking, HttpStatus.OK);
    }
}