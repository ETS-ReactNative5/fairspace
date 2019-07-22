//package io.fairspace.saturn.services.metadata.validation;
//
//import io.fairspace.saturn.vocabulary.FS;
//import org.apache.jena.query.Dataset;
//import org.apache.jena.query.DatasetFactory;
//import org.apache.jena.rdf.model.Property;
//import org.apache.jena.rdf.model.Resource;
//import org.apache.jena.rdfconnection.Isolation;
//import org.apache.jena.rdfconnection.RDFConnection;
//import org.apache.jena.rdfconnection.RDFConnectionLocal;
//import org.junit.Test;
//import org.junit.runner.RunWith;
//import org.mockito.Mock;
//import org.mockito.junit.MockitoJUnitRunner;
//import org.topbraid.shacl.vocabulary.SH;
//
//import static io.fairspace.saturn.vocabulary.Vocabularies.VOCABULARY_GRAPH_URI;
//import static org.apache.jena.rdf.model.ModelFactory.createDefaultModel;
//import static org.apache.jena.rdf.model.ResourceFactory.*;
//import static org.mockito.Mockito.*;
//
//@RunWith(MockitoJUnitRunner.class)
//public class InverseForUsedPropertiesValidatorTest {
//    private static final Resource SHAPE1 = createResource("http://ex.com/shape1");
//    private static final Resource SHAPE2 = createResource("http://ex.com/shape2");
//    private static final Property PROPERTY1 = createProperty("http://ex.com/property1");
//    private static final Property PROPERTY2 = createProperty("http://ex.com/property2");
//    private static final Resource ENTITY1 = createResource("http://ex.com/entity1");
//    private static final Resource ENTITY2 = createResource("http://ex.com/entity2");
//
//    private Dataset ds = DatasetFactory.create();
//    private RDFConnection rdf = new RDFConnectionLocal(ds, Isolation.COPY);
//    private final InverseForUsedPropertiesValidator validator = new InverseForUsedPropertiesValidator(rdf);
//
//    @Mock
//    private ViolationHandler violationHandler;
//
//
//    @Test
//    public void settingAnInverseForAnUnusedPropertyIsAllowed() {
//        validator.validate(,
//                , createDefaultModel(), createDefaultModel()
//                        .add(SHAPE1, SH.path, PROPERTY1)
//                        .add(SHAPE2, SH.path, PROPERTY2)
//                        .add(SHAPE1, FS.inverseRelation, SHAPE2)
//                        .add(SHAPE2, FS.inverseRelation, SHAPE1),
//                , violationHandler, );
//
//        verifyZeroInteractions(violationHandler);
//    }
//
//    @Test
//    public void settingAnInverseForAnUsedPropertyIsNotAllowed() {
//        ds.getDefaultModel()
//                .add(ENTITY1, PROPERTY1, ENTITY2)
//                .add(ENTITY2, PROPERTY2, ENTITY1);
//
//        validator.validate(,
//                , createDefaultModel(), createDefaultModel()
//                        .add(SHAPE1, SH.path, PROPERTY1)
//                        .add(SHAPE2, SH.path, PROPERTY2)
//                        .add(SHAPE1, FS.inverseRelation, SHAPE2)
//                        .add(SHAPE2, FS.inverseRelation, SHAPE1),
//                , violationHandler, );
//
//        verify(violationHandler).onViolation("Cannot set fs:inverseRelation for a property that has been used already", createStatement(SHAPE1, FS.inverseRelation, SHAPE2));
//        verify(violationHandler).onViolation("Cannot set fs:inverseRelation for a property that has been used already", createStatement(SHAPE2, FS.inverseRelation, SHAPE1));
//        verifyNoMoreInteractions(violationHandler);
//    }
//
//    @Test
//    public void unsettingAnInverseIsAlwaysAllowed() {
//        ds.getNamedModel(VOCABULARY_GRAPH_URI.getURI())
//                .add(SHAPE1, SH.path, PROPERTY1)
//                .add(SHAPE2, SH.path, PROPERTY2)
//                .add(SHAPE1, FS.inverseRelation, SHAPE2)
//                .add(SHAPE2, FS.inverseRelation, SHAPE1);
//
//        ds.getDefaultModel()
//                .add(ENTITY1, PROPERTY1, ENTITY2)
//                .add(ENTITY2, PROPERTY2, ENTITY1);
//
//
//        validator.validate(,
//                , createDefaultModel()
//                                .add(SHAPE1, FS.inverseRelation, SHAPE2)
//                                .add(SHAPE2, FS.inverseRelation, SHAPE1), createDefaultModel(),
//                , violationHandler, );
//
//        verifyZeroInteractions(violationHandler);
//    }
//}