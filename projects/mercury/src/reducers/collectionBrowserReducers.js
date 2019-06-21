import * as actionTypes from "../actions/actionTypes";

const defaultState = {
    selectedCollectionLocation: null,
    selectedPaths: [],
    addingCollection: false,
    deletingCollection: false
};

export const deselectPath = (state, path) => ({
    ...state,
    selectedPaths: state.selectedPaths.filter(el => el !== path)
});

const collectionBrowser = (state = defaultState, action) => {
    switch (action.type) {
        case actionTypes.SELECT_COLLECTION:
            return {
                ...state,
                selectedCollectionLocation: action.location,
                selectedPaths: [],
            };
        case actionTypes.SELECT_PATH:
            return {
                ...state,
                selectedPaths: [...state.selectedPaths, action.path]
            };
        case actionTypes.SET_SELECTED_PATHS:
            return {
                ...state,
                selectedPaths: [...action.paths]
            };
        case actionTypes.DESELECT_ALL_PATHS:
            return {
                ...state,
                selectedPaths: []
            };
        case actionTypes.DESELECT_PATH:
            return deselectPath(state, action.path);
        case actionTypes.DELETE_COLLECTION_PENDING:
            return {
                ...state,
                deletingCollection: true
            };
        case actionTypes.DELETE_COLLECTION_FULFILLED:
            return {
                ...state,
                deletingCollection: false,
                selectedCollectionLocation: state.selectedCollectionLocation === action.collectionId ? null : state.selectedCollectionLocation
            };
        case actionTypes.DELETE_COLLECTION_REJECTED:
        case actionTypes.DELETE_COLLECTION_INVALIDATE:
            return {
                ...state,
                deletingCollection: false
            };
        case actionTypes.DELETE_FILE_FULFILLED:
            return deselectPath(state, action.meta.path);
        case actionTypes.RENAME_FILE_FULFILLED:
            return {
                ...state,
                selectedPaths: [],
            };
        case actionTypes.ADD_COLLECTION_PENDING:
            return {
                ...state,
                addingCollection: true
            };
        case actionTypes.ADD_COLLECTION_FULFILLED:
        case actionTypes.ADD_COLLECTION_REJECTED:
        case actionTypes.ADD_COLLECTION_INVALIDATE:
            return {
                ...state,
                addingCollection: false
            };
        default:
            return state;
    }
};

export default collectionBrowser;