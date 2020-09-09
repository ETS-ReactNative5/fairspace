import axios from 'axios';
import {handleHttpError} from "../common/utils/httpUtils";
import {extractSparqlSelectResults, SPARQL_SELECT_HEADERS} from "./sparqlUtils";
import {COLLECTION_URI, DIRECTORY_URI, FILE_URI} from '../constants';

const fileSystemTypes = [
    COLLECTION_URI,
    DIRECTORY_URI,
    FILE_URI
];

export const searchFileSystem = (searchText, locationPrefix = '') => {
    const searchPattern = `${JSON.stringify(searchText).slice(1, -1)}*`;
    const filterLocationPrefix = locationPrefix ? `AND ("${locationPrefix}/*")` : '';
    const excludeDeleted = `AND NOT (dateDeleted:*)`;
    const onlyFileSystemTypes = `AND (type:${fileSystemTypes.map(type => `"${type}"`).join('|')})`;
    const query = `
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX text: <http://jena.apache.org/text#>

SELECT ?id ?label ?type ?comment
WHERE { 
    ?id text:query ( '${searchPattern} ${filterLocationPrefix} ${excludeDeleted} ${onlyFileSystemTypes}' 20 ) ;
        rdfs:label ?label ;
        a ?type ;
        rdfs:comment ?comment .
}
`;
    return axios.post(
        '/api/v1/rdf/query',
        query,
        {headers: SPARQL_SELECT_HEADERS}
    )
        .catch(handleHttpError("Error while performing search"))
        .then(extractSparqlSelectResults);
};
