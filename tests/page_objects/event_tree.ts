/**
 * @file Contains functions for interacting with the Helioviewer Event Tree and Markers
 */

import { Page, Locator, expect } from '@playwright/test';


class EventTree {

    page: Page;
    root: Locator;
    markersRoot: Locator;

    constructor(source, page) {
        this.page = page;
        this.root = page.locator('#tree_'+source);
        this.markersRoot = page.locator('#tree_'+source+'-event-container');
    }

    /**
    * This function checks if the given event_type exists in the given event tree and returns a boolean promise whether tree has this event_type or not.
    * @param event_type The event type to be checked (e.g. "Active Region", "Corona Hole").
    * @return A promise that resolves to a boolean value indicating whether the event type exists in the event tree (true) or not (false).
    */
    async hasEventType(event_type: string): Promise<boolean> {
        const eventTypeLink = this.page.getByRole('link', {name: event_type});
        const eventTypeCount = await this.root.getByRole('listitem').filter({has: eventTypeLink}).count();
        return eventTypeCount == 1;
    }

    /**
    * This function checks if the given frm is present in the event tree under the given event_type.
    * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
    * @param frm parameter specifies the name of the frm (ex: "NOAA SWPC Observer").
    * @return promise to resolve true or false
    **/
    async hasFRM(event_type: string, frm: string): Promise<boolean> {

        const eventTypeLink = this.page.getByRole('link', {name: event_type});
        const eventTypeNode = await this.root.getByRole('listitem').filter({has: eventTypeLink});

        const eventFRMLink = this.page.getByRole('link', {name: frm});
        const eventFRMNodeCount = await eventTypeNode.getByRole('listitem').filter({has: eventFRMLink}).count();

        return eventFRMNodeCount == 1;
    }

    /**
    * This function counts the number of event instances under given frm in the event tree under the given event_type.
    * ATTENTION: this function does not care if the event_instance nodes under frm are visible or not,
    * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
    * @param frm parameter specifies the name of the frm (ex: "NOAA SWPC Observer").
    * @return promise to resolve the number of event instances under frm
    **/
    async frmEventCount(event_type:string, frm: string): Promise<number> {

        const eventTypeLink = this.page.getByRole('link', {name: event_type});
        const eventTypeNode = await this.root.getByRole('listitem').filter({has: eventTypeLink});

        const eventFRMLink = this.page.getByRole('link', {name: frm});
        const eventFRMNode = await eventTypeNode.getByRole('listitem').filter({has: eventFRMLink});

        return await eventFRMNode.getByRole('listitem', {includeHidden: true}).count();

    }

    /**
    * This function checks if the given event_instance is present in the event tree under the given frm under the given event_type.
    * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
    * @param frm parameter specifies the name of the frm (ex: "NOAA SWPC Observer").
    * @param event_instance parameter specifies the name of the event instance (ex: "NOAA 12674 β").
    * @return promise to resolve true or false
    **/
    async frmHasEventInstance(event_type:string, frm: string, event_instance: string): Promise<boolean> {

        const eventTypeLink = this.page.getByRole('link', {name: event_type});
        const eventTypeNode = await this.root.getByRole('listitem').filter({has: eventTypeLink});

        const eventFRMLink = this.page.getByRole('link', {name: frm});
        const eventFRMNode = await eventTypeNode.getByRole('listitem').filter({has: eventFRMLink});

        const eventInstanceLink = this.page.getByRole('link', {name: event_instance, includeHidden:true});
        const eventInstanceCount = await eventFRMNode.getByRole('listitem', {includeHidden: true}).filter({has: eventInstanceLink}).count();

        return eventInstanceCount == 1;

    }

    /**
    * This function toggles ( checks if unchecked or unchecks if checked ) the given event_type in event_tree
    * All the events under this event type should be shown/hidden after this operation
    * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
    * @return void promise about the task is done
    **/
    async toggleCheckEventType(event_type: string) {
        await this.root.getByRole('link', {name: event_type}).getByRole('insertion').first().click();
    }

