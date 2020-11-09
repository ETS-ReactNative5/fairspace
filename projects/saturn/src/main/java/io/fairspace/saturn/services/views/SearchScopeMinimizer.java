package io.fairspace.saturn.services.views;

import io.fairspace.saturn.vocabulary.FS;
import org.apache.jena.datatypes.xsd.XSDDateTime;
import org.apache.jena.rdf.model.Literal;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.Statement;
import org.apache.jena.vocabulary.RDF;

import java.util.List;
import java.util.function.Consumer;

class SearchScopeMinimizer {
    static void withConstrainedScope(Model model, List<SearchConstraint> constraints, Consumer<? super Resource> consumer) {
        model.listSubjectsWithProperty(RDF.type, FS.Workspace)
                .forEachRemaining(ws -> withConstrainedScope(ws, constraints, consumer));
    }

    private static void withConstrainedScope(Resource resource, List<SearchConstraint> constraints, Consumer<? super Resource> consumer) {
        if (resource.hasProperty(FS.dateDeleted)) {
            return;
        }
        var aggregate = resource.getPropertyResourceValue(FS.aggregatedMetadata);
        if (aggregate == null) {
            return;
        }

        if (constraints != null) {
            filters:
            for (var c : constraints) {
                if (c.values != null && !c.values.isEmpty()) {
                    for (var v : c.values) {
                        if ((v == null && !aggregate.hasProperty(c.property)) || aggregate.hasProperty(c.property, v)) {
                            continue filters; // matches current filter!
                        }
                    }
                } else if (c.min > Double.NEGATIVE_INFINITY || c.max < Double.POSITIVE_INFINITY) {
                    for (var it = aggregate.listProperties(c.property).mapWith(Statement::getLiteral).mapWith(Literal::getValue); it.hasNext(); ) {
                        var value = it.next();
                        double x = Double.NaN;
                        if (value instanceof Number) {
                            x = ((Number) value).doubleValue();
                        } else if (value instanceof XSDDateTime) {
                            x = ((XSDDateTime) value).asCalendar().getTimeInMillis();
                        }

                        if (c.min <= x && x <= c.max) {
                            continue filters; // matches current filter!
                        }
                    }
                }
                return; // no match :(
            }
        }

        consumer.accept(resource);  // Finer test

        // Test children
        resource.getModel().listSubjectsWithProperty(FS.belongsTo, resource)
                .forEachRemaining(child -> withConstrainedScope(child, constraints, consumer));
    }
}
