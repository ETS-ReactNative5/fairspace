import React from 'react';
import {withRouter} from "react-router-dom";
import {connect} from 'react-redux';
import ErrorDialog from "../common/ErrorDialog";
import ErrorMessage from "../common/ErrorMessage";
import BreadCrumbs from "../common/BreadCrumbs";
import LoadingInlay from '../common/LoadingInlay';
import FileList from "./FileList";
import FileOperations from "./FileOperations";
import permissionUtils from '../../utils/permissionUtils';
import * as collectionBrowserActions from "../../actions/collectionbrowser";
import * as fileActions from "../../actions/files";
import * as collectionActions from "../../actions/collections";
import FileAPIFactory from "../../services/FileAPI/FileAPIFactory";
import {parsePath} from "../../utils/fileutils";
import GenericCollectionsScreen from "../common/GenericCollectionsScreen";

class FileBrowser extends React.Component {
    componentDidMount() {
        const {
            fetchCollectionsIfNeeded, selectCollection, fetchFilesIfNeeded, openedCollection, openedPath
        } = this.props;
        fetchCollectionsIfNeeded();
        selectCollection(openedCollection.id);

        // If the collection has not been fetched yet,
        // do not bother fetching the files
        if (openedCollection.id) {
            fetchFilesIfNeeded(openedCollection, openedPath);
        }
    }

    componentDidUpdate(prevProps) {
        const {
            selectCollection, fetchFilesIfNeeded, openedCollection, openedPath, openPath
        } = this.props;
        if (prevProps.openedCollection.id !== openedCollection.id) {
            selectCollection(openedCollection.id);
        }

        const hasCollectionDetails = openedCollection.id;
        const hasNewOpenedCollection = prevProps.openedCollection.id !== openedCollection.id;
        const hasNewOpenedPath = prevProps.openedPath !== openedPath;

        if (hasCollectionDetails && (hasNewOpenedCollection || hasNewOpenedPath)) {
            fetchFilesIfNeeded(openedCollection, openedPath);
            openPath(`/${openedCollection.location}${openedPath === '/' ? '' : openedPath}`);
        }
    }

    handlePathClick = (path) => {
        const {selectPath, deselectPath} = this.props;

        // If this pathis already selected, deselect
        if (this.isPathSelected(path.filename)) {
            deselectPath(path.filename);
        } else {
            selectPath(path.filename);
        }
    }

    handlePathDoubleClick = (path) => {
        if (path.type === 'directory') {
            this.openDir(path.basename);
        } else {
            this.downloadFile(path.basename);
        }
    }

    handlePathDelete = (path) => {
        const {
            deleteFile, fetchFilesIfNeeded, openedCollection, openedPath
        } = this.props;
        return deleteFile(openedCollection, openedPath, path.basename)
            .then(() => fetchFilesIfNeeded(openedCollection, openedPath))
            .catch((err) => {
                ErrorDialog.showError(err, "An error occurred while deleting file or directory", () => this.handlePathDelete(path));
            });
    }

    handlePathRename = (path, newName) => {
        const {
            renameFile, fetchFilesIfNeeded, openedCollection, openedPath
        } = this.props;
        return renameFile(openedCollection, openedPath, path.basename, newName)
            .then(() => fetchFilesIfNeeded(openedCollection, openedPath))
            .catch((err) => {
                ErrorDialog.showError(err, "An error occurred while renaming file or directory", () => this.handlePathRename(path, newName));
                return false;
            });
    }

    isPathSelected(path) {
        return this.props.selectedPaths.some(el => el === path);
    }

    openCollection(collection) {
        this.props.history.push(`/collections/${collection.id}`);
    }

    openDir(path) {
        const basePath = this.props.openedPath || '';
        const separator = basePath.endsWith('/') ? '' : '/';
        const fullPath = `/collections/${this.props.openedCollection.id}${basePath}${separator}${path}`;
        this.props.history.push(fullPath);
        this.props.openPath(`/${this.props.openedCollection.location}${basePath}${separator}${path}`);
    }

    downloadFile(path) {
        const fileAPI = FileAPIFactory.build(this.props.openedCollection);
        fileAPI.download(fileAPI.joinPaths(this.props.openedPath || '', path));
    }

    render() {
        const {loading, error} = this.props;

        if (error) {
            return this.renderError(error);
        }

        return (
            <GenericCollectionsScreen
                breadCrumbs={this.renderBreadcrumbs()}
                buttons={loading ? null : this.renderButtons()}
                main={loading ? this.renderLoading() : this.renderFiles()}
            />
        );
    }

    renderBreadcrumbs() {
        const {openedCollection, openedPath, loading} = this.props;

        if (loading) {
            return <BreadCrumbs />;
        }

        const segments = [
            {segment: `${openedCollection.id}`, label: openedCollection.name}
        ];

        if (openedPath) {
            const toBreadcrumb = segment => ({segment, label: segment});
            const pathParts = parsePath(openedPath);
            segments.push(...pathParts.map(toBreadcrumb));
        }

        return <BreadCrumbs segments={segments} />;
    }

    renderButtons() {
        const {openedCollection, openedPath} = this.props;
        return (
            <FileOperations
                openedCollection={openedCollection}
                openedPath={openedPath}
                disabled={!permissionUtils.canWrite(openedCollection)}
                existingFiles={this.props.files ? this.props.files.map(file => file.basename) : []}
            />
        );
    }

    renderError() {
        return (<ErrorMessage message="An error occurred while loading files" />);
    }

    renderLoading() {
        return <LoadingInlay />;
    }

    renderFiles() {
        const doesCollectionExist = this.props.openedCollection && this.props.openedCollection.id;
        if (!doesCollectionExist) {
            return 'Collection does not exist.';
        }

        return (
            <FileList
                files={this.props.files}
                selectedPaths={this.props.selectedPaths}
                onPathClick={this.handlePathClick}
                onPathDoubleClick={this.handlePathDoubleClick}
                onRename={this.handlePathRename}
                onDelete={this.handlePathDelete}
                readonly={!permissionUtils.canWrite(this.props.openedCollection)}
            />
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    const {openedCollectionId, openedPath} = ownProps;
    const filesPerCollection = state.cache.filesByCollectionAndPath[openedCollectionId] || {};
    const files = filesPerCollection[openedPath] || {};
    const getCollection = collectionId => (state.cache.collections.data && state.cache.collections.data.find(collection => collection.id === collectionId)) || {};

    return {
        loading: files.pending || state.cache.collections.pending || state.cache.collections.data.length === 0,
        error: files.error || state.cache.collections.error,
        files: files.data,
        selectedPaths: state.collectionBrowser.selectedPaths,
        openedCollection: openedCollectionId ? getCollection(openedCollectionId) : {}
    };
};

const mapDispatchToProps = {
    ...collectionActions,
    ...fileActions,
    ...collectionBrowserActions
};

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(FileBrowser));