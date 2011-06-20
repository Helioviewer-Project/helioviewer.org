<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Helioviewer.org - Video Gallery</title>
    <link rel="stylesheet" href="http://code.jquery.com/mobile/latest/jquery.mobile.min.css" />
    <script type="text/javascript" src="http://code.jquery.com/jquery-1.5.2.min.js"></script>
    <script type="text/javascript" src="http://code.jquery.com/mobile/latest/jquery.mobile.min.js"></script>
</head>
<body>
    <div id="main" data-role="page"> 
    <div data-role="header" data-theme="b"><h1>Helioviewer.org - Video Gallery</h1></div> 
    <div data-role="content">
        <ul id="videos" data-role="listview">
        </ul>
    </div> 
    <div data-role="footer"></div> 
    </div>
    <script type="text/javascript" src="../src/Utility/HelperFunctions.js"></script>
    <script type="text/javascript">
        $(function () {
            var params, callback, $videos = $("#videos");
            
            params = {
                "action": "getUserVideos",
                "pageSize": 20,
                "pageNum": 1
            };
            
            callback = function (videos) {
                $.each(videos, function (i, video) {
                    var html, date;
                    
                    date = new Date.parseUTCDate(video.published).getElapsedTime() + " ago";
                    
                    html = "<li><a href='" + video.url + "'><img src='" + 
                           video.thumbnails.small + "' /><h3>" + date + "</h3>" +
                           "<p>description</p>" +
                           "</a></li>";
                    $videos.append(html);
                });
                
                $videos.listview("refresh");
            };
            
            $.getJSON("../api/", params, callback);
        });
    </script>
</body>
</html>
