/** Namespace for the text parsing functionality. */
NextEditor.Parsing = {
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
