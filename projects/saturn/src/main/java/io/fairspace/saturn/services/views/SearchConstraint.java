package io.fairspace.saturn.services.views;

import lombok.AllArgsConstructor;
import org.apache.jena.rdf.model.Property;
import org.apache.jena.rdf.model.RDFNode;

import java.util.Set;

@AllArgsConstructor
class SearchConstraint {
    Property property;
    Set<RDFNode> values;
    double min;
    double max;
}
