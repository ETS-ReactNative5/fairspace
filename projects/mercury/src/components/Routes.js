import React from 'react';
import {Route} from "react-router-dom";

import Home from "./Home";
import Collections from "./collections/CollectionsPage";
import Notebooks from "./Notebooks";
import MetadataEntityPage from "./metadata/MetadataEntityPage";
import MetadataListPage from "./metadata/MetadataListPage";
import FilesPage from "./file/FilesPage";
import logout from "../services/logout";
import SearchPage from './search/SearchPage';
import VocabularyListPage from "./vocabulary/VocabularyListPage";

const routes = () => (
    <>
        <Route path="/" exact component={Home} />
        <Route path="/collections" exact component={Collections} />
        <Route path="/collections/:collection/:path(.*)?" component={FilesPage} />
        <Route path="/notebooks" exact component={Notebooks} />
        <Route path="/metadata" exact component={MetadataListPage} />
        <Route path="/vocabulary" exact component={VocabularyListPage} />
        <Route path="/iri/**" component={MetadataEntityPage} />
        <Route path="/login" render={() => {window.location.href = '/login';}} />
        <Route path="/logout" render={logout} />
        <Route path="/search" component={SearchPage} />
    </>
);

export default routes;
