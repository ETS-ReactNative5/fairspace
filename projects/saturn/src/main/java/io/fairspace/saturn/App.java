package io.fairspace.saturn;

import io.fairspace.saturn.auth.DummyAuthenticator;
import io.fairspace.saturn.rdf.SaturnDatasetFactory;
import io.fairspace.saturn.rdf.Vocabulary;
import io.fairspace.saturn.rdf.dao.DAO;
import io.fairspace.saturn.services.collections.CollectionsApp;
import io.fairspace.saturn.services.collections.CollectionsService;
import io.fairspace.saturn.services.health.HealthApp;
import io.fairspace.saturn.services.metadata.MetadataApp;
import io.fairspace.saturn.services.users.UserService;
import io.fairspace.saturn.vfs.SafeFileSystem;
import io.fairspace.saturn.vfs.managed.LocalBlobStore;
import io.fairspace.saturn.vfs.managed.ManagedFileSystem;
import io.fairspace.saturn.webdav.MiltonWebDAVServlet;
import lombok.extern.slf4j.Slf4j;
import org.apache.jena.fuseki.main.FusekiServer;
import org.apache.jena.rdfconnection.RDFConnectionLocal;

import java.io.File;
import java.util.function.Supplier;

import static io.fairspace.saturn.ConfigLoader.CONFIG;
import static io.fairspace.saturn.auth.SecurityUtil.createAuthenticator;
import static io.fairspace.saturn.auth.SecurityUtil.userInfo;
import static org.apache.jena.graph.NodeFactory.createURI;
import static org.apache.jena.sparql.core.Quad.defaultGraphIRI;

@Slf4j
public class App {
    public static void main(String[] args) {
        log.info("Saturn is starting");

        var vocabularyGraphNode = createURI(CONFIG.jena.baseIRI + "vocabulary");
        var metaVocabularyGraphNode = createURI(CONFIG.jena.baseIRI + "metavocabulary");

        var ds = SaturnDatasetFactory.connect(CONFIG.jena, vocabularyGraphNode);

        // The RDF connection is supposed to be thread-safe and can
        // be reused in all the application
        var rdf = new RDFConnectionLocal(ds);

        var userService = new UserService(new DAO(rdf, null));
        Supplier<String> userIriSupplier = () -> userService.getUserIRI(userInfo());
        var collections = new CollectionsService(new DAO(rdf, userIriSupplier));
        var fs = new SafeFileSystem(new ManagedFileSystem(rdf, new LocalBlobStore(new File(CONFIG.webDAV.blobStorePath)), userIriSupplier, collections));

        // Setup and initialize vocabularies
        Vocabulary vocabulary = new Vocabulary(rdf, vocabularyGraphNode);
        vocabulary.initializeDefault("vocabulary.jsonld");

        Vocabulary metaVocabulary = new Vocabulary(rdf, metaVocabularyGraphNode);
        vocabulary.initializeDefault("metavocabulary.jsonld");

        var fusekiServerBuilder = FusekiServer.create()
                .add("rdf", ds)
                .addFilter("/api/*", new SaturnSparkFilter(
                        new MetadataApp("/api/metadata", rdf, defaultGraphIRI, vocabulary),
                        new MetadataApp("/api/vocabulary", rdf, vocabularyGraphNode, metaVocabulary),
                        new CollectionsApp(collections),
                        new HealthApp()))
                .addServlet("/webdav/*", new MiltonWebDAVServlet("/webdav/", fs))
                .port(CONFIG.port);

        var auth = CONFIG.auth;
        if (!auth.enabled) {
            log.warn("Authentication is disabled");
        }
        var authenticator = auth.enabled ? createAuthenticator(auth.jwksUrl, auth.jwtAlgorithm) : new DummyAuthenticator();
        fusekiServerBuilder.securityHandler(new SaturnSecurityHandler(authenticator, userService::getUserIRI));

        fusekiServerBuilder
                .build()
                .start();

        log.info("Saturn is running on port " + CONFIG.port);
        log.info("Access Fuseki at /rdf/");
        log.info("Access Metadata at /api/metadata/");
        log.info("Access Vocabulary API at /api/vocabulary/");
        log.info("Access Collections API at /api/collections/");
        log.info("Access WebDAV API at /webdav/");
    }
}
