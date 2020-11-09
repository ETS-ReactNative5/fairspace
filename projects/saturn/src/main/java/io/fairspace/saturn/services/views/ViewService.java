package io.fairspace.saturn.services.views;

import io.fairspace.saturn.config.Config;
import lombok.extern.slf4j.Slf4j;
import org.apache.jena.datatypes.xsd.XSDDateTime;
import org.apache.jena.graph.NodeFactory;
import org.apache.jena.query.Dataset;
import org.apache.jena.query.ParameterizedSparqlString;
import org.apache.jena.query.QueryExecutionFactory;
import org.apache.jena.query.QueryFactory;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.jena.sparql.expr.*;
import org.apache.jena.sparql.syntax.ElementFilter;
import org.apache.jena.sparql.syntax.ElementGroup;
import org.apache.jena.system.Txn;
import org.apache.jena.vocabulary.RDFS;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;

import static io.fairspace.saturn.rdf.ModelUtils.getStringProperty;
import static io.fairspace.saturn.services.views.SearchScopeMinimizer.withConstrainedScope;
import static java.lang.System.currentTimeMillis;
import static java.time.Instant.ofEpochMilli;
import static java.util.stream.Collectors.toList;
import static java.util.stream.Collectors.toSet;
import static org.apache.jena.datatypes.xsd.XSDDatatype.XSDdate;
import static org.apache.jena.rdf.model.ResourceFactory.*;
import static org.apache.jena.sparql.expr.NodeValue.*;

@Slf4j
public class ViewService {
    private static final long QUERY_EXECUTION_TIMEOUT = 60;
    private static final int MAX_RESULTS = 100_000;

    private static final RuntimeException TIMEOUT = new RuntimeException();
    private static final RuntimeException TOO_MANY_RESULTS = new RuntimeException();

    private final Dataset ds;

    private final Config.Search config;

    public ViewService(Config.Search config, Dataset ds) {
        this.config = config;
        this.ds = ds;
    }

    public ViewPage retrieveViewPage(ViewRequest request) {
        var result = ViewPage.builder();
        var resources = new HashSet<>();
        var view = config.views
                .stream()
                .filter(v -> v.name.equals(request.view))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown view: " + request.view));
        var page = (request.page != null && request.page >= 1) ? request.page : 1;
        var size = (request.size != null && request.size >= 1) ? request.size : 20;
        var skip = (page - 1) * size;

        var query = QueryFactory.create(view.query);

        if (!(query.getQueryPattern() instanceof ElementGroup)) {
            var group = new ElementGroup();
            group.addElement(query.getQueryPattern());
            query.setQueryPattern(group);
        }

        var queryPatternGroup = (ElementGroup) query.getQueryPattern();

        var constraints = new ArrayList<SearchConstraint>();

        request.filters.forEach(filter -> {
            var facet = config.facets
                    .stream()
                    .filter(f -> f.name.equals(filter.field))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Unknown facet: " + filter.field));

            constraints.add(new SearchConstraint(createProperty(facet.property), filter.values.stream().map(v -> toRdfNode(v, facet.type)).collect(toSet()),
                    toBound(filter.rangeStart, Double.NEGATIVE_INFINITY),
                    toBound(filter.rangeEnd, Double.POSITIVE_INFINITY)));

            var variable = new ExprVar(filter.field);
            if (!filter.values.isEmpty()) {
                if (filter.getValues().size() == 1) {
                    queryPatternGroup.addElementFilter(new ElementFilter(new E_Equals(variable, toNodeValue(filter.values.get(0), facet.type))));
                } else {
                    queryPatternGroup.addElementFilter(new ElementFilter(new E_OneOf(variable, new ExprList(filter.values.stream().map(o -> toNodeValue(o, facet.type)).collect(toList())))));
                }
            }
            if (filter.rangeStart != null) {
                queryPatternGroup.addElementFilter(new ElementFilter(new E_GreaterThanOrEqual(variable, toNodeValue(filter.rangeStart, facet.type))));
            }
            if (filter.rangeEnd != null) {
                queryPatternGroup.addElementFilter(new ElementFilter(new E_LessThanOrEqual(variable, toNodeValue(filter.rangeEnd, facet.type))));
            }
        });


        var template = new ParameterizedSparqlString(query.toString());

        int[] total = {0};
        var start = currentTimeMillis();

        return Txn.calculateRead(ds, () -> {
            try {
                withConstrainedScope(ds.getDefaultModel(), constraints, file -> {
                    template.setParam("file", file);
                    var boundQuery = template.asQuery();

                    try (var ex = QueryExecutionFactory.create(boundQuery, ds.getDefaultModel())) {
                        for (var it = ex.execSelect(); it.hasNext(); ) {
                            if (currentTimeMillis() - start > QUERY_EXECUTION_TIMEOUT) {
                                throw TIMEOUT;
                            }

                            var row = it.next();
                            if (resources.add(row.getResource("resource"))) {
                                total[0]++;
                                if (total[0] > skip && resources.size() < size) {
                                    var map = new HashMap<String, Object>();
                                    row.varNames().forEachRemaining(name -> {
                                        var value = row.get(name);
                                        if (value.isURIResource()) {
                                            map.put(name, value.asResource().getURI());
                                            var label = getStringProperty(value.asResource(), RDFS.label);
                                            if (label != null) {
                                                map.put(name + ".label", label);
                                            }
                                        } else if (value.isLiteral()) {
                                            var literal = value.asLiteral().getValue();
                                            if (literal instanceof XSDDateTime) {
                                                literal = ofEpochMilli(((XSDDateTime) literal).asCalendar().getTimeInMillis());
                                            }
                                            map.put(name, literal);
                                        } else {
                                            map.put(name, null);
                                        }
                                    });
                                    result.row(map);
                                }
                                if (total[0] == MAX_RESULTS) {
                                    throw TOO_MANY_RESULTS;
                                }
                            }
                        }
                    }
                });
            } catch (RuntimeException e) {
                if (e == TIMEOUT) {

                } else if (e == TOO_MANY_RESULTS) {

                } else {
                    throw e;
                }
            }

            return result
                    .page(page)
                    .size(size)
                    .totalElements(total[0])
                    .totalPages((total[0] / size) + ((total[0] % size > 0) ? 1 : 0))
                    .build();
        });
    }

    private static NodeValue toNodeValue(Object o, Config.Search.ValueType type) {
        return switch (type) {
            case id -> makeNode(NodeFactory.createURI(o.toString()));
            case text -> makeString(o.toString());
            case number -> makeDecimal(o.toString());
            case date -> makeDate(o.toString());
        };
    }

    private static RDFNode toRdfNode(Object o, Config.Search.ValueType type) {
        return switch (type) {
            case id -> createResource(o.toString());
            case text -> createStringLiteral(o.toString());
            case number -> createTypedLiteral(o);
            case date -> createTypedLiteral(o.toString(), XSDdate);
        };
    }

    private static double toBound(Object value, double defaultValue) {
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return defaultValue;
    }

    public List<FacetDTO> getFacets() {
        return config.facets
                .stream()
                .map(f -> new FacetDTO(f.name, f.title, f.type))
                .collect(toList());
    }

    public List<ViewDTO> getViews() {
        return config.views
                .stream()
                .map(v -> new ViewDTO(v.name, v.title,
                        v.columns
                                .stream()
                                .map(c -> new ColumnDTO(c.name, c.title, c.type))
                                .collect(toList())))
                .collect(toList());
    }
}
