import React from 'react';
import {mount, shallow} from "enzyme";
import {MemoryRouter} from "react-router-dom";

import CollectionsContext from "../CollectionsContext";
import ContextualCollectionBrowser, {CollectionBrowser} from "../CollectionBrowser";
import MessageDisplay from "../../common/components/MessageDisplay";
import LoadingInlay from "../../common/components/LoadingInlay";

let collectionBrowser;

const collectionsContextMock = {
    addCollection: jest.fn(),
    collections: [],
    setShowDeleted: () => {}
};

beforeEach(() => {
    collectionsContextMock.addCollection.mockResolvedValue({});
    collectionBrowser = (
        <MemoryRouter>
            <CollectionsContext.Provider value={collectionsContextMock}>
                <ContextualCollectionBrowser />
            </CollectionsContext.Provider>
        </MemoryRouter>
    );

    global.window = Object.create(window);

    Object.defineProperty(window, 'location', {
        value: {
            pathname: '/workspace'
        }
    });
});

describe('<CollectionBrowser />', () => {
    it('should dispatch an action on collection save', async () => {
        const wrapper = mount(collectionBrowser);

        const addButton = wrapper.find('[aria-label="Add"]').first();
        addButton.simulate('click');

        const nameField = wrapper.find('input#name').first();
        nameField.simulate('focus');
        nameField.simulate('change', {target: {value: 'New collection'}});

        const saveButton = wrapper.find('button[aria-label="Save"]').first();

        jest.useFakeTimers();
        saveButton.simulate('click');
        jest.runAllTimers();

        expect(collectionsContextMock.addCollection).toBeCalledTimes(1);
    });

    it('should not show add button if adding disabled', async () => {
        const wrapper = shallow(<CollectionBrowser canAddCollection={false} />);

        expect(wrapper.find('[aria-label="Add"]').length).toBe(0);
    });

    it('is loading as long as the user, users or collections are pending', () => {
        const wrapper = shallow(<CollectionBrowser loading />);

        expect(wrapper.find(LoadingInlay).length).toBe(1);
    });

    it('is in error state when user fetching failed', () => {
        const wrapperErrorObj = shallow(<CollectionBrowser error={new Error()} />);
        const wrapperErrorText = shallow(<CollectionBrowser error="some error" />);

        expect(wrapperErrorObj.find(MessageDisplay).length).toBe(1);
        expect(wrapperErrorText.find(MessageDisplay).length).toBe(1);
    });
});
