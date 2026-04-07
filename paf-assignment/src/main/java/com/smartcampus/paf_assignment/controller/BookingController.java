package com.smartcampus.paf_assignment.controller;

import com.smartcampus.paf_assignment.entity.Booking;
import com.smartcampus.paf_assignment.entity.Resource;
import com.smartcampus.paf_assignment.entity.User;
import com.smartcampus.paf_assignment.repository.BookingRepository;
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

    // 1. REQUEST A BOOKING (POST)
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody Booking bookingRequest) {
        
        // Ensure the User and Resource actually exist in the database
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

        // If no conflicts, save the booking!
        bookingRequest.setStatus("PENDING"); // Bookings must start as PENDING per requirements
        bookingRequest.setUser(user.get());
        bookingRequest.setResource(resource.get());
        
        Booking savedBooking = bookingRepository.save(bookingRequest);
        return new ResponseEntity<>(savedBooking, HttpStatus.CREATED);
    }

    // 2. GET ALL BOOKINGS (For Admin view)
    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings() {
        return new ResponseEntity<>(bookingRepository.findAll(), HttpStatus.OK);
    }

    // 3. GET BOOKINGS FOR A SPECIFIC USER
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Booking>> getUserBookings(@PathVariable Long userId) {
        List<Booking> userBookings = bookingRepository.findByUser_UserId(userId);
        return new ResponseEntity<>(userBookings, HttpStatus.OK);
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
        
        // Convert status to uppercase to maintain database consistency
        String newStatus = status.toUpperCase();
        booking.setStatus(newStatus);
        
        // If an admin rejects the booking, save the reason
        if ("REJECTED".equals(newStatus) && adminReason != null) {
            booking.setAdminReason(adminReason);
        }

        Booking updatedBooking = bookingRepository.save(booking);
        return new ResponseEntity<>(updatedBooking, HttpStatus.OK);
    }
}