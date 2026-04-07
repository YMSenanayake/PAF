package com.smartcampus.paf_assignment.repository;

import com.smartcampus.paf_assignment.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // Find all notifications for a specific user, ordered by newest first
    List<Notification> findByUser_UserIdOrderByCreatedAtDesc(Long userId);
    
    // Find only unread notifications for a specific user
    List<Notification> findByUser_UserIdAndIsReadFalse(Long userId);
}