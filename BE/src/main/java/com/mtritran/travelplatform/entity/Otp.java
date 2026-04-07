package com.mtritran.travelplatform.entity;
 
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
 
import java.time.LocalDateTime;
 
@Entity
@Table(name = "otps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Otp {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
 
    @Column(nullable = false)
    String email;
 
    @Column(nullable = false)
    String code;
 
    @Column(nullable = false)
    LocalDateTime expiryTime;
 
    @CreationTimestamp
    LocalDateTime createdAt;
}
