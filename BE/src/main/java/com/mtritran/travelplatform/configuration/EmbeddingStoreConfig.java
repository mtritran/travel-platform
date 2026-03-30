package com.mtritran.travelplatform.configuration;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.pgvector.PgVectorEmbeddingStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class EmbeddingStoreConfig {

    // Tái sử dụng luôn datasource của Spring, không cần khai báo riêng
    @Value("${spring.datasource.url}")
    private String jdbcUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Bean
    public EmbeddingStore<TextSegment> embeddingStore() {
        String stripped = jdbcUrl.replace("jdbc:postgresql://", "");
        String host     = stripped.split(":")[0];
        int    port     = Integer.parseInt(stripped.split(":")[1].split("/")[0]);
        String database = stripped.split("/")[1].split("\\?")[0];

        return PgVectorEmbeddingStore.builder()
                .host(host)
                .port(port)
                .database(database)
                .user(username)
                .password(password)
                .table("guide_embeddings")
                .dimension(3072)
                .createTable(true)
                .build();
    }
}