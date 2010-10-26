/** NextLang message composer UI.
 * Copyright 2010 Victor Costan and Ying Yin. MIT License.
 */

/** */
NextEditor = {};
 
/** Constructs a syntax-highlighting editor.
 *
 * The options object should have the following properties:
 *   inputElement:: textarea serving as a placeholder for the editor; the
 *                  textarea will receive the editor's input
 *   formElement:: submitted when the user presses Enter (optional)
 *   forceWater:: uses the Water UI, even in newer browsers; intended for
 *                debugging the rigid CSS, or the Water itself
 */
NextEditor.create = function(options) {
  var klass = this.editorClass(options.forceWater);
  return new klass(options);
};

/** Creates an input handler for the NextLang syntax-highlighting editor.
 *
 * The options object should have the following properties:
 *   eventSource:: the input-receiving element
 *   observer:: the object which receives input notifications
 *   multiline:: if set, Enter key presses won't be treated as form submission
 *               requests
 *   imeSupport:: supress change notifications while an IME interface is active
 * 
 * The following notifications will be dispatched:
 *   onSubmitKey:: the user expressed their desire to submit the editor's input
 *                 (e.g., by pressing the Enter key)
 *   
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
    $(eventSource).bind('compositionstart', this.onIMECompositionStart, this);  
    $(eventSource).bind('compositionend', this.onIMECompositionEnd, this);
  }  
  if (!options.multiline) {
    $(eventSource).bind('keydown', this.onKeyDown, this);
  }

  if (NextEditor.Support.hasTextInput()) {
    $(eventSource).bind('textInput', this.onTextInput, this);
  }
  else {
    // Firefox doesn't have a uniform "textInput" event.
    $(eventSource).bind('keyup', this.onFirefoxKey, this);
    $(eventSource).bind('focus', this.onFocus, this);
    $(eventSource).bind('blur', this.onBlur, this);

    this.isFocused =
        document.hasFocus() && document.activeElement == eventSource;
    if (this.isFocused) {
      this.changeTick();
    }
  }
}

/** Creates unbound versions of some methods, with minimum closure overhead. */
NextEditor.Input.prototype.createUnboundFunctions = function() {
  var context = this;
  this.unboundChangeTick = function() { context.changeTick() };
}

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
}

/** Called when IME input stops.
 *
 * We won't change the editor's DOM while IME input is happening, because that
 * throws off the IME editors.
 */
NextEditor.Input.prototype.onIMECompositionEnd = function(event) {
  event.data.imeCompositionInProgress = false;
  setTimeout(function() { e.onChange(event); }, 10);
  return true;
}

/** Fires the submission callback when the user presses Enter. */
NextEditor.Input.prototype.onKeyDown = function(event) {
  if(event.which == 13) {
    event.preventDefault();
    e.submitForm();
    return false;
  }
  return true;
}

/** Called on textInput events, for browsers that do DOM 3 events. */
NextEditor.Input.prototype.onTextInput = function(event) {
  setTimeout(function() { e.onChange(event); }, 10);
  return true;
}

/** Called in Firefox when key presses are detected.
 * 
 * This never happens while an IME interface is active.
 */
NextEditor.Input.prototype.onFirefoxKey = function(event) {
  event.data.onFirefoxTextImeMode = false;
  setTimeout(function() { e.onChange(event); }, 10);
  return true;
}

/** True when the input element has the focus. */
NextEditor.Input.prototype.isFocused = false;

/** Called when the editor element receives focus. We poll for changes. */
NextEditor.Input.prototype.onFocus = function() {
  event.data.isFocused = true;
  event.data.changeTick();
}

/** Called when the editor element loses focus. */
NextEditor.Input.prototype.onBlur = function(event) {
  event.data.isFocused = false;
}

/** While the editor element has focus, check for changes every 100ms. */
NextEditor.Input.prototype.changeTick = function(event) {
  this.notifyChange(event);
  if (this.isFocused) setTimeout(e.unboundChangeTick, 100);
}

  
/** The class to be used for the editor's UI. */
NextEditor.editorClass = function(forceWater) {
  if (forceWater || !NextEditor.Support.hasContentEditable()) {
    return NextEditor.Water;
  }
  return NextEditor.Fire;
};

