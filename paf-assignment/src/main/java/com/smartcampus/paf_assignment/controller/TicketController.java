package com.smartcampus.paf_assignment.controller;

import com.smartcampus.paf_assignment.entity.Notification;
import com.smartcampus.paf_assignment.entity.Resource;
import com.smartcampus.paf_assignment.entity.Ticket;
import com.smartcampus.paf_assignment.entity.User;
import com.smartcampus.paf_assignment.repository.NotificationRepository;
import com.smartcampus.paf_assignment.repository.ResourceRepository;
import com.smartcampus.paf_assignment.repository.TicketRepository;
import com.smartcampus.paf_assignment.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.smartcampus.paf_assignment.entity.TicketAttachment;
import com.smartcampus.paf_assignment.repository.TicketAttachmentRepository;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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

    @Autowired
    private TicketAttachmentRepository attachmentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private void sendNotification(User user, String message) {
        Notification notif = new Notification();
        notif.setUser(user);
        notif.setMessage(message);
        notificationRepository.save(notif);
    }

    // The folder where images will be saved inside your project
    private static final String UPLOAD_DIR = "uploads/";

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

        // ── Notify all ADMINs and TECHNICIANs about the new ticket ──────────
        String resourceName = resource.get().getName();
        String reporterName = user.get().getFullName();
        String priority     = ticketRequest.getPriority() != null ? ticketRequest.getPriority() : "NORMAL";
        String notifMsg = "🎫 New " + priority + " priority ticket for \"" + resourceName
                + "\" reported by " + reporterName + ".";

        List<User> staff = new java.util.ArrayList<>();
        staff.addAll(userRepository.findByRole("ADMIN"));
        staff.addAll(userRepository.findByRole("TECHNICIAN"));
        staff.forEach(staffUser -> sendNotification(staffUser, notifMsg));

        return new ResponseEntity<>(savedTicket, HttpStatus.CREATED);
    }

    // 2. GET ALL TICKETS (Admin/Technician)
    @GetMapping
    public ResponseEntity<List<Ticket>> getAllTickets() {
        return new ResponseEntity<>(ticketRepository.findAll(), HttpStatus.OK);
    }

    // 2b. GET TICKETS FOR A SPECIFIC USER (Regular users see only their own)
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Ticket>> getUserTickets(@PathVariable Long userId) {
        return new ResponseEntity<>(ticketRepository.findByUser_UserId(userId), HttpStatus.OK);
    }

    // 3b. GET ATTACHMENTS FOR A TICKET
    @GetMapping("/{id}/attachments")
    public ResponseEntity<List<TicketAttachment>> getAttachments(@PathVariable Long id) {
        List<TicketAttachment> attachments = attachmentRepository.findByTicket_TicketId(id);
        return new ResponseEntity<>(attachments, HttpStatus.OK);
    }

    // 4. TECHNICIAN UPDATE STATUS & NOTES (PUT)
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

        // Auto-notify the ticket owner
        User ticketUser = updatedTicket.getUser();
        String resourceName = updatedTicket.getResource() != null
                ? updatedTicket.getResource().getName() : "Unknown Resource";
        String newStatusUpper = status.toUpperCase();
        String message;
        switch (newStatusUpper) {
            case "IN_PROGRESS":
                message = "🔧 Your ticket for \"" + resourceName + "\" is now being worked on (IN PROGRESS).";
                break;
            case "RESOLVED":
                message = "✅ Your ticket for \"" + resourceName + "\" has been RESOLVED!"
                        + (notes != null && !notes.isBlank() ? " Note: " + notes : "");
                break;
            case "CLOSED":
                message = "📋 Your ticket for \"" + resourceName + "\" has been CLOSED.";
                break;
            default:
                message = "📋 Your ticket for \"" + resourceName + "\" status changed to: " + newStatusUpper;
        }
        sendNotification(ticketUser, message);

        return new ResponseEntity<>(updatedTicket, HttpStatus.OK);
    }

    // 4. DELETE A TICKET (DELETE) — removes attachments first to avoid FK constraint errors
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTicket(@PathVariable Long id) {
        Optional<Ticket> ticketOpt = ticketRepository.findById(id);
        if (ticketOpt.isEmpty()) {
            return new ResponseEntity<>("Ticket not found", HttpStatus.NOT_FOUND);
        }
        try {
            // 1. Delete all file attachments linked to this ticket
            List<TicketAttachment> attachments = attachmentRepository.findByTicket_TicketId(id);
            attachmentRepository.deleteAll(attachments);

            // 2. Now safe to delete the ticket itself
            ticketRepository.deleteById(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to delete ticket: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 5. UPLOAD TICKET ATTACHMENTS (POST)
    @PostMapping("/{id}/attachments")
    public ResponseEntity<?> uploadAttachments(
            @PathVariable Long id, 
            @RequestParam("files") MultipartFile[] files) {
        
        // Enforce the assignment requirement: Max 3 images
        if (files.length > 3) {
            return new ResponseEntity<>("Error: Maximum 3 attachments allowed.", HttpStatus.BAD_REQUEST);
        }

        Optional<Ticket> ticketOpt = ticketRepository.findById(id);
        if (ticketOpt.isEmpty()) {
            return new ResponseEntity<>("Error: Ticket not found.", HttpStatus.NOT_FOUND);
        }

        try {
            // Create the 'uploads' folder if it doesn't exist yet
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) {
                uploadDir.mkdir();
            }

            // Loop through each uploaded file
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    // Generate a unique file name to prevent overwriting
                    String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                    String filePath = UPLOAD_DIR + fileName;
                    
                    // Save the physical file to the folder
                    Path path = Paths.get(filePath);
                    Files.write(path, file.getBytes());

                    // Save the file path to the database
                    TicketAttachment attachment = new TicketAttachment();
                    attachment.setTicket(ticketOpt.get());
                    attachment.setFilePath(filePath);
                    attachmentRepository.save(attachment);
                }
            }
            return new ResponseEntity<>("Files uploaded and saved successfully.", HttpStatus.OK);
            
        } catch (IOException e) {
            return new ResponseEntity<>("Error saving files: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}