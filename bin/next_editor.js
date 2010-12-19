/** NextLang message composer UI.
 * Copyright 2010 Victor Costan and Ying Yin. MIT License.
 */

/*jslint white: true, maxlen: 80, indent: 2, onevar: false */
/*global document, window, navigator, setTimeout, $ */

/** Namespace for the NextLang syntax-highlighting editor. */
var NextEditor = {};
 
/** Constructs a syntax-highlighting editor.
 *
 * The options object should have the following properties:
 *   inputElement:: textarea serving as a placeholder for the editor; the
 *                  textarea will receive the editor's input
 *   formElement:: submitted when the user presses Enter (optional)
 *   forceWater:: uses the Water UI, even in newer browsers; intended for
 *                debugging the rigid CSS, or the Water itself
 *   tokenizer:: decies who 
 */
NextEditor.create = function (options) {
  var formElement = options.formElement;
  var formSubmitter = (formElement) ? (new NextEditor.Submitter(formElement)) :
                                      null;
    
  var tokenizer = options.tokenizer;
  if (!tokenizer) {
    tokenizer = new NextEditor.Tokenizers.WordTokenizer({});
  }
  
  var UIClass = NextEditor.UI.editorClass(options.forceWater);
  var editorUI = new UIClass({
    inputElement: options.inputElement,
    formSubmitter: formSubmitter,
    tokenizer: tokenizer
  });
  
  var inputController = new NextEditor.Input({
    eventSource: editorUI.eventSource(),
    imeSupport: editorUI.needsImeSupport(),
    observer: editorUI,
    multiLine: (formSubmitter ? false : true)
  });

  return { ui: editorUI, input: inputController, tokenizer: tokenizer };
};
/** Namespace for the view code. */
NextEditor.UI = {};

/** The class to be used for the editor's UI. */
NextEditor.UI.editorClass = function (forceWater) {
  if (forceWater || !NextEditor.Support.hasContentEditable()) {
    return NextEditor.UI.Water;
  }
  return NextEditor.UI.Fire;
};
/** Namespace for DOM manipulation methods. */
NextEditor.DOM = { };

/** Parses a DOM element's subtree to get the text and cursor position.
 * 
 * Args:
 *   element:: the DOM element whose text content will be extracted
 *   selection:: a Selection object, usually window.getSelection()
 * 
 * Returns an object with the following properties:
 *   text:: a string containing the element's inner text
 *   cursor:: the index of the character that the cursor precedes
 */
NextEditor.DOM.elementContent = function (element, selection) {
  var text = '';
  var cursor = null;
  if (element.childNodes && element.childNodes.length > 0) {
    for (var i = 0; i < element.childNodes.length; i += 1) {
      var childData = this.elementContent(element.childNodes[i], selection);
      if (childData.cursor !== null) {
        cursor = text.length + childData.cursor;
      }
      else if (selection.focusNode === element && selection.focusOffset === i) {
        cursor = text.length;
      }
      text += childData.text;
    }
  }
  else {
    if (selection.focusNode === element) {
      cursor = selection.focusOffset;
    }
    
    if (element.nodeName === 'BR') {
      text = "\n";
    }
    else if (element.nodeName === '#text') {
      text = element.textContent;
    }
  }
  
  return { text: text, cursor: cursor };
};

/** Builds a DOM tree displaying some tokenized text.
 *
 * Args:
 *   tokens:: array of tokens produced by a NextEditor tokenizer
 *   cursor:: the index of the character that the cursor precedes; can be null
 * 
 * Returns an object with the following properties:
 *   nodes:: array of DOM nodes that should be used as the editor's contents
 *   cursorNode:: the node that the cursor is positioned on; if null, the
 *                cursor is positioned on the editor's node
 *   cursorOffset:: the cursor's offset, in the way that the DOM API expects
 *                  it; this might be the index of a character in a text node,
 *                  or the index of an element within its containing element
 */
