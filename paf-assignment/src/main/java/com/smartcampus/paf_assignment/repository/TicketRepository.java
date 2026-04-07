package com.smartcampus.paf_assignment.repository;

import com.smartcampus.paf_assignment.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    // Helpful methods to find tickets by the user who made them or the resource they belong to
    List<Ticket> findByUser_UserId(Long userId);
    List<Ticket> findByResource_ResourceId(Long resourceId);
}