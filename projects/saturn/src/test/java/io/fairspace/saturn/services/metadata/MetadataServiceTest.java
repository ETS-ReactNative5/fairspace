package io.fairspace.saturn.services.metadata;

import io.fairspace.saturn.rdf.transactions.SimpleTransactions;
import io.fairspace.saturn.rdf.transactions.Transactions;
import io.fairspace.saturn.services.metadata.validation.ComposedValidator;
import io.fairspace.saturn.vocabulary.FS;
import org.apache.jena.query.Dataset;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.Property;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.Statement;
import org.apache.jena.sparql.core.Quad;
import org.apache.jena.vocabulary.RDF;
import org.apache.jena.vocabulary.RDFS;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

import static io.fairspace.saturn.TestUtils.isomorphic;
import static io.fairspace.saturn.TestUtils.setupRequestContext;
import static io.fairspace.saturn.rdf.ModelUtils.modelOf;
import static io.fairspace.saturn.services.metadata.MetadataService.NIL;
import static io.fairspace.saturn.vocabulary.Vocabularies.VOCABULARY;
import static org.apache.jena.query.DatasetFactory.createTxnMem;
import static org.apache.jena.rdf.model.ModelFactory.createDefaultModel;
import static org.apache.jena.rdf.model.ResourceFactory.*;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.verify;

@RunWith(MockitoJUnitRunner.class)
public class MetadataServiceTest {
    private static final Resource S1 = createResource("http://localhost/iri/S1");
    private static final Resource S2 = createResource("http://localhost/iri/S2");
    private static final Resource S3 = createResource("http://localhost/iri/S3");
    private static final Property P1 = createProperty("http://fairspace.io/ontology/P1");
    private static final Property P2 = createProperty("http://fairspace.io/ontology/P2");

    private static final Statement STMT1 = createStatement(S1, P1, S2);
    private static final Statement STMT2 = createStatement(S2, P1, S3);

    private Dataset ds = createTxnMem();

    private Transactions txn = new SimpleTransactions(ds);
    private MetadataService api;

    @Before
    public void setUp() {
        setupRequestContext();
        api = new MetadataService(txn, VOCABULARY, new ComposedValidator());
    }

    @Test
    public void testPutWillAddStatements() {
        var delta = modelOf(STMT1, STMT2);

        api.put(delta);

        Model result = api.get(null, false);
        assertTrue(result.contains(STMT1) && result.contains(STMT2));
    }

    @Test
    public void testPutHandlesLifecycleForEntities() {
        var delta = modelOf(STMT1);
        api.put(delta);
        assertTrue(ds.getDefaultModel().contains(STMT1.getSubject(), FS.createdBy));
        assertTrue(ds.getDefaultModel().contains(STMT1.getSubject(), FS.dateCreated));
        assertTrue(ds.getDefaultModel().contains(STMT1.getSubject(), FS.modifiedBy));
        assertTrue(ds.getDefaultModel().contains(STMT1.getSubject(), FS.dateModified));
    }


    @Test
    public void testPutWillNotRemoveExistingStatements() {
        // Prepopulate the model
        final Statement EXISTING1 = createStatement(S1, P1, S3);
        final Statement EXISTING2 = createStatement(S2, P2, createPlainLiteral("test"));
        txn.executeWrite(ds -> ds.getDefaultModel().add(EXISTING1).add(EXISTING2));

        // Put new statements
        var delta = modelOf(STMT1, STMT2);
        api.put(delta);

        // Now ensure that the existing triples are still there
        // and the new ones are added
        txn.executeRead(ds -> {
            Model model = ds.getDefaultModel();
            assertTrue(model.contains(EXISTING1));
            assertTrue(model.contains(EXISTING2));
            assertTrue(model.contains(STMT1));
            assertTrue(model.contains(STMT2));
        });
    }

    @Test
    public void deleteModel() {
        txn.executeWrite(ds -> ds.getDefaultModel().add(STMT1).add(STMT2));

        api.delete(modelOf(STMT1));

        txn.executeRead(ds -> {
            assertFalse(ds.getDefaultModel().contains(STMT1));
            assertTrue(ds.getDefaultModel().contains(STMT2));
        });
    }

    @Test
    public void patch() {
        txn.executeWrite(ds -> ds.getDefaultModel().add(STMT1).add(STMT2));

        Statement newStmt1 = createStatement(S1, P1, S3);
        Statement newStmt2 = createStatement(S2, P1, S1);
        Statement newStmt3 = createStatement(S1, P2, S3);

        api.patch(modelOf(newStmt1, newStmt2, newStmt3));

        txn.executeRead(ds -> {
            assertTrue(ds.getDefaultModel().contains(newStmt1));
            assertTrue(ds.getDefaultModel().contains(newStmt2));
            assertTrue(ds.getDefaultModel().contains(newStmt3));
            assertFalse(ds.getDefaultModel().contains(STMT1));
            assertFalse(ds.getDefaultModel().contains(STMT2));
        });
    }

    @Test
    public void patchWithNil() {
        txn.executeWrite(ds -> ds.getDefaultModel().add(S1, P1, S2).add(S1, P1, S3));

        api.patch(createDefaultModel().add(S1, P1, NIL));

        assertFalse(txn.calculateRead(ds -> ds.getDefaultModel().contains(S1, P1)));
    }

    @Test
    public void testPatchHandlesLifecycleForEntities() {
        var delta = modelOf(STMT1);
        api.patch(delta);
        assertTrue(ds.getDefaultModel().contains(STMT1.getSubject(), FS.modifiedBy));
        assertTrue(ds.getDefaultModel().contains(STMT1.getSubject(), FS.dateModified));
    }


}
