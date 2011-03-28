/**
 * NextLang message composer UI.
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
 *   forceWater:: uses the Water UI, even in newer browsers; intended for
 *                debugging the rigid CSS, or the Water itself
 *   multiLine:: if true, Enter keys insert newlines to the element, and the
 *               user needs to type Ctrl+Enter or Shift+Enter to trigger a
 *               submit event
 *   tokenizer:: logic for breaking up the text into segments and deciding how
 *               the segments should be highlighted
 *   onChange:: function (element) that is invoked when the editor's text
 *              changes, and receives the DOM element that contains the updated
 *              text
 *   onSubmitKey:: function (element) that is invoked when the user expresses
 *                 their desire to submit a Enter in the input field; returning
 *                 false will cancel the event, which is useful if you want to
 *                 submit a form via AJAX
 */
NextEditor.create = function (options) {
  var tokenizer = options.tokenizer;
  if (!tokenizer) {
    tokenizer = new NextEditor.Tokenizers.WordTokenizer({});
  }
  
  var UIClass = NextEditor.UI.editorClass(options.forceWater);
  var editorUI = new UIClass({
    inputElement: options.inputElement,
    tokenizer: tokenizer,
    onChange: options.onChange,
    onSubmitKey: options.onSubmitKey
  });
  
  var inputController = new NextEditor.Input({
    eventSource: editorUI.eventSource(),
    imeSupport: editorUI.needsImeSupport(),
    multiLine: options.multiLine,
    observer: editorUI
  });

  return { ui: editorUI, input: inputController, tokenizer: tokenizer };
};
