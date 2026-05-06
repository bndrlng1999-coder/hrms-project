package com.nikhilhrms.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Connection;

//@Component
public class AttendanceSchemaMigration implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public AttendanceSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try (Connection connection = jdbcTemplate.getDataSource().getConnection()) {
            String database = connection.getMetaData().getDatabaseProductName();
            if (database.toLowerCase().contains("mysql")) {
                jdbcTemplate.execute("ALTER TABLE attendance MODIFY status VARCHAR(40) NOT NULL");
            } else if (database.toLowerCase().contains("postgres")) {
                jdbcTemplate.execute("ALTER TABLE attendance ALTER COLUMN status TYPE VARCHAR(40)");
            }
        } catch (Exception ignored) {
            // Hibernate handles fresh schemas; this keeps upgraded local databases compatible with new approval statuses.
        }
    }
}