NextEditor.DOM.buildDom = function (tokens, cursor) {
  var nodes = [];
  var cursorNode = null;
  var cursorOffset = null;
  
  if (cursor === null) {
    cursor = -1;
  }
  if (cursor === 0) {
    cursorOffset = 0;
  }
  
  for (var i = 0; i < tokens.length; i += 1) {
    var token = tokens[i];
    var runs = token[2].split("\n");
    var textOffset = token[0];
    for (var j = 0; j < runs.length; j += 1) {
      if (j > 0) {
        // Newline.
        var lineBreakNode = document.createElement('br');
        if (cursor === textOffset) {
          cursorOffset = nodes.length;
        }
        nodes.push(lineBreakNode);
        textOffset += 1;
      }
      
      // Run of non-newline characters in token.
      var runText = runs[j];      
      var runLength = runText.length;
      if (runLength === 0) {
        continue;
      }
      var span = document.createElement('span');
      var spanText = document.createTextNode(runText);
      span.appendChild(spanText);
      span.className = token[3];
      nodes.push(span);
      if (cursor > textOffset && cursor < textOffset + runLength) {
        cursorNode = spanText;
        cursorOffset = cursor - textOffset;
      }
      textOffset += runLength;
    }
    if (cursor === textOffset) {
      cursorOffset = nodes.length;
    }
  }

  return { nodes: nodes, cursorNode: cursorNode, cursorOffset: cursorOffset };
};
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
    $(eventSource).bind('compositionstart', this, this.onIMECompositionStart);  
    $(eventSource).bind('compositionend', this, this.onIMECompositionEnd);
  }
  if (!options.multiLine) {
    $(eventSource).bind('keydown', this, this.onKeyDown);
  }

  if (NextEditor.Support.hasTextInput()) {
    $(eventSource).bind('textInput', this, this.onTextInput);
    $(eventSource).bind('keyup', this, this.onModernKey);  
  }
  else {
    // Firefox doesn't have a uniform "textInput" event.
    $(eventSource).bind('keyup', this, this.onFirefoxKey);
    $(eventSource).bind('focus', this, this.onFocus);
    $(eventSource).bind('blur', this, this.onBlur);

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
  event.data.imeCompositionInProgress = true;
  return true;
};

/** Called when IME input stops.
 *
 * We won't change the editor's DOM while IME input is happening, because that
 * throws off the IME editors.
 */
NextEditor.Input.prototype.onIMECompositionEnd = function (event) {
  event.data.imeCompositionInProgress = false;
  event.data.delayedNotifyChange();
  return true;
};

/** Fires the submission callback when the user presses Enter. */
NextEditor.Input.prototype.onKeyDown = function (event) {
  if (event.which === 13) {
    event.preventDefault();
    event.data.observer.onSubmitKey();
    return false;
  }
  return true;
};

/** Called on textInput events, for browsers that do DOM 3 events. */
NextEditor.Input.prototype.onTextInput = function (event) {
  event.data.delayedNotifyChange();
  return true;
};

/** Called in Firefox when key presses are detected.
 * 
 * This never happens while an IME interface is active.
 */
NextEditor.Input.prototype.onFirefoxKey = function (event) {
  event.data.imeCompositionInProgress = false;
  event.data.delayedNotifyChange();
  return true;
};

/** Called in standards-compliant browsers when key presses are detected.
 * 
 * This catches the user pressing backspace, tab, and stuff like that.
 */
NextEditor.Input.prototype.onModernKey = function (event) {
  event.data.delayedNotifyChange();
  return true;
};

/** True when the input element has the focus. */
NextEditor.Input.prototype.isFocused = false;

/** Called when the editor element receives focus. We poll for changes. */
NextEditor.Input.prototype.onFocus = function (event) {
  event.data.isFocused = true;
  event.data.changeTick();
};

