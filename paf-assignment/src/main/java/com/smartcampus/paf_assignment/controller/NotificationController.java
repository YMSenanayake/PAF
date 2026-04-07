package com.smartcampus.paf_assignment.controller;

import com.smartcampus.paf_assignment.entity.Notification;
import com.smartcampus.paf_assignment.entity.User;
import com.smartcampus.paf_assignment.repository.NotificationRepository;
import com.smartcampus.paf_assignment.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin("*")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    // 1. CREATE A NOTIFICATION (Used by the system, or manually for testing)
    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody Notification notificationReq) {
        Optional<User> userOpt = userRepository.findById(notificationReq.getUser().getUserId());
        if (userOpt.isEmpty()) {
            return new ResponseEntity<>("Error: User not found.", HttpStatus.NOT_FOUND);
        }
        
        notificationReq.setUser(userOpt.get());
        Notification savedNotification = notificationRepository.save(notificationReq);
        return new ResponseEntity<>(savedNotification, HttpStatus.CREATED);
    }

    // 2. GET ALL NOTIFICATIONS FOR A SPECIFIC USER
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getUserNotifications(@PathVariable Long userId) {
        List<Notification> notifications = notificationRepository.findByUser_UserIdOrderByCreatedAtDesc(userId);
        return new ResponseEntity<>(notifications, HttpStatus.OK);
    }

    // 3. GET UNREAD NOTIFICATIONS FOR A USER
    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(@PathVariable Long userId) {
        List<Notification> unread = notificationRepository.findByUser_UserIdAndIsReadFalse(userId);
        return new ResponseEntity<>(unread, HttpStatus.OK);
    }

    // 4. MARK NOTIFICATION AS READ
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        Optional<Notification> notifOpt = notificationRepository.findById(id);
        if (notifOpt.isPresent()) {
            Notification notification = notifOpt.get();
            notification.setRead(true);
            notificationRepository.save(notification);
            return new ResponseEntity<>(notification, HttpStatus.OK);
        }
        return new ResponseEntity<>("Notification not found.", HttpStatus.NOT_FOUND);
    }
}