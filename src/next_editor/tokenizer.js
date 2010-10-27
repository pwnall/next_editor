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
NextEditor.Tokenizers.WordTokenizer = function(options) {
  if (options.nonWordType) this.nonWordType = options.nonWordType;
  if (options.genericWordType) this.genericWordType = options.genericWordType;
  if (options.highlightedWords) {
    this.highlightedWords = options.highlightedWords;
  }
  if (options.useSegmentation) this.useSegmentation = options.useSegmentation;
}

/* Token type for non-word contents */
NextEditor.Tokenizers.WordTokenizer.prototype.nonWordType = 'nonword';
/** Token type for generic words. */
NextEditor.Tokenizers.WordTokenizer.prototype.genericWordType = 'word';
/** Map between words to be highlighted and their token types. */
NextEditor.Tokenizers.WordTokenizer.prototype.highlightedWords = {};
/** True if the "words" need to be further segmented (CJK languages). */
NextEditor.Tokenizers.WordTokenizer.prototype.useSegmentation = false;

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
NextEditor.Tokenizers.WordTokenizer.prototype.tokenize = function(text) {
  var ir = [];
  
  // Intermediate Representation: token type = true/false for word/non-word.
  var wordStart = null;
  var nonWordStart = null;
  for (var i = 0; i < text.length; i++) {
    if (text[i].match(/[A-Za-z]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\u4E00-\u9FFF\uF900-\uFAFF\u3400-\u4DBF]/)) {
      if (nonWordStart != null) {
        ir.push([nonWordStart, i, null, false]);
        nonWordStart = null;
      }
      if (wordStart == null) wordStart = i;
    }
    else {
      if (wordStart != null) {
        ir.push([wordStart, i, null, true]);
        wordStart = null;
      }
      if (nonWordStart == null) nonWordStart = i;
    }
  }
  if (nonWordStart != null) {
    ir.push([nonWordStart, text.length, null, false]);
  }
  if (wordStart != null) {
    ir.push([wordStart, text.length, null, true]);
  }
  
  // Final representation: segmentation, proper types.
  var tokens = [];
  for (var i = 0; i < ir.length; i++) {
    var token = ir[i];
    token[1] -= token[0];
    if (!token[3]) {
      token[2] = text.substr(token[0], token[1]);
      token[3] = this.nonWordType;
      tokens.push(token);
      continue;
    }
    
    if(this.useSegmentation) {
      var segments = this.segmentToken(i, tokens, text);
    }
    else {
      var segments = [token[1]];
    }
    var tokenStart = token[0];
    for (var j = 0; j < segments.length; j++) {
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
 *   tokens:: under-construction array of tokens produced by tokenize
 *   text:: a String representing the text that the token belongs to
 * 
 * Returns an array of segment lengths. The lengths must sum up to the token
 * length.
 */
NextEditor.Tokenizers.WordTokenizer.prototype.segmentText =
    function(tokenIndex, tokens, text) {
  var token = tokens[tokenIndex];
  var tokenLength = token[1];
  var segments = new Array(tokenLength);
  for (var i = 0; i < tokenLength; i++) {
    segments[i] = 1;
  }
  return segments;
};