/** Called when the editor element loses focus. */
NextEditor.Input.prototype.onBlur = function (event) {
  event.data.isFocused = false;
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
/** Facilitates the submission of a form element. */
NextEditor.Submitter = function (formElement) {
  this.formElement = formElement;
  if (!this.formElement) {
    if (window.console) {
      window.console.error("No form element given! noop");
    }
    return;
  }
};

/** The form to be submitted. */
NextEditor.Submitter.prototype.formElement = null;

/** Set to true when an Enter press is intercepted.
 *
 * Without this, we tend to submit the same message multiple times.
 */
NextEditor.Submitter.prototype.submitted = false;

/** Submits the message composing form via XHR.
 *
 * The method also makes sure that the form is only submitted once.
 */
NextEditor.Submitter.prototype.submit = function () {
  if (this.submitted) {
    return;
  }  
  this.submitted = true;
  
  // HACK: copy-pasted from rails.js because bubbling a submit event failed
  var el      = $(this.formElement),
      method  = el.attr('method') || el.attr('data-method') || 'GET',
      url     = el.attr('action') || el.attr('href'),
      dataType  = el.attr('data-type')  || 'script';

  var data = el.is('form') ? el.serializeArray() : [];
  $.ajax({
    url: url,
    data: data,
    dataType: dataType,
    type: method.toUpperCase()
  });
};
/** Namespace for feature support detection across browsers. */
NextEditor.Support = { };

/** True if the browser suports textInput in the DOM level 3 Events spec. */
NextEditor.Support.hasTextInput = function () {
  var probe = document.createEvent('TextEvent');
  // Firefox creates its own proprietary 'text' event, but we catch it because
  // it doesn't have the data property mandated in the standard.
  return !!(probe && (probe.data !== undefined));
};
  
/** True if the browser supports contentEditable form editors. */
NextEditor.Support.hasContentEditable = function () {
  var probe = document.createElement('div');
  if (typeof(probe.contentEditable) === 'string') {
    // HACK: WebKit in iOS and Android falsely claims that it supports
    //       contentEditable
    var ua = navigator.userAgent;
    if (ua.indexOf("Mobile") >= 0 && ua.indexOf("Safari")  >= 0) {
      return false;
    }
    
    return true;
  }
  else {
    return false;
  }
};
/** Namespace for supported tokenizers. */
NextEditor.Tokenizers = {};

/** Extracts and highlights words in the text.
 *
 * The options object should have the following properties:
 *   nonWordType: token type for non-words
 *   genericWordType: token type for generic words
 *   highlightedWords: map between words to be highlighted and their token types
 *   useSegmentation: if true, each word is segmented into individual characters
 */
NextEditor.Tokenizers.WordTokenizer = function (options) {
  if (options.nonWordType) {
    this.nonWordType = options.nonWordType;
  }
  if (options.genericWordType) {
    this.genericWordType = options.genericWordType;
  }
  if (options.highlightedWords) {
    this.highlightedWords = options.highlightedWords;
  }
  if (options.useSegmentation) {
    this.useSegmentation = options.useSegmentation;
  }
};

/* Token type for non-word contents */
NextEditor.Tokenizers.WordTokenizer.prototype.nonWordType = 'nonword';
/** Token type for generic words. */
NextEditor.Tokenizers.WordTokenizer.prototype.genericWordType = 'word';
/** Map between words to be highlighted and their token types. */
NextEditor.Tokenizers.WordTokenizer.prototype.highlightedWords = {};
/** True if the "words" need to be further segmented (CJK languages). */
NextEditor.Tokenizers.WordTokenizer.prototype.useSegmentation = false;
/** The regular expression used for word characters.*/
NextEditor.Tokenizers.WordTokenizer.prototype.wordRegexp = new RegExp(
  "[A-Za-z]|[\u3040-\u309F]|[\u30A0-\u30FF]|" +
  "[\u4E00-\u9FFF\uF900-\uFAFF\u3400-\u4DBF]"
);

/** Standard tokenizing function.
 * 
 * Args:
 *   text:: a String representing the text to be tokenized
 * 
 * Returns an array of tokens. Each token is an array with the following
 * elements:
 *   * the token's starting offset in the string
 *   * the token's ending offset in the string
 *   * the CSS class for the token
 */
NextEditor.Tokenizers.WordTokenizer.prototype.tokenize = function (text) {
  var ir = [];
  
  // Intermediate Representation: token type = true/false for word/non-word.
  var wordStart = null;
  var nonWordStart = null;
  var regexp = this.wordRegexp;
  for (var i = 0; i < text.length; i += 1) {
    if (text[i].match(regexp)) {
      if (nonWordStart !== null) {
        ir.push([nonWordStart, i, null, false]);
        nonWordStart = null;
      }
      if (wordStart === null) {
        wordStart = i;
      }
    }
    else {
      if (wordStart !== null) {
        ir.push([wordStart, i, null, true]);
        wordStart = null;
      }
      if (nonWordStart === null) {
        nonWordStart = i;
      }
    }
  }
  if (nonWordStart !== null) {
    ir.push([nonWordStart, text.length, null, false]);
  }
  if (wordStart !== null) {
    ir.push([wordStart, text.length, null, true]);
  }
  
  // Final representation: segmentation, proper types.
  var tokens = [];
  for (i = 0; i < ir.length; i += 1) {
    var token = ir[i];
    token[1] -= token[0];
    if (!token[3]) {
      token[2] = text.substr(token[0], token[1]);
      token[3] = this.nonWordType;
      tokens.push(token);
      continue;
    }
    
    var segments = (this.useSegmentation) ? this.segmentToken(i, ir, text) :
                                            [token[1]];
    var tokenStart = token[0];
    for (var j = 0; j < segments.length; j += 1) {
      var segmentLength = segments[j];
      var segmentText = text.substr(tokenStart, segmentLength);
      var tokenType = this.highlightedWords[segmentText] ||
                      this.genericWordType;
      tokens.push([tokenStart, segmentLength, segmentText, tokenType]);
      tokenStart += segmentLength;
    }
  }
  
  return tokens;
};

/** Standard segmenting function.
 * 
 * Args:
 *   tokenIndex:: the offset of the token to be segmented, in the tokens array
 *   tokens:: array of tokens produced by tokenize (intermediate representation)
 *   text:: a String representing the text that the token belongs to
 * 
 * Returns an array of segment lengths. The lengths must sum up to the token
 * length.
 */
NextEditor.Tokenizers.WordTokenizer.prototype.segmentToken =
    function (tokenIndex, tokens, text) {
  var token = tokens[tokenIndex];
  var tokenLength = token[1];
  var segments = new Array(tokenLength);
  for (var i = 0; i < tokenLength; i += 1) {
    segments[i] = 1;
  }
  return segments;
};
/** Editor UI for modern browsers that support contentEditable=true fields.
 *
 * This works on pretty much everything we target. Except for Victor's iPad.
 *
 * The options object should have the following properties:
 *   inputElement:: textarea for capturing events
 *   formSubmitter:: used to submit a form when the user presses Enter
 *   tokenizer:: conforms to the NextEditor.Tokenizer interface for deciding
 *               which parts of the text get highlighted
 */
NextEditor.UI.Fire = function (options) {
  this.inputElement = options.inputElement;
  if (!this.inputElement) {
    if (window.console) {
      window.console.error("No input elment given! noop");
    }
    return;
  }
  this.tokenizer = options.tokenizer; 
  if (!this.tokenizer) {
    if (window.console) {
      window.console.error("No tokenizer given! noop");
    }
    return;
  }
  
  this.formSubmitter = options.formSubmitter;
  this.buildEditor();
};

/** The textarea or input backing the element's contents. */
NextEditor.UI.Fire.prototype.inputElement = null;

/** The form to be submitted when the user presses Enter. */
NextEditor.UI.Fire.prototype.formElement = null;

/** The DOM element with contentEditable=true. */
NextEditor.UI.Fire.prototype.editorElement = null;

/** Constructs the editor DOM UI. */
NextEditor.UI.Fire.prototype.buildEditor = function () {
  var inputClass = this.inputElement.className;
  this.inputElement.className = '';
  this.inputElement.style.visibility = 'hidden';
  this.inputElement.style.position = 'absolute';
  this.inputElement.style.width = 0;
  this.inputElement.style.height = 0;
  this.inputElement.style.margin = 0;
  this.inputElement.style.padding = 0;
  this.inputElement.style.border = 'none';
  this.inputElement.style.left = 0;
  this.inputElement.style.top = 0;
  
  this.editorElement = document.createElement('div');
  this.editorElement.style.width = this.editorElement.style.height = '100%';
  this.editorElement.style.margin = '0';
  this.editorElement.style.padding = '0';
  this.editorElement.style.border = 'none';
  $(this.editorElement).attr('contentEditable', 'true');

  // Workaround Firefox bug that shows resizing and moving controls for
  // contentEditable=true elements if they have position: absolute.
  // https://bugzilla.mozilla.org/show_bug.cgi?id=531159  
  var wrapper = document.createElement('div');
  wrapper.className = inputClass;
  $(this.inputElement).before(wrapper);
  $(wrapper).append(this.editorElement);
  $(wrapper).append(this.inputElement);
  
  var text = $(this.inputElement).attr('value');
  var tokens = this.tokenizer.tokenize(text + "\n");
  var cursor = (document.activeElement === this.editorElement) ?
               text.length : null;
  
  var domData = NextEditor.DOM.buildDom(tokens, text.length);
  this.setEditorContent(domData);
};

/** The contents of the editor element last time we did highlighting. */
NextEditor.UI.Fire.prototype.oldContent = null;

/** Parses the editor content to make it nice, only if it changed. */
NextEditor.UI.Fire.prototype.onPossibleChange = function () {
  var htmlContent = this.editorElement.innerHTML;
  if (this.oldContent === htmlContent) {
    return;
  }
    
  var selection = window.getSelection();
  var content = NextEditor.DOM.elementContent(this.editorElement, selection);
  
  // Always have a newline at the end, to appease Firefox. Never allow the
  // cursor to be set there.
  if (content.text[content.text.length - 1] !== "\n") {
    content.text += "\n";
  }
  if (content.cursor === content.length) {
    content.cursor = content.length - 1;
  }
  
  var tokens = this.tokenizer.tokenize(content.text);
  var domData = NextEditor.DOM.buildDom(tokens, content.cursor);  

  if (domData.cursorOffset !== null) {
    this.setEditorContent(domData);    
    this.oldContent = this.editorElement.innerHTML;
    // Strip the newline off the value.
    $(this.inputElement).attr('value',
        content.text.substr(0, content.text.length - 1));
  }
};

/** Updates the editor UI to reflect content change
 *
 * Args:
 *   domData:: the new DOM contents and selection information for the editor UI
 */
NextEditor.UI.Fire.prototype.setEditorContent = function (domData) {  
  this.editorElement.innerHTML = '';
  for (var i = 0; i < domData.nodes.length; i += 1) {
    this.editorElement.appendChild(domData.nodes[i]);
  }
  
  if (domData.cursorOffset !== null) {
    var range = document.createRange();
    var node = domData.cursorNode || this.editorElement;
    range.setStart(node, domData.cursorOffset);
    range.setEnd(node, domData.cursorOffset);
    
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);  
  }
};

