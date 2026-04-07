package com.smartcampus.paf_assignment.controller;

import com.smartcampus.paf_assignment.entity.Resource;
import com.smartcampus.paf_assignment.repository.ResourceRepository;
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

    // 1. ADD A NEW RESOURCE (POST)
    @PostMapping
    public ResponseEntity<Resource> createResource(@RequestBody Resource resource) {
        // Set default status to ACTIVE if none is provided
        if (resource.getStatus() == null) {
            resource.setStatus("ACTIVE");
        }
        Resource savedResource = resourceRepository.save(resource);
        return new ResponseEntity<>(savedResource, HttpStatus.CREATED);
    }

    // 2. GET ALL RESOURCES (GET)
    @GetMapping
    public ResponseEntity<List<Resource>> getAllResources() {
        return new ResponseEntity<>(resourceRepository.findAll(), HttpStatus.OK);
    }

    // 3. UPDATE A RESOURCE STATUS (PUT)
    @PutMapping("/{id}/status")
    public ResponseEntity<Resource> updateResourceStatus(@PathVariable Long id, @RequestBody Resource resourceDetails) {
        Optional<Resource> optionalResource = resourceRepository.findById(id);
        
        if (optionalResource.isPresent()) {
            Resource existingResource = optionalResource.get();
            existingResource.setStatus(resourceDetails.getStatus());
            Resource updatedResource = resourceRepository.save(existingResource);
            return new ResponseEntity<>(updatedResource, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // 4. DELETE A RESOURCE (DELETE)
    @DeleteMapping("/{id}")
    public ResponseEntity<HttpStatus> deleteResource(@PathVariable Long id) {
        try {
            resourceRepository.deleteById(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT); // 204 No Content is standard for delete
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}