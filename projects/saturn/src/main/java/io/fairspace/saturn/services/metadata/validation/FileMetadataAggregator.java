package io.fairspace.saturn.services.metadata.validation;

import io.fairspace.saturn.vocabulary.FS;
import org.apache.jena.query.ParameterizedSparqlString;
import org.apache.jena.query.QueryExecutionFactory;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.Property;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.vocabulary.RDF;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class FileMetadataAggregator extends VocabularyAwareValidator {
    private final String inheritableFileAttributesQuery;


    public FileMetadataAggregator(Model vocabulary, String inheritableFileAttributesQuery) {
        super(vocabulary);
        this.inheritableFileAttributesQuery = inheritableFileAttributesQuery;
    }

    @Override
    public void validate(Model before, Model after, Model removed, Model added, ViolationHandler violationHandler) {
        aggregateMetadata(added, after);
    }

    private void aggregateMetadata(Model added, Model after) {
        for (var file : getModifiedFiles(added, after)) {
            var props = aggregatedProperties(file);
            if (props.isEmpty()) {
                continue;
            }
            for (var f = file; f != null && !f.hasProperty(FS.dateDeleted); f = f.getPropertyResourceValue(FS.belongsTo)) {
                var aggregate = f.getPropertyResourceValue(FS.aggregatedMetadata);
                if (aggregate == null) {
                    aggregate = added.createResource();
                    f.addProperty(FS.aggregatedMetadata, aggregate);
                }
                for (var p : props.keySet()) {
                    added.add(aggregate, p, props.get(p));
                }
            }
        }
    }

    private List<Resource> getModifiedFiles(Model added, Model after) {
        return added.listSubjects()
                .mapWith(s -> s.inModel(after))
                .filterKeep(s -> {
                    var type = s.getPropertyResourceValue(RDF.type);
                    return FS.File.equals(type) || FS.Directory.equals(type) || FS.Collection.equals(type);
                }).toList();
    }

    private Map<Property, RDFNode> aggregatedProperties(Resource file) {
        var template = new ParameterizedSparqlString(inheritableFileAttributesQuery);
        template.setParam("s", file);
        var query = template.asQuery();
        var props = new HashMap<Property, RDFNode>();
        try (var ex = QueryExecutionFactory.create(query, file.getModel())) {
            ex.execSelect()
                    .forEachRemaining(row -> props.put(row.getResource("p").as(Property.class), row.get("o")));
        }
        return props;
    }
}