/** Submits the editor's form if the user presses Enter. */
NextEditor.UI.Fire.prototype.onSubmitKey = function () {
  this.formSubmitter.submit();
};

/** The DOM element receiving user input events. */
NextEditor.UI.Fire.prototype.eventSource = function () {
  return this.editorElement;
};

/** True if no change events should be generated when an IME UI is active. */
NextEditor.UI.Fire.prototype.needsImeSupport = function () {
  return true;
};
/** Editor UI for browsers that don't support contentEditable (iOS 3).
 *
 * The options object should have the following properties:
 *   inputElement:: textarea for capturing events
 *   formSubmitter:: used to submit a form when the user presses Enter
 *   tokenizer:: conforms to the NextEditor.Tokenizer interface for deciding
 *               which parts of the text get highlighted
 */
NextEditor.UI.Water = function (options) {
  this.inputElement = options.inputElement;
  if (!this.inputElement) {
    if (window.console) {
      window.console.error("No input elment given! noop");
    }
    return;
  }
  this.tokenizer = options.tokenizer; 
  if (!this.tokenizer) {
    if (window.console) {
      window.console.error("No tokenizer given! noop");
    }
    return;
  }
  
  this.formSubmitter = options.formSubmitter;
  this.buildEditor();
};

/** The textarea or input backing the element's contents. */
NextEditor.UI.Water.prototype.inputElement = null;

