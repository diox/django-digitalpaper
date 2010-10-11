var libePage = function(pageNumber, pageId, pageChannel, pageMaps) {
    var _pageElement = [], _areasElement = [];
    var map = {};
    var _pageNumber = -1, _pageId = -1;
    var _mapsLoaded = false;
    var _smallImageSource = null, _smallestImageSource = null, _imageSource = null;
    var _pageChannel = "";
    
    function defaultAjaxError(XMLHttpRequest, textStatus, errorThrown) {
        console.log(XMLHttpRequest, textStatus, errorThrown);
    }
    
    function handleMap() {
        if (_mapsLoaded) {
            return;
        }
        if (!libeConfig.pageWidth) {
            // too soon! better luck next time.
            return;
        }
        _mapsLoaded = true;
        if (!map || !map.areas || !map.areas.length || !map.width || !map.height) {
            return;
        }
        var reductionRatio = libeConfig.pageWidth / map.width;
        for (var i = 0, il = map.areas.length; i < il; i++) {
            var area = map.areas[i];
            var coords = area.coords.split(",");
            var left = Math.ceil(coords[0] * reductionRatio);
            var top = Math.ceil(coords[1] * reductionRatio);
            var width = Math.ceil( (coords[2] - coords[0]) * reductionRatio );
            var height = Math.ceil( (coords[3] - coords[1]) * reductionRatio );
            
            var areaElement = document.createElement('a');
            areaElement.className = "area";
            areaElement.href = "#";
            areaElement.style.left = left + "px";
            areaElement.style.top = top + "px";
            areaElement.style.width = width + "px";
            areaElement.style.height = height + "px";
            
            areaElement = jQuery(areaElement);
            areaElement.click(openArea);
            _areasElement.push(areaElement);
            jQuery(_pageElement).append(areaElement);
            
            areaElement.data('area', area);
            areaElement.hover(function() {
                var target = jQuery(this);
                var objectId = target.data('area').object_id;
                jQuery('.area').trigger("highlight-area-" + objectId);
            }, function() {
                var target = jQuery(this);
                var objectId = target.data('area').object_id;
                jQuery('.area').trigger("unhighlight-area-" + objectId);
            });
            
            areaElement.bind('highlight-area-' + area.object_id, highlightArea);
            areaElement.bind('unhighlight-area-' + area.object_id, unhighlightArea);
        }
    }
    
    function openArea() {
        if (!libeConfig.canUseMap(_pageNumber, _pageId)) {
            libeConfig.restrictedAccess();
            return false;
        }
        var data = jQuery(this).data('area');
        if (data.object_class == "article") {
            var url = libeConfig.webservices.contentmodel_content
            var replaces = {
                '{emitter_format}' : 'html',
                '{id}' : data.object_id,
                '{type}' : 'article'
            }

            for (key in replaces) {
                url = url.replace(key, replaces[key]);
            }
            
            var key = 'default'
            if (typeof libeConfig.modelmapping[data.object_class] !== 'undefined') {
                key = data.object_class
            }

            if (libeConfig.modelmapping[key] == 'iframe') {
                jQuery(this).openDOMWindow({
                    windowSourceURL: url,
                    windowSourceID: 'reader_contentmodel_content', 
                    height:400, 
                    width:700, 
                    positionType:'absolute', 
                    positionTop:50, 
                    positionLeft:50, 
                    windowSource:'iframe', 
                    loader:1
                });
            } else {
                window.open(url); // FIXME
            }
        }
        return false;
    }

    function highlightArea() {
        jQuery(this).clearQueue().animate({opacity: 0.1}, 300);
    }
    function unhighlightArea() {
        jQuery(this).clearQueue().animate({opacity: 0}, 300);
    }
        
    function show() {
        jQuery(_pageElement).show();
    }
    
    function hide() {
        jQuery(_pageElement).hide();
    }
    
    function getPageInfo() {
        return '<span class="pageNumber">' + _pageNumber + '</span>'
             + '<span class="pageChannel">' + _pageChannel + '</span>';
    }
    
    function getThumbnailForList(book, size) {
        var src;
        if (typeof size == 'undefined' || size != 'smallest') {
            size = 'small';
            src = _smallImageSource;
        } else {
            src = _smallestImageSource;
        }
        var a = jQuery('<a class="loading ' + size + ' ' + (_pageNumber % 2 ? 'odd' : 'even') + '" href="#' + book + '_' + _pageNumber + '"></a>');
        var img = jQuery('<img src="' + src + '" />');
        img.bind('load', function(e) {
            jQuery(this).parent().removeClass('loading');
        });
        img.bind('error', function(e) {
            jQuery(this).parent().removeClass('loading');
            jQuery(this).parent().addClass('warning');            
        });
        a.append('<span class="pageNumber">' + _pageNumber + '</span>')
        a.append(img);
        return a;
    }
    
    // Init Code
    
    if (typeof(pageNumber) !== 'undefined') {
        _pageNumber = parseInt(pageNumber, 10);
    }

    if (typeof(pageId) !== 'undefined') {
        _pageId = parseInt(pageId, 10);
    }
    
    if (typeof(pageChannel) !== 'undefined') {
        _pageChannel = pageChannel;
    }
    
    _pageElement = document.createElement("div");
    _pageElement.className = "page loading";
    if (_pageId > 0) {
        _pageElement.id = 'page_' + _pageId;
    }
    
    var baseSrc = "";
    // Set thumbnails, they are always visible, unless the page is under construction
    if (_pageId > 0) {
        baseSrc = libeConfig.webservices.paper_page_resized.replace('{emitter_format}', 'jpg').replace('{id}', _pageId)
        _smallestImageSource = baseSrc.replace('{size}', 'x50');
        _smallImageSource    = baseSrc.replace('{size}', 'x148');
    } else {
        _smallestImageSource = libeConfig.pageUnderConstructionImageSmallest;
        _smallImageSource = libeConfig.pageUnderConstructionImage;
    }

    if (_pageNumber <= 0) {
        // non existant page, do nothing
    } else if (!libeConfig.canAccess(_pageNumber, _pageId)) {
        // page that the user isn't allowed to read
        var img = document.createElement("img");
        img.src = _imageSource = libeConfig.pageLimitedAccessImage;
        _pageElement.appendChild(img);
    } else if (_pageId <= 0) {
        // page not yet included in the book, but that should exist: display it as "under construction"
        var img = document.createElement("img");
        img.src = _imageSource = libeConfig.pageUnderConstructionImage;
        _pageElement.appendChild(img);
    } else {
        // normal page
        map = pageMaps;
        var img = document.createElement("img");
        jQuery(img).bind('load', function(e) {
            jQuery(_pageElement).removeClass('loading');
            // Little trick: use _pageElement and not the image to find out the dimensions of the 
            // content, since the load event might occur at a time the image is hidden (if the user
            // is flipping through pages very fast).
            if (libeConfig.setSize(jQuery(_pageElement).width(), jQuery(_pageElement).height())) {
                // handleMap() would make more sense in showPage(), but we really need
                // to know the right width before calling it, so we call it here.
                handleMap();
            }
        });
        jQuery(img).bind('error', function(e) {
            jQuery(_pageElement).removeClass('loading');
            jQuery(_pageElement).addClass('warning');
        });
        // FIXME don't hardcore sizes, get them from config
        img.src = _imageSource = baseSrc.replace('{size}', 'x500');
        _pageElement.appendChild(img);
    }
    
    if (_pageNumber % 2 == 0) {
        libeConfig.evenSideElement.appendChild(_pageElement);
    } else {
        libeConfig.oddSideElement.appendChild(_pageElement);
    }
    
    return {
        show: show,
        hide: hide,
        imageSource: _imageSource,
        pageId: _pageId,
        pageNumber: _pageNumber,
        handleMap: handleMap,
        getPageInfo: getPageInfo,
        getThumbnailForList: getThumbnailForList
    }
}