    /**
    * This function toggles ( checks if unchecked or unchecks if checked ) the given frm under the given event_type in event_tree
    * All the events markers under this frm should be shown/hidden after this operation
    * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
    * @param frm parameter specifies the name of the frm (ex: "NOAA SWPC Observer").
    * @return void promise about the task is done
    **/
    async toggleCheckFRM(event_type: string, frm: string) {

        const eventTypeLink = this.page.getByRole('link', {name: event_type});
        const eventTypeNode = await this.root.getByRole('listitem').filter({has: eventTypeLink});

        await eventTypeNode.getByRole('link', {name: frm}).getByRole('insertion').first().click();
    }

    /**
    * This function toggles ( checks if unchecked or unchecks if checked ) the given event_instance under the given frm under the given event_type in event_tree
    * The event marker matching this event_instance should be shown/hidden after this operation
    * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
    * @param frm parameter specifies the name of the frm (ex: "NOAA SWPC Observer").
    * @param event_instance parameter specifies the name of the event instance (ex: "NOAA 12674 β").
    * @return void promise about the task is done
    **/
    async toggleCheckEventInstance(event_type: string, frm: string, event_instance: string) {

        const eventTypeLink = this.page.getByRole('link', {name: event_type});
        const eventTypeNode = await this.root.getByRole('listitem').filter({has: eventTypeLink});

        const eventFRMLink = this.page.getByRole('link', {name: frm});
        const eventFRMNode = await eventTypeNode.getByRole('listitem').filter({has: eventFRMLink});

        await eventFRMNode.getByRole('link', {name: event_instance}).getByRole('insertion').first().click();
    }


    /**
    * This function toggles ( opens if closed or closes if opened ) the given frm brach under the given event_type in event_tree
    * This operation presses the little caret near the FRM node in event tree, and make all event_instances nodes under the frm visible/unvisible to the user
    * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
    * @param frm parameter specifies the name of the frm (ex: "NOAA SWPC Observer").
    * @return void promise about the task is done
    **/
    async toggleBranchFRM(event_type: string, frm: string) {

        const eventTypeLink = this.page.getByRole('link', {name: event_type});
        const eventTypeNode = await this.root.getByRole('listitem').filter({has: eventTypeLink});

        const eventFRMLink = this.page.getByRole('link', {name: frm});
        const eventFRMNode = await eventTypeNode.getByRole('listitem').filter({has: eventFRMLink});

        await eventFRMNode.getByRole('insertion').first().click();
    }

    /**
    * This function asserts if the given event_instance node is visible under the frm in given event_tree
    * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
    * @param frm parameter specifies the name of the frm (ex: "NOAA SWPC Observer").
    * @param event_instance parameter specifies the name of the event instance (ex: "NOAA 12674 β").
    * @return void promise about the assertion is done
    **/
    async assertEventInstanceTreeNodeVisible(event_type:string, frm: string, event_instance: string) {

        const eventTypeLink = this.page.getByRole('link', {name: event_type});
        const eventTypeNode = await this.root.getByRole('listitem').filter({has: eventTypeLink});

        const eventFRMLink = this.page.getByRole('link', {name: frm});
        const eventFRMNode = await eventTypeNode.getByRole('listitem').filter({has: eventFRMLink});

        expect (eventFRMNode.getByRole('link', {name: event_instance})).toBeVisible();
    }

    /**
    * This function asserts if the given event_instance node is NOT visible under the frm in given event_tree
    * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
    * @param frm parameter specifies the name of the frm (ex: "NOAA SWPC Observer").
    * @param event_instance parameter specifies the name of the event instance (ex: "NOAA 12674 β").
    * @return void promise about the assertion is done
    **/
    async assertEventInstanceTreeNodeNotVisible(event_type:string, frm: string, event_instance: string) {

        const eventTypeLink = this.page.getByRole('link', {name: event_type});
        const eventTypeNode = await this.root.getByRole('listitem').filter({has: eventTypeLink});

        const eventFRMLink = this.page.getByRole('link', {name: frm});
        const eventFRMNode = await eventTypeNode.getByRole('listitem').filter({has: eventFRMLink});

        expect (eventFRMNode.getByRole('link', {name: event_instance})).not.toBeVisible();
    }

