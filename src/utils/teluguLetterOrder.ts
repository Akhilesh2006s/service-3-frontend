// Telugu letter ordering utility - dhirgas first, then other letters

export interface TeluguLetter {
  letter: string;
  type: 'dhirga' | 'vowel' | 'consonant' | 'modifier';
}

function getLetterType(letter: string): 'dhirga' | 'vowel' | 'consonant' | 'modifier' {
  // Telugu dhirgas (long vowels)
  const dhirgas = ['ా', 'ీ', 'ూ', 'ే', 'ై', 'ో', 'ౌ'];
  
  // Telugu short vowels
  const shortVowels = ['అ', 'ఇ', 'ఉ', 'ఎ', 'ఒ', 'ి', 'ు', 'ె', 'ొ'];
  
  // Telugu consonants
  const consonants = [
    'క', 'ఖ', 'గ', 'ఘ', 'ఙ',
    'చ', 'ఛ', 'జ', 'ఝ', 'ఞ',
    'ట', 'ఠ', 'డ', 'ఢ', 'ణ',
    'త', 'థ', 'ద', 'ధ', 'న',
    'ప', 'ఫ', 'బ', 'భ', 'మ',
    'య', 'ర', 'ల', 'వ', 'శ',
    'ష', 'స', 'హ', 'ళ', 'క్ష', 'ఱ'
  ];
  
  // Modifiers
  const modifiers = ['్', 'ం', 'ః', 'ఁ'];
  
  if (dhirgas.includes(letter)) return 'dhirga';
  if (shortVowels.includes(letter)) return 'vowel';
  if (consonants.includes(letter)) return 'consonant';
  if (modifiers.includes(letter)) return 'modifier';
  
  return 'consonant'; // default
}

export function reorderTeluguLetters(word: string): string {
  if (!word) return '';
  
  const letters = word.split('');
  const reordered: string[] = [];
  const processed = new Set<number>();
  
  // Universal pattern: consonant + dhirga + virama + consonant
  // This works for any Telugu word with conjunct characters
  
  for (let i = 0; i < letters.length; i++) {
    if (processed.has(i)) continue;
    
    const current = letters[i];
    const next = letters[i + 1];
    const nextNext = letters[i + 2];
    const nextNextNext = letters[i + 3];
    
    // Check for consonant + dhirga + virama + consonant pattern
    if (getLetterType(current) === 'consonant' && 
        getLetterType(next) === 'dhirga' && 
        getLetterType(nextNext) === 'modifier' && 
        getLetterType(nextNextNext) === 'consonant') {
      
      // Add in the correct order: consonant + dhirga + virama + consonant
      reordered.push(current, next, nextNext, nextNextNext);
      processed.add(i);
      processed.add(i + 1);
      processed.add(i + 2);
      processed.add(i + 3);
      i += 3; // Skip the next 3 characters
    } else {
      // Add other characters in their original order
      reordered.push(current);
      processed.add(i);
    }
  }
  
  // Add any remaining unprocessed letters
  for (let i = 0; i < letters.length; i++) {
    if (!processed.has(i)) {
      reordered.push(letters[i]);
    }
  }
  
  return reordered.join('');
}

// Export the main function
export function getReorderedWord(word: string): string {
  return reorderTeluguLetters(word);
}
