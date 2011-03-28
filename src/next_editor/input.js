/** Creates an input handler for the NextLang syntax-highlighting editor.
 *
 * The options object should have the following properties:
 *   eventSource:: the input-receiving element
 *   observer:: the object which receives input notifications
 *   multiLine:: if set, Enter key presses will be treated as carriage returns,
 *               and users will have to click Ctrl+Enter for form submission
 *   imeSupport:: supress change notifications while an IME interface is active
 * 
 * The following notifications will be dispatched:
 *   onPossibleChange:: the input field's contents might have changed; false
 *                      positives may happen (no actual change), but the method
 *                      will definitely be called when a change occurs (no false
 *                      negatives)
 *   onSubmitKey:: the user expressed their desire to submit the editor's input
 *                 (e.g., by pressing the Enter key)
 */
NextEditor.Input = function (options) {
  this.observer = options.observer;
  if (!this.observer) {
    if (window.console) {
      window.console.error("No observer given! noop");
    }
    return;
  }

  var eventSource = options.eventSource;
  if (!eventSource) {
    if (window.console) {
      window.console.error("No eventSource given! noop");
    }
    return;
  }

  this.createUnboundFunctions();
  
  if (options.imeSupport) {
    eventSource.addEventListener('compositionstart',
                                 this.unboundOnIMECompositionStart, false);
    eventSource.addEventListener('compositionend',
                                 this.unboundOnIMECompositionEnd, false);
  }
  this.multiLine = options.multiLine;
  eventSource.addEventListener('keydown', this.unboundOnKeyDown, false);

  if (NextEditor.Support.hasTextInput()) {
    eventSource.addEventListener('textInput', this.unboundOnTextInput, false);
    eventSource.addEventListener('keyup', this.unboundOnModernKey, false);
  }
  else {
    // Firefox doesn't have a uniform "textInput" event.
    eventSource.addEventListener('keyup', this.unboundOnFirefoxKey, false);
    eventSource.addEventListener('focus', this.unboundOnFocus, false);
    eventSource.addEventListener('blur', this.unboundOnBlur, false);

    this.isFocused =
        document.hasFocus() && document.activeElement === eventSource;
    if (this.isFocused) {
      this.changeTick();
    }
  }
};

/** Creates unbound versions of some methods, with minimum closure overhead. */
NextEditor.Input.prototype.createUnboundFunctions = function () {
  var context = this;
  this.unboundChangeTick = function () {
    context.changeTick();
  };
  this.unboundNotifyChange = function () {
    context.notifyChange();
  };
  this.unboundOnIMECompositionStart = function (event) {
    context.onIMECompositionStart(event);
  };
  this.unboundOnIMECompositionEnd = function (event) {
    context.onIMECompositionEnd(event);
  };
  this.unboundOnKeyDown = function (event) {
    context.onKeyDown(event);
  };
  this.unboundOnTextInput = function (event) {
    context.onTextInput();
  };
  this.unboundOnModernKey = function (event) {
    context.onModernKey(event);
  };
  this.unboundOnFirefoxKey = function (event) {
    context.onFirefoxKey(event);
  };
  this.unboundOnFocus = function (event) {
    context.onFocus(event);
  };
  this.unboundOnBlur = function (event) {
    context.onBlur(event);
  };
};

/** Issues a change notification after some time, so UI changes can  sink in. */
NextEditor.Input.prototype.delayedNotifyChange = function () {
  setTimeout(this.unboundNotifyChange, 10);
};

/** True when an IME UI is displayed to help the user select characters. */
NextEditor.Input.prototype.imeCompositionInProgress = false;

/** Called when an IME UI is displayed to help the user select characters.
 *
 * We won't change the editor's DOM while the IME UI is messing with the
 * input, because that throws off the IME UI.
 */
NextEditor.Input.prototype.onIMECompositionStart = function (event) {
  this.imeCompositionInProgress = true;
  return true;
};

/** Called when IME input stops.
 *
 * We won't change the editor's DOM while IME input is happening, because that
 * throws off the IME editors.
 */
NextEditor.Input.prototype.onIMECompositionEnd = function (event) {
  this.imeCompositionInProgress = false;
  this.delayedNotifyChange();
  return true;
};

/** Fires the submission callback when the user presses Enter. */
NextEditor.Input.prototype.onKeyDown = function (event) {
  if (event.which === 13 &&
      (!this.multiLine || event.ctrlKey || event.shiftKey)) {
    if (this.observer.onSubmitKey) {
      if (!this.observer.onSubmitKey(event)) {
        event.preventDefault();
        return false;
      }
    }
  }
  return true;
};

/** Called on textInput events, for browsers that do DOM 3 events. */
NextEditor.Input.prototype.onTextInput = function (event) {
  this.delayedNotifyChange();
  return true;
};

/** Called in Firefox when key presses are detected.
 * 
 * This never happens while an IME interface is active.
 */
NextEditor.Input.prototype.onFirefoxKey = function (event) {
  this.imeCompositionInProgress = false;
  this.delayedNotifyChange();
  return true;
};

/** Called in standards-compliant browsers when key presses are detected.
 * 
 * This catches the user pressing backspace, tab, and stuff like that.
 */
NextEditor.Input.prototype.onModernKey = function (event) {
  this.delayedNotifyChange();
  return true;
};

/** True when the input element has the focus. */
NextEditor.Input.prototype.isFocused = false;

/** Called when the editor element receives focus. We poll for changes. */
NextEditor.Input.prototype.onFocus = function (event) {
  this.isFocused = true;
  this.changeTick();
};

/** Called when the editor element loses focus. */
NextEditor.Input.prototype.onBlur = function (event) {
  this.isFocused = false;
};

/** While the editor element has focus, check for changes every 20ms. */
NextEditor.Input.prototype.changeTick = function (event) {
  this.notifyChange(event);
  if (this.isFocused) {
    setTimeout(this.unboundChangeTick, 20);
  }
};

/** Notifies the observer that the input field contents might have changed. */
NextEditor.Input.prototype.notifyChange = function () {
  if (this.imeCompositionInProgress) {
    return;
  }
  this.observer.onPossibleChange();
};
