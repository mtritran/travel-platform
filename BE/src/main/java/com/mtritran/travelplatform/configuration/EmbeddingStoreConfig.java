package com.mtritran.travelplatform.configuration;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.pgvector.PgVectorEmbeddingStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class EmbeddingStoreConfig {

    @Value("${spring.datasource.url}")
    private String jdbcUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    private PgVectorEmbeddingStore buildStore(String table, int dimension) {
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
                .table(table)
                .dimension(dimension)
                .createTable(true)
                .build();
    }

    @Primary
    @Bean("guideEmbeddingStore")
    public EmbeddingStore<TextSegment> embeddingStore() {
        return buildStore("guide_embeddings", 3072);
    }

    @Bean("tourEmbeddingStore")
    public EmbeddingStore<TextSegment> tourEmbeddingStore() {
        return buildStore("tour_embeddings", 3072);
    }

    @Bean("policyEmbeddingStore")
    public EmbeddingStore<TextSegment> policyEmbeddingStore() {
        return buildStore("policy_embeddings", 3072);
    }
}