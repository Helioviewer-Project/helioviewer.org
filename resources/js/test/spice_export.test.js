import { ScreenshotManagerUI } from '../Media/ScreenshotManagerUI';
jest.mock('../Media/MediaManagerUI', () => ({ MediaManagerUI: {extend: methods => methods} }));
jest.mock('../Media/ImageViewer', () => () => null);

test('SPICE screenshot preserves current API event selections and independent layer timestamp', async () => {
  const selections = ['HEK>>Flare>>NOAA SWPC'];
  const visibility = {HEK: {marker_visibility:true,label_visibility:false}};
  const values = {'state.event_selections':selections,'state.event_visibility_selections':visibility};
  global.Helioviewer = {userSettings:{get:key=>values[key]}};
  const layers='[SOLO,SPICE,intensity,O vi 103.19 nm,1,100,0,60,1,2026-11-18T10:00:00Z]';
  global.helioviewerWebClient={
    getZoomedImageScale:()=>2.4,getVisibleLayers:()=>layers,
    getCelestialBodiesLabels:()=>'',getCelestialBodiesTrajectories:()=>'',
    getDate:()=>new Date('2026-01-11T18:19:24Z'),
  };
  global.outputType='normal';
  global.$={extend:Object.assign};
  global.postJSON=jest.fn().mockResolvedValue({id:1});
  const ui={_validateRequest:()=>true,_toArcsecCoords:()=>({x1:-800,x2:800,y1:-800,y2:800}),
    _manager:{add:()=>({})},_addItem:()=>{},_displayDownloadNotification:()=>{},_refresh:()=>{}};
  await ScreenshotManagerUI._takeScreenshot.call(ui,{});
  expect(postJSON).toHaveBeenCalledWith('postScreenshot',expect.objectContaining({
    layers,date:'2026-01-11T18:19:24.000Z',event_selections:selections,event_visibility_selections:visibility,
  }));
  expect(postJSON.mock.calls[0][1]).not.toHaveProperty('eventsState');
});
