package io.fairspace.neptune.repository;

import io.fairspace.neptune.model.Permission;
import io.fairspace.neptune.model.Collection;
import org.springframework.data.repository.CrudRepository;

import java.util.List;
import java.util.Optional;

public interface PermissionRepository extends CrudRepository<Permission, Long> {
    List<Permission> findByCollectionId(Collection collection);

    List<Permission> findByUser(String user);

    Optional<Permission> findByUserAndCollectionId(String user, Collection collection);
}
