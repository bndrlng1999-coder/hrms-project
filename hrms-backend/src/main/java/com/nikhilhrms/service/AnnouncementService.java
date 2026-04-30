package com.nikhilhrms.service;

import com.nikhilhrms.dto.AnnouncementDTO;
import com.nikhilhrms.entity.Announcement;
import com.nikhilhrms.repository.AnnouncementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AnnouncementService {

    @Autowired
    private AnnouncementRepository announcementRepository;

    public List<AnnouncementDTO> getAllAnnouncements() {
        return announcementRepository.findByIsActiveTrue().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public AnnouncementDTO getAnnouncement(Long id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found"));
        return mapToDTO(announcement);
    }

    public AnnouncementDTO createAnnouncement(AnnouncementDTO dto) {
        Announcement announcement = new Announcement();
        announcement.setTitle(dto.getTitle());
        announcement.setContent(dto.getContent());
        announcement.setPostedBy(dto.getPostedBy());
        announcement.setIsActive(true);
        announcement = announcementRepository.save(announcement);
        return mapToDTO(announcement);
    }

    public AnnouncementDTO updateAnnouncement(Long id, AnnouncementDTO dto) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found"));
        announcement.setTitle(dto.getTitle());
        announcement.setContent(dto.getContent());
        announcement.setIsActive(dto.getIsActive());
        announcement = announcementRepository.save(announcement);
        return mapToDTO(announcement);
    }

    public void deleteAnnouncement(Long id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found"));
        announcement.setIsActive(false);
        announcementRepository.save(announcement);
    }

    private AnnouncementDTO mapToDTO(Announcement announcement) {
        AnnouncementDTO dto = new AnnouncementDTO();
        dto.setId(announcement.getId());
        dto.setTitle(announcement.getTitle());
        dto.setContent(announcement.getContent());
        dto.setPostedBy(announcement.getPostedBy());
        dto.setIsActive(announcement.getIsActive());
        dto.setCreatedAt(announcement.getCreatedAt().toString());
        return dto;
    }
}
