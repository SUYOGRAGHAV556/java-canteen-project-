package com.smartcanteen;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SmartCanteenApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartCanteenApplication.class, args);
        System.out.println("==================================================================");
        System.out.println("🚀 Smart Canteen Management System is ONLINE!");
        System.out.println("👉 Student Portal:        http://localhost:8080/");
        System.out.println("👉 Kitchen Display (KDS): http://localhost:8080/kds.html");
        System.out.println("👉 Owner Admin Dashboard: http://localhost:8080/admin.html");
        System.out.println("👉 H2 Database Console:   http://localhost:8080/h2-console");
        System.out.println("==================================================================");
    }
}
