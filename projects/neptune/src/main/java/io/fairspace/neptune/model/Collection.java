package io.fairspace.neptune.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.ser.ZonedDateTimeSerializer;
import lombok.*;

import javax.persistence.*;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;

@Getter
@EqualsAndHashCode
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class Collection {
    public enum CollectionType {
        LOCAL_FILE,
        AZURE_BLOB_STORAGE,
        S3_BUCKET,
        GOOGLE_CLOUD_BUCKET
    }

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Builder.Default
    private CollectionType type = CollectionType.LOCAL_FILE;

    private String location;

    @Column(nullable = false)
    private String name;

    @Column(length = 10000)
    private String description;

    @Transient
    private String uri;

    @Transient
    private Access access;

    // Do not create get method, because we need to customize it.
    @Getter(AccessLevel.NONE)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    ZonedDateTime dateCreated;

    public ZonedDateTime getDateCreated() {
        return dateCreated == null ? null : dateCreated.withZoneSameInstant(ZoneOffset.UTC);
    }

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    String creator;
}