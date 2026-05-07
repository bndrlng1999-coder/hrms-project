package com.nikhilhrms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TanvoxHrmsApplication {

    public static void main(String[] args) {
        SpringApplication.run(TanvoxHrmsApplication.class, args);
    }
}
