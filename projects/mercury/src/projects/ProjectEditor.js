import React from 'react';
import ProjectDialog from "./ProjectDialog";
import {useFormField} from "../common/hooks/UseFormField";
import {useAsync} from "../common/hooks";
import WorkspacesAPI from "./WorkspacesAPI";
import {LoadingOverlay} from "../common/components";

const ID_PATTERN = /^[a-z]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;

export default ({onSubmit, onClose, creating, projects,
                    project: {id = '', workspace = '', title = '', description = ''} = {}}) => {

    const {data: workspaces = [], error, loading, refresh} = useAsync(WorkspacesAPI.getWorkspaces);

    const workspaceControl = useFormField(workspace, value => !!value);

    const isProjectIdUnique = (id) => {
        return !projects.some(project => {return project.id === id});
    };
    const idControl = useFormField(id, value => !!value && ID_PATTERN.test(value) && isProjectIdUnique(value));

    const allControls = [idControl, workspaceControl];

    const formValid = allControls.every(({valid}) => valid);

    const state = {
        editing: true
    };

    const defaultWorkspace = (workspaces.length === 1) && workspaces[0];
    if (defaultWorkspace && (defaultWorkspace.id !== workspaceControl.value)) {
        workspaceControl.setValue(defaultWorkspace.id);
    }

    const fields = [
        {
            control: workspaceControl,
            required: true,
            autoFocus: true,
            id: "workspace",
            label: "Workspace",
            name: "workspace",
            select: true,
            selectOptions: workspaces.map(w => w.id)
        },
        {
            control: idControl,
            required: true,
            id: "id",
            label: "Id",
            name: "id",
            helperText: "Value has to be unique per workspace. " +
                "Only lower case letters, numbers, hyphens and should start with a letter."
        }
    ];

    const validateAndSubmit = () => formValid && onSubmit(
        {
            workspace: workspaceControl.value,
            id: idControl.value,
            title: idControl.value
        }
    );

    if (loading) {
        return null;
    }
    return (
        <>
            <ProjectDialog
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    validateAndSubmit();
                }}
                onClose={onClose}
                submitDisabled={Boolean(!formValid)}
                fields={fields}
            />
            <LoadingOverlay loading={creating} />
        </>
    );

};