/** Editor UI for modern browsers that support contentEditable=true fields.
 *
 * This works on pretty much everything we target. Except for Victor's iPad.
 *
 * Constructor args:
 *   editorElement:: div element that displays the formatted text.
 *   inputElement:: textarea for capturing events.
 *   formElement:: for submitting the text message.
 */
NextEditor.Fire = function(editorElement, inputElement, formElement) {
  var e = this;

  /** The DOM element with contentEditable=true. */
  e.editorElement = editorElement;
  /** The textarea or input backing the element's contents. */
  e.inputElement = inputElement;
  /** The form to be submitted when the user presses Enter. */
  e.formElement = formElement;
  
  /** The contents of the element last time we did highlighting. */
  e.oldContent = null;

  /** Parses the editor content to make it nice, only if it changed. */
  e.contentMayHaveChanged = function() {
    var htmlContent = e.editorElement.innerHTML;
    if (e.oldContent == htmlContent) return;
    
    var selection = window.getSelection();
    var contentData = NextEditor.Parsing.parseElement(e.editorElement,
                                                      selection);
    
    var formattedData = NextEditor.Parsing.formatText(contentData.text,
                                                      contentData.cursor);
    if (formattedData.cursorOffset != null) {
      e.editorElement.innerHTML = '';
      for (var i = 0; i < formattedData.nodes.length; i++) {
        e.editorElement.appendChild(formattedData.nodes[i]);
      }
      
      var range = document.createRange();
      range.setStart(formattedData.cursorNode || e.editorElement,
                     formattedData.cursorOffset);
      range.setEnd(formattedData.cursorNode || e.editorElement,
                   formattedData.cursorOffset);
      
      selection.removeAllRanges();
      selection.addRange(range);
      
      e.oldContent = e.editorElement.innerHTML;
    }
    
    $(e.inputElement).attr('value', contentData.text);
  }
  e.contentMayHaveChanged();
  
  /** Set to true when an Enter press is intercepted.
   *
   * Without this, we tend to submit the same message multiple times.
   */
  e.submitted = false;
  
  /** Submits the message composing form via XHR.
   *
   * The method also makes sure that the form is only submitted once.
   */
  e.submitForm = function() {
    if (!e.submitted) {
      e.submitted = true;
      var el      = $(e.formElement),
          method  = el.attr('method') || el.attr('data-method') || 'GET',
          url     = el.attr('action') || el.attr('href'),
          dataType  = el.attr('data-type')  || 'script';

      var data = el.is('form') ? el.serializeArray() : [];
      $.ajax({
          url: url,
          data: data,
          dataType: dataType,
          type: method.toUpperCase(),
      });
    }
  }

}

