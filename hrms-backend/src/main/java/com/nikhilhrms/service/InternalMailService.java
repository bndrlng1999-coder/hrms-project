package com.nikhilhrms.service;

import com.nikhilhrms.entity.*;
import com.nikhilhrms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InternalMailService {

    private static final Set<User.Role> MAIL_ADMINS = EnumSet.of(
            User.Role.SUPER_ADMIN,
            User.Role.ADMIN,
            User.Role.HR_MANAGER,
            User.Role.HR
    );

    private static final Path UPLOAD_ROOT = Paths.get("uploads", "internal-mails");

    @Autowired private InternalMailboxRepository mailboxRepository;
    @Autowired private InternalMailMessageRepository messageRepository;
    @Autowired private InternalMailRecipientRepository recipientRepository;
    @Autowired private InternalMailAttachmentRepository attachmentRepository;
    @Autowired private InternalMailDraftRepository draftRepository;
    @Autowired private InternalMailAuditLogRepository auditLogRepository;
    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationRepository notificationRepository;

    @Transactional
    public Map<String, Object> compose(Map<String, Object> request, List<MultipartFile> files) {
        return sendFrom(currentMailbox(), request, files);
    }

    @Transactional
    public Map<String, Object> seedMessage(InternalMailbox sender, Map<String, Object> request) {
        return sendFrom(sender, request, Collections.emptyList());
    }

    private Map<String, Object> sendFrom(InternalMailbox sender, Map<String, Object> request, List<MultipartFile> files) {
        List<RecipientTarget> targets = collectRecipients(request);
        if (targets.isEmpty()) {
            throw new RuntimeException("Add at least one internal recipient");
        }
        targets.forEach(target -> requireCanMail(sender.getEmployee(), target.mailbox.getEmployee()));

        InternalMailMessage message = new InternalMailMessage();
        message.setSenderMailbox(sender);
        message.setSubject(stringValue(request, "subject", "(No subject)"));
        message.setBody(stringValue(request, "body", ""));
        message.setDraft(false);
        message = messageRepository.save(message);
        message.setThreadId(message.getParentMessageId() == null ? message.getId() : message.getThreadId());
        message = messageRepository.save(message);

        for (RecipientTarget target : targets) {
            InternalMailRecipient recipient = new InternalMailRecipient();
            recipient.setMessage(message);
            recipient.setRecipientMailbox(target.mailbox);
            recipient.setRecipientType(target.type);
            recipientRepository.save(recipient);
            notifyMail(target.mailbox.getEmployee(), sender, message);
        }

        saveAttachments(message, files);
        audit(sender.getEmployee(), message.getId(), "SEND", "Sent internal mail to " + targets.size() + " recipient(s)");
        return sentDto(message);
    }

    @Transactional
    public Map<String, Object> saveDraft(Map<String, Object> request) {
        InternalMailbox sender = currentMailbox();
        InternalMailDraft draft = request.get("id") == null ? new InternalMailDraft() :
                draftRepository.findById(longValue(request.get("id"))).orElse(new InternalMailDraft());
        if (draft.getId() != null && !Objects.equals(draft.getSenderMailbox().getId(), sender.getId())) {
            throw new RuntimeException("You can edit only your own drafts");
        }
        draft.setSenderMailbox(sender);
        draft.setSubject(stringValue(request, "subject", ""));
        draft.setBody(stringValue(request, "body", ""));
        draft.setRecipientMailboxIds(collectRecipients(request).stream()
                .map(target -> target.type + ":" + target.mailbox.getId())
                .collect(Collectors.joining(",")));
        draft.setUpdatedAt(LocalDateTime.now());
        draft = draftRepository.save(draft);
        audit(sender.getEmployee(), null, "DRAFT", "Saved internal mail draft");
        return draftDto(draft);
    }

    public List<Map<String, Object>> inbox(String filter) {
        InternalMailbox mailbox = currentMailbox();
        return recipientRepository.findByRecipientMailboxAndDeletedByRecipientFalseOrderByMessageCreatedAtDesc(mailbox).stream()
                .filter(row -> matchesFilter(row, filter))
                .map(this::inboxDto)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> sent() {
        InternalMailbox mailbox = currentMailbox();
        return messageRepository.findBySenderMailboxAndDraftFalseAndDeletedBySenderFalseOrderByCreatedAtDesc(mailbox).stream()
                .map(this::sentDto)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> drafts() {
        InternalMailbox mailbox = currentMailbox();
        return draftRepository.findBySenderMailboxOrderByUpdatedAtDesc(mailbox).stream()
                .map(this::draftDto)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> trash() {
        InternalMailbox mailbox = currentMailbox();
        List<Map<String, Object>> rows = new ArrayList<>();
        recipientRepository.findByRecipientMailboxAndDeletedByRecipientTrueOrderByMessageUpdatedAtDesc(mailbox)
                .forEach(row -> rows.add(inboxDto(row)));
        messageRepository.findBySenderMailboxAndDeletedBySenderTrueOrderByUpdatedAtDesc(mailbox)
                .forEach(message -> rows.add(sentDto(message)));
        rows.sort((left, right) -> String.valueOf(right.get("updatedAt")).compareTo(String.valueOf(left.get("updatedAt"))));
        return rows;
    }

    public List<Map<String, Object>> starred() {
        InternalMailbox mailbox = currentMailbox();
        return recipientRepository.findByRecipientMailboxAndStarredTrueAndDeletedByRecipientFalseOrderByMessageCreatedAtDesc(mailbox).stream()
                .map(this::inboxDto)
                .collect(Collectors.toList());
    }

    public Map<String, Object> messageDetail(Long id) {
        InternalMailbox mailbox = currentMailbox();
        InternalMailMessage message = getVisibleMessage(id, mailbox);
        Optional<InternalMailRecipient> recipient = recipientRepository.findByMessageIdAndRecipientMailboxId(id, mailbox.getId());
        recipient.ifPresent(row -> {
            if (!row.getReadStatus()) {
                row.setReadStatus(true);
                row.setReadAt(LocalDateTime.now());
                recipientRepository.save(row);
            }
        });

        Map<String, Object> dto = baseMessageDto(message);
        dto.put("body", message.getBody());
        dto.put("folder", Objects.equals(message.getSenderMailbox().getId(), mailbox.getId()) ? "sent" : "inbox");
        dto.put("recipients", visibleRecipients(message, mailbox));
        dto.put("attachments", attachmentRepository.findByMessageId(message.getId()).stream().map(this::attachmentDto).collect(Collectors.toList()));
        recipient.ifPresent(row -> {
            dto.put("read", row.getReadStatus());
            dto.put("starred", row.getStarred());
            dto.put("important", row.getImportant());
        });
        return dto;
    }

    @Transactional
    public Map<String, Object> markRead(Long id, boolean read) {
        InternalMailbox mailbox = currentMailbox();
        InternalMailRecipient row = recipientRepository.findByMessageIdAndRecipientMailboxId(id, mailbox.getId())
                .orElseThrow(() -> new RuntimeException("Message is not in your inbox"));
        row.setReadStatus(read);
        row.setReadAt(read ? LocalDateTime.now() : null);
        recipientRepository.save(row);
        audit(mailbox.getEmployee(), id, read ? "READ" : "UNREAD", "Updated read state");
        return messageDetail(id);
    }

    @Transactional
    public Map<String, Object> toggleStar(Long id) {
        InternalMailbox mailbox = currentMailbox();
        InternalMailRecipient row = recipientRepository.findByMessageIdAndRecipientMailboxId(id, mailbox.getId())
                .orElseThrow(() -> new RuntimeException("Message is not in your inbox"));
        row.setStarred(!row.getStarred());
        recipientRepository.save(row);
        audit(mailbox.getEmployee(), id, "STAR", "Toggled starred state");
        return inboxDto(row);
    }

    @Transactional
    public Map<String, Object> toggleImportant(Long id) {
        InternalMailbox mailbox = currentMailbox();
        InternalMailRecipient row = recipientRepository.findByMessageIdAndRecipientMailboxId(id, mailbox.getId())
                .orElseThrow(() -> new RuntimeException("Message is not in your inbox"));
        row.setImportant(!row.getImportant());
        recipientRepository.save(row);
        audit(mailbox.getEmployee(), id, "IMPORTANT", "Toggled important state");
        return inboxDto(row);
    }

    @Transactional
    public Map<String, Object> reply(Long id, Map<String, Object> request, List<MultipartFile> files) {
        InternalMailbox sender = currentMailbox();
        InternalMailMessage parent = getVisibleMessage(id, sender);
        Map<String, Object> next = new HashMap<>(request);
        next.put("subject", stringValue(request, "subject", "Re: " + parent.getSubject()));
        next.put("to", List.of(parent.getSenderMailbox().getId()));
        InternalMailMessage message = createThreadMessage(sender, parent, next, files);
        audit(sender.getEmployee(), message.getId(), "REPLY", "Replied to message " + id);
        return messageDetail(message.getId());
    }

    @Transactional
    public Map<String, Object> forward(Long id, Map<String, Object> request, List<MultipartFile> files) {
        InternalMailbox sender = currentMailbox();
        InternalMailMessage parent = getVisibleMessage(id, sender);
        Map<String, Object> next = new HashMap<>(request);
        next.put("subject", stringValue(request, "subject", "Fwd: " + parent.getSubject()));
        next.put("body", stringValue(request, "body", "") + "\n\n--- Forwarded internal mail ---\n" + parent.getBody());
        InternalMailMessage message = createThreadMessage(sender, parent, next, files);
        audit(sender.getEmployee(), message.getId(), "FORWARD", "Forwarded message " + id);
        return messageDetail(message.getId());
    }

    @Transactional
    public void delete(Long id) {
        InternalMailbox mailbox = currentMailbox();
        boolean changed = false;
        Optional<InternalMailRecipient> recipient = recipientRepository.findByMessageIdAndRecipientMailboxId(id, mailbox.getId());
        if (recipient.isPresent()) {
            InternalMailRecipient row = recipient.get();
            row.setDeletedByRecipient(true);
            recipientRepository.save(row);
            changed = true;
        }
        InternalMailMessage message = messageRepository.findById(id).orElse(null);
        if (message != null && Objects.equals(message.getSenderMailbox().getId(), mailbox.getId())) {
            message.setDeletedBySender(true);
            message.setUpdatedAt(LocalDateTime.now());
            messageRepository.save(message);
            changed = true;
        }
        if (!changed) {
            throw new RuntimeException("Message not found");
        }
        audit(mailbox.getEmployee(), id, "DELETE", "Moved message to trash");
    }

    public List<Map<String, Object>> search(String query) {
        InternalMailbox mailbox = currentMailbox();
        String value = query == null ? "" : query;
        Set<Long> visibleIds = inbox("").stream().map(row -> longValue(row.get("id"))).collect(Collectors.toSet());
        sent().stream().map(row -> longValue(row.get("id"))).forEach(visibleIds::add);
        return messageRepository.findBySubjectContainingIgnoreCaseOrBodyContainingIgnoreCase(value, value).stream()
                .filter(message -> visibleIds.contains(message.getId()))
                .map(message -> Objects.equals(message.getSenderMailbox().getId(), mailbox.getId())
                        ? sentDto(message)
                        : recipientRepository.findByMessageIdAndRecipientMailboxId(message.getId(), mailbox.getId()).map(this::inboxDto).orElse(baseMessageDto(message)))
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> contacts() {
        InternalMailbox current = currentMailbox();
        return mailboxRepository.findByActiveTrueOrderByDisplayNameAsc().stream()
                .filter(mailbox -> !Objects.equals(mailbox.getId(), current.getId()))
                .filter(mailbox -> canMail(current.getEmployee(), mailbox.getEmployee()))
                .map(this::mailboxDto)
                .collect(Collectors.toList());
    }

    public Map<String, Object> summary() {
        InternalMailbox mailbox = currentMailbox();
        Map<String, Object> dto = new HashMap<>();
        dto.put("emailAddress", mailbox.getEmailAddress());
        dto.put("displayName", mailbox.getDisplayName());
        dto.put("unreadCount", recipientRepository.countByRecipientMailboxAndReadStatusFalseAndDeletedByRecipientFalse(mailbox));
        return dto;
    }

    @Transactional
    public Map<String, Object> createMailbox(Long employeeId) {
        Employee actor = currentEmployee();
        if (!MAIL_ADMINS.contains(actor.getUser().getRole())) {
            throw new RuntimeException("Only admins can create internal mailboxes");
        }
        Employee employee = employeeRepository.findById(employeeId).orElseThrow(() -> new RuntimeException("Employee not found"));
        return mailboxDto(ensureMailbox(employee));
    }

    @Transactional
    public void syncMailboxes() {
        Employee actor = currentEmployee();
        if (actor.getUser().getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Only admins can create internal mailboxes");
        }
        employeeRepository.findAll().stream().filter(employee -> Boolean.TRUE.equals(employee.getIsActive())).forEach(this::ensureMailbox);
    }

    public InternalMailbox ensureMailbox(Employee employee) {
        return mailboxRepository.findByEmployeeId(employee.getId()).orElseGet(() -> {
            InternalMailbox mailbox = new InternalMailbox();
            mailbox.setEmployee(employee);
            mailbox.setDisplayName(employeeName(employee));
            mailbox.setEmailAddress(uniqueAddress(employee));
            mailbox.setActive(true);
            return mailboxRepository.save(mailbox);
        });
    }

    private InternalMailMessage createThreadMessage(InternalMailbox sender, InternalMailMessage parent, Map<String, Object> request, List<MultipartFile> files) {
        List<RecipientTarget> targets = collectRecipients(request);
        if (targets.isEmpty()) {
            throw new RuntimeException("Add at least one internal recipient");
        }
        targets.forEach(target -> requireCanMail(sender.getEmployee(), target.mailbox.getEmployee()));

        InternalMailMessage message = new InternalMailMessage();
        message.setSenderMailbox(sender);
        message.setSubject(stringValue(request, "subject", "(No subject)"));
        message.setBody(stringValue(request, "body", ""));
        message.setParentMessageId(parent.getId());
        message.setThreadId(parent.getThreadId() == null ? parent.getId() : parent.getThreadId());
        message = messageRepository.save(message);
        for (RecipientTarget target : targets) {
            InternalMailRecipient recipient = new InternalMailRecipient();
            recipient.setMessage(message);
            recipient.setRecipientMailbox(target.mailbox);
            recipient.setRecipientType(target.type);
            recipientRepository.save(recipient);
            notifyMail(target.mailbox.getEmployee(), sender, message);
        }
        saveAttachments(message, files);
        return message;
    }

    private InternalMailMessage getVisibleMessage(Long id, InternalMailbox mailbox) {
        InternalMailMessage message = messageRepository.findById(id).orElseThrow(() -> new RuntimeException("Message not found"));
        boolean sentByMe = Objects.equals(message.getSenderMailbox().getId(), mailbox.getId());
        boolean recipient = recipientRepository.findByMessageIdAndRecipientMailboxId(id, mailbox.getId()).isPresent();
        if (!(sentByMe || recipient)) {
            throw new RuntimeException("Message not found");
        }
        return message;
    }

    private List<RecipientTarget> collectRecipients(Map<String, Object> request) {
        List<RecipientTarget> targets = new ArrayList<>();
        collectRecipientType(request, "to", InternalMailRecipient.RecipientType.TO, targets);
        collectRecipientType(request, "cc", InternalMailRecipient.RecipientType.CC, targets);
        collectRecipientType(request, "bcc", InternalMailRecipient.RecipientType.BCC, targets);
        Map<Long, RecipientTarget> unique = new LinkedHashMap<>();
        targets.forEach(target -> unique.putIfAbsent(target.mailbox.getId(), target));
        return new ArrayList<>(unique.values());
    }

    private void collectRecipientType(Map<String, Object> request, String key, InternalMailRecipient.RecipientType type, List<RecipientTarget> targets) {
        Object value = request.get(key);
        if (value == null) {
            return;
        }
        Collection<?> values = value instanceof Collection<?> collection ? collection : List.of(value);
        for (Object item : values) {
            InternalMailbox mailbox = mailboxByValue(item);
            if (mailbox.getActive()) {
                targets.add(new RecipientTarget(mailbox, type));
            }
        }
    }

    private InternalMailbox mailboxByValue(Object value) {
        if (value == null || String.valueOf(value).isBlank()) {
            throw new RuntimeException("Invalid recipient");
        }
        String text = String.valueOf(value).trim();
        if (text.contains("@")) {
            return mailboxRepository.findByEmailAddressIgnoreCase(text).orElseThrow(() -> new RuntimeException("Internal recipient not found: " + text));
        }
        return mailboxRepository.findById(Long.parseLong(text)).orElseThrow(() -> new RuntimeException("Internal recipient not found"));
    }

    private void requireCanMail(Employee sender, Employee recipient) {
        if (!canMail(sender, recipient)) {
            throw new RuntimeException("You cannot mail this employee based on internal mail permissions");
        }
    }

    private boolean canMail(Employee sender, Employee recipient) {
        User.Role role = sender.getUser().getRole();
        User.Role recipientRole = recipient.getUser().getRole();
        if (MAIL_ADMINS.contains(role)) {
            return true;
        }
        if (role == User.Role.MANAGER
                || role == User.Role.PROJECT_MANAGER
                || role == User.Role.TEAM_LEAD
                || role == User.Role.MARKETING_MANAGER) {
            return Objects.equals(recipient.getManagerId(), sender.getId())
                    || Objects.equals(recipient.getId(), sender.getManagerId())
                    || recipientRole == User.Role.HR
                    || recipientRole == User.Role.HR_MANAGER
                    || Objects.equals(recipient.getId(), sender.getId());
        }
        return recipientRole == User.Role.HR
                || recipientRole == User.Role.HR_MANAGER
                || Objects.equals(recipient.getId(), sender.getManagerId())
                || (sender.getManagerId() != null && Objects.equals(recipient.getManagerId(), sender.getManagerId()));
    }

    private void saveAttachments(InternalMailMessage message, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return;
        }
        try {
            Path messageDir = UPLOAD_ROOT.resolve(String.valueOf(message.getId()));
            Files.createDirectories(messageDir);
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) {
                    continue;
                }
                String safeName = Objects.requireNonNullElse(file.getOriginalFilename(), "attachment").replaceAll("[^a-zA-Z0-9._-]", "_");
                Path target = messageDir.resolve(System.currentTimeMillis() + "_" + safeName);
                Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
                InternalMailAttachment attachment = new InternalMailAttachment();
                attachment.setMessage(message);
                attachment.setFileName(safeName);
                attachment.setFileType(file.getContentType());
                attachment.setFileSize(file.getSize());
                attachment.setFilePath(target.toString());
                attachmentRepository.save(attachment);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to store attachment");
        }
    }

    private void notifyMail(Employee recipient, InternalMailbox sender, InternalMailMessage message) {
        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setTitle("New internal mail");
        notification.setMessage(sender.getDisplayName() + " sent: " + message.getSubject());
        notification.setLink("/mail/message/" + message.getId());
        notificationRepository.save(notification);
    }

    private void audit(Employee actor, Long messageId, String action, String detail) {
        InternalMailAuditLog log = new InternalMailAuditLog();
        log.setActor(actor);
        log.setMessageId(messageId);
        log.setAction(action);
        log.setDetail(detail);
        auditLogRepository.save(log);
    }

    private boolean matchesFilter(InternalMailRecipient row, String filter) {
        if (filter == null || filter.isBlank()) {
            return true;
        }
        if ("unread".equalsIgnoreCase(filter)) {
            return !row.getReadStatus();
        }
        if ("starred".equalsIgnoreCase(filter)) {
            return row.getStarred();
        }
        if ("important".equalsIgnoreCase(filter)) {
            return row.getImportant();
        }
        return true;
    }

    private Map<String, Object> inboxDto(InternalMailRecipient row) {
        Map<String, Object> dto = baseMessageDto(row.getMessage());
        dto.put("folder", row.getDeletedByRecipient() ? "trash" : "inbox");
        dto.put("recipientRowId", row.getId());
        dto.put("read", row.getReadStatus());
        dto.put("starred", row.getStarred());
        dto.put("important", row.getImportant());
        return dto;
    }

    private Map<String, Object> sentDto(InternalMailMessage message) {
        Map<String, Object> dto = baseMessageDto(message);
        dto.put("folder", message.getDeletedBySender() ? "trash" : "sent");
        dto.put("toNames", recipientRepository.findByMessage(message).stream()
                .filter(row -> row.getRecipientType() != InternalMailRecipient.RecipientType.BCC)
                .map(row -> row.getRecipientMailbox().getDisplayName())
                .collect(Collectors.joining(", ")));
        dto.put("read", true);
        dto.put("starred", message.getStarredBySender());
        dto.put("important", message.getImportantBySender());
        return dto;
    }

    private Map<String, Object> draftDto(InternalMailDraft draft) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", draft.getId());
        dto.put("subject", draft.getSubject());
        dto.put("body", draft.getBody());
        dto.put("preview", preview(draft.getBody()));
        dto.put("recipientMailboxIds", draft.getRecipientMailboxIds());
        dto.put("createdAt", draft.getCreatedAt());
        dto.put("updatedAt", draft.getUpdatedAt());
        dto.put("folder", "drafts");
        return dto;
    }

    private Map<String, Object> baseMessageDto(InternalMailMessage message) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", message.getId());
        dto.put("senderName", message.getSenderMailbox().getDisplayName());
        dto.put("senderEmail", message.getSenderMailbox().getEmailAddress());
        dto.put("subject", message.getSubject());
        dto.put("preview", preview(message.getBody()));
        dto.put("createdAt", message.getCreatedAt());
        dto.put("updatedAt", message.getUpdatedAt());
        dto.put("threadId", message.getThreadId());
        dto.put("parentMessageId", message.getParentMessageId());
        return dto;
    }

    private List<Map<String, Object>> visibleRecipients(InternalMailMessage message, InternalMailbox current) {
        boolean sender = Objects.equals(message.getSenderMailbox().getId(), current.getId());
        return recipientRepository.findByMessage(message).stream()
                .filter(row -> sender || row.getRecipientType() != InternalMailRecipient.RecipientType.BCC
                        || Objects.equals(row.getRecipientMailbox().getId(), current.getId()))
                .map(row -> {
                    Map<String, Object> dto = mailboxDto(row.getRecipientMailbox());
                    dto.put("type", row.getRecipientType());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    private Map<String, Object> mailboxDto(InternalMailbox mailbox) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", mailbox.getId());
        dto.put("employeeId", mailbox.getEmployee().getId());
        dto.put("emailAddress", mailbox.getEmailAddress());
        dto.put("displayName", mailbox.getDisplayName());
        dto.put("role", mailbox.getEmployee().getUser().getRole());
        dto.put("department", mailbox.getEmployee().getDepartment() == null ? null : mailbox.getEmployee().getDepartment().getName());
        return dto;
    }

    private Map<String, Object> attachmentDto(InternalMailAttachment attachment) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", attachment.getId());
        dto.put("fileName", attachment.getFileName());
        dto.put("fileType", attachment.getFileType());
        dto.put("fileSize", attachment.getFileSize());
        dto.put("filePath", attachment.getFilePath());
        return dto;
    }

    public Employee currentEmployee() {
        String email = String.valueOf(SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return employeeRepository.findByUserId(user.getId()).orElseThrow(() -> new RuntimeException("Employee not found"));
    }

    private InternalMailbox currentMailbox() {
        return ensureMailbox(currentEmployee());
    }

    private String uniqueAddress(Employee employee) {
        String base = (employee.getFirstName() == null || employee.getFirstName().isBlank())
                ? employee.getEmployeeCode()
                : employee.getFirstName().toLowerCase(Locale.ROOT);
        base = base.replaceAll("[^a-z0-9]", "");
        if (base.isBlank()) {
            base = employee.getEmployeeCode().toLowerCase(Locale.ROOT);
        }
        String candidate = base + "@tanvox.local";
        if (mailboxRepository.findByEmailAddressIgnoreCase(candidate).isEmpty()) {
            return candidate;
        }
        return employee.getEmployeeCode().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "") + "@tanvox.local";
    }

    private String employeeName(Employee employee) {
        return employee.getFirstName() + " " + employee.getLastName();
    }

    private String preview(String body) {
        if (body == null) {
            return "";
        }
        String clean = body.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim();
        return clean.length() <= 120 ? clean : clean.substring(0, 120) + "...";
    }

    private String stringValue(Map<String, Object> map, String key, String fallback) {
        Object value = map.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private Long longValue(Object value) {
        return value instanceof Number number ? number.longValue() : Long.parseLong(String.valueOf(value));
    }

    private record RecipientTarget(InternalMailbox mailbox, InternalMailRecipient.RecipientType type) {
    }
}
