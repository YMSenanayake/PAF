package com.smartcampus.paf_assignment.repository;

import com.smartcampus.paf_assignment.entity.TicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {
    // Helpful method to find all images for a specific ticket
    List<TicketAttachment> findByTicket_TicketId(Long ticketId);
}