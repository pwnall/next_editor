/** Creates an input handler for the NextLang syntax-highlighting editor.
 *
 * The options object should have the following properties:
 *   eventSource:: the input-receiving element
 *   observer:: the object which receives input notifications
 *   multiLine:: if set, Enter key presses won't be treated as form submission
 *               requests
 *   imeSupport:: supress change notifications while an IME interface is active
 * 
 * The following notifications will be dispatched:
 *   onSubmitKey:: the user expressed their desire to submit the editor's input
 *                 (e.g., by pressing the Enter key)
 *   onPossibleChange:: the input field's contents might have changed; false
 *                      positives may happen (no actual change), but the method
 *                      will definitely be called when a change occurs (no false
 *                      negatives)
 */
NextEditor.Input = function(options) {
  this.observer = options.observer;
  if (!this.observer) {
    window.console && console.error("No observer given! noop");
    return;
  }

  var eventSource = options.eventSource;
  if (!eventSource) {
    window.console && console.error("No eventSource given! noop");
    return;
  }

  this.createUnboundFunctions();
  
  if (options.imeSupport) {
    $(eventSource).bind('compositionstart', this, this.onIMECompositionStart);  
    $(eventSource).bind('compositionend', this, this.onIMECompositionEnd);
  }  
  if (!options.multiLine) {
    $(eventSource).bind('keydown', this, this.onKeyDown);
  }

  if (NextEditor.Support.hasTextInput()) {
    $(eventSource).bind('textInput', this, this.onTextInput);
  }
  else {
    // Firefox doesn't have a uniform "textInput" event.
    $(eventSource).bind('keyup', this, this.onFirefoxKey);
    $(eventSource).bind('focus', this, this.onFocus);
    $(eventSource).bind('blur', this, this.onBlur);

    this.isFocused =
        document.hasFocus() && document.activeElement == eventSource;
    if (this.isFocused) {
      this.changeTick();
    }
  }
};

/** Creates unbound versions of some methods, with minimum closure overhead. */
NextEditor.Input.prototype.createUnboundFunctions = function() {
  var context = this;
  this.unboundChangeTick = function() { context.changeTick(); };
  this.unboundNotifyChange = function() { context.notifyChange(); };
  this.delayedNotifyChange =
      function() { setTimeout(this.unboundNotifyChange, 10); };
};

/** True when an IME UI is displayed to help the user select characters. */
NextEditor.Input.prototype.imeCompositionInProgress = false;

/** Called when an IME UI is displayed to help the user select characters.
 *
 * We won't change the editor's DOM while the IME UI is messing with the
 * input, because that throws off the IME UI.
 */
NextEditor.Input.prototype.onIMECompositionStart = function(event) {
  event.data.imeCompositionInProgress = true;
  return true;
};

/** Called when IME input stops.
 *
 * We won't change the editor's DOM while IME input is happening, because that
 * throws off the IME editors.
 */
NextEditor.Input.prototype.onIMECompositionEnd = function(event) {
  event.data.imeCompositionInProgress = false;
  event.data.delayedNotifyChange();
  return true;
};

/** Fires the submission callback when the user presses Enter. */
NextEditor.Input.prototype.onKeyDown = function(event) {
  if (event.which == 13) {
    event.preventDefault();
    event.data.observer.onSubmitKey();
    return false;
  }
  return true;
};

/** Called on textInput events, for browsers that do DOM 3 events. */
NextEditor.Input.prototype.onTextInput = function(event) {
  event.data.delayedNotifyChange();
  return true;
};

/** Called in Firefox when key presses are detected.
 * 
 * This never happens while an IME interface is active.
 */
NextEditor.Input.prototype.onFirefoxKey = function(event) {
  event.data.onFirefoxTextImeMode = false;
  event.data.delayedNotifyChange();
  return true;
};

/** True when the input element has the focus. */
NextEditor.Input.prototype.isFocused = false;

/** Called when the editor element receives focus. We poll for changes. */
NextEditor.Input.prototype.onFocus = function() {
  event.data.isFocused = true;
  event.data.changeTick();
};

/** Called when the editor element loses focus. */
NextEditor.Input.prototype.onBlur = function(event) {
  event.data.isFocused = false;
};

/** While the editor element has focus, check for changes every 100ms. */
NextEditor.Input.prototype.changeTick = function(event) {
  this.notifyChange(event);
  if (this.isFocused) setTimeout(this.unboundChangeTick, 100);
};

/** Notifies the observer that the input field contents might have changed. */
NextEditor.Input.prototype.notifyChange = function(event) {
  this.observer.onPossibleChange();
};
