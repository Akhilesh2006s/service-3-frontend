import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Volume2, Shuffle, Eye, EyeOff, Save, BarChart3 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { speakText, stopSpeech } from '../utils/speechUtils';

interface SentenceExercise {
  id: number;
  words: string[];
  correctOrder: number[];
  sentence: string;
  meaning: string;
  hint: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Function to generate additional exercises
const generateAdditionalExercises = (): SentenceExercise[] => {
  const additionalExercises: SentenceExercise[] = [];
  
  // Generate exercises 56-100 with various patterns
  for (let i = 56; i <= 100; i++) {
    const patterns = [
      {
        words: ['నేను', 'మీకు', 'ఈ', 'పుస్తకం', 'ఇస్తాను', 'రేపు'],
        correctOrder: [0, 1, 5, 2, 3, 4],
        sentence: 'నేను మీకు రేపు ఈ పుస్తకం ఇస్తాను',
        meaning: 'I will give you this book tomorrow',
        hint: 'Subject + Indirect object + Time + Demonstrative + Object + Verb',
        explanation: 'Subject + Indirect Object + Time + Demonstrative + Object + Verb',
        difficulty: 'hard' as const
      },
      {
        words: ['అమ్మ', 'నాకు', 'ఒక', 'కథ', 'చెప్పింది', 'నిన్న'],
        correctOrder: [1, 0, 5, 2, 3, 4],
        sentence: 'నాకు అమ్మ నిన్న ఒక కథ చెప్పింది',
        meaning: 'Mother told me a story yesterday',
        hint: 'Indirect object + Subject + Time + Article + Object + Verb',
        explanation: 'Indirect Object + Subject + Time + Article + Object + Verb',
        difficulty: 'medium' as const
      },
      {
        words: ['మీరు', 'ఎప్పుడు', 'ఇక్కడ', 'వచ్చారు', '?'],
        correctOrder: [0, 1, 2, 3, 4],
        sentence: 'మీరు ఎప్పుడు ఇక్కడ వచ్చారు?',
        meaning: 'When did you come here?',
        hint: 'Subject + Question word + Place + Verb + Question mark',
        explanation: 'Subject + Question Word + Place + Verb + Question Mark',
        difficulty: 'medium' as const
      },
      {
        words: ['నేను', 'రేపు', 'ఈ', 'పని', 'చేస్తాను'],
        correctOrder: [0, 1, 2, 3, 4],
        sentence: 'నేను రేపు ఈ పని చేస్తాను',
        meaning: 'I will do this work tomorrow',
        hint: 'Subject + Time + Demonstrative + Object + Verb',
        explanation: 'Subject + Time + Demonstrative + Object + Verb',
        difficulty: 'medium' as const
      },
      {
        words: ['అతను', 'నిన్న', 'ఇక్కడ', 'లేడు'],
        correctOrder: [0, 1, 2, 3],
        sentence: 'అతను నిన్న ఇక్కడ లేడు',
        meaning: 'He was not here yesterday',
        hint: 'Subject + Time + Place + Negative verb',
        explanation: 'Subject + Time + Place + Negative Verb',
        difficulty: 'medium' as const
      }
    ];
    
    const pattern = patterns[i % patterns.length];
    additionalExercises.push({
      id: i,
      ...pattern
    });
  }
  
  return additionalExercises;
};

const exercises: SentenceExercise[] = [
  // EASY EXERCISES (1-30)
  {
    id: 1,
    words: ['నేను', 'తెలుగు', 'నేర్చుకుంటున్నాను'],
    correctOrder: [0, 1, 2],
    sentence: 'నేను తెలుగు నేర్చుకుంటున్నాను',
    meaning: 'I am learning Telugu',
    hint: 'Start with the subject (నేను = I)',
    explanation: 'Subject + Object + Verb: నేను (I) + తెలుగు (Telugu) + నేర్చుకుంటున్నాను (am learning)',
    difficulty: 'easy'
  },
  {
    id: 2,
    words: ['అమ్మ', 'నాకు', 'అన్నం', 'వండింది'],
    correctOrder: [1, 0, 2, 3],
    sentence: 'నాకు అమ్మ అన్నం వండింది',
    meaning: 'Mother cooked food for me',
    hint: 'Start with the indirect object (నాకు = for me)',
    explanation: 'Indirect Object + Subject + Object + Verb: నాకు (for me) + అమ్మ (mother) + అన్నం (food) + వండింది (cooked)',
    difficulty: 'easy'
  },
  {
    id: 3,
    words: ['మా', 'ఇల్లు', 'చాలా', 'పెద్దది'],
    correctOrder: [0, 1, 2, 3],
    sentence: 'మా ఇల్లు చాలా పెద్దది',
    meaning: 'Our house is very big',
    hint: 'Possessive pronoun comes first (మా = our)',
    explanation: 'Possessive + Noun + Adverb + Adjective: మా (our) + ఇల్లు (house) + చాలా (very) + పెద్దది (big)',
    difficulty: 'easy'
  },
  {
    id: 4,
    words: ['అతను', 'బడికి', 'వెళ్తున్నాడు'],
    correctOrder: [0, 1, 2],
    sentence: 'అతను బడికి వెళ్తున్నాడు',
    meaning: 'He is going to school',
    hint: 'Subject + Place + Verb',
    explanation: 'Subject + Place + Verb: అతను (he) + బడికి (to school) + వెళ్తున్నాడు (is going)',
    difficulty: 'easy'
  },
  {
    id: 5,
    words: ['నేను', 'నీళ్లు', 'తాగుతున్నాను'],
    correctOrder: [0, 1, 2],
    sentence: 'నేను నీళ్లు తాగుతున్నాను',
    meaning: 'I am drinking water',
    hint: 'Subject + Object + Verb',
    explanation: 'Subject + Object + Verb: నేను (I) + నీళ్లు (water) + తాగుతున్నాను (am drinking)',
    difficulty: 'easy'
  },
  {
    id: 6,
    words: ['అమ్మ', 'అన్నం', 'వండుతున్నది'],
    correctOrder: [0, 1, 2],
    sentence: 'అమ్మ అన్నం వండుతున్నది',
    meaning: 'Mother is cooking food',
    hint: 'Subject + Object + Verb',
    explanation: 'Subject + Object + Verb: అమ్మ (mother) + అన్నం (food) + వండుతున్నది (is cooking)',
    difficulty: 'easy'
  },
  {
    id: 7,
    words: ['మీరు', 'ఎక్కడ', 'ఉన్నారు'],
    correctOrder: [0, 1, 2],
    sentence: 'మీరు ఎక్కడ ఉన్నారు',
    meaning: 'Where are you?',
    hint: 'Subject + Question word + Verb',
    explanation: 'Subject + Question Word + Verb: మీరు (you) + ఎక్కడ (where) + ఉన్నారు (are)',
    difficulty: 'easy'
  },
  {
    id: 8,
    words: ['నేను', 'ఇక్కడ', 'ఉన్నాను'],
    correctOrder: [0, 1, 2],
    sentence: 'నేను ఇక్కడ ఉన్నాను',
    meaning: 'I am here',
    hint: 'Subject + Place + Verb',
    explanation: 'Subject + Place + Verb: నేను (I) + ఇక్కడ (here) + ఉన్నాను (am)',
    difficulty: 'easy'
  },
  {
    id: 9,
    words: ['అతను', 'చదువు', 'చదువుతున్నాడు'],
    correctOrder: [0, 1, 2],
    sentence: 'అతను చదువు చదువుతున్నాడు',
    meaning: 'He is studying',
    hint: 'Subject + Object + Verb',
    explanation: 'Subject + Object + Verb: అతను (he) + చదువు (study) + చదువుతున్నాడు (is studying)',
    difficulty: 'easy'
  },
  {
    id: 10,
    words: ['మా', 'ఇల్లు', 'చిన్నది'],
    correctOrder: [0, 1, 2],
    sentence: 'మా ఇల్లు చిన్నది',
    meaning: 'Our house is small',
    hint: 'Possessive + Noun + Adjective',
    explanation: 'Possessive + Noun + Adjective: మా (our) + ఇల్లు (house) + చిన్నది (small)',
    difficulty: 'easy'
  },
  {
    id: 11,
    words: ['నేను', 'అన్నం', 'తింటున్నాను'],
    correctOrder: [0, 1, 2],
    sentence: 'నేను అన్నం తింటున్నాను',
    meaning: 'I am eating food',
    hint: 'Subject + Object + Verb',
    explanation: 'Subject + Object + Verb: నేను (I) + అన్నం (food) + తింటున్నాను (am eating)',
    difficulty: 'easy'
  },
  {
    id: 12,
    words: ['అమ్మ', 'నాకు', 'అన్నం', 'ఇచ్చింది'],
    correctOrder: [1, 0, 2, 3],
    sentence: 'నాకు అమ్మ అన్నం ఇచ్చింది',
    meaning: 'Mother gave me food',
    hint: 'Indirect object first (నాకు = to me)',
    explanation: 'Indirect Object + Subject + Object + Verb: నాకు (to me) + అమ్మ (mother) + అన్నం (food) + ఇచ్చింది (gave)',
    difficulty: 'easy'
  },
  {
    id: 13,
    words: ['మీరు', 'ఎప్పుడు', 'వస్తారు'],
    correctOrder: [0, 1, 2],
    sentence: 'మీరు ఎప్పుడు వస్తారు',
    meaning: 'When will you come?',
    hint: 'Subject + Question word + Verb',
    explanation: 'Subject + Question Word + Verb: మీరు (you) + ఎప్పుడు (when) + వస్తారు (will come)',
    difficulty: 'easy'
  },
  {
    id: 14,
    words: ['నేను', 'ఇవాళ', 'వస్తాను'],
    correctOrder: [0, 1, 2],
    sentence: 'నేను ఇవాళ వస్తాను',
    meaning: 'I will come today',
    hint: 'Subject + Time + Verb',
    explanation: 'Subject + Time + Verb: నేను (I) + ఇవాళ (today) + వస్తాను (will come)',
    difficulty: 'easy'
  },
  {
    id: 15,
    words: ['అతను', 'ఎక్కడ', 'పని', 'చేస్తున్నాడు'],
    correctOrder: [0, 1, 2, 3],
    sentence: 'అతను ఎక్కడ పని చేస్తున్నాడు',
    meaning: 'Where is he working?',
    hint: 'Subject + Question word + Object + Verb',
    explanation: 'Subject + Question Word + Object + Verb: అతను (he) + ఎక్కడ (where) + పని (work) + చేస్తున్నాడు (is doing)',
    difficulty: 'easy'
  },
  {
    id: 16,
    words: ['నేను', 'ఇక్కడ', 'పని', 'చేస్తున్నాను'],
    correctOrder: [0, 1, 2, 3],
    sentence: 'నేను ఇక్కడ పని చేస్తున్నాను',
    meaning: 'I am working here',
    hint: 'Subject + Place + Object + Verb',
    explanation: 'Subject + Place + Object + Verb: నేను (I) + ఇక్కడ (here) + పని (work) + చేస్తున్నాను (am doing)',
    difficulty: 'easy'
  },
  {
    id: 17,
    words: ['మా', 'అమ్మ', 'చాలా', 'మంచిది'],
    correctOrder: [0, 1, 2, 3],
    sentence: 'మా అమ్మ చాలా మంచిది',
    meaning: 'Our mother is very good',
    hint: 'Possessive + Noun + Adverb + Adjective',
    explanation: 'Possessive + Noun + Adverb + Adjective: మా (our) + అమ్మ (mother) + చాలా (very) + మంచిది (good)',
    difficulty: 'easy'
  },
  {
    id: 18,
    words: ['అతను', 'నాకు', 'స్నేహితుడు'],
    correctOrder: [0, 1, 2],
    sentence: 'అతను నాకు స్నేహితుడు',
    meaning: 'He is my friend',
    hint: 'Subject + Indirect object + Noun',
    explanation: 'Subject + Indirect Object + Noun: అతను (he) + నాకు (to me) + స్నేహితుడు (friend)',
    difficulty: 'easy'
  },
  {
    id: 19,
    words: ['నేను', 'మీకు', 'సహాయం', 'చేస్తాను'],
    correctOrder: [0, 1, 2, 3],
    sentence: 'నేను మీకు సహాయం చేస్తాను',
    meaning: 'I will help you',
    hint: 'Subject + Indirect object + Object + Verb',
    explanation: 'Subject + Indirect Object + Object + Verb: నేను (I) + మీకు (to you) + సహాయం (help) + చేస్తాను (will do)',
    difficulty: 'easy'
  },
  {
    id: 20,
    words: ['అమ్మ', 'నాకు', 'కథ', 'చెప్పింది'],
    correctOrder: [1, 0, 2, 3],
    sentence: 'నాకు అమ్మ కథ చెప్పింది',
    meaning: 'Mother told me a story',
    hint: 'Indirect object first (నాకు = to me)',
    explanation: 'Indirect Object + Subject + Object + Verb: నాకు (to me) + అమ్మ (mother) + కథ (story) + చెప్పింది (told)',
    difficulty: 'easy'
  },
  {
    id: 21,
    words: ['మీరు', 'ఎలా', 'ఉన్నారు'],
    correctOrder: [0, 1, 2],
    sentence: 'మీరు ఎలా ఉన్నారు',
    meaning: 'How are you?',
    hint: 'Subject + Question word + Verb',
    explanation: 'Subject + Question Word + Verb: మీరు (you) + ఎలా (how) + ఉన్నారు (are)',
    difficulty: 'easy'
  },
  {
    id: 22,
    words: ['నేను', 'బాగా', 'ఉన్నాను'],
    correctOrder: [0, 1, 2],
    sentence: 'నేను బాగా ఉన్నాను',
    meaning: 'I am fine',
    hint: 'Subject + Adverb + Verb',
    explanation: 'Subject + Adverb + Verb: నేను (I) + బాగా (well) + ఉన్నాను (am)',
    difficulty: 'easy'
  },
  {
    id: 23,
    words: ['అతను', 'చాలా', 'మంచివాడు'],
    correctOrder: [0, 1, 2],
    sentence: 'అతను చాలా మంచివాడు',
    meaning: 'He is very good',
    hint: 'Subject + Adverb + Adjective',
    explanation: 'Subject + Adverb + Adjective: అతను (he) + చాలా (very) + మంచివాడు (good person)',
    difficulty: 'easy'
  },
  {
    id: 24,
    words: ['మా', 'నాన్న', 'డాక్టర్'],
    correctOrder: [0, 1, 2],
    sentence: 'మా నాన్న డాక్టర్',
    meaning: 'Our father is a doctor',
    hint: 'Possessive + Noun + Profession',
    explanation: 'Possessive + Noun + Profession: మా (our) + నాన్న (father) + డాక్టర్ (doctor)',
    difficulty: 'easy'
  },
  {
    id: 25,
    words: ['నేను', 'విద్యార్థిని'],
    correctOrder: [0, 1],
    sentence: 'నేను విద్యార్థిని',
    meaning: 'I am a student',
    hint: 'Subject + Noun',
    explanation: 'Subject + Noun: నేను (I) + విద్యార్థిని (student)',
    difficulty: 'easy'
  },
  {
    id: 26,
    words: ['అమ్మ', 'నాకు', 'అన్నం', 'తెచ్చింది'],
    correctOrder: [1, 0, 2, 3],
    sentence: 'నాకు అమ్మ అన్నం తెచ్చింది',
    meaning: 'Mother brought me food',
    hint: 'Indirect object first (నాకు = to me)',
    explanation: 'Indirect Object + Subject + Object + Verb: నాకు (to me) + అమ్మ (mother) + అన్నం (food) + తెచ్చింది (brought)',
    difficulty: 'easy'
  },
  {
    id: 27,
    words: ['మీరు', 'ఎప్పుడు', 'వస్తారు', '?'],
    correctOrder: [0, 1, 2, 3],
    sentence: 'మీరు ఎప్పుడు వస్తారు?',
    meaning: 'When will you come?',
    hint: 'Subject + Question word + Verb + Question mark',
    explanation: 'Subject + Question Word + Verb + Question Mark: మీరు (you) + ఎప్పుడు (when) + వస్తారు (will come) + ?',
    difficulty: 'easy'
  },
  {
    id: 28,
    words: ['నేను', 'రేపు', 'వస్తాను'],
    correctOrder: [0, 1, 2],
    sentence: 'నేను రేపు వస్తాను',
    meaning: 'I will come tomorrow',
    hint: 'Subject + Time + Verb',
    explanation: 'Subject + Time + Verb: నేను (I) + రేపు (tomorrow) + వస్తాను (will come)',
    difficulty: 'easy'
  },
  {
    id: 29,
    words: ['అతను', 'ఇక్కడ', 'లేడు'],
    correctOrder: [0, 1, 2],
    sentence: 'అతను ఇక్కడ లేడు',
    meaning: 'He is not here',
    hint: 'Subject + Place + Negative verb',
    explanation: 'Subject + Place + Negative Verb: అతను (he) + ఇక్కడ (here) + లేడు (is not)',
    difficulty: 'easy'
  },
  {
    id: 30,
    words: ['నేను', 'అక్కడ', 'లేను'],
    correctOrder: [0, 1, 2],
    sentence: 'నేను అక్కడ లేను',
    meaning: 'I am not there',
    hint: 'Subject + Place + Negative verb',
    explanation: 'Subject + Place + Negative Verb: నేను (I) + అక్కడ (there) + లేను (am not)',
    difficulty: 'easy'
  },
  // MEDIUM EXERCISES (31-70)
  {
    id: 31,
    words: ['నేను', 'రేపు', 'బడికి', 'వెళ్తాను'],
    correctOrder: [0, 1, 2, 3],
    sentence: 'నేను రేపు బడికి వెళ్తాను',
    meaning: 'I will go to school tomorrow',
    hint: 'Time word (రేపు) comes after subject',
    explanation: 'Subject + Time + Place + Verb: నేను (I) + రేపు (tomorrow) + బడికి (to school) + వెళ్తాను (will go)',
    difficulty: 'medium'
  },
  {
    id: 32,
    words: ['అతను', 'చదువు', 'చదువుతున్నాడు', 'బాగా'],
    correctOrder: [0, 3, 1, 2],
    sentence: 'అతను బాగా చదువు చదువుతున్నాడు',
    meaning: 'He is studying well',
    hint: 'Adverb (బాగా) comes before the object',
    explanation: 'Subject + Adverb + Object + Verb: అతను (he) + బాగా (well) + చదువు (study) + చదువుతున్నాడు (is studying)',
    difficulty: 'medium'
  },
  {
    id: 33,
    words: ['మీరు', 'ఎక్కడ', 'ఉన్నారు', '?'],
    correctOrder: [0, 1, 2, 3],
    sentence: 'మీరు ఎక్కడ ఉన్నారు?',
    meaning: 'Where are you?',
    hint: 'Question word (ఎక్కడ) comes after subject',
    explanation: 'Subject + Question Word + Verb + Question Mark: మీరు (you) + ఎక్కడ (where) + ఉన్నారు (are) + ?',
    difficulty: 'medium'
  },
  {
    id: 34,
    words: ['నేను', 'ఈ', 'పుస్తకం', 'చదివాను', 'నిన్న'],
    correctOrder: [0, 4, 1, 2, 3],
    sentence: 'నేను నిన్న ఈ పుస్తకం చదివాను',
    meaning: 'I read this book yesterday',
    hint: 'Time (నిన్న) comes after subject, demonstrative (ఈ) comes before noun',
    explanation: 'Subject + Time + Demonstrative + Object + Verb: నేను (I) + నిన్న (yesterday) + ఈ (this) + పుస్తకం (book) + చదివాను (read)',
    difficulty: 'medium'
  },
  {
    id: 35,
    words: ['అమ్మ', 'నాకు', 'ఒక', 'అందమైన', 'బొమ్మ', 'ఇచ్చింది'],
    correctOrder: [1, 0, 2, 3, 4, 5],
    sentence: 'నాకు అమ్మ ఒక అందమైన బొమ్మ ఇచ్చింది',
    meaning: 'Mother gave me a beautiful doll',
    hint: 'Indirect object first, then subject, then article + adjective + object + verb',
    explanation: 'Indirect Object + Subject + Article + Adjective + Object + Verb: నాకు (to me) + అమ్మ (mother) + ఒక (a) + అందమైన (beautiful) + బొమ్మ (doll) + ఇచ్చింది (gave)',
    difficulty: 'medium'
  },
  {
    id: 36,
    words: ['నేను', 'మీకు', 'ఈ', 'పుస్తకం', 'ఇస్తాను'],
    correctOrder: [0, 1, 2, 3, 4],
    sentence: 'నేను మీకు ఈ పుస్తకం ఇస్తాను',
    meaning: 'I will give you this book',
    hint: 'Subject + Indirect object + Demonstrative + Object + Verb',
    explanation: 'Subject + Indirect Object + Demonstrative + Object + Verb: నేను (I) + మీకు (to you) + ఈ (this) + పుస్తకం (book) + ఇస్తాను (will give)',
    difficulty: 'medium'
  },
  {
    id: 37,
    words: ['అతను', 'నిన్న', 'ఇక్కడ', 'లేడు'],
    correctOrder: [0, 1, 2, 3],
    sentence: 'అతను నిన్న ఇక్కడ లేడు',
    meaning: 'He was not here yesterday',
    hint: 'Subject + Time + Place + Negative verb',
    explanation: 'Subject + Time + Place + Negative Verb: అతను (he) + నిన్న (yesterday) + ఇక్కడ (here) + లేడు (was not)',
    difficulty: 'medium'
  },
  {
    id: 38,
    words: ['మీరు', 'ఎప్పుడు', 'ఇక్కడ', 'వచ్చారు'],
    correctOrder: [0, 1, 2, 3],
    sentence: 'మీరు ఎప్పుడు ఇక్కడ వచ్చారు',
    meaning: 'When did you come here?',
    hint: 'Subject + Question word + Place + Verb',
    explanation: 'Subject + Question Word + Place + Verb: మీరు (you) + ఎప్పుడు (when) + ఇక్కడ (here) + వచ్చారు (came)',
    difficulty: 'medium'
  },
  {
    id: 39,
    words: ['నేను', 'ఈ', 'పని', 'చేస్తాను', 'రేపు'],
    correctOrder: [0, 4, 1, 2, 3],
    sentence: 'నేను రేపు ఈ పని చేస్తాను',
    meaning: 'I will do this work tomorrow',
    hint: 'Subject + Time + Demonstrative + Object + Verb',
    explanation: 'Subject + Time + Demonstrative + Object + Verb: నేను (I) + రేపు (tomorrow) + ఈ (this) + పని (work) + చేస్తాను (will do)',
    difficulty: 'medium'
  },
  {
    id: 40,
    words: ['అమ్మ', 'నాకు', 'ఒక', 'కథ', 'చెప్పింది', 'నిన్న'],
    correctOrder: [1, 0, 5, 2, 3, 4],
    sentence: 'నాకు అమ్మ నిన్న ఒక కథ చెప్పింది',
    meaning: 'Mother told me a story yesterday',
    hint: 'Indirect object + Subject + Time + Article + Object + Verb',
    explanation: 'Indirect Object + Subject + Time + Article + Object + Verb: నాకు (to me) + అమ్మ (mother) + నిన్న (yesterday) + ఒక (a) + కథ (story) + చెప్పింది (told)',
    difficulty: 'medium'
  },
  {
    id: 41,
    words: ['మీరు', 'ఎక్కడ', 'పని', 'చేస్తున్నారు'],
    correctOrder: [0, 1, 2, 3],
    sentence: 'మీరు ఎక్కడ పని చేస్తున్నారు',
    meaning: 'Where are you working?',
    hint: 'Subject + Question word + Object + Verb',
    explanation: 'Subject + Question Word + Object + Verb: మీరు (you) + ఎక్కడ (where) + పని (work) + చేస్తున్నారు (are doing)',
    difficulty: 'medium'
  },
  {
    id: 42,
    words: ['నేను', 'ఇక్కడ', 'పని', 'చేస్తున్నాను', 'ఇవాళ'],
    correctOrder: [0, 4, 1, 2, 3],
    sentence: 'నేను ఇవాళ ఇక్కడ పని చేస్తున్నాను',
    meaning: 'I am working here today',
    hint: 'Subject + Time + Place + Object + Verb',
    explanation: 'Subject + Time + Place + Object + Verb: నేను (I) + ఇవాళ (today) + ఇక్కడ (here) + పని (work) + చేస్తున్నాను (am doing)',
    difficulty: 'medium'
  },
  {
    id: 43,
    words: ['అతను', 'చాలా', 'మంచి', 'విద్యార్థి'],
    correctOrder: [0, 1, 2, 3],
    sentence: 'అతను చాలా మంచి విద్యార్థి',
    meaning: 'He is a very good student',
    hint: 'Subject + Adverb + Adjective + Noun',
    explanation: 'Subject + Adverb + Adjective + Noun: అతను (he) + చాలా (very) + మంచి (good) + విద్యార్థి (student)',
    difficulty: 'medium'
  },
  {
    id: 44,
    words: ['మా', 'ఇల్లు', 'చాలా', 'పెద్దది', 'మరియు', 'అందమైనది'],
    correctOrder: [0, 1, 2, 3, 4, 5],
    sentence: 'మా ఇల్లు చాలా పెద్దది మరియు అందమైనది',
    meaning: 'Our house is very big and beautiful',
    hint: 'Possessive + Noun + Adverb + Adjective + Conjunction + Adjective',
    explanation: 'Possessive + Noun + Adverb + Adjective + Conjunction + Adjective: మా (our) + ఇల్లు (house) + చాలా (very) + పెద్దది (big) + మరియు (and) + అందమైనది (beautiful)',
    difficulty: 'medium'
  },
  {
    id: 45,
    words: ['నేను', 'మీకు', 'సహాయం', 'చేస్తాను', 'ఎప్పుడు', 'కావాలంటే'],
    correctOrder: [0, 1, 2, 3, 5, 4],
    sentence: 'నేను మీకు సహాయం చేస్తాను కావాలంటే ఎప్పుడు',
    meaning: 'I will help you whenever you need',
    hint: 'Subject + Indirect object + Object + Verb + Conditional + Time',
    explanation: 'Subject + Indirect Object + Object + Verb + Conditional + Time: నేను (I) + మీకు (to you) + సహాయం (help) + చేస్తాను (will do) + కావాలంటే (if needed) + ఎప్పుడు (whenever)',
    difficulty: 'medium'
  },
  // HARD EXERCISES (46-100)
  {
    id: 46,
    words: ['నేను', 'నిన్న', 'ఈ', 'పుస్తకం', 'చదివాను', 'మొత్తం'],
    correctOrder: [0, 1, 5, 2, 3, 4],
    sentence: 'నేను నిన్న మొత్తం ఈ పుస్తకం చదివాను',
    meaning: 'I read this entire book yesterday',
    hint: 'Subject + Time + Adverb + Demonstrative + Object + Verb',
    explanation: 'Subject + Time + Adverb + Demonstrative + Object + Verb: నేను (I) + నిన్న (yesterday) + మొత్తం (entire) + ఈ (this) + పుస్తకం (book) + చదివాను (read)',
    difficulty: 'hard'
  },
  {
    id: 47,
    words: ['అమ్మ', 'నాకు', 'ఒక', 'అందమైన', 'బొమ్మ', 'ఇచ్చింది', 'నిన్న'],
    correctOrder: [1, 0, 6, 2, 3, 4, 5],
    sentence: 'నాకు అమ్మ నిన్న ఒక అందమైన బొమ్మ ఇచ్చింది',
    meaning: 'Mother gave me a beautiful doll yesterday',
    hint: 'Indirect object + Subject + Time + Article + Adjective + Object + Verb',
    explanation: 'Indirect Object + Subject + Time + Article + Adjective + Object + Verb: నాకు (to me) + అమ్మ (mother) + నిన్న (yesterday) + ఒక (a) + అందమైన (beautiful) + బొమ్మ (doll) + ఇచ్చింది (gave)',
    difficulty: 'hard'
  },
  {
    id: 48,
    words: ['మీరు', 'ఎప్పుడు', 'ఇక్కడ', 'వచ్చారు', 'మరియు', 'ఎక్కడ', 'పోయారు'],
    correctOrder: [0, 1, 2, 3, 4, 5, 6],
    sentence: 'మీరు ఎప్పుడు ఇక్కడ వచ్చారు మరియు ఎక్కడ పోయారు',
    meaning: 'When did you come here and where did you go?',
    hint: 'Subject + Question word + Place + Verb + Conjunction + Question word + Verb',
    explanation: 'Subject + Question Word + Place + Verb + Conjunction + Question Word + Verb: మీరు (you) + ఎప్పుడు (when) + ఇక్కడ (here) + వచ్చారు (came) + మరియు (and) + ఎక్కడ (where) + పోయారు (went)',
    difficulty: 'hard'
  },
  {
    id: 49,
    words: ['నేను', 'రేపు', 'ఈ', 'పని', 'చేస్తాను', 'మొత్తం'],
    correctOrder: [0, 1, 5, 2, 3, 4],
    sentence: 'నేను రేపు మొత్తం ఈ పని చేస్తాను',
    meaning: 'I will do this entire work tomorrow',
    hint: 'Subject + Time + Adverb + Demonstrative + Object + Verb',
    explanation: 'Subject + Time + Adverb + Demonstrative + Object + Verb: నేను (I) + రేపు (tomorrow) + మొత్తం (entire) + ఈ (this) + పని (work) + చేస్తాను (will do)',
    difficulty: 'hard'
  },
  {
    id: 50,
    words: ['అతను', 'నిన్న', 'ఇక్కడ', 'లేడు', 'ఎందుకంటే', 'అతను', 'అనారోగ్యంగా', 'ఉన్నాడు'],
    correctOrder: [0, 1, 2, 3, 4, 5, 6, 7],
    sentence: 'అతను నిన్న ఇక్కడ లేడు ఎందుకంటే అతను అనారోగ్యంగా ఉన్నాడు',
    meaning: 'He was not here yesterday because he is sick',
    hint: 'Subject + Time + Place + Negative verb + Conjunction + Subject + Adverb + Verb',
    explanation: 'Subject + Time + Place + Negative Verb + Conjunction + Subject + Adverb + Verb: అతను (he) + నిన్న (yesterday) + ఇక్కడ (here) + లేడు (was not) + ఎందుకంటే (because) + అతను (he) + అనారోగ్యంగా (sick) + ఉన్నాడు (is)',
    difficulty: 'hard'
  },
  {
    id: 51,
    words: ['నేను', 'మీకు', 'ఈ', 'పుస్తకం', 'ఇస్తాను', 'రేపు'],
    correctOrder: [0, 1, 5, 2, 3, 4],
    sentence: 'నేను మీకు రేపు ఈ పుస్తకం ఇస్తాను',
    meaning: 'I will give you this book tomorrow',
    hint: 'Subject + Indirect object + Time + Demonstrative + Object + Verb',
    explanation: 'Subject + Indirect Object + Time + Demonstrative + Object + Verb: నేను (I) + మీకు (to you) + రేపు (tomorrow) + ఈ (this) + పుస్తకం (book) + ఇస్తాను (will give)',
    difficulty: 'hard'
  },
  {
    id: 52,
    words: ['అమ్మ', 'నాకు', 'ఒక', 'కథ', 'చెప్పింది', 'నిన్న', 'రాత్రి'],
    correctOrder: [1, 0, 5, 6, 2, 3, 4],
    sentence: 'నాకు అమ్మ నిన్న రాత్రి ఒక కథ చెప్పింది',
    meaning: 'Mother told me a story yesterday night',
    hint: 'Indirect object + Subject + Time + Time + Article + Object + Verb',
    explanation: 'Indirect Object + Subject + Time + Time + Article + Object + Verb: నాకు (to me) + అమ్మ (mother) + నిన్న (yesterday) + రాత్రి (night) + ఒక (a) + కథ (story) + చెప్పింది (told)',
    difficulty: 'hard'
  },
  {
    id: 53,
    words: ['మీరు', 'ఎప్పుడు', 'ఇక్కడ', 'వచ్చారు', 'మరియు', 'ఎక్కడ', 'పోయారు', '?'],
    correctOrder: [0, 1, 2, 3, 4, 5, 6, 7],
    sentence: 'మీరు ఎప్పుడు ఇక్కడ వచ్చారు మరియు ఎక్కడ పోయారు?',
    meaning: 'When did you come here and where did you go?',
    hint: 'Subject + Question word + Place + Verb + Conjunction + Question word + Verb + Question mark',
    explanation: 'Subject + Question Word + Place + Verb + Conjunction + Question Word + Verb + Question Mark: మీరు (you) + ఎప్పుడు (when) + ఇక్కడ (here) + వచ్చారు (came) + మరియు (and) + ఎక్కడ (where) + పోయారు (went) + ?',
    difficulty: 'hard'
  },
  {
    id: 54,
    words: ['నేను', 'రేపు', 'ఈ', 'పని', 'చేస్తాను', 'మొత్తం', 'మరియు', 'మీకు', 'చూపిస్తాను'],
    correctOrder: [0, 1, 5, 2, 3, 4, 6, 7, 8],
    sentence: 'నేను రేపు మొత్తం ఈ పని చేస్తాను మరియు మీకు చూపిస్తాను',
    meaning: 'I will do this entire work tomorrow and show it to you',
    hint: 'Subject + Time + Adverb + Demonstrative + Object + Verb + Conjunction + Indirect object + Verb',
    explanation: 'Subject + Time + Adverb + Demonstrative + Object + Verb + Conjunction + Indirect Object + Verb: నేను (I) + రేపు (tomorrow) + మొత్తం (entire) + ఈ (this) + పని (work) + చేస్తాను (will do) + మరియు (and) + మీకు (to you) + చూపిస్తాను (will show)',
    difficulty: 'hard'
  },
  {
    id: 55,
    words: ['అతను', 'నిన్న', 'ఇక్కడ', 'లేడు', 'ఎందుకంటే', 'అతను', 'అనారోగ్యంగా', 'ఉన్నాడు', 'మరియు', 'ఇంట్లో', 'ఉన్నాడు'],
    correctOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    sentence: 'అతను నిన్న ఇక్కడ లేడు ఎందుకంటే అతను అనారోగ్యంగా ఉన్నాడు మరియు ఇంట్లో ఉన్నాడు',
    meaning: 'He was not here yesterday because he is sick and is at home',
    hint: 'Subject + Time + Place + Negative verb + Conjunction + Subject + Adverb + Verb + Conjunction + Place + Verb',
    explanation: 'Subject + Time + Place + Negative Verb + Conjunction + Subject + Adverb + Verb + Conjunction + Place + Verb: అతను (he) + నిన్న (yesterday) + ఇక్కడ (here) + లేడు (was not) + ఎందుకంటే (because) + అతను (he) + అనారోగ్యంగా (sick) + ఉన్నాడు (is) + మరియు (and) + ఇంట్లో (at home) + ఉన్నాడు (is)',
    difficulty: 'hard'
  },
  // Add generated exercises to reach 100 total
  ...generateAdditionalExercises()
];

export default function TeluguSentenceFormation() {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState<number[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const { toast } = useToast();
  const { user } = useAuth();

  // Filter exercises based on difficulty
  const filteredExercises = selectedDifficulty === 'all' 
    ? exercises 
    : exercises.filter(ex => ex.difficulty === selectedDifficulty);

  // Get current exercise
  const currentExercise = filteredExercises[currentExerciseIndex];

  // API functions
  const loadProgress = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/learning-progress', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.sentenceFormation) {
          const progress = data.data.sentenceFormation;
          setCurrentExerciseIndex(progress.currentIndex || 0);
          setScore({
            correct: progress.totalScore || 0,
            total: progress.totalAttempts || 0
          });
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgress = async (exerciseId: number, isCorrect: boolean, selectedOrder: number[], correctOrder: number[]) => {
    if (!user) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/learning-progress/sentence-formation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`
        },
        body: JSON.stringify({
          exerciseId,
          score: isCorrect ? 100 : 0,
          attempts: 1,
          timeSpent: 0 // You can add time tracking if needed
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local score
          setScore(prev => ({
            correct: prev.correct + (isCorrect ? 1 : 0),
            total: prev.total + 1
          }));
        }
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const resetProgress = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/learning-progress/reset/sentenceFormation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentExerciseIndex(0);
          setScore({ correct: 0, total: 0 });
          toast({
            title: "Progress Reset",
            description: "Your sentence formation progress has been reset successfully!",
          });
        }
      }
    } catch (error) {
      console.error('Error resetting progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/learning-progress/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.data);
          setShowAnalytics(true);
        }
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDifficultyChange = (difficulty: 'all' | 'easy' | 'medium' | 'hard') => {
    setSelectedDifficulty(difficulty);
    setCurrentExerciseIndex(0);
    setSelectedWords([]);
    setAvailableWords([]);
    setIsCorrect(null);
    setShowHint(false);
    setShowExplanation(false);
    setShowAnswer(false);
  };

  // Load progress on component mount
  useEffect(() => {
    loadProgress();
  }, [user]);

  useEffect(() => {
    resetExercise();
  }, [currentExerciseIndex]);

  const resetExercise = () => {
    setSelectedWords([]);
    setAvailableWords([...currentExercise.words]);
    setIsCorrect(null);
    setShowHint(false);
    setShowExplanation(false);
    setShowAnswer(false);
  };

  const speakSentence = (sentence: string) => {
    speakText(sentence, {
      lang: 'te-IN',
      rate: 0.75,
      pitch: 1.1
    });
  };

  const selectWord = (wordIndex: number) => {
    if (isCorrect !== null) return; // Don't allow changes after submission
    
    // Find the word in available words
    const wordToSelect = currentExercise.words[wordIndex];
    const availableIndex = availableWords.findIndex(word => word === wordToSelect);
    
    if (availableIndex !== -1) {
      setSelectedWords(prev => [...prev, wordIndex]);
      setAvailableWords(prev => prev.filter((_, index) => index !== availableIndex));
    }
  };

  const deselectWord = (wordIndex: number) => {
    if (isCorrect !== null) return; // Don't allow changes after submission
    
    const wordToRemove = currentExercise.words[wordIndex];
    setSelectedWords(prev => prev.filter(index => index !== wordIndex));
    setAvailableWords(prev => [...prev, wordToRemove]);
  };

  const checkAnswer = async () => {
    const isAnswerCorrect = JSON.stringify(selectedWords) === JSON.stringify(currentExercise.correctOrder);
    setIsCorrect(isAnswerCorrect);
    
    // Save progress to backend
    await saveProgress(
      currentExercise.id,
      isAnswerCorrect,
      [], // selectedOrder - not needed for new API
      [] // correctOrder - not needed for new API
    );
    
    if (isAnswerCorrect) {
      toast({
        title: "Perfect! 🎉",
        description: "Great job! You formed the sentence correctly.",
      });
      setShowExplanation(true);
    } else {
      toast({
        title: "Try Again",
        description: "Check the word order and try again.",
        variant: "destructive"
      });
    }
  };

  const nextExercise = () => {
    if (currentExerciseIndex < filteredExercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
      toast({
        title: "Exercise Complete! 🎉",
        description: `You got ${score.correct} out of ${score.total} correct!`,
      });
    }
  };

  const resetAll = async () => {
    await resetProgress();
    resetExercise();
  };

  const shuffleWords = () => {
    if (isCorrect !== null) return; // Don't allow shuffling after submission
    
    const shuffled = [...currentExercise.words].sort(() => Math.random() - 0.5);
    setAvailableWords(shuffled);
    setSelectedWords([]);
  };

  // Auto-shuffle on exercise load
  useEffect(() => {
    if (currentExercise) {
      const shuffled = [...currentExercise.words].sort(() => Math.random() - 0.5);
      setAvailableWords(shuffled);
    }
  }, [currentExerciseIndex]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'సులభం (Easy)';
      case 'medium': return 'మధ్యస్థం (Medium)';
      case 'hard': return 'కష్టం (Hard)';
      default: return difficulty;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-gray-800">తెలుగు వాక్య నిర్మాణం</h2>
        <p className="text-xl text-gray-600">
          Arrange words to form meaningful Telugu sentences
        </p>
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Loading...</span>
          </div>
        )}
      </div>

      {/* Difficulty Selector */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-purple-700">Select Difficulty Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant={selectedDifficulty === 'all' ? 'default' : 'outline'}
              onClick={() => handleDifficultyChange('all')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              All Levels
            </Button>
            <Button
              variant={selectedDifficulty === 'easy' ? 'default' : 'outline'}
              onClick={() => handleDifficultyChange('easy')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              సులభం (Easy)
            </Button>
            <Button
              variant={selectedDifficulty === 'medium' ? 'default' : 'outline'}
              onClick={() => handleDifficultyChange('medium')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              మధ్యస్థం (Medium)
            </Button>
            <Button
              variant={selectedDifficulty === 'hard' ? 'default' : 'outline'}
              onClick={() => handleDifficultyChange('hard')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              కష్టం (Hard)
            </Button>
          </div>
          <div className="mt-3 text-center text-sm text-gray-600">
            {filteredExercises.length} exercises available in {selectedDifficulty === 'all' ? 'all levels' : selectedDifficulty} level
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-orange-700">
            <span>Exercise Progress</span>
            <div className="flex items-center gap-2">
              <Badge className={getDifficultyColor(currentExercise.difficulty)}>
                {getDifficultyLabel(currentExercise.difficulty)}
              </Badge>
              <Badge variant="outline" className="text-orange-700">
                {currentExerciseIndex + 1} / {filteredExercises.length}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={(currentExerciseIndex / Math.max(filteredExercises.length - 1, 1)) * 100} className="h-3" />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Score: {score.correct} / {score.total}</span>
            <span>{Math.round((score.correct / Math.max(score.total, 1)) * 100)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Current Exercise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentence Display */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <span>Form the Sentence</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">Sentence meaning:</p>
              <p className="text-2xl font-bold text-blue-800">{currentExercise.meaning}</p>
            </div>
            
            {/* Formed Sentence */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200">
              <p className="text-sm text-gray-600 mb-2">Your sentence:</p>
              <div className="min-h-[60px] p-4 border-2 border-dashed border-gray-300 rounded-lg">
                {selectedWords.length === 0 ? (
                  <p className="text-gray-400 text-center">Click words below to form sentence</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedWords.map((wordIndex, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => deselectWord(wordIndex)}
                        className="text-lg"
                        disabled={isCorrect !== null}
                      >
                        {currentExercise.words[wordIndex]}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => speakSentence(currentExercise.sentence)}
                  className="flex items-center gap-2"
                >
                  <Volume2 className="w-4 h-4" />
                  Listen to Correct Sentence
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="flex items-center gap-2"
                >
                  {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showAnswer ? 'Hide Answer' : 'Show Answer'}
                </Button>
              </div>
              
              {showAnswer && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-800 mb-2">Correct sentence:</p>
                  <p className="text-lg font-bold text-yellow-700">{currentExercise.sentence}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Word Selection */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <span>Available Words</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Available Words */}
            <div className="space-y-3">
                           <div className="flex items-center justify-between">
               <p className="text-sm text-gray-600">Click words to select:</p>
               <div className="flex gap-2">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={shuffleWords}
                   className="flex items-center gap-2"
                   disabled={isCorrect !== null}
                 >
                   <Shuffle className="w-4 h-4" />
                   Shuffle
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={loadAnalytics}
                   className="flex items-center gap-2"
                   disabled={isLoading}
                 >
                   <BarChart3 className="w-4 h-4" />
                   Analytics
                 </Button>
               </div>
             </div>
              
                             <div className="flex flex-wrap gap-2">
                 {availableWords.map((word, index) => (
                   <Button
                     key={`${word}-${index}`}
                     variant="outline"
                     size="lg"
                     onClick={() => {
                       const wordIndex = currentExercise.words.indexOf(word);
                       if (wordIndex !== -1) {
                         selectWord(wordIndex);
                       }
                     }}
                     className="text-lg"
                     disabled={isCorrect !== null}
                   >
                     {word}
                   </Button>
                 ))}
               </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={checkAnswer}
                disabled={selectedWords.length !== currentExercise.words.length || isCorrect !== null}
                className="w-full"
                size="lg"
              >
                Check Answer
              </Button>
              
              <Button
                variant="outline"
                onClick={resetExercise}
                className="w-full"
                disabled={isCorrect !== null}
              >
                Reset Words
              </Button>
            </div>

            {/* Result Display */}
            {isCorrect !== null && (
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center justify-center gap-3 mb-3">
                  {isCorrect ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <span className="text-green-700 font-semibold text-lg">Perfect! 🎉</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-500" />
                      <span className="text-red-700 font-semibold text-lg">Try Again</span>
                    </>
                  )}
                </div>
                
                {!isCorrect && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Correct order:</p>
                    <p className="text-lg font-bold text-blue-700">
                      {currentExercise.correctOrder.map(index => currentExercise.words[index]).join(' ')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Hint */}
            <Button
              variant="outline"
              onClick={() => setShowHint(!showHint)}
              className="w-full"
            >
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </Button>
            
            {showHint && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm font-medium text-yellow-800 mb-2">💡 Hint:</p>
                <p className="text-yellow-700">{currentExercise.hint}</p>
              </div>
            )}

            {/* Explanation */}
            {showExplanation && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-2">📚 Explanation:</p>
                <p className="text-blue-700">{currentExercise.explanation}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-2">
                             <Button
                 onClick={nextExercise}
                 disabled={currentExerciseIndex >= 99}
                 className="flex-1"
               >
                <ArrowRight className="w-4 h-4 mr-2" />
                Next Exercise
              </Button>
              
              <Button
                variant="outline"
                onClick={resetAll}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

             {/* Analytics Display */}
       {showAnalytics && analytics && (
         <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
           <CardHeader>
             <CardTitle className="flex items-center justify-between text-indigo-700">
               <span>Your Progress Analytics</span>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setShowAnalytics(false)}
               >
                 Close
               </Button>
             </CardTitle>
           </CardHeader>
           <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="text-center p-4 bg-white rounded-lg shadow-sm">
               <p className="text-2xl font-bold text-indigo-600">{analytics.totalExercises}</p>
               <p className="text-sm text-gray-600">Total Exercises</p>
             </div>
             <div className="text-center p-4 bg-white rounded-lg shadow-sm">
               <p className="text-2xl font-bold text-green-600">{analytics.correctAnswers}</p>
               <p className="text-sm text-gray-600">Correct Answers</p>
             </div>
             <div className="text-center p-4 bg-white rounded-lg shadow-sm">
               <p className="text-2xl font-bold text-red-600">{analytics.wrongAnswers}</p>
               <p className="text-sm text-gray-600">Wrong Answers</p>
             </div>
             <div className="text-center p-4 bg-white rounded-lg shadow-sm">
               <p className="text-2xl font-bold text-blue-600">{analytics.accuracy}%</p>
               <p className="text-sm text-gray-600">Accuracy</p>
             </div>
           </CardContent>
           {analytics.difficultyBreakdown && (
             <CardContent className="border-t border-indigo-200 pt-4">
               <h4 className="font-semibold text-indigo-700 mb-3">Performance by Difficulty</h4>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="p-3 bg-green-50 rounded-lg">
                   <p className="font-semibold text-green-700">Easy</p>
                   <p className="text-sm text-green-600">
                     {analytics.difficultyBreakdown.easy.correct}/{analytics.difficultyBreakdown.easy.total} correct
                   </p>
                 </div>
                 <div className="p-3 bg-yellow-50 rounded-lg">
                   <p className="font-semibold text-yellow-700">Medium</p>
                   <p className="text-sm text-yellow-600">
                     {analytics.difficultyBreakdown.medium.correct}/{analytics.difficultyBreakdown.medium.total} correct
                   </p>
                 </div>
                 <div className="p-3 bg-red-50 rounded-lg">
                   <p className="font-semibold text-red-700">Hard</p>
                   <p className="text-sm text-red-600">
                     {analytics.difficultyBreakdown.hard.correct}/{analytics.difficultyBreakdown.hard.total} correct
                   </p>
                 </div>
               </div>
             </CardContent>
           )}
         </Card>
       )}

       {/* Instructions */}
       <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            How to Practice
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-semibold text-purple-700 mb-2">Step 1: Read the Meaning</p>
            <p>Understand what the sentence should mean in English</p>
          </div>
          <div>
            <p className="font-semibold text-purple-700 mb-2">Step 2: Select Words</p>
            <p>Click words in the correct order to form the sentence</p>
          </div>
          <div>
            <p className="font-semibold text-purple-700 mb-2">Step 3: Check Grammar</p>
            <p>Learn Telugu sentence structure and word order</p>
          </div>
          <div>
            <p className="font-semibold text-purple-700 mb-2">Step 4: Practice More</p>
            <p>Continue with more exercises to master sentence formation</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
