import React from 'react';
import {Redirect, Route} from "react-router-dom";

import Home from "./Home";
import Collections from "./collections/CollectionsPage";
import Notebooks from "./Notebooks";
import FilesPage from "./file/FilesPage";
import logout from "../services/logout";
import SearchPage from './search/SearchPage';
import {createMetadataIri, createVocabularyIri} from "../utils/linkeddata/metadataUtils";
import {MetadataWrapper, VocabularyWrapper} from './metadata/LinkedDataWrapper';
import LinkedDataEntityPage from "./metadata/common/LinkedDataEntityPage";
import MetadataListPage from "./metadata/MetadataListPage";
import VocabularyListPage from "./metadata/VocabularyListPage";
import useSubject from './UseSubject';

const routes = () => (
    <>
        <Route path="/" exact component={Home} />

        <Route
            path="/collections"
            exact
            render={({location}) => (
                <MetadataWrapper location={location}>
                    <Collections />
                </MetadataWrapper>
            )}
        />

        <Route
            path="/collections/:collection/:path(.*)?"
            render={(props) => (
                <MetadataWrapper location={props.location}>
                    <FilesPage {...props} />
                </MetadataWrapper>
            )}
        />

        <Route path="/notebooks" exact component={Notebooks} />

        <Route
            path="/metadata"
            exact
            render={() => {
                const subject = useSubject();

                return (
                    <MetadataWrapper>
                        {subject ? <LinkedDataEntityPage subject={subject} /> : <MetadataListPage />}
                    </MetadataWrapper>
                );
            }}
        />

        <Route
            /* This route redirects a metadata iri which is entered directly to the metadata editor */
            path="/iri/**"
            render={({match}) => (<Redirect to={"/metadata?iri=" + encodeURIComponent(createMetadataIri(match.params[0]))} />)}
        />

        <Route
            path="/vocabulary"
            exact
            render={() => {
                const subject = useSubject();

                return (
                    <VocabularyWrapper>
                        {subject ? <LinkedDataEntityPage subject={subject} /> : <VocabularyListPage />}
                    </VocabularyWrapper>
                );
            }}
        />

        <Route
            /* This route redirects a metadata iri which is entered directly to the metadata editor */
            path="/vocabulary/**"
            render={({match}) => (<Redirect to={"/vocabulary?iri=" + encodeURIComponent(createVocabularyIri(match.params[0]))} />)}
        />

        <Route path="/login" render={() => {window.location.href = '/login';}} />
        <Route path="/logout" render={logout} />
        <Route path="/search" component={SearchPage} />
    </>
);

export default routes;
