<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Helioviewer.org - Recent Videos</title>
    <link rel="stylesheet" href="http://code.jquery.com/mobile/latest/jquery.mobile.min.css" />
    <script type="text/javascript" src="http://code.jquery.com/jquery-1.5.2.min.js"></script>
    <script type="text/javascript" src="http://code.jquery.com/mobile/latest/jquery.mobile.js"></script>
</head>
<body>
    <div id="main" data-role="page"> 
    <div data-role="header" data-theme="a">
        <h1>Helioviewer.org - Recent Videos</h1>
    </div> 
    <div data-role="content">
        <ul id="videos" data-role="listview">
        </ul>
    </div> 
    <div data-role="footer">
        <!--<a href="#page=2" data-icon="arrow-r" class="ui-btn-right">Next</a>-->
    </div> 
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
                    
                    html = "<li><a href='" + video.url + "' target='_blank'><img style='margin-top: 10px;' src='" + 
                           video.thumbnails.small + "' /><h3>" + date + "</h3>" +
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
