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
NextEditor.DOM.elementContents = function(element, selection) {
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
NextEditor.DOM.buildDom: function(tokens, cursor) {
  var nodes = [];
  var cursorNode = null;
  var cursorOffset = null;
  
  if (cursor == null) cursor = -1;  
  if (cursor == 0) { cursorOffset = 0; }
  
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    var runs = token[2].split("\n");
    var textOffset = token[0];
    for (var j = 0; j < runs.length; j++) {
      if (j > 0) {
        // Newline.
        var lineBreakNode = document.createElement('br');
        if (cursor == textOffset) {
          cursorOffset = nodes.length;
        }
        nodes.push(lineBreakNode);
        textOffset += 1;
      }
      
      // Run of non-newline characters in token.
      var runText = runs[j];
      var runLength = runText.length;
      var span = document.createElement('span');
      var spanText = document.createTextNode(runText);
      span.appendChild(spanText);
      nodes.push(span);      
      if (cursor > textOffset && cursor < textOffset + runLength) {
        cursorNode = span;
        cursorOffset = cursor - textOffset;
      }
      textOffset += runLength;
    }
    if (cursor == textOffset) {
      cursorOffset = output.nodes.length;
    }
  }

  return { nodes: nodes, cursorNode: cursorNode, cursorOffset: cursorOffset };
};
