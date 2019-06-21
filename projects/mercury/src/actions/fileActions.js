import {createErrorHandlingPromiseAction, dispatchIfNeeded} from "../utils/redux";
import FileAPI from "../services/FileAPI";
import * as actionTypes from "./actionTypes";
import {joinPaths} from '../utils/fileUtils';

export const invalidateFiles = (collection, path) => ({
    type: actionTypes.INVALIDATE_FETCH_FILES,
    meta: {
        collection,
        path
    }
});

export const renameFile = (path, currentFilename, newFilename) => {
    const from = joinPaths(path, currentFilename);
    const to = joinPaths(path, newFilename);

    return {
        type: actionTypes.RENAME_FILE,
        payload: FileAPI.move(from, to),
        meta: {
            path,
            currentFilename,
            newFilename
        }
    };
};

export const deleteFile = (path) => (
    {
        type: actionTypes.DELETE_FILE,
        payload: FileAPI.delete(path),
        meta: {
            path
        }
    });

export const uploadFiles = (path, files, nameMapping) => ({
    type: actionTypes.UPLOAD_FILES,
    payload: FileAPI.upload(path, files, nameMapping),
    meta: {
        path, files, nameMapping
    }
});

export const createDirectory = (path) => ({
    type: actionTypes.CREATE_DIRECTORY,
    payload: FileAPI.createDirectory(path),
    meta: {path}
});

const fetchFiles = createErrorHandlingPromiseAction((path) => ({
    type: actionTypes.FETCH_FILES,
    payload: FileAPI.list(path),
    meta: {
        path
    }
}));

export const fetchFilesIfNeeded = (path) => dispatchIfNeeded(
    () => fetchFiles(path),
    (state) => state.cache.filesByPath[path]
);

export const statFile = createErrorHandlingPromiseAction((path) => ({
    type: actionTypes.STAT_FILE,
    payload: FileAPI.stat(path),
    meta: {path}
}));