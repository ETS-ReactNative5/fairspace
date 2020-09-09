import React, {useContext} from 'react';
import {Link, ListItemText, Paper, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography, withStyles} from '@material-ui/core';

import {Link as RouterLink} from 'react-router-dom';
import {FolderOutlined, FolderOpenOutlined, InsertDriveFileOutlined} from '@material-ui/icons';
import queryString from 'query-string';
import {getCollectionAbsolutePath, handleCollectionSearchRedirect, pathForIri} from './collectionUtils';
import {FILE_URI} from "../constants";
import VocabularyContext, {VocabularyProvider} from '../metadata/vocabulary/VocabularyContext';
import {getLabelForType} from '../metadata/common/vocabularyUtils';
import useAsync from "../common/hooks/UseAsync";
import {getSearchQueryFromString, handleSearchError} from "../search/searchUtils";
import SearchBar from "../search/SearchBar";
import LoadingInlay from "../common/components/LoadingInlay";
import MessageDisplay from "../common/components/MessageDisplay";
import {getParentPath} from '../file/fileUtils';
import {searchFileSystem} from '../search/collectionSearch';
import BreadcrumbsContext from '../common/contexts/BreadcrumbsContext';
import BreadCrumbs from '../common/components/BreadCrumbs';

const styles = {
    tableRoot: {
        width: '100%',
        maxHeight: 'calc(100% - 60px)',
        overflowX: 'auto',
        marginTop: 16
    },
    table: {
        minWidth: 700,
    },
    search: {
        width: '80%',
        margin: 10
    },
    title: {
        margin: 10,
        marginTop: 16
    }
};

const CollectionSearchResultList = ({classes, items, total, loading, error, history, vocabulary}) => {
    const renderType = (item) => {
        if (!item.type && item.type.length === 0) {
            return null;
        }
        const typeLabel = getLabelForType(vocabulary, item.type);
        let avatar;
        switch (typeLabel) {
            case 'Collection':
                avatar = <FolderOutlined />;
                break;
            case 'Directory':
                avatar = <FolderOpenOutlined />;
                break;
            case 'File':
                avatar = <InsertDriveFileOutlined />;
                break;
            default:
                avatar = null;
        }
        if (avatar) {
            return (
                <>
                    <Tooltip title={typeLabel} arrow>
                        {avatar}
                    </Tooltip>
                    <Typography variant="srOnly">{typeLabel}</Typography>
                </>
            );
        }
        return <Typography>{typeLabel}</Typography>;
    };

    const link = (item) => {
        const path = pathForIri(item.id);
        if (item.type === FILE_URI) {
            const parentPath = getParentPath(path);
            return `${getCollectionAbsolutePath(parentPath)}?selection=${encodeURIComponent(`/${path}`)}`;
        }
        return getCollectionAbsolutePath(path);
    };

    /**
     * Handles a click on a search result.
     * @param item The clicked search result.
     */
    const handleResultDoubleClick = (item) => {
        history.push(link(item));
    };

    if (loading) {
        return <LoadingInlay />;
    }

    if (!loading && error && error.message) {
        return <MessageDisplay message={error.message} />;
    }

    if (!total || total === 0) {
        return <MessageDisplay message="No results found!" isError={false} />;
    }

    return (
        <Paper className={classes.tableRoot} data-testid="results-table">
            <Table className={classes.table}>
                <TableHead>
                    <TableRow>
                        <TableCell />
                        <TableCell />
                        <TableCell>Path</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items
                        .map((item) => (
                            <TableRow
                                hover
                                key={item.id}
                                onDoubleClick={() => handleResultDoubleClick(item)}
                            >
                                <TableCell width={30}>
                                    {renderType(item)}
                                </TableCell>
                                <TableCell>
                                    <ListItemText
                                        primary={item.label}
                                        secondary={item.comment}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Link
                                        to={link(item)}
                                        component={RouterLink}
                                        color="inherit"
                                        underline="hover"
                                    >
                                        {pathForIri(item.id)}
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                </TableBody>
            </Table>
        </Paper>
    );
};

// This separation/wrapping of components is mostly for unit testing purposes (much harder if it's 1 component)
export const CollectionSearchResultListContainer = ({
    location: {search},
    query = getSearchQueryFromString(search),
    locationIri = queryString.parse(search).location || '',
    vocabulary, vocabularyLoading, vocabularyError,
    classes, history
}) => {
    const {data, loading, error} = useAsync(() => searchFileSystem(query, locationIri)
        .catch(handleSearchError),
    [search, query]);
    const items = data || [];
    const total = data ? data.length : 0;
    const handleSearch = (value) => {
        handleCollectionSearchRedirect(history, value, locationIri);
    };

    const pathSegments = () => {
        const segments = ((locationIri && pathForIri(locationIri)) || '').split('/');
        if (segments[0] === '') {
            return [];
        }
        const result = [];
        let href = '/collections';
        segments.forEach(segment => {
            href += '/' + segment;
            result.push({label: segment, href});
        });
        return result;
    };

    return (
        <BreadcrumbsContext.Provider value={{segments: [
            {
                label: 'Collections',
                icon: <FolderOutlined />,
                href: '/collections'
            }
        ]}}
        >
            <BreadCrumbs additionalSegments={pathSegments()} />
            <SearchBar
                placeholder="Search"
                disableUnderline={false}
                onSearchChange={handleSearch}
                query={query}
            />
            <Typography variant="h6" className={classes.title}>Search results</Typography>
            <CollectionSearchResultList
                items={items}
                total={total}
                loading={loading || vocabularyLoading}
                error={vocabularyError || error}
                classes={classes}
                history={history}
                vocabulary={vocabulary}
            />
        </BreadcrumbsContext.Provider>
    );
};

const CollectionSearchResultListWithVocabulary = (props) => {
    const {vocabulary, vocabularyLoading, vocabularyError} = useContext(VocabularyContext);

    return (
        <VocabularyProvider>
            <CollectionSearchResultListContainer
                {...props}
                vocabulary={vocabulary}
                vocabularyLoading={vocabularyLoading}
                vocabularyError={vocabularyError}
            />
        </VocabularyProvider>
    );
};

export default withStyles(styles)(CollectionSearchResultListWithVocabulary);