/** The form to be submitted when the user presses Enter. */
NextEditor.UI.Water.prototype.formElement = null;

/** The DOM element with contentEditable=true. */
NextEditor.UI.Water.prototype.editorElement = null;

/** Constructs the editor DOM UI. */
NextEditor.UI.Water.prototype.buildEditor = function () {
  var inputClass = this.inputElement.className;  
  var wrapper = document.createElement('div');
  wrapper.className = inputClass + ' rigid_editor';
  $(this.inputElement).before(wrapper);
  
  this.editorElement = document.createElement('div');
  this.editorElement.style.position = 'absolute';
  this.editorElement.style.width = this.editorElement.style.height = '100%';
  this.editorElement.style.margin = 0;
  this.editorElement.style.padding = 0;
  this.editorElement.style.border = 'none';
  this.editorElement.style.zIndex = -5;
  this.editorElement.style.resize = 'none';
  this.editorElement.style.overflow = 'hidden';

  this.inputElement.className = '';
  this.inputElement.style.position = 'absolute';
  this.inputElement.style.width = this.inputElement.style.height = '100%';
  this.inputElement.style.margin = 0;
  this.inputElement.style.padding = 0;
  this.inputElement.style.border = 'none';
  this.inputElement.style.zIndex = 0;
  this.inputElement.style.backgroundColor = 'transparent';
  this.inputElement.style.color = 'rgba(0, 0, 0, 0)';
  this.inputElement.style.font = 'inherit';
  this.inputElement.style.resize = 'none';
  this.inputElement.style.overflow = 'hidden';
  //this.inputElement.style.opacity = 0;

  $(wrapper).append(this.editorElement);  
  $(wrapper).append(this.inputElement);
  
  this.onPossibleChange();
};

