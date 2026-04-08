package com.smartcampus.paf_assignment.repository;

import com.smartcampus.paf_assignment.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Custom SQL query to check for overlapping times for the same resource on the same day
    @Query("SELECT b FROM Booking b WHERE b.resource.resourceId = :resourceId " +
           "AND b.bookingDate = :bookingDate " +
           "AND b.status != 'REJECTED' AND b.status != 'CANCELLED' " +
           "AND ((b.startTime < :endTime AND b.endTime > :startTime))")
    List<Booking> findOverlappingBookings(
            @Param("resourceId") Long resourceId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );
    // Find all bookings for a specific user
    List<Booking> findByUser_UserId(Long userId);

    // Find all bookings for a specific resource (used for cascade delete)
    List<Booking> findByResource_ResourceId(Long resourceId);
}