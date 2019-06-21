import React from 'react';
import {shallow} from "enzyme";

import DeleteButton from '../DeleteButton';
import ConfirmationDialog from '../../ConfirmationDialog';

describe('<DeleteButton />', () => {
    it('should close dialog before calling onlick prop', () => {
        const onClick = jest.fn();
        const wrapper = shallow(
            <DeleteButton onClick={onClick}>
                <div>something</div>
            </DeleteButton>
        );

        wrapper.childAt(0).simulate('click');
        expect(wrapper.find(ConfirmationDialog).length).toEqual(1);

        expect(onClick.mock.calls.length).toEqual(0);
        wrapper.instance().handleAgreeClick({stopPropagation: () => {}});
        expect(wrapper.find(ConfirmationDialog).length).toEqual(0);
        expect(onClick.mock.calls.length).toEqual(1);
    });

    it('should not open dialog if disabled', () => {
        const onClick = jest.fn();
        const wrapper = shallow(
            <DeleteButton disabled onClick={onClick}>
                <div>something</div>
            </DeleteButton>
        );

        wrapper.childAt(0).simulate('click');
        expect(wrapper.find(ConfirmationDialog).length).toEqual(0);
    });

    it('should call onClick if note disabled', () => {
        const onClick = jest.fn();
        const wrapper = shallow(
            <DeleteButton onClick={onClick}>
                <div>something</div>
            </DeleteButton>
        );

        wrapper.childAt(0).simulate('click');
        expect(onClick.mock.calls.length).toEqual(0);
    });

    it('should not call onClick if disabled', () => {
        const onClick = jest.fn();
        const wrapper = shallow(
            <DeleteButton disabled onClick={onClick}>
                <div>something</div>
            </DeleteButton>
        );

        wrapper.childAt(0).simulate('click');
        expect(onClick.mock.calls.length).toEqual(0);
    });
});