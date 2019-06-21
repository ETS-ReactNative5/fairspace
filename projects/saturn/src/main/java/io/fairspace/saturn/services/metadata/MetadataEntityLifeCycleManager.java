package io.fairspace.saturn.services.metadata;

import io.fairspace.saturn.services.permissions.PermissionsService;
import lombok.AllArgsConstructor;
import org.apache.jena.graph.Node;
import org.apache.jena.rdf.model.Literal;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdfconnection.RDFConnection;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import static io.fairspace.saturn.rdf.SparqlUtils.storedQuery;
import static io.fairspace.saturn.rdf.SparqlUtils.toXSDDateTimeLiteral;
import static io.fairspace.saturn.vocabulary.FS.createdBy;
import static io.fairspace.saturn.vocabulary.FS.dateCreated;

@AllArgsConstructor
public
class MetadataEntityLifeCycleManager {
    private final RDFConnection rdf;
    private final Node graph;
    private final Supplier<Node> userIriSupplier;
    private final PermissionsService permissionsService;

    /**
     * Instantiates a lifecycle manager without a reference for the permissions
     * @param rdf
     * @param graph
     * @param userIriSupplier
     */
    public MetadataEntityLifeCycleManager(RDFConnection rdf, Node graph, Supplier<Node> userIriSupplier) {
        this(rdf, graph, userIriSupplier, null);
    }

    /**
     * Stores statements regarding the lifecycle of the entities in this model
     * <p>
     * The lifecycle statements consist of:
     * - a triple for the creator of an entity (see {@value io.fairspace.saturn.vocabulary.FS#CREATED_BY_URI})
     * - a triple for the date this entity was created (see {@value io.fairspace.saturn.vocabulary.FS#DATE_CREATED_URI})
     * <p>
     * In addition, the current user will get manage permissions on this entity as well, through the {@link PermissionsService}
     * <p>
     * Please note that this method will check the database for existence of the entities. For that reason, this method must be called
     * before actually inserting new triples.
     *
     * @param model
     */
    void updateLifecycleMetadata(Model model) {
        if (model == null || model.isEmpty()) {
            return;
        }

        // Determine whether the model to add contains new entities
        // for which new information should be stored
        var newEntities = determineNewEntities(model);

        // If there are new entities, updateLifecycleMetadata creation information for them
        // as well as permissions
        if (!newEntities.isEmpty()) {
            rdf.load(graph.getURI(), generateCreationInformation(newEntities));

            if(permissionsService != null) {
                permissionsService.createResources(newEntities);
            }
        }
    }

    /**
     * Generates a model with creation information for the list of entities given
     *
     * @param entities
     * @return
     */
    private Model generateCreationInformation(Set<Resource> entities) {
        Model model = ModelFactory.createDefaultModel();
        Resource user = model.createResource(userIriSupplier.get().getURI());
        Literal now = toXSDDateTimeLiteral(Instant.now());

        entities.forEach(resource -> model.add(resource, createdBy, user).add(resource, dateCreated, now));

        return model;
    }

    /**
     * Returns a list of all entities in the model that are not known in the graph yet
     *
     * @return
     */
    private Set<Resource> determineNewEntities(Model model) {
        Set<Resource> allUris = getAllUriResources(model);

        // Filter the list of Uris that we already know
        // in the current graph
        return allUris.stream()
                .filter(uri -> !exists(uri))
                .collect(Collectors.toSet());
    }

    /**
     * Verifies whether a certain entity exists in the database
     * <p>
     * An entity exists if there is any triples with the given URI as subject
     *
     * @param resource
     * @return
     */
    private boolean exists(Resource resource) {
        return rdf.queryAsk(storedQuery("exists", graph, resource, null, null));
    }

    /**
     * Returns a set of all URIs that are used in the model
     *
     * @param model
     * @return
     */
    private static Set<Resource> getAllUriResources(Model model) {
        Set<Resource> modelUris = new HashSet<>();

        model.listStatements().forEachRemaining(statement -> {
            if (statement.getSubject().isURIResource()) {
                modelUris.add(statement.getSubject());
            }
            if (statement.getObject().isURIResource()) {
                modelUris.add(statement.getResource());
            }
        });

        return modelUris;
    }
}