import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../page_objects/helioviewer";

/**
 * This test tests new and announcements viewing functionality with
 * - load helioviewer
 * - press news button
 * - you should see the prefaked news we mock
 * - press news button again
 * - you should NOT see the prefaked news we mock
 */
test("News button should display/hide project news and announcements", async ({ page }, info) => {
  let hv = new Helioviewer(page, info);

  // Mock news request
  const fakeNews = [
    {
      title: "Foo announcement 1",
      link: "https://foo-1.com",
      published: new Date("2001-01-01T01:01:01Z").toISOString(),
      updated: new Date("2001-01-01T01:01:01Z").toISOString(),
      id: "foo-id-1",
      content: "<p>Foo content1</p>",
      author: "author1",
      category: "foo-category",
      summary: "Foo announcement summary 1"
    },
    {
      title: "Foo announcement 2",
      link: "https://foo-2.com",
      published: new Date("2002-02-02T02:02:02Z").toISOString(),
      updated: new Date("2002-02-02T02:02:02Z").toISOString(),
      id: "foo-id-2",
      content: "<p>Foo content2</p>",
      author: "author2",
      category: "foo-category",
      summary: "Foo announcement summary 2"
    }
  ];

  const fakeFeedXML = `
  <feed xmlns="http://www.w3.org/2005/Atom">
    <generator uri="https://jekyllrb.com/" version="3.10.0">Jekyll</generator>
    <link href="https://helioviewer-project.github.io/feed.xml" rel="self" type="application/atom+xml"/>
    <link href="https://helioviewer-project.github.io/" rel="alternate" type="text/html"/>
    <updated>${new Date().toISOString()}</updated>
    <id>https://helioviewer-project.github.io/feed.xml</id>
    <title type="html">Helioviewer Project1</title>
    <subtitle>Visualization of solar and heliospheric data</subtitle>
    ${fakeNews
      .map(
        (fakenew) => `
      <entry>
        <title type="html">${fakenew.title}</title>
        <link href="${fakenew.link}" rel="alternate" type="text/html" title="${fakenew.title}"/>
        <published>${fakenew.published}</published>
        <updated>${fakenew.updated}</updated>
        <id>${fakenew.id}</id>
        <content type="html"><![CDATA[ ${fakenew.content} ]]></content>
        <author><name>${fakenew.author}</name></author>
        <category term="${fakenew.category}"/>
        <summary type="html"><![CDATA[ ${fakenew.summary} ]]></summary>
      </entry>
    `
      )
      .join("")}
  </feed>`;

  await page.route(`**/*action=getNewsFeed`, async (route) => {
    // Fetch original response.
    const response = await route.fetch();

    await route.fulfill({
      contentType: "text/xml",
      body: fakeFeedXML
    });
  });

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();

  // 2. CLICK NEWS BUTTON TO SHOW NEWS
  await hv.toggleNewsAndAnnouncements();

  // 3. ASSERT TEXT FROM FAKE NEWS SHOULD BE VISIBLE
  await expect(page.getByText("Foo announcement 1")).toBeVisible();
  await expect(page.getByText("2001-01-01 01:01:01.000Z UTC")).toBeVisible();
  await expect(page.getByText("Foo announcement summary 1")).toBeVisible();
  await expect(page.getByText("Foo announcement 2")).toBeVisible();
  await expect(page.getByText("2002-02-02 02:02:02.000Z UTC")).toBeVisible();
  await expect(page.getByText("Foo announcement summary 2")).toBeVisible();

  // 4. CLICK NEWS BUTTON TO HIDE NEWS
  await hv.toggleNewsAndAnnouncements();

  // 5. ASSERT TEXT FROM FAKE NEWS SHOULD NOT BE VISIBLE
  await expect(page.getByText("Foo announcement 1")).not.toBeVisible();
  await expect(page.getByText("2001-01-01 01:01:01.000Z UTC")).not.toBeVisible();
  await expect(page.getByText("Foo announcement summary 1")).not.toBeVisible();
  await expect(page.getByText("Foo announcement 2")).not.toBeVisible();
  await expect(page.getByText("2002-02-02 02:02:02.000Z UTC")).not.toBeVisible();
  await expect(page.getByText("Foo announcement summary 2")).not.toBeVisible();
});