/** Namespace for browser-dependent hacks. */
NextEditor.Support = {
  /** True if the browser suports textInput in the DOM level 3 Events spec. */
  hasTextInput: function() {
    var probe = document.createEvent('TextEvent');
    // Firefox creates its own proprietary 'text' event, but we catch it because
    // it doesn't have the data property mandated in the standard.
    return !!(probe && (probe.data != undefined));
  },
  
  /** True if the browser supports contentEditable form editors. */
  hasContentEditable: function() {
    var probe = document.createElement('div');
    if (typeof(probe.contentEditable) == 'string') {      
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
  }
}

/** Namespace for the text parsing functionality. */
NextEditor.Parsing = {
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
  parseElement: function(element, selection) {
    var text = '';
    var cursor = null;
    if (element.childNodes && element.childNodes.length > 0) {
      for (var i = 0; i < element.childNodes.length; i++) {
        childData = this.parseElement(element.childNodes[i], selection);
        if (childData.cursor != null) {
          cursor = text.length + childData.cursor;
        }
        else if (selection.focusNode == element && selection.focusOffset == i) {
          cursor = text.length;
        }
        text += childData.text;
      }
    }
    else {
      if (selection.focusNode == element) {
        cursor = selection.focusOffset;        
      }
      
      if (element.nodeName == 'BR') {
        text = "\n";
      }
      else if (element.nodeName == '#text') {
        text = element.textContent;
      }
    }
    
    if (element.nodeName != 'BR' && text[text.length - 1] == "\n") {
      text = text.substr(0, text.length - 1);
    }
    return { text: text, cursor: cursor };
  },
  
  /** Builds a DOM tree that displays the given text with formatting.
   *
   * Args:
   *   text:: the text to be formatted
   *   cursor:: the index of the character that the cursor precedes
   * 
   * Returns an object with the following properties:
   *   nodes:: array of DOM nodes that should be used as the editor's contents
   *   cursorNode:: the node that the cursor is positioned on; if null, the
   *                cursor is positioned on the editor's node
   *   cursorOffset:: the cursor's offset, in the way that the DOM API expects
   *                  it; this might be the index of a character in a text node,
   *                  or the index of an element within its containing element
   */
  formatText: function(text, cursor) {
    var output = { nodes: [], cursorNode: null, cursorOffset: null };
    
    var word = null, wordOffset = null;
    var nonWord = null, nonWordOffset = null;
    for (var i = 0; i < text.length; i++) {
      if (text[i].match(/[A-Za-z]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\u4E00-\u9FFF\uF900-\uFAFF\u3400-\u4DBF]/)) {
        if (word == null) {
          word = '';
          
          if (nonWord != null) {
            this.outputFormattedNonWord(output, nonWord, nonWordOffset);
            nonWordOffset = null;
            nonWord = null;
          }
        }
        if (cursor == i) {
          wordOffset = word.length;
        }
        word += text[i]; 
      }
      else {
        if (word != null) {
          this.outputFormattedWord(output, word, wordOffset);
          word = null;
          wordOffset = null;
        }
        
        if (text[i] == "\n") {
          if (nonWord != null) {
            this.outputFormattedNonWord(output, nonWord, nonWordOffset);
            nonWord = null;
            nonWordOffset = null;
          }
          
          this.outputFormattedLineBreak(output, (cursor == i));
        }        
        else {
          if (nonWord == null) {
            nonWord = '';
          }
          nonWord += text[i];
        }
      }
    }

    if (word != null) {
      this.outputFormattedWord(output, word, wordOffset);
    }
    else if (nonWord != null) {
      this.outputFormattedNonWord(output, nonWord, nonWordOffset);
    }

    if (cursor == text.length) {
      output.cursorNode = null;
      output.cursorOffset = output.nodes.length;
    }
    output.nodes.push(document.createElement('br'));
    return output;
  },

  /** Creates DOM nodes for word text, in the formatted output.
   *
   * Args:
   *   output:: under-construction return value for formatText
   *   text:: the word text (may contain one or multiple words)
   *   cursor:: the index of the character right after the cursor; nil if the
   *            cursor is not set on this piece of text
   * 
   * Returns output.
  */
  outputFormattedWord: function(output, text, cursor) {
    var words = this.segmentWordText(text);
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      var span = document.createElement('span');
      var spanText = document.createTextNode(word);
      span.className = this.wordSpanClass(word);
      span.appendChild(spanText);
      output.nodes.push(span);
      
      if (cursor != null) {
        if (cursor >= word.length) {
          cursor -= word.length;
        }
        else {
          output.cursorNode = span;
          output.cursorOffset = cursor;
        }
      }
    }
  },
  
  /** Creates DOM nodes for non-word text, in the formatted output.
   *
   * Args:
   *   output:: under-construction return value for formatText
   *   text:: text that is not part of any word (punctuation, spaces, etc)
   *   cursor:: the index of the character right after the cursor; nil if the
   *            cursor is not set on this piece of text
   * 
   * Returns output.
  */
  outputFormattedNonWord: function(output, text, cursor) {
    var span = document.createElement('span');
    var spanText = document.createTextNode(text);
    span.appendChild(spanText);
    output.nodes.push(span);
    
    if (cursor != null) {
      output.cursorNode = span;
      output.cursorOffset = cursor;
    }
    return output;
  },
  
  /** Creates DOM nodes for a line break, in the formatted output.
   *
   * Args:
   *   output:: under-construction return value for formatText
   *   cursor:: true if the cursor is right before the line break, false
   *            otherwise
   * 
   * Returns output.
  */
  outputFormattedLineBreak: function(output, cursor) {
    var lineBreakElement = document.createElement('br');
    if (cursor) {
      output.cursorNode = null;
      output.cursorOffset = output.nodes.length;
    }
    output.nodes.push(lineBreakElement);
    return output;
  },

  /** Segments word text into one or more words.
   * 
   * Args:
   *   text:: text that only contain word characters
   * 
   * Returns an array of Strings, one word per String.
   */
  segmentWordText: function(text) {
    if (document.needsSegmentation) {
      var segments = [];
      for (var i = 0; i < text.length; i++) {
        segments.push(text[i]);
      }
      return segments;
    }
    else {
      return [text];
    }
  },
  
  /** Computes the class that a word's span should get, for highlighting.
   * 
   * Args:
   *   text:: the word to be highlighted (or not)
   * 
   * Returns a String containing the class that should be applied to the span.
   * CSS takes it from there.
   */
  wordSpanClass: function(word) {
    if (document.wordDictionary && document.wordDictionary[word]) {
      return document.wordDictionary[word];
    }
    return '';
  }
}

