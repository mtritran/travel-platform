package com.mtritran.travelplatform.service.ai;

import com.mtritran.travelplatform.entity.Review;
import com.mtritran.travelplatform.entity.Tour;
import com.mtritran.travelplatform.enums.TourStatus;
import com.mtritran.travelplatform.repository.ReviewRepository;
import com.mtritran.travelplatform.repository.TourRepository;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Slf4j
public class TourEmbeddingService {

    private final TourRepository tourRepository;
    private final ReviewRepository reviewRepository;
    private final EmbeddingModel embeddingModel;
    private final EmbeddingStore<TextSegment> tourEmbeddingStore;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    // Dùng constructor injection thủ công để chỉ định đúng @Qualifier
    public TourEmbeddingService(
            TourRepository tourRepository,
            ReviewRepository reviewRepository,
            EmbeddingModel embeddingModel,
            @Qualifier("tourEmbeddingStore") EmbeddingStore<TextSegment> tourEmbeddingStore) {
        this.tourRepository = tourRepository;
        this.reviewRepository = reviewRepository;
        this.embeddingModel = embeddingModel;
        this.tourEmbeddingStore = tourEmbeddingStore;
    }

    /**
     * Chuyển thông tin Tour thành văn bản mô tả để embedding.
     * Bao gồm cả đánh giá để tăng ngữ nghĩa.
     */
    private String buildTourText(Tour tour) {
        StringBuilder sb = new StringBuilder();
        sb.append("Tour: ").append(tour.getTitle()).append("\n");
        sb.append("Địa điểm: ").append(
                tour.getLocation() != null ? tour.getLocation().getName() : "Chưa rõ").append("\n");
        sb.append("Hướng dẫn viên: ").append(
                tour.getGuide() != null ? tour.getGuide().getFullName() : "Chưa rõ").append("\n");

        if (tour.getGuide() != null) {
            if (tour.getGuide().getLanguages() != null)
                sb.append("Ngôn ngữ HDV: ").append(tour.getGuide().getLanguages()).append("\n");
            if (tour.getGuide().getSpecialties() != null)
                sb.append("Sở trường HDV: ").append(tour.getGuide().getSpecialties()).append("\n");
        }

        sb.append("Giá: ").append(
                tour.getPrice() != null ? String.format("%,.0f VNĐ/người", tour.getPrice().doubleValue()) : "Liên hệ")
                .append("\n");

        if (tour.getStartDate() != null)
            sb.append("Ngày: ").append(tour.getStartDate().format(DATE_FMT)).append("\n");
        if (tour.getStartTime() != null && tour.getEndTime() != null)
            sb.append("Giờ: ").append(tour.getStartTime().format(TIME_FMT))
                    .append(" - ").append(tour.getEndTime().format(TIME_FMT)).append("\n");

        sb.append("Số khách tối đa: ").append(
                tour.getMaxGuests() != null ? tour.getMaxGuests() : 1).append("\n");

        if (tour.getDescription() != null && !tour.getDescription().isBlank())
            sb.append("Mô tả: ").append(tour.getDescription()).append("\n");

        // Thêm reviews để LLM hiểu được chất lượng thực tế
        List<Review> reviews = reviewRepository.findAllByTour(tour);
        if (!reviews.isEmpty()) {
            double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0);
            sb.append("Đánh giá trung bình: ").append(String.format("%.1f sao (%d đánh giá)", avg, reviews.size()))
                    .append("\n");
            sb.append("Nhận xét từ khách:\n");
            reviews.stream().limit(5).forEach(
                    r -> sb.append("- ").append(r.getRating()).append(" sao: ").append(r.getComment()).append("\n"));
        }

        return sb.toString();
    }

    /**
     * Index một tour vào Vector DB.
     * Gọi khi tour được tạo mới hoặc cập nhật.
     */
    public void indexTour(Tour tour) {
        String text = buildTourText(tour);
        TextSegment segment = TextSegment.from(text, Metadata.from("tourId", tour.getId()));
        Embedding embedding = embeddingModel.embed(segment).content();
        tourEmbeddingStore.add(embedding, segment);
        log.info("[TourRAG] Indexed tour: '{}'", tour.getTitle());
    }

    /**
     * Đồng bộ toàn bộ ACTIVE tours vào Vector DB.
     * Chạy lúc startup và mỗi đêm lúc 3h sáng.
     */
    @Async
    @Scheduled(cron = "0 0 3 * * ?") // TODO: Đổi lại thành cron = "0 0 3 * * ?" trước khi production
    public void indexAllActiveTours() {
        log.info("[TourRAG] Starting full tour index sync...");
        List<Tour> activeTours = tourRepository.findAllByStatus(TourStatus.ACTIVE);
        for (Tour tour : activeTours) {
            try {
                indexTour(tour);
            } catch (Exception e) {
                log.warn("[TourRAG] Failed to index tour '{}': {}", tour.getTitle(), e.getMessage());
            }
        }
        log.info("[TourRAG] Indexed {} active tours.", activeTours.size());
    }

    /**
     * Trả về EmbeddingStore để TourChatService dùng cho similarity search.
     */
    public EmbeddingStore<TextSegment> getStore() {
        return tourEmbeddingStore;
    }
}
