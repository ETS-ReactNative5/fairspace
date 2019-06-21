import {COLLECTIONS_SEARCH, METADATA_SEARCH, VOCABULARY_SEARCH} from "./actionTypes";
import {createErrorHandlingPromiseAction} from "../utils/redux";
import searchAPI from "../services/SearchAPI";

export const searchCollections = createErrorHandlingPromiseAction((query) => ({
    type: COLLECTIONS_SEARCH,
    payload: searchAPI().searchCollections(query),
    meta: {
        query
    }
}));

export const searchMetadata = createErrorHandlingPromiseAction(({query, types, size, page}) => ({
    type: METADATA_SEARCH,
    payload: searchAPI().searchLinkedData({types, query, size, page})
}));

export const searchVocabulary = createErrorHandlingPromiseAction(({query, types, size, page}) => ({
    type: VOCABULARY_SEARCH,
    payload: searchAPI().searchLinkedData({query, types, size, page})
}));