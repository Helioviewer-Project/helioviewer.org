String.prototype.lpad = function (padString, length) {
    "use strict";
    var str = this;
    while (str.length < length) {
        str = padString + str;
    }
    return str;
};


function qs(key) {
    "use strict";
    // escape RegEx control chars
    key = key.replace(/[*+?\^$.\[\]{}()|\\\/]/g, "\\$&");
    var match = location.search.match(new RegExp("[?&]" + key +
        "=([^&]+)(&|$)"));
    return match && decodeURIComponent(match[1].replace(/\+/g, " "));
}


function decodeResolutionParam(resolutionParam) {
    "use strict";
    if (resolutionParam === undefined) {
        resolutionParam = qs('resolution');
    }

    return {
        'value' : resolutionParam,
        'magnitude' : resolutionParam.slice(0, -1),
        'period_abbr' : resolutionParam.slice(-1)
    };
}

function getPeriodInSeconds(resolutionParam) {
    "use strict";
    var resolution, seconds;

    resolution = decodeResolutionParam(resolutionParam);

    switch (resolution.period_abbr) {
    case 'm':
        seconds = 60 * resolution.magnitude;
        break;
    case 'h':
        seconds = 60 * 60 * resolution.magnitude;
        break;
    case 'D':
        seconds = 60 * 60 * 24 * resolution.magnitude;
        break;
    case 'W':
        seconds = 60 * 60 * 24 * 7 * resolution.magnitude;
        break;
    case 'M':
        seconds = 60 * 60 * 24 * 30 * resolution.magnitude;
        break;
    case 'Y':
        seconds = 60 * 60 * 24 * 365 * resolution.magnitude;
        break;
    default:
        alert('Unknown timespan abbreviation: ' + resolution.period_abbr);
        return;
    }

    return seconds;
}


function timeOption(id, start, stop, step, header, leftPadAmount, selected) {
    "use strict";
    var select, child, value, i;

    step = step !== undefined ? step : 1;


    select = $('#' + id);
    if (header !== undefined) {
        select.html('<option>' + header + '</option><option> </option>');
    }

    if (stop > start) {
        for (i = start; i <= stop; i = i + step) {
            value = i;
            if (leftPadAmount !== undefined) {
                value = i.toString().lpad('0', leftPadAmount);
            }
            child = document.createElement('option');
            $(child).attr('value', value);
            $(child).html(value.toString());
            if (i === parseInt(selected, 10)) {
                $(child).attr('selected', true);
            }
            $(select).append(child);
            $(select).show();
        }
    } else {
        for (i = start; i >= stop; i = i + step) {
            value = i;
            if (leftPadAmount !== undefined) {
                value = i.toString().lpad('0', leftPadAmount);
            }
            child = document.createElement('option');
            $(child).attr('value', value);
            $(child).html(value.toString());
            if (i === parseInt(selected, 10)) {
                $(child).attr('selected', true);
            }
            $(select).append(child);
            $(select).show();
        }
    }

}

function jump() {
    "use strict";
    var url, date, seconds, steps, id;

    id = $(this).attr('id').split('_')[1];

    url = location.origin + location.pathname + '?';

    if (qs('endDate') !== null) {
        date = new Date(Date.parse(qs('endDate')));
    } else {
        date = new Date();
    }


    seconds = getPeriodInSeconds();
    steps = $('#select_' + id + ' option:selected').val();


    if (this.attributes.id.value.indexOf('prev') !== -1) {
        date = new Date(date.getTime() - (steps * seconds * 1000));
    } else {
        date = new Date(date.getTime() + (steps * seconds * 1000));
    }

    url += 'resolution=' + qs('resolution');
    url += '&';
    url += 'endDate=' + date.toISOString();
    url += '&';
    url += 'jumpBy=' + steps;
    url += this.attributes['data-hash'].value;

    $(location).attr('href', url);
}

function stepMenu(node, id) {
    "use strict";
    var select, option, selected,
        options = [7, 14, 24, 26, 30, 48, 52];

    selected = qs('jumpBy');
    selected = parseInt(selected, 10);
    if (selected === undefined || options.indexOf(selected) === -1) {
        selected = options[2];
    }

    select = document.createElement('select');
    $(select).attr('id', 'select_' + id);
    node.append(select);

    $.each(options, function (i, value) {
        option = document.createElement('option');
        $(option).val(value);
        $(option).html(value);
        if (parseInt(value, 10) === selected) {
            $(option).attr('selected', true);
        }
        $(select).append(option);
    });
}


