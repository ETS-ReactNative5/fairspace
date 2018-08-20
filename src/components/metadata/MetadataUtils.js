import * as jsonld from 'jsonld/dist/jsonld';

function combine(vocabulary, metadata) {
    return extractLabelsByIdMap(vocabulary)
        .then(labelsById =>
            jsonld.expand(metadata)
                .then(expandedMetadata => {
                    const root = expandedMetadata[0];
                    const resultMap = {};
                    for (const key in root) {
                        const label = labelsById[key];
                        if (label) {
                            const value = root[key][0]['@value'];
                            const values = result[label] || [];
                            values.push(value);

                            result[label] = values;
                        }
                    }
                    return Object.keys(resultMap).map(label => ({label: label, values: resultMap[label]}));
                }));
}


function extractLabelsByIdMap(vocabulary) {
    return jsonld.expand(vocabulary)
        .then(expandedVocabulary => {
            const labelsById = {};
            expandedVocabulary.forEach(property => {
                let id = property["@id"];
                let label = property['http://www.w3.org/2000/01/rdf-schema#label'][0]["@value"];
                labelsById[id] = label;
            });
            return labelsById;
        });
}

export default combine;
