package io.fairspace.saturn.services.metadata.validation;

import io.fairspace.saturn.services.AccessDeniedException;
import io.fairspace.saturn.services.permissions.Access;
import io.fairspace.saturn.services.permissions.MetadataAccessDeniedException;
import io.fairspace.saturn.services.permissions.PermissionsService;
import org.apache.jena.graph.Node;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.Statement;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

import java.util.Collections;
import java.util.Set;

import static org.apache.jena.graph.NodeFactory.createURI;
import static org.apache.jena.rdf.model.ModelFactory.createDefaultModel;
import static org.apache.jena.rdf.model.ResourceFactory.createProperty;
import static org.apache.jena.rdf.model.ResourceFactory.createResource;
import static org.apache.jena.rdf.model.ResourceFactory.createStatement;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.verifyZeroInteractions;

@RunWith(MockitoJUnitRunner.class)
public class PermissionCheckingValidatorTest {
    private static final Model EMPTY = createDefaultModel();

    private static final Statement STATEMENT = createStatement(
            createResource("http://ex.com/subject"),
            createProperty("http://ex.com/predicate"), // does not have an inverse
            createResource("http://ex.com/object"));


    @Mock
    private PermissionsService permissions;

    @Mock
    private ViolationHandler violationHandler;


    private PermissionCheckingValidator validator;

    private Model model = createDefaultModel();

    @Before
    public void setUp() {
        validator = new PermissionCheckingValidator(permissions);
    }

    @Test
    public void noChecksShouldBePerformedOnAnEmptyModel() {
        validator.validate(EMPTY, EMPTY, violationHandler);

        verify(permissions).ensureAccess(Collections.emptySet(), Access.Write);
        verifyZeroInteractions(violationHandler);
    }

    @Test
    public void noWritePermissionCausesAFailure() {
        model.add(STATEMENT);
        Set<Node> nodes = Set.of(STATEMENT.getSubject().asNode());

        doThrow(new MetadataAccessDeniedException("", STATEMENT.getSubject().asNode())).when(permissions).ensureAccess(nodes, Access.Write);
        validator.validate(EMPTY, model, violationHandler);
        verify(violationHandler).onViolation("Cannot modify read-only resource", STATEMENT.getSubject(), null, null);
    }

    @Test
    public void itShouldCheckPermissionsForSubject() {
        model.add(STATEMENT);
        Set<Node> nodes = Set.of(STATEMENT.getSubject().asNode());

        validator.validate(EMPTY, model, violationHandler);

        verifyZeroInteractions(violationHandler);
        verify(permissions).ensureAccess(nodes, Access.Write);

        verifyNoMoreInteractions(permissions);
    }
}