package com.smartcampus.paf_assignment.controller;

import com.smartcampus.paf_assignment.entity.Resource;
import com.smartcampus.paf_assignment.entity.Ticket;
import com.smartcampus.paf_assignment.entity.User;
import com.smartcampus.paf_assignment.repository.ResourceRepository;
import com.smartcampus.paf_assignment.repository.TicketRepository;
import com.smartcampus.paf_assignment.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin("*")
public class TicketController {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    // 1. CREATE A TICKET (POST)
    @PostMapping
    public ResponseEntity<?> createTicket(@RequestBody Ticket ticketRequest) {
        Optional<User> user = userRepository.findById(ticketRequest.getUser().getUserId());
        Optional<Resource> resource = resourceRepository.findById(ticketRequest.getResource().getResourceId());

        if (user.isEmpty() || resource.isEmpty()) {
            return new ResponseEntity<>("Error: User or Resource not found.", HttpStatus.BAD_REQUEST);
        }

        ticketRequest.setUser(user.get());
        ticketRequest.setResource(resource.get());
        ticketRequest.setStatus("OPEN"); // Tickets always start as OPEN
        
        Ticket savedTicket = ticketRepository.save(ticketRequest);
        return new ResponseEntity<>(savedTicket, HttpStatus.CREATED);
    }

    // 2. GET ALL TICKETS (GET)
    @GetMapping
    public ResponseEntity<List<Ticket>> getAllTickets() {
        return new ResponseEntity<>(ticketRepository.findAll(), HttpStatus.OK);
    }

    // 3. TECHNICIAN UPDATE STATUS & NOTES (PUT)
    @PutMapping("/{id}/resolve")
    public ResponseEntity<?> updateTicketStatus(
            @PathVariable Long id, 
            @RequestParam String status, 
            @RequestParam(required = false) String notes) {
        
        Optional<Ticket> optionalTicket = ticketRepository.findById(id);
        
        if (optionalTicket.isEmpty()) {
            return new ResponseEntity<>("Error: Ticket not found.", HttpStatus.NOT_FOUND);
        }

        Ticket ticket = optionalTicket.get();
        ticket.setStatus(status.toUpperCase());
        
        if (notes != null) {
            ticket.setResolutionNotes(notes);
        }

        Ticket updatedTicket = ticketRepository.save(ticket);
        return new ResponseEntity<>(updatedTicket, HttpStatus.OK);
    }

    // 4. DELETE A TICKET (DELETE)
    @DeleteMapping("/{id}")
    public ResponseEntity<HttpStatus> deleteTicket(@PathVariable Long id) {
        try {
            ticketRepository.deleteById(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}