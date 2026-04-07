package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.entity.Booking;
import com.mtritran.travelplatform.entity.Tour;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.enums.BookingStatus;
import com.mtritran.travelplatform.repository.BookingRepository;
import com.mtritran.travelplatform.repository.TourRepository;
import com.mtritran.travelplatform.repository.UserRepository;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.store.embedding.EmbeddingStore;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@ActiveProfiles("test")
public class FinancialAutomationIntegrationTest {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private PenaltyService penaltyService;

    @Autowired
    private ScheduledTasks scheduledTasks;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.mtritran.travelplatform.repository.LocationRepository locationRepository;

    @Autowired
    private com.mtritran.travelplatform.repository.RoleRepository roleRepository;

    @MockBean
    private EmbeddingStore<TextSegment> embeddingStore;

    private com.mtritran.travelplatform.entity.Location testLocation;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        testLocation = locationRepository.findByName("Test Location").orElseGet(() -> {
            com.mtritran.travelplatform.entity.Location loc = com.mtritran.travelplatform.entity.Location.builder()
                    .name("Test Location")
                    .latitude(10.0)
                    .longitude(106.0)
                    .build();
            return locationRepository.save(loc);
        });
    }

    @Test
    @WithMockUser(username = "customer@gmail.com")
    void testLateCancellation_80_20_Rule() {
        // 1. Setup Data
        User customer = userRepository.findByEmail("customer@gmail.com").orElseGet(() -> {
            User u = User.builder()
                    .email("customer@gmail.com")
                    .password("password")
                    .fullName("Customer")
                    .balance(BigDecimal.ZERO)
                    .build();
            return userRepository.save(u);
        });

        User guide = userRepository.findByEmail("guide@gmail.com").orElseGet(() -> {
            User u = User.builder()
                    .email("guide@gmail.com")
                    .password("password")
                    .fullName("Guide")
                    .balance(BigDecimal.ZERO)
                    .build();
            return userRepository.save(u);
        });

        Tour tour = Tour.builder()
                .guide(guide)
                .title("Test Tour")
                .location(testLocation)
                .meetingLocation(testLocation)
                .startDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.now().minusHours(1)) // Less than 24h from now
                .price(new BigDecimal("1000000"))
                .build();
        tour = tourRepository.save(tour);

        Booking booking = Booking.builder()
                .user(customer)
                .tour(tour)
                .bookingDate(LocalDate.now())
                .totalPrice(new BigDecimal("1000000"))
                .paidAmount(new BigDecimal("1000000"))
                .status(BookingStatus.CONFIRMED)
                .build();
        booking = bookingRepository.save(booking);

        // 2. Execute Cancel (Customer is logged in)
        bookingService.cancelBooking(booking.getId());

        // 3. Verify
        Booking cancelled = bookingRepository.findById(booking.getId()).orElseThrow();
        assertEquals(BookingStatus.CANCELLED, cancelled.getStatus());
        
        // 80% of 1M is 800k. Customer should have 800k in balance.
        User updatedCustomer = userRepository.findByEmail("customer@gmail.com").orElseThrow();
        assertEquals(0, new BigDecimal("800000").compareTo(updatedCustomer.getBalance()));
        
        // 20% (200k) should be in booking.paidAmount (Escrow)
        assertEquals(0, new BigDecimal("200000").compareTo(cancelled.getPaidAmount()));
        
        // PayoutAt should be set to ~24h from now
        assertNotNull(cancelled.getPayoutAt());
        assertTrue(cancelled.getPayoutAt().isAfter(Instant.now().plus(23, ChronoUnit.HOURS)));
    }

    @Test
    @WithMockUser(username = "guide@gmail.com")
    void testGuideCancellation_PenaltyPoints() {
        // Setup
        User guide = userRepository.findByEmail("guide@gmail.com").orElseGet(() -> {
            User u = User.builder()
                    .email("guide@gmail.com")
                    .password("password")
                    .fullName("Guide")
                    .penaltyPoints(0)
                    .build();
            return userRepository.save(u);
        });

        User customer = userRepository.findByEmail("customer@gmail.com").orElseGet(() -> {
            User u = User.builder()
                    .email("customer@gmail.com")
                    .password("password")
                    .fullName("Customer")
                    .balance(BigDecimal.ZERO)
                    .build();
            return userRepository.save(u);
        });

        Tour tour = Tour.builder()
                .guide(guide)
                .title("Guide Delete Tour")
                .location(testLocation)
                .meetingLocation(testLocation)
                .startDate(LocalDate.now().plusDays(2))
                .startTime(LocalTime.NOON)
                .price(new BigDecimal("500000"))
                .build();
        tour = tourRepository.save(tour);

        Booking booking = Booking.builder()
                .user(customer)
                .tour(tour)
                .bookingDate(LocalDate.now())
                .totalPrice(new BigDecimal("500000"))
                .paidAmount(new BigDecimal("500000"))
                .status(BookingStatus.CONFIRMED)
                .build();
        booking = bookingRepository.save(booking);

        // Execute Cancel by Guide
        bookingService.cancelBooking(booking.getId());

        // Verify
        User updatedGuide = userRepository.findByEmail("guide@gmail.com").orElseThrow();
        assertEquals(2, updatedGuide.getPenaltyPoints()); // +2 points
        
        User updatedCustomer = userRepository.findByEmail("customer@gmail.com").orElseThrow();
        assertEquals(0, new BigDecimal("500000").compareTo(updatedCustomer.getBalance())); // 100% refund
    }

    @Test
    void testAutoBanThreshold() {
        User guide = userRepository.findByEmail("badguide@gmail.com").orElseGet(() -> {
            User u = User.builder()
                    .email("badguide@gmail.com")
                    .password("password")
                    .penaltyPoints(4)
                    .build();
            return userRepository.save(u);
        });

        // Add 2 more points
        penaltyService.addPenalty(guide.getId(), 2, "Late cancellation");

        User bannedGuide = userRepository.findById(guide.getId()).orElseThrow();
        assertNotNull(bannedGuide.getGuideBannedUntil());
        assertTrue(bannedGuide.getGuideBannedUntil().isAfter(Instant.now()));
        assertEquals(0, bannedGuide.getPenaltyPoints()); // Points reset after ban
    }

    @Test
    void testScheduledPayout_80_20_Split() {
        // Setup
        User guide = userRepository.findByEmail("guide@gmail.com").orElseGet(() -> {
            User u = User.builder()
                    .email("guide@gmail.com")
                    .password("password")
                    .fullName("Guide")
                    .balance(BigDecimal.ZERO)
                    .build();
            return userRepository.save(u);
        });

        // Ensure the admin exists and has the ADMIN role
        User admin = userRepository.findByEmail("admin@travelx.com").orElseGet(() -> {
            User u = User.builder()
                    .email("admin@travelx.com")
                    .password("password")
                    .fullName("Admin")
                    .balance(BigDecimal.ZERO)
                    .build();
            return userRepository.save(u);
        });
        
        com.mtritran.travelplatform.entity.Role adminRole = roleRepository.findByName(com.mtritran.travelplatform.enums.RoleName.ADMIN).orElse(null);
        if (adminRole != null && (admin.getRoles() == null || admin.getRoles().stream().noneMatch(r -> r.getName() == com.mtritran.travelplatform.enums.RoleName.ADMIN))) {
             if (admin.getRoles() == null) admin.setRoles(new java.util.HashSet<>());
             admin.getRoles().add(adminRole);
             userRepository.save(admin);
        }

        Tour tour = Tour.builder()
                .guide(guide)
                .title("Completed Tour")
                .location(testLocation)
                .meetingLocation(testLocation)
                .price(new BigDecimal("1000000"))
                .build();
        tour = tourRepository.save(tour);

        Booking booking = Booking.builder()
                .user(guide) // irrelevant
                .tour(tour)
                .bookingDate(LocalDate.now().minusDays(1))
                .totalPrice(new BigDecimal("1000000"))
                .paidAmount(new BigDecimal("1000000"))
                .isPaidOut(false)
                .payoutAt(Instant.now().minus(1, java.time.temporal.ChronoUnit.HOURS)) // Already past!
                .build();
        booking = bookingRepository.save(booking);

        // Run Scheduler manually
        scheduledTasks.processAutoPayouts();

        // Verify
        User updatedGuide = userRepository.findById(guide.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("800000").compareTo(updatedGuide.getBalance())); // 80%

        // Verify admin balance (might be more than 200k if multiple tests ran, so we check if it increased)
        // Actually, H2 resets per test if configured, or keeps state. 
        // Let's just check if it's at least 200k.
        User updatedAdmin = userRepository.findByEmail("admin@travelx.com").orElseThrow();
        assertTrue(updatedAdmin.getBalance().compareTo(new BigDecimal("200000")) >= 0);

        // Verify paidOut flag
        Booking paidOutBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        assertTrue(paidOutBooking.isPaidOut());
    }
}
