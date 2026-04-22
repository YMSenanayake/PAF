package com.smartcampus.paf_assignment.repository;

import com.smartcampus.paf_assignment.entity.TicketComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {
    List<TicketComment> findByTicket_TicketIdOrderByCreatedAtAsc(Long ticketId);
}