/** The contents of the editor element last time we did highlighting. */
NextEditor.UI.Water.prototype.oldContent = null;

/** Parses the editor content to make it nice, only if it changed. */
NextEditor.UI.Water.prototype.onPossibleChange = function () {
  var text = $(this.inputElement).attr('value');
  if (this.oldContent === text) {
    return;
  }
    
  var tokens = this.tokenizer.tokenize(text);
  var domData = NextEditor.DOM.buildDom(tokens, null);  

  this.setEditorContent(domData);    
  this.oldContent = text;
};

/** Updates the editor UI to reflect content change
 *
 * Args:
 *   domData:: the new DOM contents and selection information for the editor UI
 */
NextEditor.UI.Water.prototype.setEditorContent = function (domData) {  
  this.editorElement.innerHTML = '';
  for (var i = 0; i < domData.nodes.length; i += 1) {
    this.editorElement.appendChild(domData.nodes[i]);
  }
};

/** Submits the editor's form if the user presses Enter. */
NextEditor.UI.Water.prototype.onSubmitKey = function () {
  this.formSubmitter.submit();
};

/** The DOM element receiving user input events. */
NextEditor.UI.Water.prototype.eventSource = function () {
  return this.inputElement;
};

/** True if no change events should be generated when an IME UI is active. */
NextEditor.UI.Water.prototype.needsImeSupport = function () {
  return false;
};