    /**
    * This function hovers the mouse to the given event_type node in event_tree
    * All the event markers under this event type should be highlighted after this operation
    * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
    * @return void promise about the task is done
    **/
    async hoverOnEventType(event_type:string) {
        const eventTypeLink = this.page.getByRole('link', {name: event_type});
        const eventTypeNode = await this.root.getByRole('listitem').filter({has: eventTypeLink});
        await eventTypeNode.getByRole('link', {name: event_type}).locator("nth=0").hover();
    }

    /**
    * This function hovers the mouse to the given frm node under the given event_type node in event_tree
    * All the event markers under this frm should be highlighted after this operation
    * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
    * @param frm parameter specifies the name of the frm (ex: "NOAA SWPC Observer").
    * @return void promise about the task is done
    **/
    async hoverOnFRM(event_type:string, frm:string) {
        const eventTypeLink = this.page.getByRole('link', {name: event_type});
        const eventTypeNode = await this.root.getByRole('listitem').filter({has: eventTypeLink});

        const eventFRMLink = this.page.getByRole('link', {name: frm});
        const eventFRMNode = await eventTypeNode.getByRole('listitem').filter({has: eventFRMLink});

        await eventFRMNode.getByRole('link', {name: frm}).locator("nth=0").hover();
    }

    /**
    * This function hovers the mouse to the given frm node under the given event_type node in event_tree
    * All the event markers under this frm should be highlighted after this operation
    * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
    * @param frm parameter specifies the name of the frm (ex: "NOAA SWPC Observer").
    * @param event_instance parameter specifies the name of the event instance (ex: "NOAA 12674 β").
    * @return void promise about the assertion is done
    **/
    async hoverOnEventInstance(event_type:string, frm:string, event_instance:string) {
        const eventTypeLink = this.page.getByRole('link', {name: event_type});
        const eventTypeNode = await this.root.getByRole('listitem').filter({has: eventTypeLink});

        const eventFRMLink = this.page.getByRole('link', {name: frm});
        const eventFRMNode = await eventTypeNode.getByRole('listitem').filter({has: eventFRMLink});

        await eventFRMNode.getByRole('link', {name: event_instance}).hover();
    }

    /**
    * This function asserts if the marker for given event_instance is visible
    * @param event_instance parameter specifies the name of the event instance (ex: "NOAA 12674 β").
    * @return void promise about the assertion is done
    **/
    async assertMarkerVisible(event_instance: string) {
        expect (await this.markersRoot.getByText(event_instance)).toBeVisible();
    }

    /**
    * This function asserts if the marker for given event_instance is NOT visible
    * @param event_instance parameter specifies the name of the event instance (ex: "NOAA 12674 β").
    * @return void promise about the assertion is done
    **/
    async assertMarkerNotVisible(event_instance: string) {
        expect (await this.markersRoot.getByText(event_instance)).not.toBeVisible();
    }


    /**
    * This function asserts if the marker for given event_instance is visible and it is highlighted
    * @param event_instance parameter specifies the name of the event instance (ex: "NOAA 12674 β").
    * @return void promise about the assertion is done
    **/
    async assertMarkerHighlighted(event_instance: string) {
        const markerLabel = await this.markersRoot.getByText(event_instance);
        await expect(markerLabel).toBeVisible();
        await expect(markerLabel).toHaveClass('event-label event-label-hover');
    }

    /**
    * This function asserts if the marker for given event_instance is visible but it is NOT highlighted
    * @param event_instance parameter specifies the name of the event instance (ex: "NOAA 12674 β").
    * @return void promise about the assertion is done
    **/
    async assertMarkerNotHighlighted(event_instance: string) {
        const markerLabel = await this.markersRoot.getByText(event_instance);
        await expect(markerLabel).toBeVisible();
        await expect(markerLabel).not.toHaveClass('event-label event-label-hover');
    }

}

export { EventTree }
