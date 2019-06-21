import React from 'react';
import {mount, shallow} from "enzyme";

import {STRING_URI} from "../../../../constants";
import LinkedDataProperty from "../LinkedDataProperty";
import LinkedDataRelationTable from "../LinkedDataRelationTable";
import LinkedDataInputFieldsTable from "../LinkedDataInputFieldsTable";
import {LinkedDataValuesContext} from "../LinkedDataValuesContext";
import NumberValue from "../values/NumberValue";
import StringValue from "../values/StringValue";
import SwitchValue from "../values/SwitchValue";

const defaultProperty = {
    key: 'description',
    datatype: STRING_URI,
    label: 'Description',
    values: [{value: 'More info'}, {value: 'My first collection'}, {value: 'My second collection'}],
    maxValuesCount: 4,
    isEditable: true,
    isRelationShape: true
};

describe('LinkedDataProperty elements', () => {
    it('shows a table with relations for relationShapes', () => {
        const wrapper = shallow(<LinkedDataProperty property={defaultProperty} />);
        const table = wrapper.find(LinkedDataRelationTable);
        expect(table.length).toEqual(1);
        expect(table.prop("property")).toEqual(defaultProperty);
    });

    it('shows a table for input fields for non-relationShapes', () => {
        const property = {
            ...defaultProperty,
            isRelationShape: false
        };

        const wrapper = shallow(<LinkedDataProperty property={property} />);
        const table = wrapper.find(LinkedDataInputFieldsTable);
        expect(table.length).toEqual(1);
        expect(table.prop("property")).toEqual(property);
    });

    describe('canAdd', () => {
        const verifyCanAdd = (property, expectedCanAdd) => {
            const wrapper = shallow(<LinkedDataProperty property={property} />);
            const table = wrapper.find(LinkedDataRelationTable);
            expect(table.length).toEqual(1);
            expect(table.prop("canAdd")).toBe(expectedCanAdd);
        };

        it('should allow adding new entities', () => verifyCanAdd(defaultProperty, true));
        it('should not allow adding new entities if property is not editable', () => verifyCanAdd({
            ...defaultProperty,
            isEditable: false
        }, false));
        it('should not allow adding new entities if property is machineOnly', () => verifyCanAdd({
            ...defaultProperty,
            machineOnly: true
        }, false));
        it('should not allow adding new entities if the max number of values is reached', () => verifyCanAdd({
            ...defaultProperty,
            maxValuesCount: 3
        }, false));
    });

    describe('inputComponents', () => {
        const valueComponentFactory = {
            addComponent: () => NumberValue,
            editComponent: () => StringValue,
            readOnlyComponent: () => SwitchValue
        };

        const renderTable = property => {
            const wrapper = mount(<LinkedDataValuesContext.Provider value={{editorPath: '/metadata', componentFactory: valueComponentFactory}}><LinkedDataProperty property={property} /></LinkedDataValuesContext.Provider>);
            const table = wrapper.find(LinkedDataInputFieldsTable);
            expect(table.length).toEqual(1);
            return table;
        };

        it('should use the factory in the context to determine the Add component', () => {
            expect(
                renderTable({
                    ...defaultProperty,
                    isRelationShape: false
                }).prop("addComponent")
            ).toEqual(NumberValue);
        });

        it('should use the factory in the context to determine the edit component', () => {
            expect(
                renderTable({
                    ...defaultProperty,
                    isRelationShape: false
                }).prop("editComponent")
            ).toEqual(StringValue);
        });

        it('should render a read-only component for non editable shapes', () => {
            expect(
                renderTable({
                    ...defaultProperty,
                    isRelationShape: false,
                    isEditable: false
                }).prop("editComponent")
            ).toEqual(SwitchValue);
        });

        it('should render a read-only component for machine only shapes', () => {
            expect(
                renderTable({
                    ...defaultProperty,
                    isRelationShape: false,
                    machineOnly: true
                }).prop("editComponent")
            ).toEqual(SwitchValue);
        });

        it('should render a read-only component for generic IRI resources', () => {
            expect(
                renderTable({
                    ...defaultProperty,
                    isRelationShape: false,
                    isGenericIriResource: true
                }).prop("editComponent")
            ).toEqual(SwitchValue);
        });

        it('should render a read-only component for controlled vocabulary shapes', () => {
            expect(
                renderTable({
                    ...defaultProperty,
                    isRelationShape: false,
                    allowedValues: ['a']
                }).prop("editComponent")
            ).toEqual(SwitchValue);
        });
    });
});