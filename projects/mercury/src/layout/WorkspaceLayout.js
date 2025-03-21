import React, {useContext} from 'react';
import {VocabularyProvider} from '../metadata/vocabulary/VocabularyContext';
import {CollectionsProvider} from '../collections/CollectionsContext';
import MainMenu from './MainMenu';
import {currentWorkspace} from '../workspaces/workspaces';
import WorkspaceRoutes from '../routes/WorkspaceRoutes';
import WorkspaceContext, {WorkspacesProvider} from "../workspaces/WorkspaceContext";
import {ServicesProvider} from '../common/contexts/ServicesContext';
import Layout from "./Layout";
import TopBar from "./TopBar";
import {UsersProvider} from "../users/UsersContext";
import {FeaturesProvider} from "../common/contexts/FeaturesContext";
import {MetadataViewProvider} from "../metadata/views/MetadataViewContext";
import {MetadataViewFacetsProvider} from "../metadata/views/MetadataViewFacetsContext";
import {ExternalStoragesProvider} from "../external-storage/ExternalStoragesContext";
import {StatusProvider} from "../status/StatusContext";
import type {Workspace} from "../workspaces/WorkspacesAPI";

const WorkspaceLayoutInner = () => {
    const {workspaces} = useContext(WorkspaceContext);

    const workspace: Workspace = currentWorkspace() && workspaces.find(w => w.iri === currentWorkspace());
    const title = (workspace && workspace.code) || '';

    return (
        <StatusProvider>
            <UsersProvider>
                <VocabularyProvider>
                    <CollectionsProvider>
                        <ServicesProvider>
                            <FeaturesProvider>
                                <ExternalStoragesProvider>
                                    <MetadataViewFacetsProvider>
                                        <MetadataViewProvider>
                                            <Layout
                                                renderMenu={() => <MainMenu />}
                                                renderMain={() => <WorkspaceRoutes />}
                                                renderTopbar={() => <TopBar title={title} />}
                                            />
                                        </MetadataViewProvider>
                                    </MetadataViewFacetsProvider>
                                </ExternalStoragesProvider>
                            </FeaturesProvider>
                        </ServicesProvider>
                    </CollectionsProvider>
                </VocabularyProvider>
            </UsersProvider>
        </StatusProvider>
    );
};

const WorkspaceLayout = () => (
    <WorkspacesProvider>
        <WorkspaceLayoutInner />
    </WorkspacesProvider>
);

export default WorkspaceLayout;