/** Editor UI for browsers that don't support contentEditable (iPad OS 3.2).
 *
 * Constructor args:
 *   editorElement:: div element that displays the formatted text.
 *   inputElement:: textarea for capturing events.
 *   formElement:: for submitting the text message.
 */
NextEditor.Water = function(editorElement, inputElement, formElement) {
  var e = this;

  /** The DOM element with contentEditable=true. */
  e.editorElement = editorElement;
  /** The textarea or input backing the element's contents. */
  e.inputElement = inputElement;
  /** The form to be submitted when the user presses Enter. */
  e.formElement = formElement;
  
  /** The contents of the element last time we did highlighting. */
  e.oldContent = null;
  
  e.applyEditorStyle = function() {
    var matching_styles = ['padding', 'margin', 'border-left-width',
                           'border-right-width', 'border-top-width',
                           'border-bottom-width',
                           'height', 'width', 'font-family', 'font-size'];
    var style_hash = new Array();
    var inputElement = $(e.inputElement);
    var editorElement = $(e.editorElement);
    for (var i = 0; i < matching_styles.length; i++) {
      style_hash[matching_styles[i]] = editorElement.css(matching_styles[i]);
    }
    inputElement.css(style_hash);        
    editorElement.css({'z-index' : -5});
    editorElement.attr('contentEditable', 'false');
    $(editorElement).before(
        '<style type="text/css">.no, .may, .yes { padding: 0 !important; }</style>');
    
    inputElement.css({'background-color' : 'transparent',
                      'opacity' : 0.0,
                      'visibility' : 'visible',
                      'position' : 'absolute',
                      'left' : '4px',
                      'top' : '3px'});
  }
  e.applyEditorStyle();

  /** Parses the editor content to make it nice, only if it changed. */
  e.contentMayHaveChanged = function() {
    var text = $(e.inputElement).val();
    if (e.oldContent == text) return;
    
    var formattedData = NextEditor.Parsing.formatText(text, null);
    $(e.editorElement).html('');
    for (var i = 0; i < formattedData.nodes.length; i++) {
      e.editorElement.appendChild(formattedData.nodes[i]);
    }
      
    e.oldContent = text;
  }
  e.contentMayHaveChanged();
  
  /** Set to true when an Enter press is intercepted.
    *
    * Without this, we tend to submit the same message multiple times.
    */
  e.submitted = false;

  /** Called on DOM events indicating the editor's contents may have changed. */
  e.onChange = function(event) {
    e.contentMayHaveChanged();
  }
  $(e.inputElement).bind('keypress', e.onChange);
  $(e.inputElement).bind('input', e.onChange);
}