function createColumnChart(id, rows, desc, height, color) {
    "use strict";
    var width, data, row, chart, node;

    width = $(window).width();

    // Build datatable
    data = new google.visualization.DataTable();
    data.addColumn('string', 'Time');
    data.addColumn('number', desc);
    data.addRows(rows.length);

    // Set datatable values
    row = 0;
    $.each(rows, function (i, pair) {
        var key;
        // Grab key and value from the pair
        for (key in pair) {
            if (pair.hasOwnProperty(key)) {
                data.setValue(row, 0, key);
                data.setValue(row, 1, pair[key]);
            }
        }
        row += 1;
    });

    node = $("#barCharts");
    node.append('<a id="' + desc.replace(/ /g, '') + '" name="' +
        desc.replace(/ /g, '') + '"> </a>');

    node.append('<div id="' + id + 'Chart" class="columnChart"></div>');
    node.append('<br />');
    node.append('<a id="prev_' + id + '" class="button">&larr; Prev</a>');
    stepMenu(node, id);
    node.append('<a id="next_' + id + '" class="button">Next &rarr;</a>');
    node.append('<br />');

    $('#prev_' + id).attr('data-hash', '#' + desc.replace(/ /g, ''));
    $('#prev_' + id).bind('click', jump);

    $('#next_' + id).attr('data-hash', '#' + desc.replace(/ /g, ''));
    $('#next_' + id).bind('click', jump);

    chart = new google.visualization.ColumnChart(document.getElementById(id +
        "Chart"));
    chart.draw(data, {
        width: width,
        height: height,
        colors: [color],
        legend: 'none',
        title: desc,
        hAxis: {slantedText: true, slantedTextAngle: 50, showTextEvery: 1,
                textStyle: { fontSize: '12'} },
        vAxis: {viewWindow: {min: 0} }
    });
}


function displayDataCoverage(dataCoverage) {
    "use strict";
    var barChartHeight = 550, count = 0,
        colors = ["#d53e4f", "#f46d43", "#fdae61",
                  "#fee08b", "#ffffbf", "#e6f598",
                  "#abdda4", "#66c2a5", "#3288bd"];

    $.each(dataCoverage, function (i, dataSource) {
        createColumnChart(dataSource.sourceId, dataSource.data,
            dataSource.label, barChartHeight, colors[count % colors.length]);
        count += 1;
    });

    // Now that charts are rendered, scroll to specified anchor tag
    if (location.hash !== '') {
        document.getElementById(location.hash.substr(1)).scrollIntoView();
    }
}


function getDataCoverage(timeInterval, endDate) {
    "use strict";
    $.getJSON(
        "../api/index.php",
        {
            action: "getDataCoverage",
            resolution: timeInterval,
            endDate: endDate
        },
        function (response) {
            displayDataCoverage(response);
        }
    );
}


function redraw(resolution, dateTime) {
    "use strict";
    var endDate, url = 'http://'+location.hostname+'/coverage/?';

    if (resolution === undefined || typeof resolution == 'object') {
        resolution = qs('resolution');
    }

    if (dateTime !== undefined) {
        endDate = dateTime;
    } else {
        endDate  =       $('#yyyy option:selected').val();
        endDate += '-' + $('#mm option:selected').val();
        endDate += '-' + $('#dd option:selected').val();
        endDate += 'T' + $('#hour option:selected').val();
        endDate += ':' + $('#min option:selected').val();
        endDate += ':00Z';
    }

    url += 'resolution=' + resolution + '&endDate=' + endDate;
    $(location).attr('href', url);
}


google.load("jquery", "1.5");
google.load("visualization", "1", { packages: ["corechart"] });

google.setOnLoadCallback(function () {
    "use strict";
    var yyyy, mm, dd, hr, min, sec, resolution, endDate, now = new Date();

    endDate = qs('endDate');
    if (endDate !== null) {
        yyyy = endDate.slice(0, 4);
        mm   = endDate.slice(5, 7);
        dd   = endDate.slice(8, 10);
        hr   = endDate.slice(11, 13);
        min  = endDate.slice(14, 16);
        sec  = endDate.slice(17, 19);
    } else {
        yyyy =  now.getFullYear().toString().lpad('0', 4);
        mm   = (now.getMonth() + 1).toString().lpad('0', 2);
        dd   =  now.getDate().toString().lpad('0', 2);
        hr   =  now.getHours().toString().lpad('0', 2);
        min  =  now.getMinutes().toString().lpad('0', 2);
        sec  =  now.getSeconds().toString().lpad('0', 2);
        endDate = yyyy + '-' + mm + '-' + dd +
                 'T' + hr + ':' + min + ':' + sec + 'Z';
    }

    timeOption('yyyy', now.getFullYear(), 1990, -1, 'YYYY',
        null, yyyy);
    timeOption('mm', 1, 12, 1, 'MM', 2, mm);
    timeOption('dd', 1, 31, 1, 'DD', 2, dd);
    $('#datePicker').show();

    timeOption('hour', 0, 23, 1, 'hh', 2, hr);
    timeOption('min',  0, 55, 5, 'mm', 2, 55);
    resolution = qs('resolution');
    if (resolution === null) {
        resolution = '1D';
    }
    if (resolution.slice(-1) === 'm') {
        $('#timePicker').show();
    } else {
        $('#timePicker').hide();
    }

    getDataCoverage(resolution, endDate);
    $('#yyyy').bind('change', redraw);
    $('#mm').bind('change', redraw);
    $('#dd').bind('change', redraw);
    $('#hour').bind('change', redraw);
    $('#min').bind('change', redraw);
});