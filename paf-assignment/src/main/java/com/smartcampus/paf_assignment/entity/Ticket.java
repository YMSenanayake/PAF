package com.smartcampus.paf_assignment.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ticketId;

    // The user who reported the issue
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // The resource that has the issue
    @ManyToOne
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;

    // Staff member assigned to this ticket (optional)
    @ManyToOne
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    private String category; // e.g., "HARDWARE", "SOFTWARE", "FACILITY"
    
    private String description;
    
    private String priority; // "LOW", "MEDIUM", "HIGH", "CRITICAL"
    
    private String contactDetails; // How to reach the reporter
    
    private String status; // OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED
    
    private String resolutionNotes; // Added by technician later
    
    private LocalDateTime createdAt;

    // Automatically set the creation time when a ticket is made
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // --- Getters and Setters ---

    public Long getTicketId() { return ticketId; }
    public void setTicketId(Long ticketId) { this.ticketId = ticketId; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Resource getResource() { return resource; }
    public void setResource(Resource resource) { this.resource = resource; }

    public User getAssignedTo() { return assignedTo; }
    public void setAssignedTo(User assignedTo) { this.assignedTo = assignedTo; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getContactDetails() { return contactDetails; }
    public void setContactDetails(String contactDetails) { this.contactDetails = contactDetails; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}