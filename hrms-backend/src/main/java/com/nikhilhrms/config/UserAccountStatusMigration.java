package com.nikhilhrms.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class UserAccountStatusMigration implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public UserAccountStatusMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        String database = "";
        try {
            database = jdbcTemplate.getDataSource().getConnection().getMetaData().getDatabaseProductName().toLowerCase();
        } catch (Exception ignored) {
            return;
        }

        try {
            if (database.contains("mysql")) {
                jdbcTemplate.execute("ALTER TABLE users MODIFY account_status ENUM('PENDING_VERIFICATION','ACTIVE','INACTIVE','DISABLED','LOCKED') NOT NULL");
            } else if (database.contains("postgresql")) {
                jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN account_status TYPE varchar(32)");
            }
        } catch (Exception ignored) {
            // The column may already support the enterprise statuses.
        }
    }
}
