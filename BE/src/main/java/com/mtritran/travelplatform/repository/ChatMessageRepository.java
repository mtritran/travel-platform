package com.mtritran.travelplatform.repository;

import com.mtritran.travelplatform.entity.ChatMessage;
import com.mtritran.travelplatform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {
    List<ChatMessage> findAllByUserAndIsBotTrueOrderByCreatedAtAsc(User user);
    
    @Query("SELECT m FROM ChatMessage m WHERE " +
           "((m.user = :u1 AND m.recipient = :u2) OR (m.user = :u2 AND m.recipient = :u1)) " +
           "AND m.isBot = false ORDER BY m.createdAt ASC")
    List<ChatMessage> findP2PHistory(@Param("u1") User u1, @Param("u2") User u2);

    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.user.id = :userId OR m.recipient.id = :userId) " +
           "AND m.isBot = false " +
           "AND m.createdAt IN (" +
           "  SELECT MAX(m2.createdAt) FROM ChatMessage m2 " +
           "  WHERE (m2.user.id = :userId OR m2.recipient.id = :userId) AND m2.isBot = false " +
           "  GROUP BY CASE WHEN m2.user.id = :userId THEN m2.recipient.id ELSE m2.user.id END" +
           ") " +
           "ORDER BY m.createdAt DESC")
    List<ChatMessage> findRecentConversations(@Param("userId") String userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ChatMessage m WHERE " +
           "((m.user.id = :userId AND m.recipient.id = :partnerId) OR " +
           " (m.user.id = :partnerId AND m.recipient.id = :userId)) " +
           "AND m.isBot = false")
    void deleteConversationBetween(@Param("userId") String userId, @Param("partnerId") String partnerId);

    void deleteAllByUser(User user);
}
