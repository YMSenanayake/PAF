package com.smartcampus.paf_assignment.controller;

import com.smartcampus.paf_assignment.entity.Booking;
import com.smartcampus.paf_assignment.entity.Resource;
import com.smartcampus.paf_assignment.entity.Ticket;
import com.smartcampus.paf_assignment.entity.TicketAttachment;
import com.smartcampus.paf_assignment.repository.BookingRepository;
import com.smartcampus.paf_assignment.repository.ResourceRepository;
import com.smartcampus.paf_assignment.repository.TicketAttachmentRepository;
import com.smartcampus.paf_assignment.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/resources")
@CrossOrigin("*")
public class ResourceController {

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private TicketAttachmentRepository ticketAttachmentRepository;

    // 1. ADD A NEW RESOURCE (POST)
    @PostMapping
    public ResponseEntity<Resource> createResource(@RequestBody Resource resource) {
        if (resource.getStatus() == null) {
            resource.setStatus("ACTIVE");
        }
        return new ResponseEntity<>(resourceRepository.save(resource), HttpStatus.CREATED);
    }

    // 2. GET ALL RESOURCES (GET)
    @GetMapping
    public ResponseEntity<List<Resource>> getAllResources() {
        return new ResponseEntity<>(resourceRepository.findAll(), HttpStatus.OK);
    }

    // 3. UPDATE A RESOURCE STATUS (PUT)
    @PutMapping("/{id}/status")
    public ResponseEntity<Resource> updateResourceStatus(@PathVariable Long id,
                                                         @RequestBody Resource resourceDetails) {
        Optional<Resource> optionalResource = resourceRepository.findById(id);
        if (optionalResource.isPresent()) {
            Resource existing = optionalResource.get();
            existing.setStatus(resourceDetails.getStatus());
            return new ResponseEntity<>(resourceRepository.save(existing), HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    // 4. DELETE A RESOURCE (DELETE)
    //    Must delete child records first to satisfy FK constraints:
    //    ticket_attachments → tickets → bookings → resource
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResource(@PathVariable Long id) {
        if (!resourceRepository.existsById(id)) {
            return new ResponseEntity<>("Resource not found", HttpStatus.NOT_FOUND);
        }
        try {
            // Step 1: Delete attachments for all tickets linked to this resource
            List<Ticket> tickets = ticketRepository.findByResource_ResourceId(id);
            for (Ticket ticket : tickets) {
                List<TicketAttachment> attachments =
                        ticketAttachmentRepository.findByTicket_TicketId(ticket.getTicketId());
                ticketAttachmentRepository.deleteAll(attachments);
            }

            // Step 2: Delete all tickets linked to this resource
            ticketRepository.deleteAll(tickets);

            // Step 3: Delete all bookings linked to this resource
            List<Booking> bookings = bookingRepository.findByResource_ResourceId(id);
            bookingRepository.deleteAll(bookings);

            // Step 4: Safe to delete the resource now
            resourceRepository.deleteById(id);

            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to delete resource: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}