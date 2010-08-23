var libeConfigFunc = function (data) {
   
    var evenSideElement = document.getElementById('evenSide');
    var oddSideElement = document.getElementById('oddSide');
    var accessLevel = 0;
    
    var canAccess = function(pageNumber, pageId) {
        return settings.accessLevel > 0 || settings.pagesFree.indexOf(pageNumber) >= 0;
    };
    
    var canZoom = function() {
        return settings.accessLevel > 0 && settings.pageWidth && settings.pageHeight;
    };
    
    var changeAccessLevel = function(newlevel) {
        settings.accessLevel = newlevel;
    };

    var setSize = function(w, h) {
        // dynamic config should set height
        if (w) {
            libeConfig.pageWidth = w
            // libeConfig.pageHeight = h
            // libeConfig.pageThumbnailHeight = 
            libeConfig.pageThumbnailWidth = parseInt(w * libeConfig.pageThumbnailHeight / libeConfig.pageHeight, 10);
            jQuery(window).trigger('size-known');
            return true;
        }
        return false;
    };

    this.settings = {
        'accessLevel' : accessLevel,
        'changeAccessLevel' : changeAccessLevel,
        'canAccess': canAccess,
        'canZoom': canZoom,
        'setSize' : setSize,
        'evenSideElement' : evenSideElement,
        'oddSideElement' : oddSideElement, 
        'pageWidth': 0,
        'pageHeight': 0,
        'pageThumbnailWidth': 0,
        'pageThumbnailHeight': 0
    };
    
    for (d in data) {
        if (typeof d == 'string') {
            this.settings[d] = data[d];
        }
    }    
    
    return this.settings;
}
