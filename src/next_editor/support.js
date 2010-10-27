/** Namespace for feature support detection across browsers. */
NextEditor.Support = { }

/** True if the browser suports textInput in the DOM level 3 Events spec. */
NextEditor.Support.hasTextInput = function() {
  var probe = document.createEvent('TextEvent');
  // Firefox creates its own proprietary 'text' event, but we catch it because
  // it doesn't have the data property mandated in the standard.
  return !!(probe && (probe.data != undefined));
};
  
/** True if the browser supports contentEditable form editors. */
NextEditor.Support.hasContentEditable = function() {
  var probe = document.createElement('div');
  if (typeof(probe.contentEditable) == 'string') {
    // HACK: Safari in iOS3 falsely claims that it supports contentEditable
    var ua = navigator.userAgent;
    if ((ua.indexOf("iPod;") >= 0 || ua.indexOf("iPad;")  >= 0) &&
        ua.indexOf("OS 3") >= 0) {
      return false;
    }
    
    return true;
  }
  else {
    return false;
  }
};
